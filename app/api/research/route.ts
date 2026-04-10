import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { ResearchPayload, ResearchReport } from "@/lib/types";

const SYSTEM_PROMPT = `You are a senior career market researcher specializing in US and job markets. You use web search to find current, accurate data — never fabricate job postings or URLs. Return valid JSON only. No markdown, no backticks, no text before or after the JSON.`;

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
  "titles": [{"title": "string", "responsibilities": "string"}],
  "companies": {
    "large_tech": ["string"],
    "design_agencies": ["string"],
    "startups": ["string"],
    "saas_marketing": ["string"],
    "staffing_agencies": ["string"]
  },
  "vacancies": [{"company": "string", "title": "string", "url": "string", "type": "Remote|Hybrid|Onsite", "notes": "string"}],
  "salary": {"min": "string", "max": "string", "average": "string", "notes": "string"},
  "requirements": {
    "core_responsibilities": ["string"],
    "core_requirements": ["string"],
    "nice_to_have": ["string"]
  },
  "profiles": [{"url": "string", "notes": "string"}],
  "strategy": {"connections_target": "string", "applications_target": "string", "notes": "string"}
}

Minimums: 10 titles, 8 companies per category, 5 vacancies with real URLs, 12 responsibilities, 10 requirements, 5 nice-to-have, 5 profiles.`;

function buildUserPrompt(payload: ResearchPayload): string {
  return USER_PROMPT_TEMPLATE.replaceAll("{{clientName}}", payload.clientName.trim())
    .replaceAll("{{specialty}}", payload.specialty.trim())
    .replaceAll("{{targetRole}}", payload.targetRole.trim())
    .replaceAll("{{location}}", payload.location.trim())
    .replaceAll("{{experience}}", payload.experience)
    .replaceAll("{{notes}}", payload.notes?.trim() || "None");
}

function textFromResponse(response: Anthropic.Messages.Message): string {
  const textParts = response.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text);
  return textParts.join("\n").trim();
}

function validatePayload(payload: Partial<ResearchPayload>): string | null {
  if (!payload.clientName?.trim()) return "Client name is required.";
  if (!payload.specialty?.trim()) return "Client specialty / skills is required.";
  if (!payload.targetRole?.trim()) return "Target job title is required.";
  if (!payload.location?.trim()) return "Target location is required.";
  if (!payload.experience?.trim()) return "Experience level is required.";
  return null;
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
  try {
    payload = (await request.json()) as ResearchPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payloadError = validatePayload(payload);
  if (payloadError) {
    return NextResponse.json({ error: payloadError }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: buildUserPrompt(payload) }],
    });

    const rawText = textFromResponse(response);
    try {
      const parsed = JSON.parse(rawText) as ResearchReport;
      return NextResponse.json({ ok: true, report: parsed, rawText });
    } catch {
      return NextResponse.json({ ok: false, rawText });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
