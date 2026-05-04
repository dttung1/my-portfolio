"use client";

import { useState } from "react";
import { Profile } from "@/lib/profile-schema";
import { fetchGitHubProfile, GitHubImport } from "@/lib/import-github";
import { fetchOrcidProfile, OrcidImport } from "@/lib/import-orcid";

type Source = "github" | "orcid";
type Fetched =
  | { source: "github"; data: GitHubImport }
  | { source: "orcid"; data: OrcidImport };

export function ImportPanel({
  current,
  onApply,
  onClose,
}: {
  current: Profile;
  onApply: (next: Profile) => void;
  onClose: () => void;
}) {
  const [source, setSource] = useState<Source>("github");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const [overwriteBasic, setOverwriteBasic] = useState(false);

  const onFetch = async () => {
    setError(null);
    setFetched(null);
    setLoading(true);
    try {
      if (source === "github") {
        const data = await fetchGitHubProfile(identifier);
        setFetched({ source: "github", data });
      } else {
        const data = await fetchOrcidProfile(identifier);
        setFetched({ source: "orcid", data });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onApplyClick = () => {
    if (!fetched) return;
    onApply(mergeProfile(current, fetched, { overwriteBasic }));
    onClose();
  };

  const placeholder =
    source === "github" ? "vd: torvalds (username GitHub)" : "vd: 0000-0002-1825-0097";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Import từ mạng xã hội / hồ sơ</h2>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          {(["github", "orcid"] as Source[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`btn ${
                source === s
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700"
              }`}
              onClick={() => {
                setSource(s);
                setFetched(null);
                setError(null);
              }}
            >
              {s === "github" ? "GitHub" : "ORCID"}
            </button>
          ))}
        </div>

        <div className="mb-3 flex gap-2">
          <input
            className="input"
            placeholder={placeholder}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && identifier.trim()) onFetch();
            }}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={loading || !identifier.trim()}
            onClick={onFetch}
          >
            {loading ? "Đang tải…" : "Lấy dữ liệu"}
          </button>
        </div>

        {source === "orcid" && (
          <p className="mb-2 text-xs text-slate-500">
            Dữ liệu chỉ lấy từ các trường đặt chế độ <em>public</em> trên ORCID.
          </p>
        )}
        {source === "github" && (
          <p className="mb-2 text-xs text-slate-500">
            Lấy hồ sơ public, top 8 repo (loại trừ fork & archived), 8 ngôn ngữ
            phổ biến nhất làm kỹ năng.
          </p>
        )}

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {fetched && (
          <div className="space-y-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
              <Preview fetched={fetched} />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={overwriteBasic}
                onChange={(e) => setOverwriteBasic(e.target.checked)}
              />
              Ghi đè các trường cơ bản (tên, giới thiệu, email…) — mặc định chỉ
              điền khi đang trống.
            </label>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Huỷ
              </button>
              <button type="button" className="btn-primary" onClick={onApplyClick}>
                Áp dụng vào hồ sơ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Preview({ fetched }: { fetched: Fetched }) {
  const counts =
    fetched.source === "github"
      ? {
          "Tên": fetched.data.fullName,
          "Giới thiệu": fetched.data.summary,
          "Liên kết": fetched.data.links.length,
          "Dự án": fetched.data.projects.length,
          "Kỹ năng": fetched.data.skills.length,
        }
      : {
          "Tên": fetched.data.fullName,
          "Tiểu sử": fetched.data.summary,
          "Liên kết": fetched.data.links.length,
          "Học vấn": fetched.data.education.length,
          "Kinh nghiệm": fetched.data.experience.length,
          "Công bố": fetched.data.publications.length,
        };

  return (
    <ul className="space-y-1">
      {Object.entries(counts).map(([k, v]) => (
        <li key={k} className="flex justify-between">
          <span className="text-slate-500">{k}</span>
          <span className="font-medium">
            {typeof v === "number"
              ? v
              : v
                ? v.length > 60
                  ? v.slice(0, 60) + "…"
                  : v
                : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function mergeProfile(
  current: Profile,
  fetched: Fetched,
  opts: { overwriteBasic: boolean },
): Profile {
  const next: Profile = structuredClone(current);
  type StringBasicKey =
    | "fullName"
    | "summary"
    | "address"
    | "website"
    | "email"
    | "phone";
  const fillBasic = (key: StringBasicKey, value?: string) => {
    if (!value) return;
    if (opts.overwriteBasic || !next.basic[key]) {
      next.basic[key] = value;
    }
  };

  if (fetched.source === "github") {
    const d = fetched.data;
    fillBasic("fullName", d.fullName);
    fillBasic("summary", d.summary);
    fillBasic("address", d.address);
    fillBasic("website", d.website);
    fillBasic("email", d.email);
    next.links = dedupeBy([...next.links, ...d.links], (l) => l.url);
    next.projects = dedupeBy(
      [...next.projects, ...d.projects],
      (p) => p.url || p.name,
    );
    next.skills = dedupeStrings([...next.skills, ...d.skills]);
  } else {
    const d = fetched.data;
    fillBasic("fullName", d.fullName);
    fillBasic("summary", d.summary);
    fillBasic("email", d.email);
    next.links = dedupeBy([...next.links, ...d.links], (l) => l.url);
    next.education = [...next.education, ...d.education];
    next.experience = [...next.experience, ...d.experience];
    next.publications = dedupeBy(
      [...next.publications, ...d.publications],
      (p) => (p.doi ? `doi:${p.doi}` : `t:${p.title.toLowerCase()}`),
    );
    next.skills = dedupeStrings([...next.skills, ...d.skills]);
  }
  return next;
}

function dedupeBy<T>(arr: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!k || seen.has(k.toLowerCase())) continue;
    seen.add(k.toLowerCase());
    out.push(item);
  }
  return out;
}

function dedupeStrings(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = s.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(s.trim());
  }
  return out;
}
