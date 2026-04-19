"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Currency, ExpenseItem } from "@/lib/types";

interface TransactionFormSubmitPayload {
  amount: number;
  currency: Currency;
  categoryId: string;
  date: string;
  note: string;
}

interface TransactionFormProps {
  categories: ExpenseItem[];
  onSubmit: (payload: TransactionFormSubmitPayload) => void;
}

export function TransactionForm({ categories, onSubmit }: TransactionFormProps) {
  const firstCategory = categories[0]?.id ?? "";
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("RUB");
  const [categoryId, setCategoryId] = useState(firstCategory);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const hasCategories = categories.length > 0;
  const selectedCategoryId = categories.some((item) => item.id === categoryId)
    ? categoryId
    : firstCategory;
  const categoryLabelMap = new Map(
    categories.map((category, index) => [
      category.id,
      category.name.trim() || `Категория ${index + 1}`,
    ]),
  );
  const selectedCategoryLabel = categoryLabelMap.get(selectedCategoryId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-base font-semibold">+ Добавить транзакцию</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={amount}
          placeholder="Сумма"
          onChange={(event) => setAmount(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
        />
        <Select value={currency} onValueChange={(value) => setCurrency(value === "USD" ? "USD" : "RUB")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RUB">RUB</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={selectedCategoryId}
          onValueChange={(value) => setCategoryId(value ?? "")}
          disabled={!hasCategories}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={hasCategories ? "Категория" : "Сначала добавьте категорию"}>
              {selectedCategoryLabel ?? (hasCategories ? "Категория" : "Сначала добавьте категорию")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {categoryLabelMap.get(category.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Заметка (опционально)"
        className="mt-3 min-h-[84px]"
      />
      <div className="mt-3 flex justify-end">
        <Button
          onClick={() => {
            const parsed = Number.parseFloat(amount);
            if (!Number.isFinite(parsed) || parsed <= 0 || !selectedCategoryId || !hasCategories) {
              return;
            }
            onSubmit({
              amount: parsed,
              currency,
              categoryId: selectedCategoryId,
              date,
              note,
            });
            setAmount("");
            setNote("");
          }}
        >
          Добавить транзакцию
        </Button>
      </div>
    </div>
  );
}
