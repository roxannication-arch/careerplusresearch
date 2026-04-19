"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMonthLabel } from "@/lib/storage";

interface MonthSelectorProps {
  selectedMonth: string;
  monthOptions: string[];
  onChange: (month: string) => void;
}

export function MonthSelector({ selectedMonth, monthOptions, onChange }: MonthSelectorProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-medium text-slate-500">Месяц:</p>
      <Select
        value={selectedMonth}
        onValueChange={(value) => {
          if (value) {
            onChange(value);
          }
        }}
      >
        <SelectTrigger className="min-w-52 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((monthOption) => (
            <SelectItem key={monthOption} value={monthOption}>
              {getMonthLabel(monthOption)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
