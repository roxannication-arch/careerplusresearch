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

  const vacancyRows = [
    new TableRow({
      children: [
        new TableCell({ children: [body("Company")] }),
        new TableCell({ children: [body("Role")] }),
        new TableCell({ children: [body("Type")] }),
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
    heading("Companies"),
  ];

  (Object.entries(report.companies) as [keyof ResearchReport["companies"], string[]][]).forEach(([key, values]) => {
    sectionChildren.push(body(`${key.replaceAll("_", " ")}:`));
    values.forEach((value) => sectionChildren.push(bullet(value)));
  });

  sectionChildren.push(
    heading("Vacancies"),
    vacanciesTable,
    heading("Salary"),
    body(`Min: ${report.salary.min}`),
    body(`Max: ${report.salary.max}`),
    body(`Average: ${report.salary.average}`),
    body(`Notes: ${report.salary.notes}`),
    heading("Requirements"),
    body("Core Responsibilities"),
  );

  report.requirements.core_responsibilities.forEach((item) => sectionChildren.push(bullet(item)));
  sectionChildren.push(body("Core Requirements"));
  report.requirements.core_requirements.forEach((item) => sectionChildren.push(bullet(item)));
  sectionChildren.push(body("Nice to Have"));
  report.requirements.nice_to_have.forEach((item) => sectionChildren.push(bullet(item)));

  sectionChildren.push(heading("LinkedIn Profiles"));
  report.profiles.forEach((profile) => {
    sectionChildren.push(body(profile.url), body(`Notes: ${profile.notes}`));
  });

  sectionChildren.push(
    heading("Strategy"),
    body(`Connections target: ${report.strategy.connections_target}`),
    body(`Applications target: ${report.strategy.applications_target}`),
    body(`Notes: ${report.strategy.notes}`),
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
