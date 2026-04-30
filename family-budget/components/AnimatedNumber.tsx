"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  formatter?: (value: number) => string;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
}

function defaultFormatter(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function AnimatedNumber({
  value,
  className,
  formatter = defaultFormatter,
  durationMs = 520,
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [trend, setTrend] = useState<"up" | "down" | null>(null);
  const rafRef = useRef<number | null>(null);
  const trendTimerRef = useRef<number | null>(null);
  const displayRef = useRef(value);

  useEffect(() => {
    displayRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    const startValue = displayRef.current;
    const endValue = value;
    if (!Number.isFinite(endValue) || Math.abs(endValue - startValue) < 0.0001) {
      setDisplayValue(endValue);
      return;
    }

    setTrend(endValue > startValue ? "up" : "down");
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = easeOutCubic(progress);
      const next = startValue + (endValue - startValue) * eased;
      setDisplayValue(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(endValue);
      }
    };

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);

    if (trendTimerRef.current !== null) {
      window.clearTimeout(trendTimerRef.current);
    }
    trendTimerRef.current = window.setTimeout(() => {
      setTrend(null);
    }, durationMs + 120);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (trendTimerRef.current !== null) {
        window.clearTimeout(trendTimerRef.current);
      }
    };
  }, [durationMs, value]);

  const text = useMemo(() => formatter(displayValue), [displayValue, formatter]);

  return (
    <span
      className={cn(
        "tabular-nums transition-[transform,filter] duration-300",
        trend === "up" && "-translate-y-[1px] saturate-[1.08]",
        trend === "down" && "translate-y-[1px] saturate-[0.94]",
        className,
      )}
    >
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
