import { z } from "zod";

/**
 * Mô hình dữ liệu cho công cụ kiểm soát nguồn vốn cho vay GQVL.
 * Toàn bộ số tiền lưu ở đơn vị ĐỒNG; việc hiển thị/nhập theo triệu đồng
 * do `settings.displayUnit` quy định (xem lib/gqvl/format.ts).
 */

export const SOURCE_LEVELS = [
  { value: "TW", label: "Trung ương (KH A)" },
  { value: "DP", label: "Địa phương (KH B)" },
] as const;

export const SOURCE_KINDS = [
  { value: "chung", label: "Nguồn chung — thay thế được cho nhau" },
  { value: "hoi", label: "Hội đoàn thể — chỉ cho hội viên đúng hội" },
  { value: "chuyende", label: "Chuyên đề — gán cứng theo đối tượng" },
] as const;

export const fundSourceSchema = z.object({
  id: z.string(),
  /** Mã đợt / mã nhà đầu tư trên hệ thống — dùng để khớp khi nhập KT740. */
  code: z.string().min(1),
  name: z.string().min(1),
  level: z.enum(["TW", "DP"]),
  kind: z.enum(["chung", "hoi", "chuyende"]),
  /** Thứ tự ưu tiên sử dụng: số nhỏ hơn thì dùng trước. */
  priority: z.number().int(),
  /** Chỉ tiêu kế hoạch được giao. */
  planQuota: z.number().min(0),
  /** Dư nợ theo số liệu hệ thống (KT740) tại ngày `balanceAsOf`. */
  systemBalance: z.number().min(0),
  balanceAsOf: z.string(),
  /** Số liệu của lần nhập KT740 trước đó, dùng cho đối chiếu. */
  previousBalance: z.number().nullable(),
  previousAsOf: z.string().nullable(),
  /** Hạn giải ngân của nguồn (nếu có) — ảnh hưởng cảnh báo tồn nguồn. */
  deadline: z.string(),
  note: z.string(),
});
export type FundSource = z.infer<typeof fundSourceSchema>;

export const reservationSchema = z.object({
  id: z.string(),
  dossierNo: z.string().min(1),
  customerName: z.string().min(1),
  commune: z.string(),
  officer: z.string(),
  /** Bốn thuộc tính dùng cho ma trận gán mã. */
  borrowerType: z.string(),
  purpose: z.string(),
  union: z.string(),
  sourceId: z.string(),
  amount: z.number().positive(),
  approvedAt: z.string(),
  /** Giữ chỗ tự hết hiệu lực sau `settings.holdWorkingDays` ngày làm việc. */
  expiresAt: z.string(),
  /** Ngày phiên giao dịch xã dự kiến giải ngân — dùng để gom phiếu duyệt. */
  plannedSessionAt: z.string(),
  disbursedAt: z.string(),
  status: z.enum(["held", "disbursed", "cancelled"]),
  note: z.string(),
});
export type Reservation = z.infer<typeof reservationSchema>;

/** Thu nợ đã xác nhận tại xã nhưng chưa kịp hạch toán lên hệ thống. */
export const receiptSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  amount: z.number().positive(),
  commune: z.string(),
  officer: z.string(),
  confirmedAt: z.string(),
  /** Căn cứ xác nhận: số phiếu thu, ảnh chụp, tổ trưởng xác nhận… */
  evidence: z.string(),
  note: z.string(),
});
export type Receipt = z.infer<typeof receiptSchema>;

/**
 * Một dòng của ma trận gán mã. Điều kiện để trống nghĩa là "không xét".
 * Quy tắc khớp cụ thể hơn (nhiều điều kiện hơn) thắng quy tắc tổng quát.
 */
export const matrixRuleSchema = z.object({
  id: z.string(),
  borrowerType: z.string(),
  purpose: z.string(),
  union: z.string(),
  commune: z.string(),
  /** Danh sách nguồn hợp lệ; khi có nhiều nguồn thì chọn theo thứ tự ưu tiên. */
  sourceIds: z.array(z.string()),
  /** Gán cứng: hết chỉ tiêu thì dừng, tuyệt đối không dùng nguồn khác thay. */
  hardBound: z.boolean(),
  note: z.string(),
});
export type MatrixRule = z.infer<typeof matrixRuleSchema>;

export const settingsSchema = z.object({
  unitName: z.string(),
  focalPoint: z.string(),
  approver: z.string(),
  /** Tỷ lệ đã dùng vượt ngưỡng này thì cảnh báo sát chỉ tiêu. */
  warnRatio: z.number().min(0).max(1),
  /** Tỷ lệ đã dùng dưới ngưỡng này thì cảnh báo giải ngân chậm. */
  slowRatio: z.number().min(0).max(1),
  holdWorkingDays: z.number().int().min(1),
  displayUnit: z.enum(["dong", "trieu"]),
});
export type Settings = z.infer<typeof settingsSchema>;

export const ledgerSchema = z.object({
  version: z.literal(1),
  settings: settingsSchema,
  sources: z.array(fundSourceSchema),
  reservations: z.array(reservationSchema),
  receipts: z.array(receiptSchema),
  rules: z.array(matrixRuleSchema),
});
export type Ledger = z.infer<typeof ledgerSchema>;

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Cộng thêm n ngày làm việc (bỏ thứ Bảy, Chủ nhật) vào một ngày yyyy-mm-dd. */
export function addWorkingDays(fromISO: string, n: number): string {
  const [y, m, d] = fromISO.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  let left = n;
  while (left > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const defaultSettings: Settings = {
  unitName: "Phòng giao dịch NHCSXH huyện",
  focalPoint: "",
  approver: "",
  warnRatio: 0.9,
  slowRatio: 0.7,
  holdWorkingDays: 10,
  displayUnit: "trieu",
};

/**
 * Danh mục nguồn khởi tạo: đúng cơ cấu nguồn GQVL nhưng chỉ tiêu để 0 —
 * đơn vị phải nhập theo văn bản giao chỉ tiêu thực tế của chi nhánh tỉnh.
 */
export function defaultSources(): FundSource[] {
  const base = { systemBalance: 0, balanceAsOf: todayISO(), previousBalance: null, previousAsOf: null, deadline: "", planQuota: 0 };
  return [
    { id: "src-a-hdt", code: "A-HDT-02", name: "Tổ chức Hội đoàn thể Trung ương", level: "TW", kind: "hoi", priority: 20, note: "Chỉ cho vay hội viên đúng hội đã nhận ủy thác.", ...base },
    { id: "src-a-nhcs", code: "A-NHCS-01", name: "NHCSXH & nguồn huy động (Trung ương)", level: "TW", kind: "chung", priority: 30, note: "", ...base },
    { id: "src-b-stc", code: "B-STC-11", name: "Sở Tài chính chuyển sang", level: "DP", kind: "chung", priority: 40, note: "", ...base },
    { id: "src-b-nsh", code: "B-NSH-12", name: "Ngân sách huyện (vốn đối ứng)", level: "DP", kind: "chung", priority: 50, note: "Dễ điều hòa nội bộ nhất — để dùng sau.", ...base },
    { id: "src-b-mstb", code: "B-MSTB-13", name: "Cho vay hộ có mức sống trung bình", level: "DP", kind: "chuyende", priority: 10, note: "Gán cứng theo đối tượng, không dùng thay nguồn khác.", ...base },
    { id: "src-b-ns", code: "B-NS-14", name: "Cho vay nông sản", level: "DP", kind: "chuyende", priority: 10, note: "Gán cứng theo mục đích sử dụng vốn.", ...base },
  ];
}

export const BORROWER_TYPES = [
  "Người lao động",
  "Cơ sở sản xuất kinh doanh",
  "Hộ sản xuất, kinh doanh",
  "Hộ có mức sống trung bình",
];

export const PURPOSES = [
  "Chăn nuôi",
  "Trồng trọt",
  "Nông sản (trồng, chế biến, tiêu thụ)",
  "Tiểu thủ công nghiệp",
  "Thương mại, dịch vụ",
];

export const UNIONS = [
  "Hội Nông dân",
  "Hội Liên hiệp Phụ nữ",
  "Hội Cựu chiến binh",
  "Đoàn Thanh niên",
];

export function defaultRules(): MatrixRule[] {
  return [
    {
      id: "rule-mstb",
      borrowerType: "Hộ có mức sống trung bình",
      purpose: "",
      union: "",
      commune: "",
      sourceIds: ["src-b-mstb"],
      hardBound: true,
      note: "Gán cứng. Hết chỉ tiêu thì dừng, không chuyển sang nguồn khác.",
    },
    {
      id: "rule-nongsan",
      borrowerType: "",
      purpose: "Nông sản (trồng, chế biến, tiêu thụ)",
      union: "",
      commune: "",
      sourceIds: ["src-b-ns"],
      hardBound: true,
      note: "Gán cứng theo mục đích. Ưu tiên giải ngân sớm để tránh tồn nguồn.",
    },
    {
      id: "rule-mac-dinh",
      borrowerType: "",
      purpose: "",
      union: "",
      commune: "",
      sourceIds: ["src-a-hdt", "src-a-nhcs", "src-b-stc", "src-b-nsh"],
      hardBound: false,
      note: "Nhóm nguồn thay thế được — chọn theo thứ tự ưu tiên và chỉ tiêu còn lại. Nguồn hội đoàn thể chỉ áp dụng khi hồ sơ có ghi tổ chức hội.",
    },
  ];
}

export function emptyLedger(): Ledger {
  return {
    version: 1,
    settings: defaultSettings,
    sources: defaultSources(),
    reservations: [],
    receipts: [],
    rules: defaultRules(),
  };
}
