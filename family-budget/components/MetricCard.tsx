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
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className={cn("text-3xl font-semibold tracking-tight", toneClasses[tone])}>
          {formatRub(rubValue)}
        </p>
        <p className="text-sm text-muted-foreground">{formatUsd(usdValue)}</p>
      </CardContent>
    </Card>
  );
}
