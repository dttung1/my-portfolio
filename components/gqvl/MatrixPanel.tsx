"use client";

import {
  BORROWER_TYPES,
  Ledger,
  MatrixRule,
  PURPOSES,
  UNIONS,
  newId,
} from "@/lib/gqvl/types";
import { Callout, Field } from "./ui";

const ANY = "";

export function MatrixPanel({
  ledger,
  update,
}: {
  ledger: Ledger;
  update: (fn: (l: Ledger) => Ledger) => void;
}) {
  const patch = (id: string, changes: Partial<MatrixRule>) =>
    update((l) => ({
      ...l,
      rules: l.rules.map((r) => (r.id === id ? { ...r, ...changes } : r)),
    }));

  const addRule = () =>
    update((l) => ({
      ...l,
      rules: [
        ...l.rules,
        {
          id: newId(),
          borrowerType: "",
          purpose: "",
          union: "",
          commune: "",
          sourceIds: [],
          hardBound: false,
          note: "",
        },
      ],
    }));

  const remove = (id: string) => {
    if (!confirm("Xóa dòng ma trận này?")) return;
    update((l) => ({ ...l, rules: l.rules.filter((r) => r.id !== id) }));
  };

  const toggleSource = (rule: MatrixRule, sourceId: string) => {
    const has = rule.sourceIds.includes(sourceId);
    patch(rule.id, {
      sourceIds: has
        ? rule.sourceIds.filter((s) => s !== sourceId)
        : [...rule.sourceIds, sourceId],
    });
  };

  const sorted = [...ledger.sources].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-4">
      <Callout tone="info">
        Ma trận biến việc chọn mã nguồn thành kết quả suy ra từ hồ sơ. Dòng có
        nhiều điều kiện hơn sẽ thắng dòng tổng quát. Điều kiện để trống nghĩa là
        “áp dụng cho mọi trường hợp”. Khi một dòng cho phép nhiều nguồn, công cụ
        chọn nguồn còn đủ chỉ tiêu theo thứ tự ưu tiên đã đặt ở tab Danh mục nguồn.
      </Callout>

      {ledger.rules.map((rule, index) => (
        <div key={rule.id} className="card space-y-3">
          <div className="section-title">
            <span>
              Dòng {index + 1}
              {rule.hardBound ? (
                <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800">
                  Gán cứng
                </span>
              ) : null}
            </span>
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={() => remove(rule.id)}
            >
              Xóa dòng
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Đối tượng vay">
              <select
                className="input"
                value={rule.borrowerType}
                onChange={(e) => patch(rule.id, { borrowerType: e.target.value })}
              >
                <option value={ANY}>— mọi đối tượng —</option>
                {BORROWER_TYPES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Mục đích sử dụng vốn">
              <select
                className="input"
                value={rule.purpose}
                onChange={(e) => patch(rule.id, { purpose: e.target.value })}
              >
                <option value={ANY}>— mọi mục đích —</option>
                {PURPOSES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Hội nhận ủy thác">
              <select
                className="input"
                value={rule.union}
                onChange={(e) => patch(rule.id, { union: e.target.value })}
              >
                <option value={ANY}>— mọi trường hợp —</option>
                {UNIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Xã / địa bàn" hint="Để trống nếu áp dụng toàn huyện">
              <input
                className="input"
                value={rule.commune}
                onChange={(e) => patch(rule.id, { commune: e.target.value })}
              />
            </Field>
          </div>

          <div>
            <span className="label">Nguồn được gán (theo thứ tự ưu tiên)</span>
            <div className="flex flex-wrap gap-2">
              {sorted.map((s) => {
                const checked = rule.sourceIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-sm ${
                      checked
                        ? "border-brand-500 bg-brand-50 text-brand-800"
                        : "border-slate-300 bg-white text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSource(rule, s.id)}
                    />
                    <span className="font-mono text-xs">{s.code || "(chưa có mã)"}</span>
                    <span className="text-xs text-slate-400">#{s.priority}</span>
                  </label>
                );
              })}
            </div>
            {rule.sourceIds.length === 0 ? (
              <p className="mt-1 text-xs text-red-600">
                Dòng này chưa gán nguồn nào — hồ sơ khớp dòng này sẽ không cấp
                được mã.
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-[auto,1fr]">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rule.hardBound}
                onChange={(e) => patch(rule.id, { hardBound: e.target.checked })}
              />
              Gán cứng — hết chỉ tiêu thì dừng, không dùng nguồn khác thay
            </label>
            <Field label="Ghi chú ràng buộc">
              <input
                className="input"
                value={rule.note}
                onChange={(e) => patch(rule.id, { note: e.target.value })}
              />
            </Field>
          </div>
        </div>
      ))}

      <button type="button" className="btn-secondary" onClick={addRule}>
        Thêm dòng ma trận
      </button>
    </div>
  );
}
