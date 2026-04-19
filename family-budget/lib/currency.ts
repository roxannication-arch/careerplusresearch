import { Currency } from "@/lib/types";

const rubFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function normalizeAmount(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  return value;
}

export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate: number,
): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  const safeRate = Number.isFinite(exchangeRate) && exchangeRate > 0 ? exchangeRate : 1;

  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === "USD" && toCurrency === "RUB") {
    return amount * safeRate;
  }

  return amount / safeRate;
}

export function toRub(amount: number, currency: Currency, exchangeRate: number): number {
  return convertCurrency(amount, currency, "RUB", exchangeRate);
}

export function toUsd(amount: number, currency: Currency, exchangeRate: number): number {
  return convertCurrency(amount, currency, "USD", exchangeRate);
}

export function formatRub(value: number): string {
  return rubFormatter.format(normalizeAmount(value));
}

export function formatUsd(value: number): string {
  return usdFormatter.format(normalizeAmount(value));
}
