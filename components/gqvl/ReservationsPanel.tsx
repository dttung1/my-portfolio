"use client";

import { useMemo, useState } from "react";
import {
  EffectiveHoldStatus,
  SourceStat,
  effectiveHoldStatus,
  suggestSource,
} from "@/lib/gqvl/compute";
import { formatDate, formatMoney } from "@/lib/gqvl/format";
import {
  BORROWER_TYPES,
  Ledger,
  PURPOSES,
  Reservation,
  UNIONS,
  addWorkingDays,
  newId,
} from "@/lib/gqvl/types";
import { Callout, DataList, EmptyState, Field, MoneyInput } from "./ui";

type Draft = {
  dossierNo: string;
  customerName: string;
  commune: string;
  officer: string;
  borrowerType: string;
  purpose: string;
  union: string;
  amount: number;
  plannedSessionAt: string;
  note: string;
};

const HOLD_LABEL: Record<EffectiveHoldStatus, string> = {
  held: "Đang giữ chỗ",
  expired: "Quá hạn giữ chỗ",
  disbursed: "Đã giải ngân",
  cancelled: "Đã hủy",
};

const HOLD_CLASS: Record<EffectiveHoldStatus, string> = {
  held: "bg-brand-50 text-brand-700 ring-brand-200",
  expired: "bg-amber-50 text-amber-700 ring-amber-200",
  disbursed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function ReservationsPanel({
  ledger,
  stats,
  today,
  update,
}: {
  ledger: Ledger;
  stats: SourceStat[];
  today: string;
  update: (fn: (l: Ledger) => Ledger) => void;
}) {
  const unit = ledger.settings.displayUnit;
  const emptyDraft: Draft = {
    dossierNo: "",
    customerName: "",
    commune: "",
    officer: "",
    borrowerType: "",
    purpose: "",
    union: "",
    amount: 0,
    plannedSessionAt: today,
    note: "",
  };
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [filter, setFilter] = useState<"all" | EffectiveHoldStatus>("held");
  const [disburseDates, setDisburseDates] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const suggestion = useMemo(
    () =>
      suggestSource(
        ledger,
        stats,
        {
          borrowerType: draft.borrowerType,
          purpose: draft.purpose,
          union: draft.union,
          commune: draft.commune,
        },
        draft.amount
      ),
    [ledger, stats, draft.borrowerType, draft.purpose, draft.union, draft.commune, draft.amount]
  );

  const communes = useMemo(
    () =>
      Array.from(
        new Set(ledger.reservations.map((r) => r.commune).filter(Boolean))
      ).sort(),
    [ledger.reservations]
  );
  const officers = useMemo(
    () =>
      Array.from(
        new Set(ledger.reservations.map((r) => r.officer).filter(Boolean))
      ).sort(),
    [ledger.reservations]
  );

  const onHold = () => {
    if (!draft.dossierNo.trim() || !draft.customerName.trim()) {
      setError("Nhập số hồ sơ và tên khách hàng.");
      return;
    }
    if (draft.amount <= 0) {
      setError("Nhập số tiền đề nghị vay.");
      return;
    }
    if (!suggestion.chosen) {
      setError("Chưa cấp được mã nguồn cho hồ sơ này.");
      return;
    }
    const duplicated = ledger.reservations.some(
      (r) =>
        r.dossierNo.trim().toLowerCase() === draft.dossierNo.trim().toLowerCase() &&
        r.status !== "cancelled"
    );
    if (duplicated) {
      setError(`Số hồ sơ ${draft.dossierNo} đã có giữ chỗ đang hiệu lực.`);
      return;
    }

    const reservation: Reservation = {
      id: newId(),
      dossierNo: draft.dossierNo.trim(),
      customerName: draft.customerName.trim(),
      commune: draft.commune.trim(),
      officer: draft.officer.trim(),
      borrowerType: draft.borrowerType,
      purpose: draft.purpose,
      union: draft.union,
      sourceId: suggestion.chosen.source.id,
      amount: draft.amount,
      approvedAt: today,
      expiresAt: addWorkingDays(today, ledger.settings.holdWorkingDays),
      plannedSessionAt: draft.plannedSessionAt,
      disbursedAt: "",
      status: "held",
      note: draft.note.trim(),
    };
    update((l) => ({ ...l, reservations: [reservation, ...l.reservations] }));
    setDraft({ ...emptyDraft, commune: draft.commune, officer: draft.officer });
    setError("");
  };

  const patch = (id: string, changes: Partial<Reservation>) =>
    update((l) => ({
      ...l,
      reservations: l.reservations.map((r) =>
        r.id === id ? { ...r, ...changes } : r
      ),
    }));

  const remove = (id: string) =>
    update((l) => ({
      ...l,
      reservations: l.reservations.filter((r) => r.id !== id),
    }));

  const sourceById = new Map(ledger.sources.map((s) => [s.id, s]));
  const rows = ledger.reservations.filter((r) =>
    filter === "all" ? true : effectiveHoldStatus(r, today) === filter
  );

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="section-title">
          <span>Đề nghị giữ chỗ chỉ tiêu</span>
          <span className="text-xs font-normal text-slate-500">
            Hiệu lực {ledger.settings.holdWorkingDays} ngày làm việc
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Số hồ sơ">
            <input
              className="input"
              value={draft.dossierNo}
              onChange={(e) => set("dossierNo", e.target.value)}
              placeholder="VD: 2026/GQVL/0142"
            />
          </Field>
          <Field label="Khách hàng">
            <input
              className="input"
              value={draft.customerName}
              onChange={(e) => set("customerName", e.target.value)}
            />
          </Field>
          <Field label={`Số tiền đề nghị (${unit === "trieu" ? "triệu đồng" : "đồng"})`}>
            <MoneyInput
              value={draft.amount}
              unit={unit}
              onChange={(v) => set("amount", v)}
              ariaLabel="Số tiền đề nghị vay"
            />
          </Field>

          <Field label="Xã / địa bàn">
            <input
              className="input"
              list="gqvl-communes"
              value={draft.commune}
              onChange={(e) => set("commune", e.target.value)}
            />
            <DataList id="gqvl-communes" options={communes} />
          </Field>
          <Field label="Cán bộ tín dụng">
            <input
              className="input"
              list="gqvl-officers"
              value={draft.officer}
              onChange={(e) => set("officer", e.target.value)}
            />
            <DataList id="gqvl-officers" options={officers} />
          </Field>
          <Field label="Ngày phiên giao dịch dự kiến">
            <input
              type="date"
              className="input"
              value={draft.plannedSessionAt}
              onChange={(e) => set("plannedSessionAt", e.target.value)}
            />
          </Field>

          <Field label="Đối tượng vay" hint="Thuộc tính 1 của ma trận gán mã">
            <select
              className="input"
              value={draft.borrowerType}
              onChange={(e) => set("borrowerType", e.target.value)}
            >
              <option value="">— chọn —</option>
              {BORROWER_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Mục đích sử dụng vốn" hint="Thuộc tính 2">
            <select
              className="input"
              value={draft.purpose}
              onChange={(e) => set("purpose", e.target.value)}
            >
              <option value="">— chọn —</option>
              {PURPOSES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Hội nhận ủy thác" hint="Thuộc tính 3 — để trống nếu không qua hội">
            <select
              className="input"
              value={draft.union}
              onChange={(e) => set("union", e.target.value)}
            >
              <option value="">— không qua hội —</option>
              {UNIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
        </div>

        <SuggestionBox suggestion={suggestion} ledger={ledger} />

        {error ? <Callout tone="danger">{error}</Callout> : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onHold}
            disabled={!suggestion.chosen}
          >
            Duyệt &amp; giữ chỗ chỉ tiêu
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setDraft(emptyDraft);
              setError("");
            }}
          >
            Xóa form
          </button>
          <p className="text-xs text-slate-500">
            Cán bộ tín dụng không chọn mã nguồn — mã do ma trận và chỉ tiêu còn
            lại quyết định.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Sổ giữ chỗ</h2>
          <div className="flex flex-wrap gap-1 text-xs">
            {(["held", "expired", "disbursed", "cancelled", "all"] as const).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-2 py-1 ${
                    filter === f
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" ? "Tất cả" : HOLD_LABEL[f]}
                </button>
              )
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState>Chưa có hồ sơ nào ở trạng thái này.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Hồ sơ</th>
                  <th className="px-3 py-2 text-left">Xã / cán bộ</th>
                  <th className="px-3 py-2 text-left">Mã nguồn</th>
                  <th className="px-3 py-2 text-right">Số tiền</th>
                  <th className="px-3 py-2 text-left">Duyệt / hết hạn</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                  <th className="px-3 py-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const status = effectiveHoldStatus(r, today);
                  const source = sourceById.get(r.sourceId);
                  return (
                    <tr key={r.id} className="align-top hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.customerName}</div>
                        <div className="font-mono text-xs text-slate-500">
                          {r.dossierNo}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        <div>{r.commune || "—"}</div>
                        <div className="text-slate-400">{r.officer || "—"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                          {source?.code ?? "?"}
                        </span>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {source?.name ?? "Nguồn đã bị xóa"}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(r.amount, unit)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        <div>{formatDate(r.approvedAt)}</div>
                        <div
                          className={
                            status === "expired" ? "text-amber-600" : "text-slate-400"
                          }
                        >
                          hết hạn {formatDate(r.expiresAt)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${HOLD_CLASS[status]}`}
                        >
                          {HOLD_LABEL[status]}
                        </span>
                        {r.disbursedAt ? (
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            GN {formatDate(r.disbursedAt)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {(status === "held" || status === "expired") && (
                            <>
                              <input
                                type="date"
                                className="input w-auto px-1.5 py-1 text-xs"
                                aria-label="Ngày giải ngân"
                                value={disburseDates[r.id] ?? today}
                                onChange={(e) =>
                                  setDisburseDates((d) => ({
                                    ...d,
                                    [r.id]: e.target.value,
                                  }))
                                }
                              />
                              <button
                                type="button"
                                className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                                onClick={() =>
                                  patch(r.id, {
                                    status: "disbursed",
                                    disbursedAt: disburseDates[r.id] ?? today,
                                  })
                                }
                              >
                                Đã giải ngân
                              </button>
                            </>
                          )}
                          {status === "expired" && (
                            <button
                              type="button"
                              className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300"
                              onClick={() =>
                                patch(r.id, {
                                  expiresAt: addWorkingDays(
                                    today,
                                    ledger.settings.holdWorkingDays
                                  ),
                                })
                              }
                            >
                              Gia hạn
                            </button>
                          )}
                          {status !== "cancelled" && status !== "disbursed" && (
                            <button
                              type="button"
                              className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                              onClick={() => patch(r.id, { status: "cancelled" })}
                            >
                              Hủy
                            </button>
                          )}
                          <button
                            type="button"
                            className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Xóa hẳn hồ sơ ${r.dossierNo}?`)) remove(r.id);
                            }}
                          >
                            Xóa
                          </button>
                        </div>
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

function SuggestionBox({
  suggestion,
  ledger,
}: {
  suggestion: ReturnType<typeof suggestSource>;
  ledger: Ledger;
}) {
  const unit = ledger.settings.displayUnit;
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Mã nguồn được cấp
        </span>
        {suggestion.rule?.hardBound ? (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            Nguồn gán cứng
          </span>
        ) : null}
      </div>

      {suggestion.chosen ? (
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="rounded bg-brand-600 px-2 py-1 font-mono text-sm font-semibold text-white">
            {suggestion.chosen.source.code}
          </span>
          <span className="text-sm">{suggestion.chosen.source.name}</span>
        </div>
      ) : (
        <div className="text-sm font-medium text-red-600">Chưa cấp được mã nguồn</div>
      )}

      <p
        className={`mt-2 text-sm ${
          suggestion.blocked ? "text-red-700" : "text-slate-600"
        }`}
      >
        {suggestion.message}
      </p>

      {suggestion.candidates.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {suggestion.candidates.map((c) => (
            <li key={c.stat.source.id} className="flex flex-wrap items-center gap-2">
              <span
                className={`font-mono ${
                  c.stat.source.id === suggestion.chosen?.source.id
                    ? "font-semibold text-brand-700"
                    : ""
                }`}
              >
                {c.stat.source.code}
              </span>
              <span className="tabular-nums">
                khả dụng {formatMoney(c.stat.available, unit)}
              </span>
              {c.reason ? <span className="text-slate-400">— {c.reason}</span> : null}
            </li>
          ))}
        </ul>
      )}

      {suggestion.rule?.note ? (
        <p className="mt-2 text-xs italic text-slate-400">{suggestion.rule.note}</p>
      ) : null}
    </div>
  );
}
