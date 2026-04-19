"use client";

import { formatRub, formatUsd, toRub, toUsd } from "@/lib/currency";
import { Currency } from "@/lib/types";

interface CurrencyDisplayProps {
  amount: number | null | undefined;
  currency: Currency;
  exchangeRate: number;
  rubClassName?: string;
  usdClassName?: string;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  currency,
  exchangeRate,
  rubClassName,
  usdClassName,
  className,
}: CurrencyDisplayProps) {
  const hasValue = typeof amount === "number" && Number.isFinite(amount);
  const rubValue = hasValue ? toRub(amount, currency, exchangeRate) : null;
  const usdValue = hasValue ? toUsd(amount, currency, exchangeRate) : null;

  return (
    <div className={className}>
      <p className={rubClassName}>{rubValue === null ? "—" : formatRub(rubValue)}</p>
      <p className={usdClassName}>{usdValue === null ? "—" : formatUsd(usdValue)}</p>
    </div>
  );
}
