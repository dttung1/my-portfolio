"use client";

import { useRef, useState } from "react";
import { Profile } from "@/lib/profile-schema";
import { fetchGitHubProfile, GitHubImport } from "@/lib/import-github";
import { fetchOrcidProfile, OrcidImport } from "@/lib/import-orcid";
import { parseBibtex, BibtexImport } from "@/lib/import-bibtex";
import { parseLinkedInPdf, LinkedInImport } from "@/lib/import-linkedin-pdf";

type Source = "github" | "orcid" | "bibtex" | "linkedin";
type Fetched =
  | { source: "github"; data: GitHubImport }
  | { source: "orcid"; data: OrcidImport }
  | { source: "bibtex"; data: BibtexImport }
  | { source: "linkedin"; data: LinkedInImport };

const SOURCE_META: Record<Source, { label: string; hint: string }> = {
  github: {
    label: "GitHub",
    hint: "Hồ sơ public, top 8 repo (loại fork & archived), 8 ngôn ngữ phổ biến nhất.",
  },
  orcid: {
    label: "ORCID",
    hint: "Chỉ lấy các trường đặt chế độ public trên ORCID.",
  },
  bibtex: {
    label: "BibTeX",
    hint: "Dán BibTeX export từ Google Scholar, Mendeley, Zotero… → công bố.",
  },
  linkedin: {
    label: "LinkedIn PDF",
    hint:
      "Trên LinkedIn: More → Save to PDF, sau đó upload tại đây. Trích xuất tốt nhất cho CV tiếng Anh; tiếng Việt cần xác minh.",
  },
};

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
  const [bibtexText, setBibtexText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const [overwriteBasic, setOverwriteBasic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setError(null);
    setFetched(null);
  };

  const onFetch = async () => {
    reset();
    setLoading(true);
    try {
      if (source === "github") {
        const data = await fetchGitHubProfile(identifier);
        setFetched({ source: "github", data });
      } else if (source === "orcid") {
        const data = await fetchOrcidProfile(identifier);
        setFetched({ source: "orcid", data });
      } else if (source === "bibtex") {
        if (!bibtexText.trim()) throw new Error("Hãy dán nội dung BibTeX trước.");
        const data = parseBibtex(bibtexText);
        if (data.publications.length === 0) {
          throw new Error("Không phát hiện entry @article/@inproceedings nào trong văn bản.");
        }
        setFetched({ source: "bibtex", data });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onPdfFile = async (file: File) => {
    reset();
    setLoading(true);
    try {
      const data = await parseLinkedInPdf(file);
      setFetched({ source: "linkedin", data });
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

        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(SOURCE_META) as Source[]).map((s) => (
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
                reset();
              }}
            >
              {SOURCE_META[s].label}
            </button>
          ))}
        </div>

        <p className="mb-3 text-xs text-slate-500">{SOURCE_META[source].hint}</p>

        {(source === "github" || source === "orcid") && (
          <div className="mb-3 flex gap-2">
            <input
              className="input"
              placeholder={
                source === "github"
                  ? "vd: torvalds (username GitHub)"
                  : "vd: 0000-0002-1825-0097"
              }
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
        )}

        {source === "bibtex" && (
          <div className="mb-3 space-y-2">
            <textarea
              rows={8}
              className="input font-mono text-xs"
              placeholder={"@article{key, title={...}, author={...}, journal={...}, year={2024} }"}
              value={bibtexText}
              onChange={(e) => setBibtexText(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="btn-primary"
                disabled={loading || !bibtexText.trim()}
                onClick={onFetch}
              >
                {loading ? "Đang phân tích…" : "Phân tích BibTeX"}
              </button>
            </div>
          </div>
        )}

        {source === "linkedin" && (
          <div className="mb-3 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPdfFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="btn-primary w-full"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
            >
              {loading ? "Đang phân tích PDF…" : "Chọn file LinkedIn PDF"}
            </button>
          </div>
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

            {hasBasicTargets(fetched) && (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={overwriteBasic}
                  onChange={(e) => setOverwriteBasic(e.target.checked)}
                />
                <span>
                  Ghi đè các trường cơ bản (tên, giới thiệu, email…) — mặc định
                  chỉ điền khi đang trống.
                </span>
              </label>
            )}

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

function hasBasicTargets(f: Fetched) {
  return f.source === "github" || f.source === "orcid" || f.source === "linkedin";
}

function Preview({ fetched }: { fetched: Fetched }) {
  let counts: Record<string, number | string | undefined>;
  let warnings: string[] = [];
  switch (fetched.source) {
    case "github":
      counts = {
        Tên: fetched.data.fullName,
        "Giới thiệu": fetched.data.summary,
        "Liên kết": fetched.data.links.length,
        "Dự án": fetched.data.projects.length,
        "Kỹ năng": fetched.data.skills.length,
      };
      break;
    case "orcid":
      counts = {
        Tên: fetched.data.fullName,
        "Tiểu sử": fetched.data.summary,
        "Liên kết": fetched.data.links.length,
        "Học vấn": fetched.data.education.length,
        "Kinh nghiệm": fetched.data.experience.length,
        "Công bố": fetched.data.publications.length,
      };
      break;
    case "bibtex":
      counts = { "Công bố nhận diện được": fetched.data.publications.length };
      warnings = fetched.data.warnings;
      break;
    case "linkedin":
      counts = {
        Tên: fetched.data.fullName,
        Email: fetched.data.email,
        "Tóm tắt": fetched.data.summary,
        "Kỹ năng": fetched.data.skills.length,
        "Ngôn ngữ": fetched.data.languages.length,
        "Học vấn": fetched.data.education.length,
        "Kinh nghiệm": fetched.data.experience.length,
      };
      warnings = fetched.data.warnings;
      break;
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {Object.entries(counts).map(([k, v]) => (
          <li key={k} className="flex justify-between gap-2">
            <span className="text-slate-500">{k}</span>
            <span className="text-right font-medium">
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
      {warnings.length > 0 && (
        <ul className="space-y-1 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
          {warnings.map((w, i) => (
            <li key={i}>⚠ {w}</li>
          ))}
        </ul>
      )}
    </div>
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
    next.projects = dedupeBy([...next.projects, ...d.projects], (p) => p.url || p.name);
    next.skills = dedupeStrings([...next.skills, ...d.skills]);
  } else if (fetched.source === "orcid") {
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
  } else if (fetched.source === "bibtex") {
    next.publications = dedupeBy(
      [...next.publications, ...fetched.data.publications],
      (p) => (p.doi ? `doi:${p.doi}` : `t:${p.title.toLowerCase()}`),
    );
  } else if (fetched.source === "linkedin") {
    const d = fetched.data;
    fillBasic("fullName", d.fullName);
    fillBasic("summary", d.summary);
    fillBasic("email", d.email);
    next.experience = [...next.experience, ...d.experience];
    next.education = [...next.education, ...d.education];
    next.skills = dedupeStrings([...next.skills, ...d.skills]);
    next.languages = dedupeStrings([...next.languages, ...d.languages]);
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
