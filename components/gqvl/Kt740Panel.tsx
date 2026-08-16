"use client";

import { useMemo, useRef, useState } from "react";
import { ReconcileRow } from "@/lib/gqvl/compute";
import { formatDate, formatMoney } from "@/lib/gqvl/format";
import { IMPORT_UNITS, ImportUnit, parseKt740 } from "@/lib/gqvl/kt740";
import { Ledger } from "@/lib/gqvl/types";
import { Callout, EmptyState, Field } from "./ui";

export function Kt740Panel({
  ledger,
  reconcileRows,
  today,
  update,
}: {
  ledger: Ledger;
  reconcileRows: ReconcileRow[];
  today: string;
  update: (fn: (l: Ledger) => Ledger) => void;
}) {
  const unit = ledger.settings.displayUnit;
  const [text, setText] = useState("");
  const [importUnit, setImportUnit] = useState<ImportUnit>("dong");
  const [asOf, setAsOf] = useState(today);
  const [applied, setApplied] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const parsed = useMemo(
    () => (text.trim() ? parseKt740(text, ledger.sources, importUnit) : null),
    [text, ledger.sources, importUnit]
  );

  const sourceById = new Map(ledger.sources.map((s) => [s.id, s]));

  const staleDate = ledger.sources.some(
    (s) => s.systemBalance > 0 && asOf <= s.balanceAsOf
  );

  const apply = () => {
    if (!parsed || parsed.matched.length === 0) return;
    const byId = new Map(
      parsed.matched.map((r) => [r.matchedSourceId as string, r.balance])
    );
    update((l) => ({
      ...l,
      sources: l.sources.map((s) => {
        const next = byId.get(s.id);
        if (next === undefined) return s;
        return {
          ...s,
          previousBalance: s.systemBalance,
          previousAsOf: s.balanceAsOf,
          systemBalance: next,
          balanceAsOf: asOf,
        };
      }),
    }));
    setApplied(
      `Đã cập nhật dư nợ cho ${parsed.matched.length} nguồn theo số liệu ngày ${formatDate(asOf)}.`
    );
    setText("");
  };

  const onFile = async (file: File) => {
    if (/\.xlsx?$/i.test(file.name)) {
      alert(
        "Công cụ đọc CSV/TSV/text. Với file Excel: mở file, bôi đen vùng dữ liệu rồi dán vào ô bên dưới, hoặc lưu lại dạng CSV."
      );
      return;
    }
    setText(await file.text());
    setApplied("");
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="section-title">
          <span>Nhập dư nợ theo mã nhà đầu tư (KT740)</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Số liệu chốt đến ngày">
            <input
              type="date"
              className="input"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </Field>
          <Field label="Đơn vị số tiền trong file">
            <select
              className="input"
              value={importUnit}
              onChange={(e) => setImportUnit(e.target.value as ImportUnit)}
            >
              {IMPORT_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nguồn dữ liệu">
            <button
              type="button"
              className="btn-secondary w-full justify-center"
              onClick={() => fileInput.current?.click()}
            >
              Chọn file CSV / TSV
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
          </Field>
        </div>

        <Field
          label="Hoặc dán trực tiếp từ Excel"
          hint="Công cụ tự nhận dòng tiêu đề có cột “Mã / nhà đầu tư” và cột “Dư nợ / số dư”. Nếu không có tiêu đề, cột đầu được hiểu là mã nguồn và cột số cuối cùng là dư nợ."
        >
          <textarea
            className="input h-32 font-mono text-xs"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setApplied("");
            }}
            placeholder={"Mã nhà đầu tư\tTên nguồn\tDư nợ\nA-NHCS-01\tNguồn TW\t12.210.000.000"}
          />
        </Field>

        {applied ? <Callout tone="ok">{applied}</Callout> : null}
        {staleDate && parsed ? (
          <Callout tone="warn">
            Ngày chốt số liệu không mới hơn ngày đang lưu của một số nguồn. Kiểm
            tra lại để tránh ghi đè bằng số liệu cũ.
          </Callout>
        ) : null}
        {parsed?.warnings.map((w, i) => (
          <Callout key={i} tone="warn">
            {w}
          </Callout>
        ))}

        {parsed && parsed.rows.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Mã trong file</th>
                    <th className="px-3 py-2 text-left">Khớp nguồn</th>
                    <th className="px-3 py-2 text-right">Dư nợ đang lưu</th>
                    <th className="px-3 py-2 text-right">Dư nợ trong file</th>
                    <th className="px-3 py-2 text-right">Biến động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsed.rows.map((r, i) => {
                    const src = r.matchedSourceId
                      ? sourceById.get(r.matchedSourceId)
                      : null;
                    const delta = src ? r.balance - src.systemBalance : 0;
                    return (
                      <tr key={i} className={src ? "" : "bg-red-50"}>
                        <td className="px-3 py-2 font-mono text-xs">{r.rawCode}</td>
                        <td className="px-3 py-2">
                          {src ? (
                            <>
                              <span className="font-mono text-xs">{src.code}</span>
                              <span className="ml-2 text-xs text-slate-500">
                                {src.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-red-600">
                              Không khớp mã nào — dòng này sẽ bị bỏ qua
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                          {src ? formatMoney(src.systemBalance, unit) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">
                          {formatMoney(r.balance, unit)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right tabular-nums ${
                            delta > 0 ? "text-slate-900" : "text-emerald-700"
                          }`}
                        >
                          {src ? `${delta >= 0 ? "+" : "−"}${formatMoney(Math.abs(delta), unit)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn-primary disabled:opacity-50"
              onClick={apply}
              disabled={parsed.matched.length === 0}
            >
              Áp dụng cho {parsed.matched.length} nguồn
            </button>
          </>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Đối chiếu biến động giữa hai lần nhập</h2>
          <p className="mt-1 text-xs text-slate-500">
            Chênh <strong>dương</strong> nghĩa là dư nợ nguồn này tăng nhiều hơn
            phần giải ngân đã ghi nhận trong sổ giữ chỗ — dấu hiệu có khoản vay
            bị gán sai mã nguồn. Chênh âm là bình thường: thu nợ hạch toán tại
            trụ sở không được nhập vào công cụ này.
          </p>
        </div>
        {reconcileRows.length === 0 ? (
          <div className="p-4">
            <EmptyState>
              Chưa có dữ liệu đối chiếu. Cần nhập KT740 ít nhất hai lần.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Nguồn</th>
                  <th className="px-3 py-2 text-left">Kỳ đối chiếu</th>
                  <th className="px-3 py-2 text-right">Dư nợ đầu</th>
                  <th className="px-3 py-2 text-right">Dư nợ cuối</th>
                  <th className="px-3 py-2 text-right">Giải ngân đã ghi</th>
                  <th className="px-3 py-2 text-right">Thu tại xã đã ghi</th>
                  <th className="px-3 py-2 text-right">Chênh chưa giải thích</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reconcileRows.map((r) => (
                  <tr key={r.source.id} className={r.flagged ? "bg-red-50" : ""}>
                    <td className="px-3 py-2 font-mono text-xs">{r.source.code}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {formatDate(r.previousAsOf)} → {formatDate(r.source.balanceAsOf)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(r.previousBalance, unit)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(r.currentBalance, unit)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(r.recordedDisbursed, unit)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(r.recordedReceipts, unit)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-semibold tabular-nums ${
                        r.flagged ? "text-red-600" : "text-slate-500"
                      }`}
                    >
                      {r.unexplained >= 0 ? "+" : "−"}
                      {formatMoney(Math.abs(r.unexplained), unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
