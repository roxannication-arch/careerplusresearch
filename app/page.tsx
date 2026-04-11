"use client";

import { useMemo, useState } from "react";
import { generateResearchDocxBlob } from "@/lib/docx";
import { generateResearchPdfBlob } from "@/lib/pdf";
import type { ExperienceLevel, ResearchPayload, ResearchReport } from "@/lib/types";

type ApiSuccess = {
  ok: true;
  report: ResearchReport;
  rawText: string;
};

type ApiError = {
  ok: false;
  error?: string;
  rawText?: string;
};

type GenericErrorResponse = {
  error?: string;
  rawText?: string;
};

const REQUEST_TIMEOUT_MS = 210_000;

const initialForm: ResearchPayload = {
  clientName: "",
  specialty: "",
  targetRole: "",
  location: "USA",
  experience: "Middle 2-5yr",
  notes: "",
};

const MAX_RESUME_BYTES = 4 * 1024 * 1024;

const experienceOptions: ExperienceLevel[] = ["Junior 0-2yr", "Middle 2-5yr", "Senior 5+yr", "Lead"];

const companyLabels: Record<keyof ResearchReport["company_priority"], string> = {
  large_tech: "Large Tech",
  design_agencies: "Design Agencies",
  startups: "Startups",
  saas_marketing: "SaaS / Marketing",
  staffing_agencies: "Staffing Agencies",
};

const titleGroupLabels: Record<keyof ResearchReport["title_groups"], string> = {
  standard: "Standard Titles",
  niche: "Niche Titles",
  senior: "Senior / Aspirational Titles",
};

const priorityBadgeClass: Record<"High" | "Medium" | "Low", string> = {
  High: "border-rose-200 bg-rose-50 text-rose-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-slate-200 bg-slate-50 text-slate-700",
};

const fieldClass =
  "input-neo w-full rounded-xl px-3 py-2.5 text-sm shadow-sm outline-none transition";
const textareaClass = `${fieldClass} min-h-[110px]`;
const cardClass = "glass-card rounded-3xl p-8";
const subCardClass = "section-card rounded-2xl p-4";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{children}</label>;
}

function sanitizeFilename(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function HomePage() {
  const [formData, setFormData] = useState<ResearchPayload>(initialForm);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [rawResponse, setRawResponse] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      formData.clientName.trim().length > 0 &&
      formData.specialty.trim().length > 0 &&
      formData.targetRole.trim().length > 0 &&
      formData.location.trim().length > 0
    );
  }, [formData]);

  const onChange =
    <K extends keyof ResearchPayload>(key: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData((prev) => ({
        ...prev,
        [key]: event.target.value,
      }));
    };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (resumeFile && resumeFile.size > MAX_RESUME_BYTES) {
      setError("Resume file is too large. Please upload a file up to 4MB.");
      setRawResponse("");
      return;
    }

    setIsLoading(true);
    setError("");
    setReport(null);
    setRawResponse("");

    let timeoutId: number | undefined;
    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const body = new FormData();
      body.append("clientName", formData.clientName);
      body.append("specialty", formData.specialty);
      body.append("targetRole", formData.targetRole);
      body.append("location", formData.location);
      body.append("experience", formData.experience);
      body.append("notes", formData.notes ?? "");
      if (resumeFile) {
        body.append("resumeFile", resumeFile);
      }

      const response = await fetch("/api/research", {
        method: "POST",
        body,
        signal: controller.signal,
      });

      const responseText = await response.text();
      let data: ApiSuccess | ApiError | GenericErrorResponse = {};
      try {
        data = JSON.parse(responseText) as ApiSuccess | ApiError | GenericErrorResponse;
      } catch {
        data = { error: responseText || "Unexpected non-JSON response from server." };
      }

      if (response.ok && "ok" in data && data.ok) {
        setReport(data.report);
        setRawResponse(data.rawText ?? "");
        return;
      }

      setError("error" in data ? data.error ?? "Request failed." : "Request failed.");
      setRawResponse("rawText" in data ? data.rawText ?? "" : "");
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        setError("The request timed out after 210 seconds. Please try again.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Unexpected error.");
      }
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      setIsLoading(false);
    }
  };

  const onReset = () => {
    setFormData(initialForm);
    setResumeFile(null);
    setReport(null);
    setRawResponse("");
    setError("");
  };

  const onExport = async () => {
    if (!report) return;
    const blob = await generateResearchDocxBlob(report, formData.clientName);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeClientName = sanitizeFilename(formData.clientName) || "client";
    anchor.href = url;
    anchor.download = `${safeClientName}-careerplus-research.docx`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const onExportPdf = async () => {
    if (!report) return;
    const blob = await generateResearchPdfBlob(report, formData.clientName);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeClientName = sanitizeFilename(formData.clientName) || "client";
    anchor.href = url;
    anchor.download = `${safeClientName}-careerplus-research.pdf`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-[1500px] px-10 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-r from-slate-100 via-white to-indigo-100 p-8 text-slate-900 shadow-[0_30px_90px_-35px_rgba(51,65,85,0.32)]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-fuchsia-200/50 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="relative">
          <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
            CareerPlus Intelligence
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">Research Generator</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700/90">
            Generate premium, consultant-ready US market research with strategic interpretations, vacancy intelligence, and
            export-ready documentation.
          </p>
          <div className="mt-5 flex gap-2 text-xs">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Desktop-first</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Anthropic + Web Search</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Docx Export</span>
          </div>
        </div>
      </div>

      <section className={`mt-6 ${cardClass}`}>
        <p className="mb-4 text-sm font-semibold text-slate-800">Client Intake</p>
        <p className="-mt-2 mb-6 text-xs text-slate-500">Fill in profile details to generate a high-signal research brief.</p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <FieldLabel>Client name</FieldLabel>
              <input type="text" value={formData.clientName} onChange={onChange("clientName")} required className={fieldClass} placeholder="e.g. Jane Doe" />
            </div>

            <div>
              <FieldLabel>Target job title</FieldLabel>
              <input
                type="text"
                value={formData.targetRole}
                onChange={onChange("targetRole")}
                required
                className={fieldClass}
                placeholder="e.g. Product Designer"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Client specialty / skills</FieldLabel>
            <textarea
              value={formData.specialty}
              onChange={onChange("specialty")}
              required
              rows={4}
              className={textareaClass}
              placeholder="Key strengths, tools, domain experience"
            />
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <FieldLabel>Target location</FieldLabel>
              <input type="text" value={formData.location} onChange={onChange("location")} required className={fieldClass} />
            </div>

            <div>
              <FieldLabel>Experience level</FieldLabel>
              <select value={formData.experience} onChange={onChange("experience")} className={fieldClass}>
                {experienceOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                className="premium-btn rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.01] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isLoading ? "Researching..." : "Generate report"}
              </button>
              <button type="button" onClick={onReset} className="muted-btn rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 transition">
                Reset
              </button>
            </div>
          </div>

          <div>
            <FieldLabel>Current resume (optional: PDF, DOCX, TXT)</FieldLabel>
            <input
              type="file"
              accept=".pdf,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && file.size > MAX_RESUME_BYTES) {
                  setResumeFile(null);
                  setError("Resume file is too large. Please upload a file up to 4MB.");
                  setRawResponse("");
                  event.currentTarget.value = "";
                  return;
                }
                setError("");
                setResumeFile(file);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            {resumeFile && <p className="mt-2 text-xs font-medium text-slate-500">Attached: {resumeFile.name}</p>}
          </div>

          <div>
            <FieldLabel>Notes (optional)</FieldLabel>
            <textarea
              value={formData.notes}
              onChange={onChange("notes")}
              rows={3}
              className={textareaClass}
              placeholder="Additional constraints, priorities, certifications, etc."
            />
          </div>
        </form>
      </section>

      {error && (
        <section className="mt-6 rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-rose-700">Request error</h2>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
          {rawResponse && (
            <pre className="mt-4 overflow-x-auto rounded-xl border border-rose-100 bg-white p-4 text-xs leading-5 text-slate-700">{rawResponse}</pre>
          )}
        </section>
      )}

      {report && (
        <section className={`mt-6 space-y-6 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Generated Report</h2>
            <div className="flex gap-2">
              <button type="button" onClick={onExportPdf} className="premium-btn rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition">
                Export to PDF
              </button>
              <button type="button" onClick={onExport} className="muted-btn rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition">
                Export to .docx
              </button>
            </div>
          </div>

          <div className={subCardClass}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Job Titles</h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">Title</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Responsibilities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.titles.map((title, index) => (
                    <tr key={`${title.title}-${index}`} className="align-top odd:bg-white even:bg-slate-50/60">
                      <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">{title.title}</td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{title.responsibilities}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-500">{report.section_notes.job_titles}</p>
          </div>

          <div className={subCardClass}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Title Groups</h3>
            <div className="grid grid-cols-3 gap-4">
              {(Object.entries(report.title_groups) as [keyof ResearchReport["title_groups"], string[]][]).map(([key, titles]) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-800">{titleGroupLabels[key]}</p>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {titles.map((title, index) => (
                      <li key={`${title}-${index}`}>{title}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">{report.section_notes.title_groups}</p>
          </div>

          <div className={subCardClass}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Companies</h3>
            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(report.company_priority) as [
                keyof ResearchReport["company_priority"],
                ResearchReport["company_priority"][keyof ResearchReport["company_priority"]],
              ][]).map(([key, group]) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">{companyLabels[key]}</p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityBadgeClass[group.priority]}`}
                    >
                      Priority: {group.priority}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[...group.remote_friendly, ...group.local].map((name, index) => (
                      <span
                        key={`${name}-${index}`}
                        className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-white p-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Remote Friendly</p>
                      <p className="mt-1 text-xs text-slate-500">{group.remote_friendly.join(", ") || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Local</p>
                      <p className="mt-1 text-xs text-slate-500">{group.local.join(", ") || "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">{report.section_notes.companies}</p>
          </div>

          <div className={subCardClass}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Vacancies</h3>
            <div className="grid grid-cols-2 gap-4">
              {report.vacancies.map((vacancy, index) => (
                <article key={`${vacancy.url}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">{vacancy.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{vacancy.company}</p>
                  <p className="mt-2 inline-block rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                    {vacancy.type}
                  </p>
                  <p className="ml-2 mt-2 inline-block rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                    Status: {vacancy.status}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{vacancy.notes}</p>
                  <a
                    href={vacancy.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
                  >
                    Open vacancy
                  </a>
                </article>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">{report.section_notes.vacancies}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={subCardClass}>
              <h3 className="text-lg font-semibold text-slate-900">Salary</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Min:</span> {report.salary.min}
                </p>
                <p>
                  <span className="font-semibold">Max:</span> {report.salary.max}
                </p>
                <p>
                  <span className="font-semibold">Average:</span> {report.salary.average}
                </p>
                <p>
                  <span className="font-semibold">Notes:</span> {report.salary.notes}
                </p>
              </div>
              <p className="mt-3 text-sm text-slate-500">{report.section_notes.salary}</p>
            </div>

            <div className={subCardClass}>
              <h3 className="text-lg font-semibold text-slate-900">LinkedIn Profiles</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {report.profiles.map((profile, index) => (
                  <li key={`${profile.url}-${index}`} className="rounded-lg border border-slate-200 bg-white/90 p-3">
                    <a
                      href={profile.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-indigo-700 underline-offset-2 hover:underline"
                    >
                      {profile.url}
                    </a>
                    <p className="mt-1 text-xs">{profile.notes}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">Borrow: {profile.profile_notes}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-slate-500">{report.section_notes.profiles}</p>
            </div>
          </div>

          <div className={subCardClass}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Requirements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-slate-700">Core responsibilities</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {report.requirements.core_responsibilities.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-slate-700">Core requirements</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {report.requirements.core_requirements.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-slate-700">Nice to have</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {report.requirements.nice_to_have.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">{report.section_notes.requirements}</p>
          </div>

          <div className={subCardClass}>
            <h3 className="text-lg font-semibold text-slate-900">Stop List</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {report.stop_list.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-500">{report.section_notes.stop_list}</p>
          </div>

          <div className={subCardClass}>
            <h3 className="text-lg font-semibold text-slate-900">Strategy</h3>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Connections target:</span> {report.strategy.connections_target}
              </p>
              <p>
                <span className="font-semibold">Applications target:</span> {report.strategy.applications_target}
              </p>
              <p>
                <span className="font-semibold">Notes:</span> {report.strategy.notes}
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-500">{report.section_notes.strategy}</p>
          </div>
        </section>
      )}
    </main>
  );
}
