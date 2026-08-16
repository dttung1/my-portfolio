"use client";

import {
  ReconcileRow,
  SourceStat,
  computeTotals,
  effectiveHoldStatus,
} from "@/lib/gqvl/compute";
import { formatDate, formatMoney, formatPercent, unitLabel } from "@/lib/gqvl/format";
import { Ledger } from "@/lib/gqvl/types";
import { Callout, StatusBadge } from "./ui";

export function DashboardPanel({
  ledger,
  stats,
  reconcileRows,
  today,
}: {
  ledger: Ledger;
  stats: SourceStat[];
  reconcileRows: ReconcileRow[];
  today: string;
}) {
  const unit = ledger.settings.displayUnit;
  const totals = computeTotals(stats);

  const blocked = stats.filter((s) => s.status === "blocked");
  const near = stats.filter((s) => s.status === "near");
  const slow = stats.filter((s) => s.status === "slow");
  const unset = stats.filter((s) => s.status === "unset");
  const expiredHolds = ledger.reservations.filter(
    (r) => effectiveHoldStatus(r, today) === "expired"
  );
  const flagged = reconcileRows.filter((r) => r.flagged);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Chỉ tiêu kế hoạch" value={formatMoney(totals.planQuota, unit)} unit={unit} />
        <Kpi label="Dư nợ theo KT740" value={formatMoney(totals.systemBalance, unit)} unit={unit} />
        <Kpi label="Đang giữ chỗ" value={formatMoney(totals.held, unit)} unit={unit} />
        <Kpi
          label="Khả dụng toàn đơn vị"
          value={formatMoney(totals.available, unit)}
          unit={unit}
          tone={totals.available <= 0 ? "danger" : "ok"}
        />
      </div>

      {(blocked.length > 0 ||
        near.length > 0 ||
        slow.length > 0 ||
        expiredHolds.length > 0 ||
        flagged.length > 0 ||
        unset.length > 0) && (
        <div className="space-y-2">
          {blocked.length > 0 && (
            <Callout tone="danger">
              <strong>Dừng cấp mã:</strong>{" "}
              {blocked.map((s) => s.source.code).join(", ")} đã hết chỉ tiêu.
              Không duyệt thêm hồ sơ vào các nguồn này — điều hòa chỉ tiêu giữa
              các xã hoặc đề nghị chi nhánh tỉnh điều chỉnh.
            </Callout>
          )}
          {near.length > 0 && (
            <Callout tone="warn">
              <strong>Sát ngưỡng {formatPercent(ledger.settings.warnRatio)}:</strong>{" "}
              {near.map((s) => s.source.code).join(", ")}. Rà lại danh sách hồ sơ
              chờ duyệt trước khi giữ chỗ tiếp.
            </Callout>
          )}
          {slow.length > 0 && (
            <Callout tone="warn">
              <strong>Giải ngân chậm (dưới {formatPercent(ledger.settings.slowRatio)}):</strong>{" "}
              {slow.map((s) => `${s.source.code}${s.source.deadline ? ` (hạn ${formatDate(s.source.deadline)})` : ""}`).join(", ")}
              . Với nguồn chuyên đề, phối hợp UBND xã và hội đoàn thể rà soát
              danh sách đúng đối tượng thay vì chuyển chỉ tiêu sang nguồn khác.
            </Callout>
          )}
          {flagged.length > 0 && (
            <Callout tone="danger">
              <strong>Nghi vấn gán sai mã nguồn:</strong>{" "}
              {flagged.map((r) => r.source.code).join(", ")} có dư nợ tăng nhiều
              hơn phần giải ngân đã ghi nhận. Xem tab “Nhập KT740 &amp; đối chiếu”.
            </Callout>
          )}
          {expiredHolds.length > 0 && (
            <Callout tone="info">
              {expiredHolds.length} giữ chỗ đã quá hạn và không còn khóa chỉ tiêu.
              Gia hạn hoặc hủy để sổ sạch.
            </Callout>
          )}
          {unset.length > 0 && (
            <Callout tone="info">
              Chưa nhập chỉ tiêu kế hoạch cho:{" "}
              {unset.map((s) => s.source.code).join(", ")}. Nhập tại tab “Danh
              mục nguồn”.
            </Callout>
          )}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Bảng nguồn vốn khả dụng</h2>
          <span className="text-xs text-slate-500">
            Đơn vị: {unitLabel(unit)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Mã nguồn</th>
                <th className="px-3 py-2 text-left">Tên nguồn</th>
                <th className="px-3 py-2 text-right">Chỉ tiêu</th>
                <th className="px-3 py-2 text-right">Dư nợ</th>
                <th className="px-3 py-2 text-right">Giữ chỗ</th>
                <th className="px-3 py-2 text-right">GN chưa HT</th>
                <th className="px-3 py-2 text-right">Thu chưa HT</th>
                <th className="px-3 py-2 text-right">Khả dụng</th>
                <th className="px-3 py-2 text-right">Đã dùng</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((s) => (
                <tr key={s.source.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs">{s.source.code}</td>
                  <td className="px-3 py-2">
                    <div>{s.source.name}</div>
                    <div className="text-xs text-slate-500">
                      {s.source.level === "TW" ? "KH A" : "KH B"}
                      {s.source.kind === "chuyende" ? " · chuyên đề, gán cứng" : ""}
                      {s.source.kind === "hoi" ? " · hội đoàn thể" : ""}
                      {s.heldCount > 0 ? ` · ${s.heldCount} hồ sơ giữ chỗ` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(s.source.planQuota, unit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMoney(s.source.systemBalance, unit)}
                    <div className="text-[11px] text-slate-400">
                      {formatDate(s.source.balanceAsOf)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(s.held, unit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(s.pendingDisbursed, unit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                    {s.pendingReceipts > 0 ? `+${formatMoney(s.pendingReceipts, unit)}` : "—"}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-semibold tabular-nums ${
                      s.available <= 0 ? "text-red-600" : "text-slate-900"
                    }`}
                  >
                    {formatMoney(s.available, unit)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                    {formatPercent(s.usedRatio)}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={s.status} label={s.statusLabel} />
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-3 py-2" colSpan={2}>
                  Cộng
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(totals.planQuota, unit)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(totals.systemBalance, unit)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(totals.held, unit)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(totals.pendingDisbursed, unit)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(totals.pendingReceipts, unit)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(totals.available, unit)}</td>
                <td className="px-3 py-2" colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          Khả dụng = Chỉ tiêu − Dư nợ hệ thống − Giữ chỗ − Giải ngân chưa hạch
          toán + Thu nợ đã xác nhận chưa hạch toán. Cột “Thu chưa HT” chính là
          phần giải phóng chỉ tiêu ngay trong phiên giao dịch xã, không phải chờ
          bút toán.
        </p>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  tone = "neutral",
}: {
  label: string;
  value: string;
  unit: "dong" | "trieu";
  tone?: "neutral" | "ok" | "danger";
}) {
  const color =
    tone === "danger"
      ? "text-red-600"
      : tone === "ok"
        ? "text-emerald-700"
        : "text-slate-900";
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-slate-400">{unitLabel(unit)}</div>
    </div>
  );
}
