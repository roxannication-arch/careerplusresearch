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
    <div className="inline-flex items-center gap-2">
      <p className="text-sm text-muted-foreground">Месяц:</p>
      <Select value={selectedMonth} onValueChange={onChange}>
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
