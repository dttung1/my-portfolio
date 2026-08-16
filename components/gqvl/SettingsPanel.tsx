"use client";

import { useRef } from "react";
import { demoLedger } from "@/lib/gqvl/demo";
import { exportLedgerJson, importLedgerJson } from "@/lib/gqvl/storage";
import { Ledger, Settings, emptyLedger } from "@/lib/gqvl/types";
import { Callout, Field } from "./ui";

export function SettingsPanel({
  ledger,
  today,
  update,
  replace,
}: {
  ledger: Ledger;
  today: string;
  update: (fn: (l: Ledger) => Ledger) => void;
  replace: (l: Ledger) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  const patch = (changes: Partial<Settings>) =>
    update((l) => ({ ...l, settings: { ...l.settings, ...changes } }));

  const onImport = async (file: File) => {
    try {
      replace(await importLedgerJson(file));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="section-title">
          <span>Thiết lập đơn vị</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Tên đơn vị">
            <input
              className="input"
              value={ledger.settings.unitName}
              onChange={(e) => patch({ unitName: e.target.value })}
            />
          </Field>
          <Field label="Cán bộ đầu mối nguồn vốn" hint="Người duy nhất được cấp mã nguồn">
            <input
              className="input"
              value={ledger.settings.focalPoint}
              onChange={(e) => patch({ focalPoint: e.target.value })}
            />
          </Field>
          <Field label="Người duyệt" hint="Ký trên phiếu duyệt giải ngân">
            <input
              className="input"
              value={ledger.settings.approver}
              onChange={(e) => patch({ approver: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="section-title">
          <span>Ngưỡng cảnh báo &amp; hiển thị</span>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Ngưỡng sát chỉ tiêu (%)" hint="Mặc định 90%">
            <input
              type="number"
              min={1}
              max={100}
              className="input text-right"
              value={Math.round(ledger.settings.warnRatio * 100)}
              onChange={(e) =>
                patch({
                  warnRatio: Math.min(100, Math.max(1, Number(e.target.value) || 90)) / 100,
                })
              }
            />
          </Field>
          <Field label="Ngưỡng giải ngân chậm (%)" hint="Dưới mức này thì cảnh báo tồn nguồn">
            <input
              type="number"
              min={0}
              max={100}
              className="input text-right"
              value={Math.round(ledger.settings.slowRatio * 100)}
              onChange={(e) =>
                patch({
                  slowRatio: Math.min(100, Math.max(0, Number(e.target.value) || 70)) / 100,
                })
              }
            />
          </Field>
          <Field label="Hiệu lực giữ chỗ (ngày làm việc)">
            <input
              type="number"
              min={1}
              max={60}
              className="input text-right"
              value={ledger.settings.holdWorkingDays}
              onChange={(e) =>
                patch({
                  holdWorkingDays: Math.max(1, Number(e.target.value) || 10),
                })
              }
            />
          </Field>
          <Field label="Đơn vị hiển thị">
            <select
              className="input"
              value={ledger.settings.displayUnit}
              onChange={(e) =>
                patch({ displayUnit: e.target.value as Settings["displayUnit"] })
              }
            >
              <option value="trieu">Triệu đồng</option>
              <option value="dong">Đồng</option>
            </select>
          </Field>
        </div>
        <p className="text-xs text-slate-500">
          Đổi đơn vị hiển thị chỉ đổi cách hiển thị và cách đọc số bạn gõ vào —
          dữ liệu luôn lưu bằng đồng.
        </p>
      </div>

      <div className="card space-y-3">
        <div className="section-title">
          <span>Dữ liệu</span>
        </div>

        <Callout tone="warn">
          Dữ liệu lưu trong trình duyệt của máy này. Xuất JSON cuối mỗi ngày để
          sao lưu và để bàn giao giữa các máy. Nếu đơn vị cần nhiều người cùng
          xem một bảng theo thời gian thực thì phải triển khai bản có máy chủ và
          cơ sở dữ liệu.
        </Callout>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportLedgerJson(ledger)}
          >
            Xuất JSON sao lưu
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInput.current?.click()}
          >
            Nhập JSON
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (
                confirm(
                  "Nạp bộ số liệu minh họa để tập huấn? Toàn bộ dữ liệu hiện tại sẽ bị thay thế."
                )
              ) {
                replace(demoLedger(today));
              }
            }}
          >
            Nạp dữ liệu minh họa
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (confirm("Xóa toàn bộ dữ liệu và quay về danh mục nguồn mặc định?")) {
                replace(emptyLedger());
              }
            }}
          >
            Xóa toàn bộ dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
}
