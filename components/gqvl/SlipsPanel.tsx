"use client";

import { useMemo, useState } from "react";
import { effectiveHoldStatus } from "@/lib/gqvl/compute";
import { formatDate, formatMoney } from "@/lib/gqvl/format";
import { Ledger, Reservation } from "@/lib/gqvl/types";
import { Callout, EmptyState, Field } from "./ui";

/**
 * Phiếu duyệt giải ngân: danh sách đã chốt trước phiên, mã nguồn in sẵn.
 * Tại điểm giao dịch xã, cán bộ nhập theo phiếu chứ không quyết định nguồn.
 */
export function SlipsPanel({
  ledger,
  today,
}: {
  ledger: Ledger;
  today: string;
}) {
  const [sessionDate, setSessionDate] = useState(today);
  const [commune, setCommune] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const held = useMemo(
    () =>
      ledger.reservations.filter(
        (r) => effectiveHoldStatus(r, today) === "held"
      ),
    [ledger.reservations, today]
  );

  const communes = useMemo(
    () => Array.from(new Set(held.map((r) => r.commune).filter(Boolean))).sort(),
    [held]
  );

  const candidates = useMemo(
    () =>
      held.filter(
        (r) =>
          (!sessionDate || r.plannedSessionAt === sessionDate) &&
          (!commune || r.commune === commune)
      ),
    [held, sessionDate, commune]
  );

  const chosen = candidates.filter((r) => selected[r.id]);

  const groups = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of chosen) {
      const key = r.commune || "(chưa ghi xã)";
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return Array.from(map.entries());
  }, [chosen]);

  const sourceById = new Map(ledger.sources.map((s) => [s.id, s]));
  const allSelected =
    candidates.length > 0 && candidates.every((r) => selected[r.id]);

  return (
    <div className="space-y-4">
      <div className="card space-y-3 print:hidden">
        <div className="section-title">
          <span>Lập phiếu duyệt giải ngân</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Ngày phiên giao dịch" hint="Để trống để xem mọi ngày">
            <input
              type="date"
              className="input"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </Field>
          <Field label="Điểm giao dịch xã">
            <select
              className="input"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
            >
              <option value="">— tất cả các xã —</option>
              {communes.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Thao tác">
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setSelected(
                    allSelected
                      ? {}
                      : Object.fromEntries(candidates.map((r) => [r.id, true]))
                  )
                }
              >
                {allSelected ? "Bỏ chọn hết" : "Chọn hết"}
              </button>
              <button
                type="button"
                className="btn-primary disabled:opacity-50"
                disabled={chosen.length === 0}
                onClick={() => window.print()}
              >
                In phiếu ({chosen.length})
              </button>
            </div>
          </Field>
        </div>

        {candidates.length === 0 ? (
          <EmptyState>
            Không có hồ sơ nào đang giữ chỗ khớp bộ lọc. Duyệt giữ chỗ ở tab
            “Giữ chỗ &amp; cấp mã” trước khi lập phiếu.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2 text-left">Hồ sơ</th>
                  <th className="px-3 py-2 text-left">Xã</th>
                  <th className="px-3 py-2 text-left">Mã nguồn</th>
                  <th className="px-3 py-2 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[r.id])}
                        onChange={(e) =>
                          setSelected((s) => ({ ...s, [r.id]: e.target.checked }))
                        }
                        aria-label={`Chọn hồ sơ ${r.dossierNo}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div>{r.customerName}</div>
                      <div className="font-mono text-xs text-slate-500">
                        {r.dossierNo}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{r.commune}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {sourceById.get(r.sourceId)?.code ?? "?"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(r.amount, ledger.settings.displayUnit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Callout tone="info">
          In phiếu trước khi đi giao dịch xã. Mỗi xã một phiếu riêng; số tiền
          trên phiếu ghi bằng đồng.
        </Callout>
      </div>

      {groups.length === 0 ? null : (
        <div className="space-y-6">
          {groups.map(([communeName, items], gi) => (
            <Slip
              key={communeName}
              ledger={ledger}
              commune={communeName}
              sessionDate={sessionDate}
              items={items}
              last={gi === groups.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Slip({
  ledger,
  commune,
  sessionDate,
  items,
  last,
}: {
  ledger: Ledger;
  commune: string;
  sessionDate: string;
  items: Reservation[];
  last: boolean;
}) {
  const sourceById = new Map(ledger.sources.map((s) => [s.id, s]));
  const total = items.reduce((sum, r) => sum + r.amount, 0);
  const officers = Array.from(new Set(items.map((r) => r.officer).filter(Boolean)));

  return (
    <div
      className={`card bg-white text-slate-900 print:rounded-none print:border-0 print:p-0 print:shadow-none ${
        last ? "" : "print:break-after-page"
      }`}
    >
      <div className="mb-4 border-b border-slate-300 pb-3 text-center">
        <div className="text-xs uppercase tracking-wide text-slate-600">
          {ledger.settings.unitName || "Phòng giao dịch NHCSXH"}
        </div>
        <h3 className="mt-1 text-lg font-bold uppercase">
          Phiếu duyệt giải ngân nguồn vốn GQVL
        </h3>
        <div className="mt-1 text-sm">
          Điểm giao dịch: <strong>{commune}</strong> · Ngày phiên:{" "}
          <strong>{formatDate(sessionDate)}</strong>
        </div>
        {officers.length > 0 && (
          <div className="text-sm text-slate-600">
            Cán bộ tín dụng: {officers.join(", ")}
          </div>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-slate-300 text-xs uppercase text-slate-600">
            <th className="px-2 py-1.5 text-left">TT</th>
            <th className="px-2 py-1.5 text-left">Số hồ sơ</th>
            <th className="px-2 py-1.5 text-left">Khách hàng</th>
            <th className="px-2 py-1.5 text-right">Số tiền (đồng)</th>
            <th className="px-2 py-1.5 text-left">Mã nguồn</th>
            <th className="px-2 py-1.5 text-left">Ký nhận</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={r.id} className="border-b border-slate-200">
              <td className="px-2 py-2">{i + 1}</td>
              <td className="px-2 py-2 font-mono text-xs">{r.dossierNo}</td>
              <td className="px-2 py-2">{r.customerName}</td>
              <td className="px-2 py-2 text-right tabular-nums">
                {formatMoney(r.amount, "dong")}
              </td>
              <td className="px-2 py-2">
                <span className="border border-slate-400 px-1.5 py-0.5 font-mono text-sm font-bold">
                  {sourceById.get(r.sourceId)?.code ?? "?"}
                </span>
              </td>
              <td className="px-2 py-2"></td>
            </tr>
          ))}
          <tr className="border-b border-slate-300 font-semibold">
            <td className="px-2 py-2" colSpan={3}>
              Cộng {items.length} hồ sơ
            </td>
            <td className="px-2 py-2 text-right tabular-nums">
              {formatMoney(total, "dong")}
            </td>
            <td className="px-2 py-2" colSpan={2}></td>
          </tr>
        </tbody>
      </table>

      <p className="mt-3 text-xs italic text-slate-600">
        Cán bộ nhập đúng mã nguồn đã in trên phiếu. Không tự đổi mã nguồn tại
        điểm giao dịch xã. Hồ sơ phát sinh ngoài danh sách phải gọi về đầu mối
        nguồn vốn để được cấp mã trước khi giải ngân. Thu nợ trong phiên báo về
        đầu mối ngay để giải phóng chỉ tiêu.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="font-semibold">Cán bộ tín dụng</div>
          <div className="text-xs text-slate-500">(ký, ghi rõ họ tên)</div>
          <div className="h-16" />
          <div className="text-xs">{officers.join(", ")}</div>
        </div>
        <div>
          <div className="font-semibold">Đầu mối nguồn vốn</div>
          <div className="text-xs text-slate-500">(ký, ghi rõ họ tên)</div>
          <div className="h-16" />
          <div className="text-xs">{ledger.settings.focalPoint}</div>
        </div>
        <div>
          <div className="font-semibold">Người duyệt</div>
          <div className="text-xs text-slate-500">(ký, ghi rõ họ tên)</div>
          <div className="h-16" />
          <div className="text-xs">{ledger.settings.approver}</div>
        </div>
      </div>
    </div>
  );
}
