import { IncomeOwner } from "@/lib/types";

const OWNER_PREFIX = /^(me|milena)::/i;

export function encodeIncomeCategoryId(owner: IncomeOwner, source: string): string {
  const trimmedSource = source.trim() || "Income";
  return `${owner}::${trimmedSource}`;
}

export function parseIncomeCategoryId(categoryId: string): {
  owner: IncomeOwner | null;
  source: string;
} {
  const raw = categoryId.trim();
  const match = raw.match(OWNER_PREFIX);
  if (!match) {
    return {
      owner: null,
      source: raw || "Income",
    };
  }

  const owner = match[1].toLowerCase() === "milena" ? "milena" : "me";
  const source = raw.replace(OWNER_PREFIX, "").trim() || "Income";
  return {
    owner,
    source,
  };
}

export function normalizeIncomeSource(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "roksana" || normalized === "роксана") {
    return "Roksana";
  }
  if (normalized === "milena" || normalized === "милена") {
    return "Milena";
  }
  if (normalized === "other" || normalized === "другое") {
    return "Other";
  }
  return value.trim() || "Other";
}
