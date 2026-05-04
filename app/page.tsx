"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileForm } from "@/components/ProfileForm";
import { PdfDownloadButton } from "@/components/PdfDownloadButton";
import {
  Profile,
  emptyProfile,
  profileSchema,
} from "@/lib/profile-schema";
import {
  clearProfile,
  exportProfileJson,
  importProfileJson,
  loadProfile,
  saveProfile,
} from "@/lib/storage";
import { TemplateId, templates } from "@/lib/templates";

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [templateId, setTemplateId] = useState<TemplateId>("modern");
  const fileInput = useRef<HTMLInputElement>(null);

  const form = useForm<Profile>({
    defaultValues: emptyProfile,
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset(loadProfile());
    setHydrated(true);
  }, [form]);

  const watched = form.watch();

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => {
      saveProfile(watched);
      setSavedAt(new Date());
    }, 400);
    return () => window.clearTimeout(id);
  }, [watched, hydrated]);

  const onImport = async (file: File) => {
    try {
      const data = await importProfileJson(file);
      form.reset(data);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const onReset = () => {
    if (!confirm("Xoá toàn bộ dữ liệu hồ sơ hiện tại?")) return;
    clearProfile();
    form.reset(emptyProfile);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-brand-700">Portfolio Builder</h1>
            <p className="text-xs text-slate-500">
              Tạo, lưu và xuất hồ sơ — dữ liệu lưu cục bộ trên trình duyệt.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden text-xs text-slate-500 md:block">
              {savedAt
                ? `Đã lưu lúc ${savedAt.toLocaleTimeString()}`
                : "Chưa lưu"}
            </div>
            <select
              className="input w-auto text-sm"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as TemplateId)}
              aria-label="Chọn template"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInput.current?.click()}
            >
              Import JSON
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
              onClick={() => exportProfileJson(form.getValues())}
            >
              Export JSON
            </button>
            <button type="button" className="btn-danger" onClick={onReset}>
              Xoá hết
            </button>
            {hydrated && (
              <PdfDownloadButton profile={form.getValues()} templateId={templateId} />
            )}
          </div>
        </div>

        <div className="flex border-t border-slate-200 text-sm md:hidden">
          <button
            className={`flex-1 py-2 ${
              tab === "edit" ? "bg-brand-50 text-brand-700" : "text-slate-600"
            }`}
            onClick={() => setTab("edit")}
          >
            Chỉnh sửa
          </button>
          <button
            className={`flex-1 py-2 ${
              tab === "preview" ? "bg-brand-50 text-brand-700" : "text-slate-600"
            }`}
            onClick={() => setTab("preview")}
          >
            Xem trước
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
        <div className={`flex-1 ${tab === "preview" ? "hidden md:block" : ""}`}>
          {hydrated ? (
            <ProfileForm form={form} />
          ) : (
            <div className="card text-sm text-slate-500">Đang tải dữ liệu…</div>
          )}
        </div>

        <aside
          className={`md:w-[420px] ${tab === "edit" ? "hidden md:block" : ""}`}
        >
          <div className="sticky top-32 space-y-3">
            <div className="card">
              <div className="section-title">
                <span>Template hiện chọn</span>
              </div>
              <TemplateInfo templateId={templateId} />
            </div>
            <div className="card">
              <div className="section-title">Xem trước</div>
              <PreviewCard profile={watched} />
            </div>
          </div>
        </aside>
      </main>

      <footer className="p-4 text-center text-xs text-slate-400">
        MVP bước 2 — 4 template (Modern / SV / Nhà KH / Sơ yếu LL 2C) · Bước
        tiếp: import GitHub/ORCID & học mẫu DOCX của viên chức bằng LLM.
      </footer>
    </div>
  );
}

function TemplateInfo({ templateId }: { templateId: TemplateId }) {
  const t = templates.find((x) => x.id === templateId)!;
  return (
    <div className="space-y-1 text-sm">
      <div className="font-semibold text-brand-700">{t.name}</div>
      <div className="text-xs text-slate-500">Đối tượng: {t.audience}</div>
      <p className="text-slate-700">{t.description}</p>
      {templateId === "civil-servant-2c" && (
        <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
          Mở mục <strong>Viên chức / Sơ yếu lý lịch</strong> trong form để bổ
          sung các trường ngạch, Đảng/Đoàn, gia đình, kỷ luật…
        </p>
      )}
    </div>
  );
}

function PreviewCard({ profile }: { profile: Profile }) {
  const b = profile.basic;
  const valid = profileSchema.safeParse(profile).success;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-3">
        {b.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.photoDataUrl}
            alt="avatar"
            className="h-14 w-14 rounded-md object-cover ring-1 ring-slate-200"
          />
        ) : null}
        <div>
          <div className="text-base font-semibold text-brand-700">
            {b.fullName || "(chưa có tên)"}
          </div>
          <div className="text-xs text-slate-500">
            {[b.email, b.phone].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>
      {b.summary ? <p className="text-slate-700">{b.summary}</p> : null}

      <PreviewSection
        title="Học vấn"
        items={profile.education.map((e) => ({
          line1: `${e.institution}${e.degree ? ` — ${e.degree}` : ""}`,
          line2: [e.field, [e.startYear, e.endYear].filter(Boolean).join(" – ")]
            .filter(Boolean)
            .join(" · "),
        }))}
      />
      <PreviewSection
        title="Kinh nghiệm"
        items={profile.experience.map((x) => ({
          line1: `${x.role ? `${x.role} — ` : ""}${x.organization}`,
          line2: [x.startDate, x.endDate].filter(Boolean).join(" – "),
        }))}
      />
      <PreviewSection
        title="Dự án"
        items={profile.projects.map((p) => ({
          line1: p.name,
          line2: [p.role, p.year].filter(Boolean).join(" · "),
        }))}
      />
      <PreviewSection
        title="Công bố"
        items={profile.publications.map((p) => ({
          line1: p.title,
          line2: [p.authors, p.venue, p.year].filter(Boolean).join(" · "),
        }))}
      />
      {profile.skills.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-slate-500">
            Kỹ năng
          </div>
          <div className="flex flex-wrap gap-1">
            {profile.skills.map((s, i) => (
              <span
                key={i}
                className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className={`text-xs ${valid ? "text-emerald-600" : "text-amber-600"}`}>
        {valid ? "Hồ sơ hợp lệ — sẵn sàng xuất PDF" : "Còn lỗi nhập liệu — xem trong form"}
      </div>
    </div>
  );
}

function PreviewSection({
  title,
  items,
}: {
  title: string;
  items: { line1: string; line2?: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase text-slate-500">{title}</div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i}>
            <div className="font-medium">{it.line1}</div>
            {it.line2 ? <div className="text-xs text-slate-500">{it.line2}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
