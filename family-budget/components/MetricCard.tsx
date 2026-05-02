"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRub, formatUsd } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  rubValue: number;
  usdValue: number;
  tone?: "default" | "positive" | "negative" | "pocket";
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "text-foreground",
  positive: "text-emerald-600",
  negative: "text-rose-600",
  pocket: "text-indigo-600",
};

export function MetricCard({ title, rubValue, usdValue, tone = "default" }: MetricCardProps) {
  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader className="pb-0">
        <CardTitle className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-500">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        <p className={cn("text-2xl sm:text-3xl font-semibold tracking-tight", toneClasses[tone])}>
          {formatRub(rubValue)}
        </p>
        <p className="text-xs font-medium text-slate-500">{formatUsd(usdValue)}</p>
      </CardContent>
    </Card>
  );
}
