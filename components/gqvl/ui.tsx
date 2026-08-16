"use client";

import { useEffect, useState } from "react";
import { SourceStatus } from "@/lib/gqvl/compute";
import { DisplayUnit, toDisplayNumber, toStore } from "@/lib/gqvl/format";

const STATUS_CLASS: Record<SourceStatus, string> = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  slow: "bg-amber-50 text-amber-700 ring-amber-200",
  near: "bg-orange-50 text-orange-700 ring-orange-200",
  blocked: "bg-red-50 text-red-700 ring-red-200",
  unset: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function StatusBadge({
  status,
  label,
}: {
  status: SourceStatus;
  label: string;
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STATUS_CLASS[status]}`}
    >
      {label}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Callout({
  tone,
  children,
}: {
  tone: "info" | "warn" | "danger" | "ok";
  children: React.ReactNode;
}) {
  const cls = {
    info: "border-brand-200 bg-brand-50 text-brand-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[tone];
  return (
    <div className={`rounded-md border p-3 text-sm ${cls}`}>{children}</div>
  );
}

/**
 * Ô nhập tiền theo đơn vị hiển thị đang chọn. Giá trị trả về luôn là ĐỒNG.
 * Người dùng gõ được cả "12.400" lẫn "12400" lẫn "12,4".
 */
export function MoneyInput({
  value,
  unit,
  onChange,
  placeholder,
  className,
  ariaLabel,
}: {
  value: number;
  unit: DisplayUnit;
  onChange: (dong: number) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const render = (dong: number) =>
    dong === 0
      ? ""
      : toDisplayNumber(dong, unit).toLocaleString("vi-VN", {
          maximumFractionDigits: 3,
          useGrouping: false,
        });

  const [text, setText] = useState(() => render(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(render(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, unit, focused]);

  return (
    <input
      className={className ?? "input text-right tabular-nums"}
      inputMode="decimal"
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        if (next.trim() === "") {
          onChange(0);
          return;
        }
        const parsed = parseLoose(next);
        if (Number.isFinite(parsed)) onChange(toStore(parsed, unit));
      }}
    />
  );
}

/** Đọc số khi đang gõ dở: chấp nhận cả dấu phẩy lẫn dấu chấm làm thập phân. */
function parseLoose(input: string): number {
  const cleaned = input.replace(/\s/g, "");
  if (!/^[\d.,]*$/.test(cleaned)) return NaN;
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? "." : ",";
    const grp = dec === "." ? "," : ".";
    return Number(cleaned.split(grp).join("").replace(dec, "."));
  }
  const sep = lastDot >= 0 ? "." : lastComma >= 0 ? "," : "";
  if (!sep) return Number(cleaned);
  const parts = cleaned.split(sep);
  const grouped = parts.length > 1 && parts.slice(1).every((p) => p.length === 3);
  return Number(grouped ? parts.join("") : cleaned.replace(sep, "."));
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function DataList({ id, options }: { id: string; options: string[] }) {
  return (
    <datalist id={id}>
      {options.map((o) => (
        <option key={o} value={o} />
      ))}
    </datalist>
  );
}
