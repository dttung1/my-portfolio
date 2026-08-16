import { parseVnNumber } from "./format";
import { FundSource } from "./types";

/**
 * Đọc dữ liệu dư nợ theo mã nhà đầu tư từ báo cáo KT740.
 * Chấp nhận file CSV/TSV xuất từ hệ thống hoặc dán trực tiếp từ Excel.
 */

export type ImportUnit = "dong" | "nghin" | "trieu";

export const IMPORT_UNITS: { value: ImportUnit; label: string; factor: number }[] = [
  { value: "dong", label: "Đồng", factor: 1 },
  { value: "nghin", label: "Nghìn đồng", factor: 1_000 },
  { value: "trieu", label: "Triệu đồng", factor: 1_000_000 },
];

export type Kt740Row = {
  rawCode: string;
  balance: number;
  matchedSourceId: string | null;
  matchedCode: string | null;
};

export type Kt740Parse = {
  rows: Kt740Row[];
  matched: Kt740Row[];
  unmatched: Kt740Row[];
  warnings: string[];
};

function detectDelimiter(lines: string[]): string {
  const candidates = ["\t", ";", ",", "|"];
  let best = "\t";
  let bestScore = 0;
  for (const d of candidates) {
    const score = lines
      .slice(0, 20)
      .reduce((acc, l) => acc + (l.split(d).length - 1), 0);
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  // Không có ký tự phân tách nào — dùng khoảng trắng từ 2 ký tự trở lên.
  return bestScore === 0 ? "  +" : best;
}

function splitLine(line: string, delimiter: string): string[] {
  const cells =
    delimiter === "  +" ? line.split(/\s{2,}/) : line.split(delimiter);
  return cells.map((c) => c.trim().replace(/^"|"$/g, "").trim());
}

function normalizeCode(value: string): string {
  return value.toUpperCase().replace(/\s+/g, "");
}

const CODE_HEADERS = /m[aã]|nh[aà]\s*đ[aầ]u\s*t[uư]|investor|ngu[oồ]n/i;
const BALANCE_HEADERS = /d[uư]\s*n[oợ]|s[oố]\s*d[uư]|balance|outstanding/i;

/**
 * Trả về chỉ số cột mã nguồn và cột dư nợ nếu dòng này trông như dòng tiêu đề.
 */
function readHeader(cells: string[]): { code: number; balance: number } | null {
  let code = -1;
  let balance = -1;
  cells.forEach((cell, i) => {
    if (code < 0 && CODE_HEADERS.test(cell)) code = i;
    if (BALANCE_HEADERS.test(cell)) balance = i;
  });
  return code >= 0 && balance >= 0 ? { code, balance } : null;
}

export function parseKt740(
  text: string,
  sources: FundSource[],
  unit: ImportUnit
): Kt740Parse {
  const warnings: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], matched: [], unmatched: [], warnings: ["Không có dữ liệu."] };
  }

  const delimiter = detectDelimiter(lines);
  const table = lines.map((l) => splitLine(l, delimiter));

  let codeIdx = 0;
  let balanceIdx = -1;
  let startRow = 0;

  for (let i = 0; i < Math.min(table.length, 10); i += 1) {
    const header = readHeader(table[i]);
    if (header) {
      codeIdx = header.code;
      balanceIdx = header.balance;
      startRow = i + 1;
      break;
    }
  }

  if (balanceIdx < 0) {
    warnings.push(
      "Không tìm thấy dòng tiêu đề có cột “Mã” và “Dư nợ”. Đang đọc theo quy ước: cột đầu là mã nguồn, cột số cuối cùng là dư nợ."
    );
  }

  const factor =
    IMPORT_UNITS.find((u) => u.value === unit)?.factor ?? 1;
  const normalizedSources = sources.map((s) => ({
    id: s.id,
    code: s.code,
    norm: normalizeCode(s.code),
  }));

  const rows: Kt740Row[] = [];

  for (let i = startRow; i < table.length; i += 1) {
    const cells = table[i];
    if (cells.length === 0) continue;

    const rawCode = (cells[codeIdx] ?? "").trim();
    if (!rawCode) continue;

    let balance = NaN;
    if (balanceIdx >= 0) {
      balance = parseVnNumber(cells[balanceIdx] ?? "");
    } else {
      // Lấy ô số hợp lệ ở vị trí cuối cùng của dòng.
      for (let c = cells.length - 1; c > codeIdx; c -= 1) {
        const v = parseVnNumber(cells[c]);
        if (Number.isFinite(v)) {
          balance = v;
          break;
        }
      }
    }
    if (!Number.isFinite(balance)) continue;

    const norm = normalizeCode(rawCode);
    const hit =
      normalizedSources.find((s) => s.norm === norm) ??
      normalizedSources.find((s) => norm.includes(s.norm) && s.norm.length >= 3);

    rows.push({
      rawCode,
      balance: Math.round(balance * factor),
      matchedSourceId: hit?.id ?? null,
      matchedCode: hit?.code ?? null,
    });
  }

  if (rows.length === 0) {
    warnings.push("Không đọc được dòng dữ liệu nào. Kiểm tra lại định dạng file.");
  }

  const matched = rows.filter((r) => r.matchedSourceId);
  const unmatched = rows.filter((r) => !r.matchedSourceId);

  if (unmatched.length > 0) {
    warnings.push(
      `${unmatched.length} mã trong file không khớp danh mục nguồn của đơn vị — kiểm tra lại mã đợt / mã nhà đầu tư ở tab Danh mục nguồn.`
    );
  }

  const seen = new Set<string>();
  for (const r of matched) {
    if (r.matchedSourceId && seen.has(r.matchedSourceId)) {
      warnings.push(
        `Mã ${r.matchedCode} xuất hiện nhiều lần trong file — giá trị đọc sau sẽ ghi đè giá trị trước.`
      );
    }
    if (r.matchedSourceId) seen.add(r.matchedSourceId);
  }

  return { rows, matched, unmatched, warnings };
}
