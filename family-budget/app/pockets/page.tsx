"use client";

import { useMemo, useState } from "react";

import { useBudget } from "@/components/BudgetProvider";
import { toRub, toUsd } from "@/lib/currency";
import { Currency, Pocket } from "@/lib/types";
import { cn } from "@/lib/utils";

type PocketColorKey = "blue" | "green" | "red" | "amber" | "purple" | "ink2";
type OptionsMode = "menu" | "color" | "goal";

const colorTokens: Record<PocketColorKey, { value: string; bg: string }> = {
  blue: { value: "var(--blue)", bg: "var(--blue-bg)" },
  green: { value: "var(--green)", bg: "var(--green-bg)" },
  red: { value: "var(--red)", bg: "var(--red-bg)" },
  amber: { value: "var(--amber)", bg: "var(--amber-bg)" },
  purple: { value: "var(--purple)", bg: "var(--purple-bg)" },
  ink2: { value: "var(--ink2)", bg: "var(--bg)" },
};

const colorSwatches: PocketColorKey[] = ["blue", "green", "red", "amber", "purple", "ink2"];
const legacyColorMap: Record<string, PocketColorKey> = {
  "#4f46e5": "blue",
  "#0ea5e9": "blue",
  "#10b981": "green",
  "#f97316": "amber",
  "#ef4444": "red",
  "#8b5cf6": "purple",
};

const compactNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function normalizeColorKey(color: string): PocketColorKey {
  if (color in colorTokens) {
    return color as PocketColorKey;
  }
  const normalized = legacyColorMap[color.toLowerCase()];
  return normalized ?? "blue";
}

function formatCompactCurrency(value: number, currency: Currency): string {
  const symbol = currency === "USD" ? "$" : "₽";
  return `${symbol}${compactNumber.format(Math.round(Math.abs(value)))}`;
}

function BoldDigits({
  value,
  className,
  color,
}: {
  value: string;
  className: string;
  color?: string;
}) {
  return (
    <p className={className} style={color ? { color } : undefined}>
      {Array.from(value).map((char, index) =>
        /\d/.test(char) ? (
          <b key={`${char}-${index}`} className="font-bold">
            {char}
          </b>
        ) : (
          <span key={`${char}-${index}`}>{char}</span>
        ),
      )}
    </p>
  );
}

export default function PocketsPage() {
  const { monthData, addPocket, updatePocket, deletePocket, addFundsToPocket } = useBudget();

  const [editingPocketId, setEditingPocketId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  const [fundPocketId, setFundPocketId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundCurrency, setFundCurrency] = useState<Currency>("RUB");

  const [optionsPocketId, setOptionsPocketId] = useState<string | null>(null);
  const [optionsMode, setOptionsMode] = useState<OptionsMode>("menu");
  const [goalDraft, setGoalDraft] = useState("");

  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newCurrency, setNewCurrency] = useState<Currency>("RUB");
  const [newColor, setNewColor] = useState<PocketColorKey>("blue");

  const fundPocket = useMemo(
    () => monthData.pockets.find((pocket) => pocket.id === fundPocketId) ?? null,
    [fundPocketId, monthData.pockets],
  );
  const optionsPocket = useMemo(
    () => monthData.pockets.find((pocket) => pocket.id === optionsPocketId) ?? null,
    [monthData.pockets, optionsPocketId],
  );

  const parsedFundAmount = Number.parseFloat(fundAmount);
  const hasFundAmount = Number.isFinite(parsedFundAmount) && parsedFundAmount > 0;

  const fundApproxValue =
    hasFundAmount && fundPocket
      ? fundCurrency === "RUB"
        ? formatCompactCurrency(toUsd(parsedFundAmount, "RUB", monthData.exchangeRate), "USD")
        : formatCompactCurrency(toRub(parsedFundAmount, "USD", monthData.exchangeRate), "RUB")
      : "—";

  const savePocketName = (pocketId: string) => {
    updatePocket(pocketId, { name: nameDraft.trim() });
    setEditingPocketId(null);
  };

  const openAddFundsSheet = (pocket: Pocket) => {
    setFundPocketId(pocket.id);
    setFundAmount("");
    setFundCurrency(pocket.currency);
  };

  const openGoalEditor = (pocket: Pocket) => {
    setOptionsPocketId(pocket.id);
    setGoalDraft(
      typeof pocket.targetAmount === "number" && Number.isFinite(pocket.targetAmount)
        ? String(pocket.targetAmount)
        : "",
    );
    setOptionsMode("goal");
  };

  const closeOptionsSheet = () => {
    setOptionsPocketId(null);
    setOptionsMode("menu");
    setGoalDraft("");
  };

  return (
    <div className="-mx-4 -mt-6 bg-[var(--bg)] px-4 pt-6 pb-[100px]">
      {monthData.pockets.length === 0 ? (
        <div className="mt-[60px] text-center">
          <div className="mx-auto inline-flex h-8 w-8 items-center justify-center text-[var(--ink3)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 9.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M7 7.5V6a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-3 text-[14px] text-[var(--ink2)]">No pockets yet</p>
          <button
            type="button"
            onClick={() => setIsCreateSheetOpen(true)}
            className="mt-3 rounded-xl bg-[var(--blue)] px-6 py-3 text-[14px] font-semibold text-white"
          >
            Create your first pocket
          </button>
        </div>
      ) : (
        <>
          {monthData.pockets.map((pocket) => {
            const colorKey = normalizeColorKey(pocket.color);
            const tone = colorTokens[colorKey];
            const target = pocket.targetAmount ?? null;
            const progress =
              target && target > 0 ? Math.min((pocket.savedAmount / target) * 100, 100) : 0;
            const savedPrimary =
              pocket.currency === "USD"
                ? formatCompactCurrency(pocket.savedAmount, "USD")
                : formatCompactCurrency(pocket.savedAmount, "RUB");
            const savedSecondary =
              pocket.currency === "USD"
                ? formatCompactCurrency(toRub(pocket.savedAmount, "USD", monthData.exchangeRate), "RUB")
                : formatCompactCurrency(toUsd(pocket.savedAmount, "RUB", monthData.exchangeRate), "USD");

            const goalText = (() => {
              if (!target || target <= 0) {
                return null;
              }
              const goalRub = toRub(target, pocket.currency, monthData.exchangeRate);
              const goalUsd = toUsd(target, pocket.currency, monthData.exchangeRate);
              const toGoRub = toRub(
                Math.max(target - pocket.savedAmount, 0),
                pocket.currency,
                monthData.exchangeRate,
              );
              return `Goal: ${formatCompactCurrency(goalRub, "RUB")} (${formatCompactCurrency(goalUsd, "USD")}) · ${formatCompactCurrency(toGoRub, "RUB")} to go`;
            })();

            return (
              <article key={pocket.id} className="mb-3 overflow-hidden rounded-2xl bg-[var(--white)]">
                <div className="h-[2px]" style={{ backgroundColor: tone.value }} />
                <div className="px-[18px] pt-[18px] pb-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    {editingPocketId === pocket.id ? (
                      <input
                        autoFocus
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.target.value)}
                        onBlur={() => savePocketName(pocket.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            savePocketName(pocket.id);
                          }
                        }}
                        className="min-w-0 flex-1 border-0 bg-transparent text-[16px] font-semibold tracking-[-0.4px] text-[var(--ink)] outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPocketId(pocket.id);
                          setNameDraft(pocket.name);
                        }}
                        className="min-w-0 flex-1 truncate text-left text-[16px] font-semibold tracking-[-0.4px] text-[var(--ink)]"
                      >
                        {pocket.name || "Pocket"}
                      </button>
                    )}

                    <span
                      className="shrink-0 rounded-[20px] px-[9px] py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: tone.bg, color: tone.value }}
                    >
                      {Math.round(progress)}%
                    </span>
                  </div>

                  <BoldDigits
                    value={savedPrimary}
                    className="text-[32px] font-light leading-none tracking-[-1px]"
                    color={tone.value}
                  />
                  <p className="mt-0.5 text-[12px] text-[var(--ink3)]">≈ {savedSecondary}</p>

                  {goalText ? (
                    <p className="mb-[14px] mt-2 text-[12px] text-[var(--ink3)]">{goalText}</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openGoalEditor(pocket)}
                      className="mb-[14px] mt-2 text-[12px] text-[var(--ink3)] underline-offset-2"
                    >
                      No goal set · tap to add
                    </button>
                  )}

                  <div className="mb-4 h-[3px] overflow-hidden rounded-[2px] bg-[var(--bg)]">
                    <div
                      className="h-full rounded-[2px]"
                      style={{ width: `${progress}%`, backgroundColor: tone.value }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openAddFundsSheet(pocket)}
                      className="flex-1 rounded-[10px] border border-[var(--line2)] px-3 py-[11px] text-[13px] font-semibold"
                      style={{ color: tone.value }}
                    >
                      Add funds
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsPocketId(pocket.id);
                        setOptionsMode("menu");
                      }}
                      className="rounded-[10px] bg-[var(--bg)] px-[14px] py-[11px] text-[18px] leading-none text-[var(--ink3)]"
                    >
                      ···
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </>
      )}

      <button
        type="button"
        onClick={() => setIsCreateSheetOpen(true)}
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[var(--line2)] px-4 py-4 text-[13px] font-medium text-[var(--ink3)]"
      >
        <span aria-hidden="true">+</span>
        New pocket
      </button>

      {fundPocket ? (
        <div className="fixed inset-0 z-[120] bg-[rgba(0,0,0,0.22)]" onClick={() => setFundPocketId(null)}>
          <div
            className="absolute right-0 bottom-0 left-0 mx-auto w-full max-w-[480px] rounded-t-[20px] bg-[var(--white)] px-5 pt-6 pb-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-9 rounded-[2px] bg-[var(--line2)]" />
            <h2 className="mb-5 text-[17px] font-semibold tracking-[-0.4px] text-[var(--ink)]">
              Add to {fundPocket.name || "pocket"}
            </h2>

            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              value={fundAmount}
              onChange={(event) => setFundAmount(event.target.value)}
              className="w-full rounded-[10px] border-0 bg-[var(--bg)] px-[14px] py-3 text-center text-[28px] font-light outline-none"
            />
            <p className="mt-2 text-center text-[12px] text-[var(--ink3)]">≈ {fundApproxValue}</p>

            <div className="mt-4 flex items-center justify-center gap-2">
              {(["RUB", "USD"] as const).map((item) => {
                const active = item === fundCurrency;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFundCurrency(item)}
                    className={cn(
                      "rounded-[10px] px-4 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-[var(--blue-bg)] font-semibold text-[var(--blue)]"
                        : "bg-[var(--bg)] text-[var(--ink3)]",
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                const parsed = Number.parseFloat(fundAmount);
                if (!Number.isFinite(parsed) || parsed <= 0) {
                  return;
                }
                addFundsToPocket(fundPocket.id, parsed, fundCurrency);
                setFundPocketId(null);
                setFundAmount("");
              }}
              className="mt-4 w-full rounded-xl px-4 py-[14px] text-[15px] font-semibold text-white"
              style={{ backgroundColor: colorTokens[normalizeColorKey(fundPocket.color)].value }}
            >
              Add funds
            </button>
          </div>
        </div>
      ) : null}

      {optionsPocket ? (
        <div className="fixed inset-0 z-[121] bg-[rgba(0,0,0,0.22)]" onClick={closeOptionsSheet}>
          <div
            className="absolute right-0 bottom-0 left-0 mx-auto w-full max-w-[480px] rounded-t-[20px] bg-[var(--white)] px-5 pt-6 pb-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-9 rounded-[2px] bg-[var(--line2)]" />
            {optionsMode === "menu" ? (
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPocketId(optionsPocket.id);
                    setNameDraft(optionsPocket.name);
                    closeOptionsSheet();
                  }}
                  className="rounded-[10px] bg-[var(--bg)] px-4 py-3 text-left text-[14px] text-[var(--ink)]"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => setOptionsMode("color")}
                  className="rounded-[10px] bg-[var(--bg)] px-4 py-3 text-left text-[14px] text-[var(--ink)]"
                >
                  Change color
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoalDraft(
                      typeof optionsPocket.targetAmount === "number"
                        ? String(optionsPocket.targetAmount)
                        : "",
                    );
                    setOptionsMode("goal");
                  }}
                  className="rounded-[10px] bg-[var(--bg)] px-4 py-3 text-left text-[14px] text-[var(--ink)]"
                >
                  Set goal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deletePocket(optionsPocket.id);
                    closeOptionsSheet();
                  }}
                  className="rounded-[10px] bg-[var(--red-bg)] px-4 py-3 text-left text-[14px] text-[var(--red)]"
                >
                  Delete
                </button>
              </div>
            ) : null}

            {optionsMode === "color" ? (
              <div>
                <p className="mb-3 text-[14px] font-semibold text-[var(--ink)]">Change color</p>
                <div className="flex flex-wrap gap-3">
                  {colorSwatches.map((swatch) => {
                    const selected = normalizeColorKey(optionsPocket.color) === swatch;
                    return (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => {
                          updatePocket(optionsPocket.id, { color: swatch });
                          closeOptionsSheet();
                        }}
                        className={cn(
                          "h-7 w-7 rounded-full border-2 border-transparent",
                          selected && "ring-2 ring-white ring-offset-2 ring-offset-[var(--ink3)]",
                        )}
                        style={{ backgroundColor: colorTokens[swatch].value }}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}

            {optionsMode === "goal" ? (
              <div>
                <p className="mb-2 text-[14px] font-semibold text-[var(--ink)]">Set goal</p>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={goalDraft}
                  onChange={(event) => setGoalDraft(event.target.value)}
                  className="w-full rounded-[10px] border-0 bg-[var(--bg)] px-[14px] py-3 text-[15px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = goalDraft.trim();
                    if (!trimmed) {
                      updatePocket(optionsPocket.id, { targetAmount: null });
                      closeOptionsSheet();
                      return;
                    }
                    const parsed = Number.parseFloat(trimmed);
                    if (!Number.isFinite(parsed) || parsed <= 0) {
                      return;
                    }
                    updatePocket(optionsPocket.id, { targetAmount: parsed });
                    closeOptionsSheet();
                  }}
                  className="mt-3 w-full rounded-xl bg-[var(--blue)] px-4 py-3 text-[14px] font-semibold text-white"
                >
                  Save goal
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isCreateSheetOpen ? (
        <div className="fixed inset-0 z-[122] bg-[rgba(0,0,0,0.22)]" onClick={() => setIsCreateSheetOpen(false)}>
          <div
            className="absolute right-0 bottom-0 left-0 mx-auto w-full max-w-[480px] rounded-t-[20px] bg-[var(--white)] px-5 pt-6 pb-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-9 rounded-[2px] bg-[var(--line2)]" />
            <h2 className="mb-4 text-[17px] font-semibold tracking-[-0.4px] text-[var(--ink)]">
              New pocket
            </h2>

            <div className="mb-[14px]">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                Name
              </p>
              <input
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="w-full rounded-[10px] border-0 bg-[var(--bg)] px-[14px] py-3 text-[15px] outline-none"
              />
            </div>

            <div className="mb-[14px]">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                Goal amount (optional)
              </p>
              <input
                type="number"
                min={0}
                step="0.01"
                value={newGoal}
                onChange={(event) => setNewGoal(event.target.value)}
                className="w-full rounded-[10px] border-0 bg-[var(--bg)] px-[14px] py-3 text-[15px] outline-none"
              />
            </div>

            <div className="mb-[14px]">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                Currency
              </p>
              <div className="flex items-center gap-2">
                {(["RUB", "USD"] as const).map((item) => {
                  const active = item === newCurrency;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setNewCurrency(item)}
                      className={cn(
                        "rounded-[10px] px-4 py-2 text-[13px] transition-colors",
                        active
                          ? "bg-[var(--blue-bg)] font-semibold text-[var(--blue)]"
                          : "bg-[var(--bg)] text-[var(--ink3)]",
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                Color
              </p>
              <div className="flex flex-wrap gap-3">
                {colorSwatches.map((swatch) => {
                  const selected = newColor === swatch;
                  return (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => setNewColor(swatch)}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 border-transparent",
                        selected && "ring-2 ring-white ring-offset-2 ring-offset-[var(--ink3)]",
                      )}
                      style={{ backgroundColor: colorTokens[swatch].value }}
                    />
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const goalValue = newGoal.trim();
                addPocket({
                  name: newName.trim() || "New pocket",
                  targetAmount: goalValue ? Number.parseFloat(goalValue) : null,
                  currency: newCurrency,
                  color: newColor,
                });
                setIsCreateSheetOpen(false);
                setNewName("");
                setNewGoal("");
                setNewCurrency("RUB");
                setNewColor("blue");
              }}
              className="w-full rounded-xl bg-[var(--blue)] px-4 py-[14px] text-[15px] font-semibold text-white"
            >
              Create pocket
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
