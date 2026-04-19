"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InlineEditableProps {
  value: string | number | null;
  onCommit: (value: string | number | null) => void;
  placeholder?: string;
  type?: "text" | "number";
  className?: string;
  displayClassName?: string;
  disabled?: boolean;
}

export function InlineEditable({
  value,
  onCommit,
  placeholder = "Нажмите для ввода",
  type = "text",
  className,
  displayClassName,
  disabled,
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value === null ? "" : String(value));
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commit = () => {
    if (type === "number") {
      if (draft.trim() === "") {
        onCommit(null);
      } else {
        const parsed = Number.parseFloat(draft);
        onCommit(Number.isFinite(parsed) ? parsed : null);
      }
    } else {
      onCommit(draft);
    }

    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      commit();
      return;
    }

    if (event.key === "Escape") {
      setDraft(value === null ? "" : String(value));
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    const hasValue = value !== null && String(value).trim().length > 0;
    return (
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsEditing(true);
          }
        }}
        disabled={disabled}
        className={cn(
          "flex h-8 w-full items-center rounded-lg border border-transparent px-2.5 text-left text-sm",
          "hover:border-slate-200 hover:bg-slate-50",
          disabled && "pointer-events-none opacity-60",
          !hasValue && "text-muted-foreground",
          displayClassName,
        )}
      >
        {hasValue ? String(value) : placeholder}
      </button>
    );
  }

  return (
    <Input
      ref={inputRef}
      type={type}
      min={type === "number" ? 0 : undefined}
      step={type === "number" ? "0.01" : undefined}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
}
