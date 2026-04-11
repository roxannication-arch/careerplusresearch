import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ResearchReport } from "@/lib/types";

const BRAND = {
  navy: "1E293B",
  ink: "0F172A",
  slate: "475569",
  line: "CBD5E1",
  soft: "F8FAFC",
};

const heading = (text: string): Paragraph =>
  new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND.line } },
    children: [new TextRun({ text, bold: true, size: 28, color: BRAND.ink })],
  });

const body = (text: string): Paragraph =>
  new Paragraph({
    spacing: { after: 90 },
    children: [new TextRun({ text, size: 22, color: BRAND.ink })],
  });

const label = (text: string): Paragraph =>
  new Paragraph({
    spacing: { before: 140, after: 70 },
    children: [new TextRun({ text, size: 20, bold: true, color: BRAND.slate })],
  });

const note = (text: string): Paragraph =>
  new Paragraph({
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, size: 20, italics: true, color: BRAND.slate })],
  });

const bullet = (text: string, level = 0): Paragraph =>
  new Paragraph({
    text,
    bullet: { level },
    spacing: { after: 70 },
    thematicBreak: false,
  });

const tableHeader = (text: string) =>
  new TableCell({
    shading: { fill: BRAND.soft, color: BRAND.soft },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: BRAND.navy })] })],
  });

const tableBody = (text: string) =>
  new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, color: BRAND.ink })] })],
  });

export async function generateResearchDocxBlob(report: ResearchReport, clientName: string): Promise<Blob> {
  const titleRows = [
    new TableRow({
      children: [tableHeader("Title"), tableHeader("Responsibilities")],
    }),
    ...report.titles.map(
      (item) =>
        new TableRow({
          children: [tableBody(item.title), tableBody(item.responsibilities)],
        }),
    ),
  ];

  const titlesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: titleRows,
  });

  const groupedTitlesRows = [
    new TableRow({
      children: [tableHeader("Group"), tableHeader("Titles")],
    }),
    new TableRow({
      children: [tableBody("Standard"), tableBody(report.title_groups.standard.join("; "))],
    }),
    new TableRow({
      children: [tableBody("Niche"), tableBody(report.title_groups.niche.join("; "))],
    }),
    new TableRow({
      children: [tableBody("Senior"), tableBody(report.title_groups.senior.join("; "))],
    }),
  ];

  const groupedTitlesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: groupedTitlesRows,
  });

  const vacancyRows = [
    new TableRow({
      children: [tableHeader("Company"), tableHeader("Role"), tableHeader("Type"), tableHeader("Status"), tableHeader("URL")],
    }),
    ...report.vacancies.map(
      (item) =>
        new TableRow({
          children: [tableBody(item.company), tableBody(item.title), tableBody(item.type), tableBody(item.status), tableBody(item.url)],
        }),
    ),
  ];

  const vacanciesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: vacancyRows,
  });

  const sectionChildren: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "CAREERPLUS RESEARCH REPORT", bold: true, size: 38, color: BRAND.navy })],
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: clientName, size: 26, color: BRAND.slate })],
      spacing: { after: 260 },
    }),
    heading("Job Titles"),
    titlesTable,
    note(`Strategic Note: ${report.section_notes.job_titles}`),
    heading("Title Groups"),
    groupedTitlesTable,
    note(`Strategic Note: ${report.section_notes.title_groups}`),
    heading("Companies"),
  ];

  (
    Object.entries(report.company_priority) as [
      keyof ResearchReport["company_priority"],
      ResearchReport["company_priority"][keyof ResearchReport["company_priority"]],
    ][]
  ).forEach(([key, values]) => {
      sectionChildren.push(label(`${key.replaceAll("_", " ")}  |  Priority: ${values.priority}`));
      sectionChildren.push(body(`Remote-friendly: ${values.remote_friendly.join(", ") || "—"}`));
      sectionChildren.push(body(`Local: ${values.local.join(", ") || "—"}`));
    },
  );
  sectionChildren.push(note(`Strategic Note: ${report.section_notes.companies}`));

  sectionChildren.push(
    heading("Vacancies"),
    vacanciesTable,
    note(`Strategic Note: ${report.section_notes.vacancies}`),
    heading("Salary"),
    label("Compensation Snapshot"),
    body(`Min: ${report.salary.min}`),
    body(`Max: ${report.salary.max}`),
    body(`Average: ${report.salary.average}`),
    body(`Notes: ${report.salary.notes}`),
    note(`Strategic Note: ${report.section_notes.salary}`),
    heading("Requirements"),
    label("Core Responsibilities"),
  );

  report.requirements.core_responsibilities.forEach((item) => sectionChildren.push(bullet(item)));
  sectionChildren.push(label("Core Requirements"));
  report.requirements.core_requirements.forEach((item) => sectionChildren.push(bullet(item)));
  sectionChildren.push(label("Nice to Have"));
  report.requirements.nice_to_have.forEach((item) => sectionChildren.push(bullet(item)));
  sectionChildren.push(note(`Strategic Note: ${report.section_notes.requirements}`));

  sectionChildren.push(heading("LinkedIn Profiles"));
  report.profiles.forEach((profile) => {
    sectionChildren.push(
      body(profile.url),
      body(`Notes: ${profile.notes}`),
      body(`What to borrow: ${profile.profile_notes}`),
      new Paragraph({ spacing: { after: 40 } }),
    );
  });
  sectionChildren.push(note(`Strategic Note: ${report.section_notes.profiles}`));

  sectionChildren.push(
    heading("Stop List"),
    ...report.stop_list.map((item) => bullet(item)),
    note(`Strategic Note: ${report.section_notes.stop_list}`),
    heading("Strategy"),
    label("Execution Plan"),
    body(`Connections target: ${report.strategy.connections_target}`),
    body(`Applications target: ${report.strategy.applications_target}`),
    body(`Notes: ${report.strategy.notes}`),
    note(`Strategic Note: ${report.section_notes.strategy}`),
  );

  const doc = new Document({
    sections: [
      {
        children: sectionChildren,
      },
    ],
  });

  return Packer.toBlob(doc);
}
