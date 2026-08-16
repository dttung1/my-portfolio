import { Settings } from "./types";

export type DisplayUnit = Settings["displayUnit"];

export function unitLabel(unit: DisplayUnit): string {
  return unit === "trieu" ? "triệu đồng" : "đồng";
}

export function unitShort(unit: DisplayUnit): string {
  return unit === "trieu" ? "tr.đ" : "đ";
}

/** Quy đổi số người dùng nhập (theo đơn vị hiển thị) về ĐỒNG để lưu trữ. */
export function toStore(value: number, unit: DisplayUnit): number {
  return unit === "trieu" ? Math.round(value * 1_000_000) : Math.round(value);
}

/** Quy đổi số ĐỒNG đã lưu về đơn vị hiển thị (dạng số, để đổ vào ô nhập). */
export function toDisplayNumber(dong: number, unit: DisplayUnit): number {
  return unit === "trieu" ? dong / 1_000_000 : dong;
}

export function formatMoney(dong: number, unit: DisplayUnit): string {
  const v = toDisplayNumber(dong, unit);
  return v.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: unit === "trieu" ? 3 : 0,
  });
}

export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/**
 * Đọc số viết theo kiểu Việt Nam ("12.400", "12.400,5") lẫn kiểu Anh ("12,400.5").
 * Trả về NaN nếu không đọc được.
 */
export function parseVnNumber(input: string): number {
  const raw = String(input)
    .replace(/[\s ]/g, "")
    .replace(/[đdĐD]$/g, "")
    .trim();
  if (!raw) return NaN;

  const negative = /^\(.*\)$/.test(raw) || raw.startsWith("-");
  const body = raw.replace(/^[-(]/, "").replace(/\)$/, "");
  if (!/^[\d.,]+$/.test(body)) return NaN;

  const lastDot = body.lastIndexOf(".");
  const lastComma = body.lastIndexOf(",");
  let normalized: string;

  if (lastDot >= 0 && lastComma >= 0) {
    // Dấu xuất hiện sau cùng là dấu thập phân, dấu còn lại là dấu phân nhóm.
    const decimalSep = lastDot > lastComma ? "." : ",";
    const groupSep = decimalSep === "." ? "," : ".";
    normalized = body.split(groupSep).join("").replace(decimalSep, ".");
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? "." : ",";
    const parts = body.split(sep);
    const looksGrouped =
      parts.length > 1 && parts.slice(1).every((p) => p.length === 3);
    normalized = looksGrouped ? parts.join("") : body.replace(sep, ".");
  } else {
    normalized = body;
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) return NaN;
  return negative ? -n : n;
}
