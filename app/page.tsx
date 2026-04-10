"use client";

import { useMemo, useState } from "react";
import { generateResearchDocxBlob } from "@/lib/docx";
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

const initialForm: ResearchPayload = {
  clientName: "",
  specialty: "",
  targetRole: "",
  location: "USA",
  experience: "Middle 2-5yr",
  notes: "",
};

const experienceOptions: ExperienceLevel[] = ["Junior 0-2yr", "Middle 2-5yr", "Senior 5+yr", "Lead"];

const companyLabels: Record<keyof ResearchReport["companies"], string> = {
  large_tech: "Large Tech",
  design_agencies: "Design Agencies",
  startups: "Startups",
  saas_marketing: "SaaS / Marketing",
  staffing_agencies: "Staffing Agencies",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-semibold text-slate-700">{children}</label>;
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
    setIsLoading(true);
    setError("");
    setReport(null);
    setRawResponse("");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as ApiSuccess | ApiError;
      if (response.ok && data.ok) {
        setReport(data.report);
        setRawResponse(data.rawText);
        return;
      }

      setError(!data.ok ? data.error ?? "Request failed." : "Request failed.");
      setRawResponse(!data.ok ? data.rawText ?? "" : "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error.");
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = () => {
    setFormData(initialForm);
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

  return (
    <main className="mx-auto max-w-[1400px] px-10 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">CareerPlus Research Generator</h1>
        <p className="mt-2 text-sm text-slate-600">
          Generate structured US market research reports for consultants. Desktop optimized.
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <FieldLabel>Client name</FieldLabel>
              <input
                type="text"
                value={formData.clientName}
                onChange={onChange("clientName")}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:border-indigo-500 focus:ring-2"
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div>
              <FieldLabel>Target job title</FieldLabel>
              <input
                type="text"
                value={formData.targetRole}
                onChange={onChange("targetRole")}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:border-indigo-500 focus:ring-2"
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:border-indigo-500 focus:ring-2"
              placeholder="Key strengths, tools, domain experience"
            />
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <FieldLabel>Target location</FieldLabel>
              <input
                type="text"
                value={formData.location}
                onChange={onChange("location")}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:border-indigo-500 focus:ring-2"
              />
            </div>

            <div>
              <FieldLabel>Experience level</FieldLabel>
              <select
                value={formData.experience}
                onChange={onChange("experience")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:border-indigo-500 focus:ring-2"
              >
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
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading ? "Researching..." : "Generate report"}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Reset
              </button>
            </div>
          </div>

          <div>
            <FieldLabel>Notes (optional)</FieldLabel>
            <textarea
              value={formData.notes}
              onChange={onChange("notes")}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:border-indigo-500 focus:ring-2"
              placeholder="Additional constraints, priorities, certifications, etc."
            />
          </div>
        </form>
      </section>

      {error && (
        <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-rose-700">Request error</h2>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
          {rawResponse && (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-white p-4 text-xs leading-5 text-slate-700">{rawResponse}</pre>
          )}
        </section>
      )}

      {report && (
        <section className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Generated Report</h2>
            <button
              type="button"
              onClick={onExport}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Export to .docx
            </button>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Job Titles</h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">Title</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Responsibilities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.titles.map((title, index) => (
                    <tr key={`${title.title}-${index}`} className="align-top odd:bg-white even:bg-slate-50/40">
                      <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">{title.title}</td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{title.responsibilities}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Companies</h3>
            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(report.companies) as [keyof ResearchReport["companies"], string[]][]).map(([key, names]) => (
                <div key={key} className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">{companyLabels[key]}</p>
                  <div className="flex flex-wrap gap-2">
                    {names.map((name, index) => (
                      <span
                        key={`${name}-${index}`}
                        className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Vacancies</h3>
            <div className="grid grid-cols-2 gap-4">
              {report.vacancies.map((vacancy, index) => (
                <article key={`${vacancy.url}-${index}`} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">{vacancy.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{vacancy.company}</p>
                  <p className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {vacancy.type}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">{vacancy.notes}</p>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-4">
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
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-900">LinkedIn Profiles</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {report.profiles.map((profile, index) => (
                  <li key={`${profile.url}-${index}`} className="rounded-lg bg-slate-50 p-2">
                    <a
                      href={profile.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-indigo-700 underline-offset-2 hover:underline"
                    >
                      {profile.url}
                    </a>
                    <p className="mt-1 text-xs">{profile.notes}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Requirements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-700">Core responsibilities</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {report.requirements.core_responsibilities.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-700">Core requirements</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {report.requirements.core_requirements.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="col-span-2 rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-700">Nice to have</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {report.requirements.nice_to_have.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
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
          </div>
        </section>
      )}
    </main>
  );
}
