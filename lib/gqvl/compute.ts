import {
  FundSource,
  Ledger,
  MatrixRule,
  Reservation,
  Settings,
} from "./types";

/**
 * Trạng thái thực tế của một giữ chỗ tại ngày `today`.
 * Giữ chỗ quá hạn không còn khóa chỉ tiêu (tránh giữ chỗ ảo làm nghẽn nguồn).
 */
export type EffectiveHoldStatus = "held" | "expired" | "disbursed" | "cancelled";

export function effectiveHoldStatus(
  r: Reservation,
  today: string
): EffectiveHoldStatus {
  if (r.status !== "held") return r.status;
  return r.expiresAt && r.expiresAt < today ? "expired" : "held";
}

export type SourceStatus = "unset" | "blocked" | "near" | "slow" | "ok";

export type SourceStat = {
  source: FundSource;
  /** Đã duyệt, đang giữ chỗ (chưa giải ngân, chưa quá hạn). */
  held: number;
  heldCount: number;
  /** Đã giải ngân sau ngày chốt số liệu KT740 nên dư nợ hệ thống chưa phản ánh. */
  pendingDisbursed: number;
  /** Thu nợ đã xác nhận sau ngày chốt số liệu, chưa hạch toán. */
  pendingReceipts: number;
  /** Chỉ tiêu còn có thể cho vay. */
  available: number;
  /** Phần chỉ tiêu đã bị chiếm dụng. */
  used: number;
  usedRatio: number;
  status: SourceStatus;
  statusLabel: string;
};

const STATUS_LABEL: Record<SourceStatus, string> = {
  unset: "Chưa giao chỉ tiêu",
  blocked: "Cạn chỉ tiêu",
  near: "Sát ngưỡng",
  slow: "Giải ngân chậm",
  ok: "Còn nguồn",
};

/**
 * Khả dụng = Chỉ tiêu − Dư nợ hệ thống − Giữ chỗ − Giải ngân chưa hạch toán
 *            + Thu nợ đã xác nhận chưa hạch toán
 *
 * Việc so ngày với `balanceAsOf` khiến công thức tự hiệu chỉnh sau mỗi lần
 * nhập KT740: các khoản đã lên hệ thống thôi được cộng/trừ lần thứ hai.
 */
export function computeSourceStat(
  source: FundSource,
  ledger: Ledger,
  today: string
): SourceStat {
  let held = 0;
  let heldCount = 0;
  let pendingDisbursed = 0;

  for (const r of ledger.reservations) {
    if (r.sourceId !== source.id) continue;
    const status = effectiveHoldStatus(r, today);
    if (status === "held") {
      held += r.amount;
      heldCount += 1;
    } else if (status === "disbursed" && r.disbursedAt > source.balanceAsOf) {
      pendingDisbursed += r.amount;
    }
  }

  let pendingReceipts = 0;
  for (const t of ledger.receipts) {
    if (t.sourceId !== source.id) continue;
    if (t.confirmedAt > source.balanceAsOf) pendingReceipts += t.amount;
  }

  const used =
    source.systemBalance + held + pendingDisbursed - pendingReceipts;
  const available = source.planQuota - used;
  const usedRatio = source.planQuota > 0 ? used / source.planQuota : NaN;

  const status = classify(source, available, usedRatio, ledger.settings);

  return {
    source,
    held,
    heldCount,
    pendingDisbursed,
    pendingReceipts,
    available,
    used,
    usedRatio,
    status,
    statusLabel: STATUS_LABEL[status],
  };
}

function classify(
  source: FundSource,
  available: number,
  usedRatio: number,
  settings: Settings
): SourceStatus {
  if (source.planQuota <= 0) return "unset";
  if (available <= 0) return "blocked";
  if (usedRatio >= settings.warnRatio) return "near";
  if (usedRatio < settings.slowRatio) return "slow";
  return "ok";
}

export function computeStats(ledger: Ledger, today: string): SourceStat[] {
  return ledger.sources
    .map((s) => computeSourceStat(s, ledger, today))
    .sort((a, b) => a.source.priority - b.source.priority);
}

export type LedgerTotals = {
  planQuota: number;
  systemBalance: number;
  held: number;
  pendingDisbursed: number;
  pendingReceipts: number;
  available: number;
};

export function computeTotals(stats: SourceStat[]): LedgerTotals {
  return stats.reduce<LedgerTotals>(
    (acc, s) => ({
      planQuota: acc.planQuota + s.source.planQuota,
      systemBalance: acc.systemBalance + s.source.systemBalance,
      held: acc.held + s.held,
      pendingDisbursed: acc.pendingDisbursed + s.pendingDisbursed,
      pendingReceipts: acc.pendingReceipts + s.pendingReceipts,
      available: acc.available + s.available,
    }),
    {
      planQuota: 0,
      systemBalance: 0,
      held: 0,
      pendingDisbursed: 0,
      pendingReceipts: 0,
      available: 0,
    }
  );
}

/* ------------------------------------------------------------------ */
/* Ma trận gán mã nguồn                                                */
/* ------------------------------------------------------------------ */

export type DossierAttrs = {
  borrowerType: string;
  purpose: string;
  union: string;
  commune: string;
};

export type Candidate = {
  stat: SourceStat;
  eligible: boolean;
  enough: boolean;
  reason: string;
};

export type Suggestion = {
  rule: MatrixRule | null;
  candidates: Candidate[];
  chosen: SourceStat | null;
  blocked: boolean;
  message: string;
};

function ruleSpecificity(rule: MatrixRule): number {
  return [rule.borrowerType, rule.purpose, rule.union, rule.commune].filter(
    Boolean
  ).length;
}

export function matchRule(
  rules: MatrixRule[],
  attrs: DossierAttrs
): MatrixRule | null {
  let best: MatrixRule | null = null;
  let bestScore = -1;
  for (const rule of rules) {
    const ok =
      (!rule.borrowerType || rule.borrowerType === attrs.borrowerType) &&
      (!rule.purpose || rule.purpose === attrs.purpose) &&
      (!rule.union || rule.union === attrs.union) &&
      (!rule.commune || rule.commune === attrs.commune);
    if (!ok) continue;
    const score = ruleSpecificity(rule);
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Suy ra mã nguồn cho một hồ sơ. Cán bộ tín dụng không chọn nguồn —
 * nguồn là kết quả của thuộc tính hồ sơ và chỉ tiêu còn lại.
 */
export function suggestSource(
  ledger: Ledger,
  stats: SourceStat[],
  attrs: DossierAttrs,
  amount: number
): Suggestion {
  const rule = matchRule(ledger.rules, attrs);
  if (!rule) {
    return {
      rule: null,
      candidates: [],
      chosen: null,
      blocked: true,
      message:
        "Không có dòng nào trong ma trận khớp hồ sơ này. Bổ sung ma trận gán mã trước khi cấp nguồn.",
    };
  }

  const byId = new Map(stats.map((s) => [s.source.id, s]));
  const candidates: Candidate[] = rule.sourceIds
    .map((id) => byId.get(id))
    .filter((s): s is SourceStat => Boolean(s))
    .sort((a, b) => a.source.priority - b.source.priority)
    .map((stat) => {
      // Nguồn hội đoàn thể chỉ dùng được khi hồ sơ ghi rõ tổ chức hội.
      const eligible = stat.source.kind !== "hoi" || Boolean(attrs.union);
      const enough = eligible && amount > 0 && stat.available >= amount;
      let reason = "";
      if (!eligible) {
        reason = "Hồ sơ chưa ghi tổ chức hội nhận ủy thác.";
      } else if (stat.source.planQuota <= 0) {
        reason = "Chưa nhập chỉ tiêu kế hoạch cho nguồn này.";
      } else if (!enough) {
        reason = "Chỉ tiêu còn lại không đủ cho khoản vay.";
      }
      return { stat, eligible, enough, reason };
    });

  const chosen = candidates.find((c) => c.enough)?.stat ?? null;

  if (chosen) {
    const remaining = chosen.available - amount;
    const ratio =
      chosen.source.planQuota > 0
        ? (chosen.used + amount) / chosen.source.planQuota
        : NaN;
    const warn =
      ratio >= ledger.settings.warnRatio
        ? " Sau khi giữ chỗ, nguồn này chạm ngưỡng cảnh báo — cân nhắc đề nghị điều chỉnh chỉ tiêu."
        : "";
    return {
      rule,
      candidates,
      chosen,
      blocked: false,
      message: `Cấp nguồn ${chosen.source.code}. Chỉ tiêu còn lại sau khi giữ chỗ: ${remaining >= 0 ? "" : "-"}${Math.abs(remaining).toLocaleString("vi-VN")} đồng.${warn}`,
    };
  }

  if (rule.hardBound) {
    return {
      rule,
      candidates,
      chosen: null,
      blocked: true,
      message:
        "Nguồn chuyên đề đã hết chỉ tiêu. Đây là nguồn gán cứng theo đối tượng — tuyệt đối không dùng nguồn khác thay thế. Dừng hồ sơ và đề nghị chi nhánh tỉnh điều chỉnh chỉ tiêu.",
    };
  }

  return {
    rule,
    candidates,
    chosen: null,
    blocked: true,
    message:
      "Không nguồn thay thế nào còn đủ chỉ tiêu cho khoản vay này. Điều hòa chỉ tiêu giữa các xã, hoặc đề nghị chi nhánh tỉnh điều chỉnh trước khi duyệt.",
  };
}

/* ------------------------------------------------------------------ */
/* Đối chiếu biến động dư nợ giữa hai lần nhập KT740                   */
/* ------------------------------------------------------------------ */

export type ReconcileRow = {
  source: FundSource;
  previousBalance: number;
  previousAsOf: string;
  currentBalance: number;
  balanceChange: number;
  recordedDisbursed: number;
  recordedReceipts: number;
  /**
   * Phần biến động không giải thích được bằng dữ liệu trong công cụ.
   * Âm là bình thường (thu nợ hạch toán tại trụ sở không nhập vào đây).
   * DƯƠNG là dấu hiệu có khoản giải ngân rơi vào nguồn này ngoài sổ giữ chỗ —
   * khả năng cao là gán sai mã nguồn.
   */
  unexplained: number;
  flagged: boolean;
};

export function reconcile(ledger: Ledger): ReconcileRow[] {
  const rows: ReconcileRow[] = [];

  for (const source of ledger.sources) {
    if (source.previousBalance === null || source.previousAsOf === null) continue;
    const from = source.previousAsOf;
    const to = source.balanceAsOf;

    let recordedDisbursed = 0;
    for (const r of ledger.reservations) {
      if (r.sourceId !== source.id || r.status !== "disbursed") continue;
      if (r.disbursedAt > from && r.disbursedAt <= to) recordedDisbursed += r.amount;
    }

    let recordedReceipts = 0;
    for (const t of ledger.receipts) {
      if (t.sourceId !== source.id) continue;
      if (t.confirmedAt > from && t.confirmedAt <= to) recordedReceipts += t.amount;
    }

    const balanceChange = source.systemBalance - source.previousBalance;
    const unexplained = balanceChange - recordedDisbursed + recordedReceipts;

    rows.push({
      source,
      previousBalance: source.previousBalance,
      previousAsOf: from,
      currentBalance: source.systemBalance,
      balanceChange,
      recordedDisbursed,
      recordedReceipts,
      unexplained,
      // Ngưỡng 1.000 đồng để bỏ qua sai số làm tròn khi nhập theo triệu đồng.
      flagged: unexplained > 1000,
    });
  }

  return rows;
}
