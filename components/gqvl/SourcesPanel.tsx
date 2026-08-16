"use client";

import { SOURCE_KINDS, SOURCE_LEVELS } from "@/lib/gqvl/types";
import { FundSource, Ledger, newId, todayISO } from "@/lib/gqvl/types";
import { unitLabel } from "@/lib/gqvl/format";
import { Callout, MoneyInput } from "./ui";

export function SourcesPanel({
  ledger,
  update,
}: {
  ledger: Ledger;
  update: (fn: (l: Ledger) => Ledger) => void;
}) {
  const unit = ledger.settings.displayUnit;

  const patch = (id: string, changes: Partial<FundSource>) =>
    update((l) => ({
      ...l,
      sources: l.sources.map((s) => (s.id === id ? { ...s, ...changes } : s)),
    }));

  const addSource = () =>
    update((l) => ({
      ...l,
      sources: [
        ...l.sources,
        {
          id: newId(),
          code: "",
          name: "",
          level: "DP",
          kind: "chung",
          priority: 60,
          planQuota: 0,
          systemBalance: 0,
          balanceAsOf: todayISO(),
          previousBalance: null,
          previousAsOf: null,
          deadline: "",
          note: "",
        },
      ],
    }));

  const remove = (id: string) => {
    const used =
      ledger.reservations.some((r) => r.sourceId === id) ||
      ledger.receipts.some((r) => r.sourceId === id);
    if (used) {
      alert(
        "Nguồn này đang được tham chiếu bởi hồ sơ giữ chỗ hoặc khoản thu. Không xóa được — sửa lại các hồ sơ liên quan trước."
      );
      return;
    }
    if (!confirm("Xóa nguồn vốn này khỏi danh mục?")) return;
    update((l) => ({
      ...l,
      sources: l.sources.filter((s) => s.id !== id),
      rules: l.rules.map((r) => ({
        ...r,
        sourceIds: r.sourceIds.filter((sid) => sid !== id),
      })),
    }));
  };

  return (
    <div className="space-y-4">
      <Callout tone="info">
        Mã nguồn phải trùng đúng <strong>mã đợt / mã nhà đầu tư</strong> đang mở
        trên hệ thống — đây là khóa để công cụ khớp số liệu khi nhập KT740. Chỉ
        tiêu kế hoạch nhập theo văn bản giao chỉ tiêu của chi nhánh tỉnh.
      </Callout>

      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Danh mục nguồn &amp; chỉ tiêu</h2>
          <span className="text-xs text-slate-500">Đơn vị: {unitLabel(unit)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Mã nguồn</th>
                <th className="px-3 py-2 text-left">Tên nguồn</th>
                <th className="px-3 py-2 text-left">Cấp</th>
                <th className="px-3 py-2 text-left">Tính chất</th>
                <th className="px-3 py-2 text-right">Ưu tiên</th>
                <th className="px-3 py-2 text-right">Chỉ tiêu</th>
                <th className="px-3 py-2 text-left">Hạn giải ngân</th>
                <th className="px-3 py-2 text-left">Ghi chú</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.sources.map((s) => (
                <tr key={s.id} className="align-top">
                  <td className="px-2 py-2">
                    <input
                      className="input font-mono text-xs"
                      value={s.code}
                      onChange={(e) => patch(s.id, { code: e.target.value })}
                      aria-label="Mã nguồn"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className="input"
                      value={s.name}
                      onChange={(e) => patch(s.id, { name: e.target.value })}
                      aria-label="Tên nguồn"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className="input"
                      value={s.level}
                      onChange={(e) =>
                        patch(s.id, { level: e.target.value as FundSource["level"] })
                      }
                      aria-label="Cấp nguồn"
                    >
                      {SOURCE_LEVELS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className="input"
                      value={s.kind}
                      onChange={(e) =>
                        patch(s.id, { kind: e.target.value as FundSource["kind"] })
                      }
                      aria-label="Tính chất nguồn"
                    >
                      {SOURCE_KINDS.map((k) => (
                        <option key={k.value} value={k.value}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      className="input w-20 text-right tabular-nums"
                      value={s.priority}
                      onChange={(e) =>
                        patch(s.id, { priority: Number(e.target.value) || 0 })
                      }
                      aria-label="Thứ tự ưu tiên"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <MoneyInput
                      value={s.planQuota}
                      unit={unit}
                      onChange={(v) => patch(s.id, { planQuota: v })}
                      ariaLabel="Chỉ tiêu kế hoạch"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      className="input"
                      value={s.deadline}
                      onChange={(e) => patch(s.id, { deadline: e.target.value })}
                      aria-label="Hạn giải ngân"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className="input"
                      value={s.note}
                      onChange={(e) => patch(s.id, { note: e.target.value })}
                      aria-label="Ghi chú"
                    />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => remove(s.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3">
          <button type="button" className="btn-secondary" onClick={addSource}>
            Thêm nguồn vốn
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Thứ tự ưu tiên: số nhỏ dùng trước. Nguồn ràng buộc chặt và sắp hết
            hạn giải ngân để số nhỏ; nguồn huy động và ngân sách huyện để số lớn
            làm đệm.
          </p>
        </div>
      </div>
    </div>
  );
}
