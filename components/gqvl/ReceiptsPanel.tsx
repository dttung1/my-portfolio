"use client";

import { useState } from "react";
import { formatDate, formatMoney } from "@/lib/gqvl/format";
import { Ledger, Receipt, newId } from "@/lib/gqvl/types";
import { Callout, EmptyState, Field, MoneyInput } from "./ui";

/**
 * Thu nợ tại điểm giao dịch xã, báo về đầu mối ngay trong phiên.
 * Mỗi khoản ghi ở đây giải phóng chỉ tiêu của nguồn tương ứng tức thì,
 * không phải chờ bút toán lên hệ thống.
 */
export function ReceiptsPanel({
  ledger,
  today,
  update,
}: {
  ledger: Ledger;
  today: string;
  update: (fn: (l: Ledger) => Ledger) => void;
}) {
  const unit = ledger.settings.displayUnit;
  const [sourceId, setSourceId] = useState(ledger.sources[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [commune, setCommune] = useState("");
  const [officer, setOfficer] = useState("");
  const [confirmedAt, setConfirmedAt] = useState(today);
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState("");

  const sourceById = new Map(ledger.sources.map((s) => [s.id, s]));

  const add = () => {
    if (!sourceId) {
      setError("Chọn nguồn vốn của khoản thu.");
      return;
    }
    if (amount <= 0) {
      setError("Nhập số tiền thu.");
      return;
    }
    if (!evidence.trim()) {
      setError(
        "Phải ghi căn cứ xác nhận (số phiếu thu, ảnh chụp, tổ trưởng xác nhận). Báo miệng không đủ để giải phóng chỉ tiêu."
      );
      return;
    }
    const receipt: Receipt = {
      id: newId(),
      sourceId,
      amount,
      commune: commune.trim(),
      officer: officer.trim(),
      confirmedAt,
      evidence: evidence.trim(),
      note: "",
    };
    update((l) => ({ ...l, receipts: [receipt, ...l.receipts] }));
    setAmount(0);
    setEvidence("");
    setError("");
  };

  const remove = (id: string) =>
    update((l) => ({ ...l, receipts: l.receipts.filter((r) => r.id !== id) }));

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="section-title">
          <span>Ghi nhận thu nợ tại xã (chưa hạch toán)</span>
        </div>

        <Callout tone="info">
          Khoản thu ghi ở đây <strong>chỉ giải phóng chỉ tiêu</strong> của nguồn
          tương ứng. Tiền mặt thu về là quỹ của đơn vị — không mang “màu” nguồn
          vốn, nên không được lấy làm căn cứ chọn mã cho khoản giải ngân kế tiếp.
        </Callout>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Nguồn vốn của khoản thu">
            <select
              className="input"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              {ledger.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Số tiền thu (${unit === "trieu" ? "triệu đồng" : "đồng"})`}>
            <MoneyInput
              value={amount}
              unit={unit}
              onChange={setAmount}
              ariaLabel="Số tiền thu nợ"
            />
          </Field>
          <Field label="Ngày thu">
            <input
              type="date"
              className="input"
              value={confirmedAt}
              onChange={(e) => setConfirmedAt(e.target.value)}
            />
          </Field>
          <Field label="Xã / điểm giao dịch">
            <input
              className="input"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
            />
          </Field>
          <Field label="Cán bộ thu">
            <input
              className="input"
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
            />
          </Field>
          <Field label="Căn cứ xác nhận" hint="Bắt buộc — số phiếu thu / ảnh chụp / tổ trưởng xác nhận">
            <input
              className="input"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="VD: PT 0125, ảnh gửi nhóm lúc 9h20"
            />
          </Field>
        </div>

        {error ? <Callout tone="danger">{error}</Callout> : null}

        <button type="button" className="btn-primary" onClick={add}>
          Ghi nhận &amp; giải phóng chỉ tiêu
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Các khoản thu đã ghi nhận</h2>
          <p className="mt-1 text-xs text-slate-500">
            Khoản thu có ngày sau ngày chốt KT740 của nguồn thì còn được cộng vào
            chỉ tiêu khả dụng; khi KT740 mới đã phản ánh, phần cộng này tự mất đi.
          </p>
        </div>
        {ledger.receipts.length === 0 ? (
          <div className="p-4">
            <EmptyState>Chưa ghi nhận khoản thu nào.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Ngày</th>
                  <th className="px-3 py-2 text-left">Nguồn</th>
                  <th className="px-3 py-2 text-right">Số tiền</th>
                  <th className="px-3 py-2 text-left">Xã / cán bộ</th>
                  <th className="px-3 py-2 text-left">Căn cứ</th>
                  <th className="px-3 py-2 text-left">Hiệu lực</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.receipts.map((r) => {
                  const src = sourceById.get(r.sourceId);
                  const stillCounted = src
                    ? r.confirmedAt > src.balanceAsOf
                    : false;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">{formatDate(r.confirmedAt)}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {src?.code ?? "?"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(r.amount, unit)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {[r.commune, r.officer].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{r.evidence}</td>
                      <td className="px-3 py-2 text-xs">
                        {stillCounted ? (
                          <span className="text-emerald-700">Đang cộng vào khả dụng</span>
                        ) : (
                          <span className="text-slate-400">Đã có trên KT740</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => remove(r.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
