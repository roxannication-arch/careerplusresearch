import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Color, PDFFont, PDFPage } from "pdf-lib";
import type { ResearchReport } from "@/lib/types";

const PAGE_MARGIN = 44;
const HEADER_COLOR = rgb(0.19, 0.27, 0.47);
const SUBTLE_COLOR = rgb(0.4, 0.45, 0.56);
const TEXT_COLOR = rgb(0.13, 0.15, 0.2);

type PdfContext = {
  doc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
};

function ensureSpace(ctx: PdfContext, minY = 90) {
  if (ctx.y > minY) return;
  ctx.page = ctx.doc.addPage([ctx.width, ctx.height]);
  ctx.y = ctx.height - PAGE_MARGIN;
}

function textWrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function writeLines(
  ctx: PdfContext,
  lines: string[],
  options: { size?: number; color?: Color; lineGap?: number; bold?: boolean } = {},
) {
  const size = options.size ?? 10;
  const color = options.color ?? TEXT_COLOR;
  const lineGap = options.lineGap ?? 4;
  const font = options.bold ? ctx.bold : ctx.regular;

  for (const line of lines) {
    ensureSpace(ctx);
    ctx.page.drawText(line, {
      x: PAGE_MARGIN,
      y: ctx.y,
      size,
      font,
      color,
    });
    ctx.y -= size + lineGap;
  }
}

function writeParagraph(
  ctx: PdfContext,
  text: string,
  options: { size?: number; color?: Color; bold?: boolean; spacingAfter?: number } = {},
) {
  const size = options.size ?? 10;
  const maxWidth = ctx.width - PAGE_MARGIN * 2;
  const font = options.bold ? ctx.bold : ctx.regular;
  const lines = textWrap(font, text, size, maxWidth);
  writeLines(ctx, lines, { size, color: options.color, bold: options.bold });
  ctx.y -= options.spacingAfter ?? 6;
}

function writeSectionTitle(ctx: PdfContext, title: string) {
  ensureSpace(ctx, 130);
  ctx.page.drawLine({
    start: { x: PAGE_MARGIN, y: ctx.y + 4 },
    end: { x: ctx.width - PAGE_MARGIN, y: ctx.y + 4 },
    thickness: 0.6,
    color: rgb(0.85, 0.88, 0.93),
  });
  ctx.y -= 16;
  ctx.page.drawText(title, {
    x: PAGE_MARGIN,
    y: ctx.y,
    size: 13,
    font: ctx.bold,
    color: HEADER_COLOR,
  });
  ctx.y -= 20;
}

function writeBullets(ctx: PdfContext, items: string[], indent = 0) {
  const maxWidth = ctx.width - PAGE_MARGIN * 2 - indent - 14;
  for (const item of items) {
    ensureSpace(ctx);
    ctx.page.drawCircle({
      x: PAGE_MARGIN + indent + 3,
      y: ctx.y + 4,
      size: 1.7,
      color: rgb(0.3, 0.34, 0.46),
    });
    const lines = textWrap(ctx.regular, item, 10, maxWidth);
    for (let index = 0; index < lines.length; index += 1) {
      ensureSpace(ctx);
      ctx.page.drawText(lines[index], {
        x: PAGE_MARGIN + indent + 11,
        y: ctx.y,
        size: 10,
        font: ctx.regular,
        color: TEXT_COLOR,
      });
      ctx.y -= 14;
    }
    ctx.y -= 2;
  }
  ctx.y -= 4;
}

export async function generateResearchPdfBlob(report: ResearchReport, clientName: string): Promise<Blob> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const ctx: PdfContext = {
    doc,
    page,
    width,
    height,
    y: height - PAGE_MARGIN,
    regular,
    bold,
  };

  // Cover
  ctx.page.drawRectangle({
    x: PAGE_MARGIN,
    y: ctx.y - 120,
    width: width - PAGE_MARGIN * 2,
    height: 110,
    color: rgb(0.96, 0.97, 1),
    borderColor: rgb(0.83, 0.87, 0.95),
    borderWidth: 1,
  });
  ctx.page.drawText("CareerPlus Research Report", {
    x: PAGE_MARGIN + 16,
    y: ctx.y - 42,
    size: 22,
    font: bold,
    color: HEADER_COLOR,
  });
  ctx.page.drawText(`Client: ${clientName}`, {
    x: PAGE_MARGIN + 16,
    y: ctx.y - 68,
    size: 11,
    font: regular,
    color: TEXT_COLOR,
  });
  ctx.page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: PAGE_MARGIN + 16,
    y: ctx.y - 86,
    size: 10,
    font: regular,
    color: SUBTLE_COLOR,
  });
  ctx.y -= 144;

  writeSectionTitle(ctx, "Job Titles");
  report.titles.forEach((item, index) => {
    writeParagraph(ctx, `${index + 1}. ${item.title}`, { bold: true, size: 10.5, spacingAfter: 2 });
    writeParagraph(ctx, item.responsibilities, { size: 10, color: SUBTLE_COLOR });
  });
  writeParagraph(ctx, `Interpretation: ${report.section_notes.job_titles}`, { size: 10, color: SUBTLE_COLOR });

  writeSectionTitle(ctx, "Title Groups");
  writeParagraph(ctx, `Standard: ${report.title_groups.standard.join(", ")}`);
  writeParagraph(ctx, `Niche: ${report.title_groups.niche.join(", ")}`);
  writeParagraph(ctx, `Senior: ${report.title_groups.senior.join(", ")}`);
  writeParagraph(ctx, `Interpretation: ${report.section_notes.title_groups}`, { size: 10, color: SUBTLE_COLOR });

  writeSectionTitle(ctx, "Companies & Priority");
  (Object.entries(report.company_priority) as [
    keyof ResearchReport["company_priority"],
    ResearchReport["company_priority"][keyof ResearchReport["company_priority"]],
  ][]).forEach(([key, group]) => {
    writeParagraph(ctx, `${key.replaceAll("_", " ")} — Priority: ${group.priority}`, { bold: true, size: 10.5, spacingAfter: 2 });
    writeParagraph(ctx, `Remote-friendly: ${group.remote_friendly.join(", ") || "—"}`, { size: 10 });
    writeParagraph(ctx, `Local: ${group.local.join(", ") || "—"}`, { size: 10 });
  });
  writeParagraph(ctx, `Interpretation: ${report.section_notes.companies}`, { size: 10, color: SUBTLE_COLOR });

  writeSectionTitle(ctx, "Vacancies");
  report.vacancies.forEach((vacancy) => {
    writeParagraph(ctx, `${vacancy.company} — ${vacancy.title}`, { bold: true, size: 10.5, spacingAfter: 2 });
    writeParagraph(ctx, `Type: ${vacancy.type} | Status: ${vacancy.status}`, { size: 10, color: SUBTLE_COLOR, spacingAfter: 2 });
    writeParagraph(ctx, `URL: ${vacancy.url}`, { size: 10 });
    writeParagraph(ctx, `Notes: ${vacancy.notes}`, { size: 10, color: SUBTLE_COLOR });
  });
  writeParagraph(ctx, `Interpretation: ${report.section_notes.vacancies}`, { size: 10, color: SUBTLE_COLOR });

  writeSectionTitle(ctx, "Salary");
  writeParagraph(ctx, `Range: ${report.salary.min} — ${report.salary.max}`);
  writeParagraph(ctx, `Average: ${report.salary.average}`);
  writeParagraph(ctx, `Notes: ${report.salary.notes}`, { size: 10, color: SUBTLE_COLOR });
  writeParagraph(ctx, `Interpretation: ${report.section_notes.salary}`, { size: 10, color: SUBTLE_COLOR });

  writeSectionTitle(ctx, "Requirements");
  writeParagraph(ctx, "Core responsibilities", { bold: true });
  writeBullets(ctx, report.requirements.core_responsibilities);
  writeParagraph(ctx, "Core requirements", { bold: true });
  writeBullets(ctx, report.requirements.core_requirements);
  writeParagraph(ctx, "Nice to have", { bold: true });
  writeBullets(ctx, report.requirements.nice_to_have);
  writeParagraph(ctx, `Interpretation: ${report.section_notes.requirements}`, { size: 10, color: SUBTLE_COLOR });

  writeSectionTitle(ctx, "LinkedIn Profiles");
  report.profiles.forEach((profile) => {
    writeParagraph(ctx, profile.url, { bold: true, size: 10.5, spacingAfter: 2 });
    writeParagraph(ctx, `Snapshot: ${profile.notes}`, { size: 10 });
    writeParagraph(ctx, `Borrow: ${profile.profile_notes}`, { size: 10, color: SUBTLE_COLOR });
  });
  writeParagraph(ctx, `Interpretation: ${report.section_notes.profiles}`, { size: 10, color: SUBTLE_COLOR });

  writeSectionTitle(ctx, "Stop List");
  writeBullets(ctx, report.stop_list);
  writeParagraph(ctx, `Interpretation: ${report.section_notes.stop_list}`, { size: 10, color: SUBTLE_COLOR });

  writeSectionTitle(ctx, "Strategy");
  writeParagraph(ctx, `Connections target: ${report.strategy.connections_target}`);
  writeParagraph(ctx, `Applications target: ${report.strategy.applications_target}`);
  writeParagraph(ctx, `Notes: ${report.strategy.notes}`, { size: 10, color: SUBTLE_COLOR });
  writeParagraph(ctx, `Interpretation: ${report.section_notes.strategy}`, { size: 10, color: SUBTLE_COLOR });

  const bytes = await doc.save();
  const pdfBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([pdfBuffer], { type: "application/pdf" });
}
