"use client";

import { Trash2 } from "lucide-react";

import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { InlineEditable } from "@/components/InlineEditable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Currency } from "@/lib/types";

interface BudgetRowProps {
  name: string;
  amount: number | null;
  currency: Currency;
  exchangeRate: number;
  namePlaceholder?: string;
  amountPlaceholder?: string;
  onNameChange: (value: string) => void;
  onAmountChange: (value: number | null) => void;
  onCurrencyChange: (currency: Currency) => void;
  onDelete?: () => void;
  readonly?: boolean;
}

export function BudgetRow({
  name,
  amount,
  currency,
  exchangeRate,
  namePlaceholder = "Название",
  amountPlaceholder = "0",
  onNameChange,
  onAmountChange,
  onCurrencyChange,
  onDelete,
  readonly,
}: BudgetRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:grid-cols-[1.3fr_0.8fr_0.5fr_0.8fr_auto] md:items-center">
      <InlineEditable
        value={name}
        onCommit={(value) => onNameChange(typeof value === "string" ? value : "")}
        placeholder={namePlaceholder}
        className="h-9"
        disabled={readonly}
      />
      <InlineEditable
        type="number"
        value={amount}
        onCommit={(value) => onAmountChange(typeof value === "number" ? value : null)}
        placeholder={amountPlaceholder}
        className="h-9"
        disabled={readonly}
      />
      <Select
        value={currency}
        onValueChange={(value) => onCurrencyChange(value === "USD" ? "USD" : "RUB")}
        disabled={readonly}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="RUB">RUB</SelectItem>
          <SelectItem value="USD">USD</SelectItem>
        </SelectContent>
      </Select>
      <CurrencyDisplay
        amount={amount}
        currency={currency}
        exchangeRate={exchangeRate}
        rubClassName="font-medium text-slate-900"
        usdClassName="text-xs text-muted-foreground"
      />
      {onDelete ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Удалить строку"
          disabled={readonly}
        >
          <Trash2 className="size-4 text-rose-500" />
        </Button>
      ) : (
        <div className="hidden md:block" />
      )}
    </div>
  );
}
