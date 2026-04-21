"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Currency, Pocket } from "@/lib/types";

interface PocketCardProps {
  pocket: Pocket;
  exchangeRate: number;
  onUpdate: (patch: Partial<Pocket>) => void;
  onDelete: () => void;
  onAddFunds: (amount: number, currency: Currency) => void;
}

export function PocketCard({ pocket, exchangeRate, onUpdate, onDelete, onAddFunds }: PocketCardProps) {
  const [fundAmount, setFundAmount] = useState("");
  const [fundCurrency, setFundCurrency] = useState<Currency>(pocket.currency);

  const progressValue =
    pocket.targetAmount && pocket.targetAmount > 0
      ? Math.min((pocket.savedAmount / pocket.targetAmount) * 100, 100)
      : 0;
  const remaining = pocket.targetAmount ? Math.max(pocket.targetAmount - pocket.savedAmount, 0) : null;

  return (
    <Card className="bg-white">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <Input
            value={pocket.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
            placeholder="Название покета"
          />
          <Input
            type="color"
            value={pocket.color}
            onChange={(event) => onUpdate({ color: event.target.value })}
            className="h-9 w-14 p-1"
            aria-label="Цвет покета"
          />
          <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Удалить покет">
            <Trash2 className="size-4 text-rose-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Накоплено</p>
            <CurrencyDisplay
              amount={pocket.savedAmount}
              currency={pocket.currency}
              exchangeRate={exchangeRate}
              rubClassName="text-lg font-semibold text-slate-900"
              usdClassName="text-xs text-muted-foreground"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Цель</p>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={pocket.targetAmount ?? ""}
              placeholder="Не указана"
              onChange={(event) => {
                const value = event.target.value;
                if (value.trim() === "") {
                  onUpdate({ targetAmount: null });
                  return;
                }
                const parsed = Number.parseFloat(value);
                onUpdate({ targetAmount: Number.isFinite(parsed) ? parsed : null });
              }}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Осталось</p>
            {remaining === null ? (
              <p className="text-sm text-muted-foreground">Без цели</p>
            ) : (
              <CurrencyDisplay
                amount={remaining}
                currency={pocket.currency}
                exchangeRate={exchangeRate}
                rubClassName="font-medium text-slate-900"
                usdClassName="text-xs text-muted-foreground"
              />
            )}
          </div>
        </div>

        <Progress
          value={progressValue}
          className="gap-2"
          style={{ ["--progress-color" as string]: pocket.color }}
        >
          <p className="text-xs text-muted-foreground">Прогресс</p>
          <p className="text-xs text-muted-foreground">{Math.round(progressValue)}%</p>
        </Progress>

        <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={fundAmount}
            placeholder="Сумма пополнения"
            onChange={(event) => setFundAmount(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              const parsed = Number.parseFloat(fundAmount);
              if (!Number.isFinite(parsed) || parsed <= 0) {
                return;
              }
              onAddFunds(parsed, fundCurrency);
              setFundAmount("");
            }}
          />
          <Select
            value={fundCurrency}
            onValueChange={(value) => setFundCurrency(value === "USD" ? "USD" : "RUB")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RUB">RUB</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              const parsed = Number.parseFloat(fundAmount);
              if (!Number.isFinite(parsed) || parsed <= 0) {
                return;
              }
              onAddFunds(parsed, fundCurrency);
              setFundAmount("");
            }}
          >
            <Plus className="size-4" />
            +пополнить
          </Button>
          <div className="rounded-md px-3 py-2 text-xs text-muted-foreground" style={{ backgroundColor: `${pocket.color}20` }}>
            Валюта покета: {pocket.currency}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
