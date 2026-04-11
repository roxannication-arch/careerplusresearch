import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import type { ResearchReport } from "@/lib/types";

const heading = (text: string): Paragraph =>
  new Paragraph({
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28 })],
  });

const body = (text: string): Paragraph =>
  new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22 })],
  });

const bullet = (text: string): Paragraph =>
  new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 70 },
  });

export async function generateResearchDocxBlob(report: ResearchReport, clientName: string): Promise<Blob> {
  const titleRows = [
    new TableRow({
      children: [
        new TableCell({ children: [body("Title")] }),
        new TableCell({ children: [body("Responsibilities")] }),
      ],
    }),
    ...report.titles.map(
      (item) =>
        new TableRow({
          children: [new TableCell({ children: [body(item.title)] }), new TableCell({ children: [body(item.responsibilities)] })],
        }),
    ),
  ];

  const titlesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: titleRows,
  });

  const groupedTitlesRows = [
    new TableRow({
      children: [
        new TableCell({ children: [body("Group")] }),
        new TableCell({ children: [body("Titles")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [body("Standard")] }),
        new TableCell({ children: [body(report.title_groups.standard.join("; "))] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [body("Niche")] }),
        new TableCell({ children: [body(report.title_groups.niche.join("; "))] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [body("Senior")] }),
        new TableCell({ children: [body(report.title_groups.senior.join("; "))] }),
      ],
    }),
  ];

  const groupedTitlesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: groupedTitlesRows,
  });

  const vacancyRows = [
    new TableRow({
      children: [
        new TableCell({ children: [body("Company")] }),
        new TableCell({ children: [body("Role")] }),
        new TableCell({ children: [body("Type")] }),
        new TableCell({ children: [body("Status")] }),
        new TableCell({ children: [body("URL")] }),
      ],
    }),
    ...report.vacancies.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({ children: [body(item.company)] }),
            new TableCell({ children: [body(item.title)] }),
            new TableCell({ children: [body(item.type)] }),
            new TableCell({ children: [body(item.status)] }),
            new TableCell({ children: [body(item.url)] }),
          ],
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
      children: [new TextRun({ text: `CareerPlus Research Report - ${clientName}`, bold: true, size: 34 })],
      spacing: { after: 220 },
    }),
    heading("Job Titles"),
    titlesTable,
    body(`Section note: ${report.section_notes.job_titles}`),
    heading("Title Groups"),
    groupedTitlesTable,
    heading("Companies"),
  ];

  (
    Object.entries(report.company_priority) as [
      keyof ResearchReport["company_priority"],
      ResearchReport["company_priority"][keyof ResearchReport["company_priority"]],
    ][]
  ).forEach(([key, values]) => {
      sectionChildren.push(body(`${key.replaceAll("_", " ")} (Priority: ${values.priority})`));
      sectionChildren.push(body(`Remote friendly: ${values.remote_friendly.join(", ")}`));
      sectionChildren.push(body(`Local: ${values.local.join(", ")}`));
    },
  );

  sectionChildren.push(
    heading("Vacancies"),
    vacanciesTable,
    body(`Section note: ${report.section_notes.vacancies}`),
    heading("Salary"),
    body(`Min: ${report.salary.min}`),
    body(`Max: ${report.salary.max}`),
    body(`Average: ${report.salary.average}`),
    body(`Notes: ${report.salary.notes}`),
    body(`Section note: ${report.section_notes.salary}`),
    heading("Requirements"),
    body("Core Responsibilities"),
  );

  report.requirements.core_responsibilities.forEach((item) => sectionChildren.push(bullet(item)));
  sectionChildren.push(body("Core Requirements"));
  report.requirements.core_requirements.forEach((item) => sectionChildren.push(bullet(item)));
  sectionChildren.push(body("Nice to Have"));
  report.requirements.nice_to_have.forEach((item) => sectionChildren.push(bullet(item)));
  sectionChildren.push(body(`Section note: ${report.section_notes.requirements}`));

  sectionChildren.push(heading("LinkedIn Profiles"));
  report.profiles.forEach((profile) => {
    sectionChildren.push(body(profile.url), body(`Notes: ${profile.notes}`), body(`What to borrow: ${profile.profile_notes}`));
  });
  sectionChildren.push(body(`Section note: ${report.section_notes.profiles}`));

  sectionChildren.push(
    heading("Stop List"),
    ...report.stop_list.map((item) => bullet(item)),
    body(`Section note: ${report.section_notes.stop_list}`),
    heading("Strategy"),
    body(`Connections target: ${report.strategy.connections_target}`),
    body(`Applications target: ${report.strategy.applications_target}`),
    body(`Notes: ${report.strategy.notes}`),
    body(`Section note: ${report.section_notes.strategy}`),
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
