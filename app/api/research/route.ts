import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { NextResponse } from "next/server";
import type { ResearchPayload, ResearchReport } from "@/lib/types";

const SYSTEM_PROMPT = `You are a senior career market researcher specializing in US and job markets. You use web search to find current, accurate data — never fabricate job postings or URLs. Return valid JSON only. No markdown, no backticks, no text before or after the JSON.`;
const ANTHROPIC_TIMEOUT_MS = 180_000;

const USER_PROMPT_TEMPLATE = `Research the job market for this client and return ONLY a JSON object.

CLIENT:
- Name: {{clientName}}
- Specialty: {{specialty}}
- Target role: {{targetRole}}
- Location: {{location}}
- Experience: {{experience}}
- Notes: {{notes}}

Do web searches for: "{{targetRole}} jobs {{location}} 2025", "{{targetRole}} salary {{location}} 2025", "companies hiring {{targetRole}} {{location}}", "{{targetRole}} job description requirements"

Return this exact JSON:
{
  "title_groups": {
    "standard": ["string"],
    "niche": ["string"],
    "senior": ["string"]
  },
  "titles": [{"title": "string", "responsibilities": "string"}],
  "companies": {
    "large_tech": ["string"],
    "design_agencies": ["string"],
    "startups": ["string"],
    "saas_marketing": ["string"],
    "staffing_agencies": ["string"]
  },
  "company_priority": {
    "large_tech": {"priority": "High|Medium|Low", "remote_friendly": ["string"], "local": ["string"]},
    "design_agencies": {"priority": "High|Medium|Low", "remote_friendly": ["string"], "local": ["string"]},
    "startups": {"priority": "High|Medium|Low", "remote_friendly": ["string"], "local": ["string"]},
    "saas_marketing": {"priority": "High|Medium|Low", "remote_friendly": ["string"], "local": ["string"]},
    "staffing_agencies": {"priority": "High|Medium|Low", "remote_friendly": ["string"], "local": ["string"]}
  },
  "vacancies": [{"company": "string", "title": "string", "url": "string", "type": "Remote|Hybrid|Onsite", "status": "Active|Expired|Unverified", "notes": "string"}],
  "salary": {"min": "string", "max": "string", "average": "string", "notes": "string"},
  "requirements": {
    "core_responsibilities": ["string"],
    "core_requirements": ["string"],
    "nice_to_have": ["string"]
  },
  "profiles": [{"url": "string", "notes": "string", "profile_notes": "string"}],
  "stop_list": ["Company or category to avoid + reason"],
  "strategy": {"connections_target": "string", "applications_target": "string", "notes": "string"},
  "section_notes": {
    "title_groups": "string",
    "job_titles": "string",
    "companies": "string",
    "vacancies": "string",
    "salary": "string",
    "requirements": "string",
    "profiles": "string",
    "strategy": "string",
    "stop_list": "string"
  }
}

Minimums: 10 titles, 8 companies per category, 5 vacancies with real URLs, 12 responsibilities, 10 requirements, 5 nice-to-have, 5 profiles.
Ensure section_notes contain 1-2 strategic sentences per section.`;

function buildUserPrompt(payload: ResearchPayload, resumeText: string): string {
  const prompt = USER_PROMPT_TEMPLATE.replaceAll("{{clientName}}", payload.clientName.trim())
    .replaceAll("{{specialty}}", payload.specialty.trim())
    .replaceAll("{{targetRole}}", payload.targetRole.trim())
    .replaceAll("{{location}}", payload.location.trim())
    .replaceAll("{{experience}}", payload.experience)
    .replaceAll("{{notes}}", payload.notes?.trim() || "None");

  if (!resumeText.trim()) {
    return prompt;
  }

  return `${prompt}

RESUME CONTEXT (optional):
Use this resume to tailor the output to the candidate's actual background. Do not invent resume facts beyond this content.
${resumeText}`;
}

function textFromResponse(response: Anthropic.Messages.Message): string {
  const textParts = response.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text);
  return textParts.join("\n").trim();
}

function normalizeReport(report: ResearchReport): ResearchReport {
  const companyKeys: Array<keyof ResearchReport["companies"]> = [
    "large_tech",
    "design_agencies",
    "startups",
    "saas_marketing",
    "staffing_agencies",
  ];

  const rawTitleGroups = report.title_groups ?? { standard: [], niche: [], senior: [] };
  const normalizeTitleList = (input: unknown[] | undefined): string[] =>
    (input ?? [])
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "title" in item) {
          return String((item as { title: unknown }).title);
        }
        return "";
      })
      .filter((item) => item.trim().length > 0);

  const titleGroups = {
    standard: normalizeTitleList(rawTitleGroups.standard as unknown[]),
    niche: normalizeTitleList(rawTitleGroups.niche as unknown[]),
    senior: normalizeTitleList(rawTitleGroups.senior as unknown[]),
  };

  const fallbackTitles =
    report.titles?.length > 0
      ? report.titles
      : titleGroups.standard.map((title) => ({
          title,
          responsibilities: "",
        }));

  const companies = companyKeys.reduce(
    (acc, key) => {
      acc[key] = report.companies?.[key] ?? [];
      return acc;
    },
    {} as ResearchReport["companies"],
  );

  const rawCompanyPriority = (report as { company_priority?: Record<string, unknown> }).company_priority ?? {};
  const companyPriority = companyKeys.reduce(
    (acc, key) => {
      const source = (rawCompanyPriority[key] ?? {}) as {
        priority?: ResearchReport["company_priority"][typeof key]["priority"];
        remote_friendly?: string[];
        local?: string[];
        subcategories?: {
          remote_friendly?: string[];
          local?: string[];
        };
      };
      acc[key] = {
        priority: source.priority ?? "Medium",
        remote_friendly: source.remote_friendly ?? source.subcategories?.remote_friendly ?? [],
        local: source.local ?? source.subcategories?.local ?? [],
      };
      return acc;
    },
    {} as ResearchReport["company_priority"],
  );

  return {
    ...report,
    companies,
    company_priority: companyPriority,
    titles: fallbackTitles,
    title_groups: {
      standard: titleGroups.standard ?? fallbackTitles,
      niche: titleGroups.niche ?? [],
      senior: titleGroups.senior ?? [],
    },
    vacancies: (report.vacancies ?? []).map((vacancy) => ({
      ...vacancy,
      status: vacancy.status ?? "Unverified",
    })),
    profiles: (report.profiles ?? []).map((profile) => ({
      ...profile,
      profile_notes: profile.profile_notes ?? profile.notes,
    })),
    stop_list: report.stop_list ?? [],
    section_notes: {
      title_groups: report.section_notes?.title_groups ?? "",
      job_titles: report.section_notes?.job_titles ?? "",
      companies: report.section_notes?.companies ?? "",
      vacancies: report.section_notes?.vacancies ?? "",
      salary: report.section_notes?.salary ?? "",
      requirements: report.section_notes?.requirements ?? "",
      profiles: report.section_notes?.profiles ?? "",
      strategy: report.section_notes?.strategy ?? "",
      stop_list: report.section_notes?.stop_list ?? "",
    },
  };
}

function tryParseJSONFromModelText(rawText: string): ResearchReport | null {
  try {
    return JSON.parse(rawText) as ResearchReport;
  } catch {
    // fall through to extraction strategies below
  }

  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1]) as ResearchReport;
    } catch {
      // continue to brace-slice fallback
    }
  }

  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = rawText.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate) as ResearchReport;
    } catch {
      return null;
    }
  }

  return null;
}

function validatePayload(payload: Partial<ResearchPayload>): string | null {
  if (!payload.clientName?.trim()) return "Client name is required.";
  if (!payload.specialty?.trim()) return "Client specialty / skills is required.";
  if (!payload.targetRole?.trim()) return "Target job title is required.";
  if (!payload.location?.trim()) return "Target location is required.";
  if (!payload.experience?.trim()) return "Experience level is required.";
  return null;
}

function normalizeResumeText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 6000);
}

async function extractResumeText(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split(".").pop();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (ext === "txt") {
    return normalizeResumeText(buffer.toString("utf-8"));
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return normalizeResumeText(result.value);
  }

  if (ext === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
    try {
      const result = await parser.getText();
      return normalizeResumeText(result.text);
    } finally {
      await parser.destroy();
    }
  }

  throw new Error("Unsupported resume format. Use PDF, DOCX, or TXT.");
}

async function parsePayloadFromRequest(request: Request): Promise<{ payload: ResearchPayload; resumeText: string }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload: ResearchPayload = {
      clientName: String(formData.get("clientName") ?? ""),
      specialty: String(formData.get("specialty") ?? ""),
      targetRole: String(formData.get("targetRole") ?? ""),
      location: String(formData.get("location") ?? "USA"),
      experience: String(formData.get("experience") ?? "") as ResearchPayload["experience"],
      notes: String(formData.get("notes") ?? ""),
    };

    const file = formData.get("resumeFile");
    let resumeText = "";
    if (file instanceof File && file.size > 0) {
      if (file.size > 4 * 1024 * 1024) {
        throw new Error("Resume file is too large. Max size is 4MB.");
      }
      resumeText = await extractResumeText(file);
    }

    return { payload, resumeText };
  }

  const payload = (await request.json()) as ResearchPayload;
  return { payload, resumeText: "" };
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured in .env.local." },
      { status: 500 },
    );
  }

  let payload: ResearchPayload;
  let resumeText = "";
  try {
    const parsed = await parsePayloadFromRequest(request);
    payload = parsed.payload;
    resumeText = parsed.resumeText;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const payloadError = validatePayload(payload);
  if (payloadError) {
    return NextResponse.json({ error: payloadError }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create(
      {
        model: "claude-opus-4-5",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: buildUserPrompt(payload, resumeText) }],
      },
      { timeout: ANTHROPIC_TIMEOUT_MS },
    );

    const rawText = textFromResponse(response);
    const parsed = tryParseJSONFromModelText(rawText);
    if (parsed) {
      return NextResponse.json({ ok: true, report: normalizeReport(parsed), rawText });
    }

    return NextResponse.json({
      ok: false,
      error: "Model response was not valid JSON. Use the raw response below.",
      rawText,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Research timed out. Please retry with shorter notes or resume text." },
        { status: 504 },
      );
    }
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
