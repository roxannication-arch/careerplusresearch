"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { MetricCard } from "@/components/MetricCard";
import { PocketCard } from "@/components/PocketCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRub } from "@/lib/currency";
import {
  calculateCategorySummary,
  calculateIncomeTotals,
  calculateRunningBalance,
  calculateTotalExpenses,
  calculatePocketTotals,
} from "@/lib/summary";
import { useBudget } from "@/components/BudgetProvider";

const chartPalette = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];

function tooltipFormatter(value: unknown) {
  if (typeof value === "number") {
    return formatRub(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? formatRub(parsed) : value;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "number") {
      return formatRub(first);
    }
    if (typeof first === "string") {
      const parsed = Number.parseFloat(first);
      return Number.isFinite(parsed) ? formatRub(parsed) : first;
    }
  }
  return "—";
}

export default function DashboardPage() {
  const { monthData, addFundsToPocket, updatePocket, deletePocket } = useBudget();
  const income = useMemo(() => calculateIncomeTotals(monthData), [monthData]);
  const expenses = useMemo(() => calculateTotalExpenses(monthData), [monthData]);
  const pockets = useMemo(() => calculatePocketTotals(monthData), [monthData]);
  const running = useMemo(() => calculateRunningBalance(monthData), [monthData]);
  const categorySummary = useMemo(() => calculateCategorySummary(monthData), [monthData]);

  const chartData = categorySummary
    .filter((item) => item.plannedRub > 0 || item.actualRub > 0)
    .map((item) => ({
      name: item.categoryName,
      plannedRub: Number(item.plannedRub.toFixed(2)),
      actualRub: Number(item.actualRub.toFixed(2)),
    }));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Общий доход" rubValue={income.rub} usdValue={income.usd} tone="positive" />
        <MetricCard title="Общие расходы" rubValue={expenses.rub} usdValue={expenses.usd} tone="negative" />
        <MetricCard title="В покетах" rubValue={pockets.rub} usdValue={pockets.usd} tone="pocket" />
        <MetricCard
          title="Свободный остаток"
          rubValue={running.rub}
          usdValue={running.usd}
          tone={running.rub >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Структура бюджета по категориям</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Пока нет категорий с суммами. Заполните раздел &quot;Бюджет&quot;.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="plannedRub"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={96}
                    paddingAngle={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={tooltipFormatter}
                    contentStyle={{ borderRadius: "12px", borderColor: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>План и факт по категориям (месяц)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Добавьте категории и транзакции для графика.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={56} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip
                    formatter={tooltipFormatter}
                    contentStyle={{ borderRadius: "12px", borderColor: "#e2e8f0" }}
                  />
                  <Bar dataKey="plannedRub" name="План" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="actualRub" name="Факт" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Покеты</CardTitle>
        </CardHeader>
        <CardContent>
          {monthData.pockets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Покетов пока нет. Создайте их на вкладке &quot;Покеты&quot;.
            </p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {monthData.pockets.map((pocket) => (
                <PocketCard
                  key={pocket.id}
                  pocket={pocket}
                  exchangeRate={monthData.exchangeRate}
                  onUpdate={(patch) => updatePocket(pocket.id, patch)}
                  onDelete={() => deletePocket(pocket.id)}
                  onAddFunds={(amount, currency) => addFundsToPocket(pocket.id, amount, currency)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
