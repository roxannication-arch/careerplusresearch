"use client";

import { Plus } from "lucide-react";

import { BudgetRow } from "@/components/BudgetRow";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { InlineEditable } from "@/components/InlineEditable";
import { useBudget } from "@/components/BudgetProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateIncomeTotals, calculatePlannedExpenseTotals } from "@/lib/summary";

export default function BudgetPage() {
  const {
    monthData,
    updateExchangeRate,
    updateIncome,
    addIncome,
    deleteIncome,
    updateExpense,
    addExpense,
    deleteExpense,
  } = useBudget();

  const incomeTotals = calculateIncomeTotals(monthData);
  const plannedTotals = calculatePlannedExpenseTotals(monthData);

  return (
    <div className="space-y-5">
      <Card className="bg-white">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Курс валют</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">1 USD =</span>
            <div className="min-w-32">
              <InlineEditable
                type="number"
                value={monthData.exchangeRate}
                onCommit={(value) => {
                  if (typeof value === "number" && value > 0) {
                    updateExchangeRate(value);
                  }
                }}
                placeholder="92"
              />
            </div>
            <span className="text-muted-foreground">RUB</span>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-white">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Доходы</CardTitle>
          <Button variant="outline" onClick={addIncome}>
            <Plus className="size-4" />
            Добавить источник
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {monthData.incomes.map((income) => (
            <BudgetRow
              key={income.id}
              name={income.name}
              amount={income.amount}
              currency={income.currency}
              exchangeRate={monthData.exchangeRate}
              namePlaceholder="Источник дохода"
              amountPlaceholder="Сумма"
              onNameChange={(value) => updateIncome(income.id, { name: value })}
              onAmountChange={(value) => updateIncome(income.id, { amount: value })}
              onCurrencyChange={(currency) => updateIncome(income.id, { currency })}
              onDelete={
                monthData.incomes.length > 2 ? () => deleteIncome(income.id) : undefined
              }
            />
          ))}
          <div className="rounded-lg bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-700">Итого доходы</p>
            <CurrencyDisplay
              amount={incomeTotals.rub}
              currency="RUB"
              exchangeRate={monthData.exchangeRate}
              rubClassName="text-lg font-semibold text-emerald-700"
              usdClassName="text-xs text-emerald-700/80"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Плановые расходы</CardTitle>
          <Button variant="outline" onClick={addExpense}>
            <Plus className="size-4" />
            Добавить категорию
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {monthData.expenses.map((expense) => (
            <BudgetRow
              key={expense.id}
              name={expense.name}
              amount={expense.amount}
              currency={expense.currency}
              exchangeRate={monthData.exchangeRate}
              namePlaceholder="Название категории"
              amountPlaceholder="Сумма"
              onNameChange={(value) => updateExpense(expense.id, { name: value })}
              onAmountChange={(value) => updateExpense(expense.id, { amount: value })}
              onCurrencyChange={(currency) => updateExpense(expense.id, { currency })}
              onDelete={() => deleteExpense(expense.id)}
            />
          ))}
          <div className="rounded-lg bg-rose-50 px-3 py-2">
            <p className="text-xs text-rose-700">Итого плановые расходы</p>
            <CurrencyDisplay
              amount={plannedTotals.rub}
              currency="RUB"
              exchangeRate={monthData.exchangeRate}
              rubClassName="text-lg font-semibold text-rose-700"
              usdClassName="text-xs text-rose-700/80"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
