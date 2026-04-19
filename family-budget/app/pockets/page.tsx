"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { PocketCard } from "@/components/PocketCard";
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
import { Currency } from "@/lib/types";

const pocketColors = ["#4f46e5", "#0ea5e9", "#10b981", "#f97316", "#ef4444", "#8b5cf6"];

export default function PocketsPage() {
  const { monthData, addPocket, updatePocket, deletePocket, addFundsToPocket } = useBudget();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("RUB");
  const [color, setColor] = useState(pocketColors[0]);

  return (
    <div className="space-y-5">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Создать покет</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_180px_130px_140px_auto]">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Название покета" />
          <Input
            type="number"
            min={0}
            step="0.01"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
            placeholder="Цель (опционально)"
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
          <Select value={color} onValueChange={(value) => setColor(value ?? pocketColors[0])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pocketColors.map((presetColor) => (
                <SelectItem key={presetColor} value={presetColor}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ backgroundColor: presetColor }}
                    />
                    {presetColor}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              addPocket({
                name: name.trim() || "Новый покет",
                targetAmount:
                  targetAmount.trim().length === 0 ? null : Number.parseFloat(targetAmount),
                currency,
                color,
              });
              setName("");
              setTargetAmount("");
            }}
          >
            <Plus className="size-4" />
            Добавить
          </Button>
        </CardContent>
      </Card>

      {monthData.pockets.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Покетов пока нет. Создайте первый покет для накоплений.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {monthData.pockets.map((pocket) => (
            <PocketCard
              key={pocket.id}
              pocket={pocket}
              exchangeRate={monthData.exchangeRate}
              onUpdate={(patch) => updatePocket(pocket.id, patch)}
              onDelete={() => deletePocket(pocket.id)}
              onAddFunds={(amount, inputCurrency) =>
                addFundsToPocket(pocket.id, amount, inputCurrency)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
