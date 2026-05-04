"use client";

import { useRef, useState } from "react";
import {
  CustomTemplate,
  FieldMapping,
  addCustomTemplate,
} from "@/lib/custom-templates-storage";
import { ALL_PROFILE_PATHS } from "@/lib/profile-paths";

type Analysis = {
  templatedHtml: string;
  mappings: FieldMapping[];
  unmatched: string[];
  originalName: string;
  usage?: { input: number; output: number; cacheRead: number };
};

export function CustomTemplateUploader({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (template: CustomTemplate) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [name, setName] = useState("");

  const onFile = async (file: File) => {
    setError(null);
    setAnalysis(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/analyze-template", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setAnalysis(data);
      setName(file.name.replace(/\.docx$/i, "") || "Mẫu mới");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (idx: number, patch: Partial<FieldMapping>) => {
    setAnalysis((a) => {
      if (!a) return a;
      const mappings = [...a.mappings];
      mappings[idx] = { ...mappings[idx], ...patch };
      let html = a.templatedHtml;
      if (patch.profilePath !== undefined) {
        const oldToken = mappings[idx].token;
        const newToken = `{{${patch.profilePath}}}`;
        html = html.split(oldToken).join(newToken);
        mappings[idx].token = newToken;
      }
      return { ...a, templatedHtml: html, mappings };
    });
  };

  const removeMapping = (idx: number) => {
    setAnalysis((a) => {
      if (!a) return a;
      const m = a.mappings[idx];
      const html = a.templatedHtml.split(m.token).join("_____");
      const mappings = a.mappings.filter((_, i) => i !== idx);
      const unmatched = [...a.unmatched, m.label];
      return { ...a, templatedHtml: html, mappings, unmatched };
    });
  };

  const onSave = () => {
    if (!analysis) return;
    const template: CustomTemplate = {
      id: `custom-${Date.now().toString(36)}`,
      name: name.trim() || analysis.originalName,
      templatedHtml: analysis.templatedHtml,
      mappings: analysis.mappings,
      unmatched: analysis.unmatched,
      createdAt: new Date().toISOString(),
    };
    addCustomTemplate(template);
    onSaved(template);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Học mẫu mới (AI)</h2>
            <p className="text-xs text-slate-500">
              Upload file DOCX của mẫu lý lịch / sơ yếu / đơn từ → Claude sẽ
              chèn token vào đúng ô và bạn duyệt lại trước khi lưu.
            </p>
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-600" onClick={onClose}>
            ✕
          </button>
        </div>

        {!analysis && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="btn-primary w-full"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
            >
              {loading ? "Đang gọi Claude (có thể mất 30–90 giây)…" : "Chọn file DOCX"}
            </button>
            <p className="mt-3 text-xs text-slate-500">
              Yêu cầu: server phải có <code>ANTHROPIC_API_KEY</code> (xem{" "}
              <code>.env.local.example</code>). File ≤ 5 MB. HTML rút từ DOCX ≤
              200K ký tự.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            <div>
              <label className="label">Tên template</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: Sơ yếu lý lịch viên chức 2C - Sở Y tế"
              />
              <p className="mt-1 text-xs text-slate-500">
                File gốc: {analysis.originalName}
                {analysis.usage && (
                  <>
                    {" "}— Token vào: {analysis.usage.input}, ra:{" "}
                    {analysis.usage.output}
                  </>
                )}
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">
                Mapping được nhận diện ({analysis.mappings.length})
              </h3>
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-2 py-1">Nhãn trong mẫu</th>
                      <th className="px-2 py-1">Profile path</th>
                      <th className="px-2 py-1">Tin cậy</th>
                      <th className="px-2 py-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.mappings.map((m, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-2 py-1">{m.label}</td>
                        <td className="px-2 py-1">
                          <select
                            className="input py-1 text-xs"
                            value={m.profilePath}
                            onChange={(e) => updateMapping(i, { profilePath: e.target.value })}
                          >
                            {!ALL_PROFILE_PATHS.includes(m.profilePath) && (
                              <option value={m.profilePath}>
                                {m.profilePath} (không trong schema)
                              </option>
                            )}
                            {ALL_PROFILE_PATHS.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <span
                            className={
                              m.confidence === "high"
                                ? "rounded bg-emerald-100 px-1.5 text-xs text-emerald-700"
                                : m.confidence === "medium"
                                  ? "rounded bg-amber-100 px-1.5 text-xs text-amber-700"
                                  : "rounded bg-rose-100 px-1.5 text-xs text-rose-700"
                            }
                          >
                            {m.confidence}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button
                            type="button"
                            className="text-xs text-rose-600 hover:underline"
                            onClick={() => removeMapping(i)}
                          >
                            Bỏ
                          </button>
                        </td>
                      </tr>
                    ))}
                    {analysis.mappings.length === 0 && (
                      <tr>
                        <td className="px-2 py-2 text-center text-slate-500" colSpan={4}>
                          Không có mapping nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {analysis.unmatched.length > 0 && (
              <div className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                <div className="font-semibold">
                  Nhãn chưa map ({analysis.unmatched.length}):
                </div>
                <ul className="ml-5 list-disc">
                  {analysis.unmatched.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            )}

            <details>
              <summary className="cursor-pointer text-sm text-slate-600">
                Xem HTML đã chèn token (debug)
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-900 p-2 text-[10px] text-slate-100">
                {analysis.templatedHtml}
              </pre>
            </details>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Huỷ
              </button>
              <button type="button" className="btn-primary" onClick={onSave} disabled={!name.trim()}>
                Lưu template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
