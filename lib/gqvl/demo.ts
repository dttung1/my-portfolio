import {
  Ledger,
  addWorkingDays,
  defaultRules,
  defaultSettings,
  defaultSources,
} from "./types";

const TR = 1_000_000;

function shiftDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Bộ số liệu minh họa khớp với bảng ví dụ trong đề án — dùng để tập huấn
 * và thử quy trình trước khi nhập số thật. Không phải số liệu nghiệp vụ.
 */
export function demoLedger(today: string): Ledger {
  const asOf = shiftDays(today, -1);
  const expires = addWorkingDays(today, defaultSettings.holdWorkingDays);

  const balances: Record<string, { quota: number; balance: number }> = {
    "src-a-nhcs": { quota: 12_400 * TR, balance: 12_210 * TR },
    "src-a-hdt": { quota: 3_000 * TR, balance: 2_640 * TR },
    "src-b-stc": { quota: 8_000 * TR, balance: 6_150 * TR },
    "src-b-nsh": { quota: 4_500 * TR, balance: 3_020 * TR },
    "src-b-mstb": { quota: 2_000 * TR, balance: 760 * TR },
    "src-b-ns": { quota: 1_500 * TR, balance: 430 * TR },
  };

  const sources = defaultSources().map((s) => ({
    ...s,
    planQuota: balances[s.id]?.quota ?? 0,
    systemBalance: balances[s.id]?.balance ?? 0,
    balanceAsOf: asOf,
  }));

  const hold = (
    n: number,
    sourceId: string,
    dossierNo: string,
    customerName: string,
    commune: string,
    officer: string,
    amountTr: number,
    attrs: { borrowerType: string; purpose: string; union: string }
  ) => ({
    id: `demo-res-${n}`,
    dossierNo,
    customerName,
    commune,
    officer,
    borrowerType: attrs.borrowerType,
    purpose: attrs.purpose,
    union: attrs.union,
    sourceId,
    amount: amountTr * TR,
    approvedAt: today,
    expiresAt: expires,
    plannedSessionAt: today,
    disbursedAt: "",
    status: "held" as const,
    note: "",
  });

  return {
    version: 1,
    settings: { ...defaultSettings, unitName: "PGD NHCSXH huyện (dữ liệu minh họa)" },
    sources,
    rules: defaultRules(),
    reservations: [
      hold(1, "src-a-nhcs", "2026/GQVL/0140", "Nguyễn Văn An", "Xã Hòa Bình", "Lê Minh Tú", 150, {
        borrowerType: "Người lao động",
        purpose: "Chăn nuôi",
        union: "",
      }),
      hold(2, "src-a-hdt", "2026/GQVL/0141", "Trần Thị Bình", "Xã Hòa Bình", "Lê Minh Tú", 100, {
        borrowerType: "Người lao động",
        purpose: "Trồng trọt",
        union: "Hội Liên hiệp Phụ nữ",
      }),
      hold(3, "src-b-stc", "2026/GQVL/0142", "Phạm Văn Cường", "Xã Tân Phú", "Lê Minh Tú", 250, {
        borrowerType: "Cơ sở sản xuất kinh doanh",
        purpose: "Tiểu thủ công nghiệp",
        union: "",
      }),
      hold(4, "src-b-stc", "2026/GQVL/0143", "Võ Thị Dung", "Xã Tân Phú", "Nguyễn Hải Đăng", 150, {
        borrowerType: "Người lao động",
        purpose: "Thương mại, dịch vụ",
        union: "",
      }),
      hold(5, "src-b-nsh", "2026/GQVL/0144", "Đỗ Văn Em", "Xã Long Thới", "Nguyễn Hải Đăng", 200, {
        borrowerType: "Người lao động",
        purpose: "Chăn nuôi",
        union: "",
      }),
      hold(6, "src-b-ns", "2026/GQVL/0145", "Huỳnh Thị Gấm", "Xã Long Thới", "Nguyễn Hải Đăng", 120, {
        borrowerType: "Hộ sản xuất, kinh doanh",
        purpose: "Nông sản (trồng, chế biến, tiêu thụ)",
        union: "",
      }),
    ],
    receipts: [
      {
        id: "demo-rec-1",
        sourceId: "src-a-hdt",
        amount: 80 * TR,
        commune: "Xã Hòa Bình",
        officer: "Lê Minh Tú",
        confirmedAt: today,
        evidence: "PT 0125 — ảnh gửi nhóm lúc 9h20",
        note: "",
      },
      {
        id: "demo-rec-2",
        sourceId: "src-b-nsh",
        amount: 50 * TR,
        commune: "Xã Long Thới",
        officer: "Nguyễn Hải Đăng",
        confirmedAt: today,
        evidence: "PT 0126 — tổ trưởng xác nhận",
        note: "",
      },
    ],
  };
}
