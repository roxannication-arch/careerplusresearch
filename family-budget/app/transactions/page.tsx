"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { TransactionForm } from "@/components/TransactionForm";
import { useBudget } from "@/components/BudgetProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateCategorySummary } from "@/lib/summary";

function monthStartDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export default function TransactionsPage() {
  const { monthData, addTransaction, deleteTransaction } = useBudget();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(monthStartDate());
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const categorySummary = useMemo(() => calculateCategorySummary(monthData), [monthData]);

  const filteredTransactions = monthData.transactions.filter((transaction) => {
    if (categoryFilter !== "all" && transaction.categoryId !== categoryFilter) {
      return false;
    }

    if (dateFrom && transaction.date < dateFrom) {
      return false;
    }

    if (dateTo && transaction.date > dateTo) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      <TransactionForm
        categories={monthData.expenses}
        onSubmit={(payload) => addTransaction(payload)}
      />

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Фильтры транзакций</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {monthData.expenses.map((expense) => (
                <SelectItem key={expense.id} value={expense.id}>
                  {expense.name.trim() || "Без названия"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Список транзакций</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Пока нет транзакций в выбранном диапазоне.
            </p>
          ) : (
            filteredTransactions.map((transaction) => {
              const category = monthData.expenses.find((item) => item.id === transaction.categoryId);
              return (
                <div
                  key={transaction.id}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    <p className="text-sm font-medium">{category?.name || "Без категории"}</p>
                    {transaction.note ? (
                      <p className="text-xs text-muted-foreground">{transaction.note}</p>
                    ) : null}
                  </div>
                  <CurrencyDisplay
                    amount={transaction.amount}
                    currency={transaction.currency}
                    exchangeRate={monthData.exchangeRate}
                    rubClassName="font-medium"
                    usdClassName="text-xs text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground self-center">
                    Валюта операции: {transaction.currency}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteTransaction(transaction.id)}
                    aria-label="Удалить транзакцию"
                    className="justify-self-start md:justify-self-end"
                  >
                    <Trash2 className="size-4 text-rose-500" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Итоги по категориям: план vs факт</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categorySummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">Добавьте категории бюджета для сводки.</p>
          ) : (
            categorySummary.map((item) => {
              const isOver = item.diffRub < 0;
              return (
                <div
                  key={item.categoryId}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <p className="text-sm font-medium">{item.categoryName}</p>
                  <div>
                    <p className="text-xs text-muted-foreground">План</p>
                    <CurrencyDisplay
                      amount={item.plannedRub}
                      currency="RUB"
                      exchangeRate={monthData.exchangeRate}
                      rubClassName="text-sm font-medium"
                      usdClassName="text-xs text-muted-foreground"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Факт</p>
                    <CurrencyDisplay
                      amount={item.actualRub}
                      currency="RUB"
                      exchangeRate={monthData.exchangeRate}
                      rubClassName="text-sm font-medium"
                      usdClassName="text-xs text-muted-foreground"
                    />
                  </div>
                  <p
                    className={`text-sm font-medium self-center ${
                      isOver ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {isOver ? "Перерасход" : "В рамках"}: {Math.abs(item.diffRub).toLocaleString("ru-RU")} ₽
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
