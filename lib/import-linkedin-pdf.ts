import type { EducationItem, ExperienceItem } from "./profile-schema";

export type LinkedInImport = {
  fullName?: string;
  email?: string;
  summary?: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  languages: string[];
  warnings: string[];
};

const SECTION_HEADERS: { key: SectionKey; patterns: RegExp[] }[] = [
  { key: "summary", patterns: [/^summary$/i, /^t[óo]m t[ắa]t$/i, /^gi[ớo]i thi[êệ]u$/i] },
  { key: "experience", patterns: [/^experience$/i, /^kinh nghi[êệ]m$/i] },
  { key: "education", patterns: [/^education$/i, /^h[ọo]c v[ấâ]n$/i] },
  {
    key: "skills",
    patterns: [/^skills$/i, /^top skills$/i, /^k[ỹy] n[ăa]ng$/i, /^k[ỹy] n[ăa]ng h[àa]ng đ[ầâ]u$/i],
  },
  { key: "languages", patterns: [/^languages$/i, /^ng[ôo]n ng[ữu]$/i] },
  {
    key: "certifications",
    patterns: [/^certifications$/i, /^licenses & certifications$/i, /^ch[ứu]ng ch[ỉi]$/i],
  },
  { key: "publications", patterns: [/^publications$/i, /^c[ôo]ng b[ốo]$/i] },
  { key: "honors", patterns: [/^honors[ &-]+awards$/i, /^awards$/i, /^gi[ảa]i th[ưu][ơo]ng$/i] },
  { key: "contact", patterns: [/^contact$/i, /^li[êe]n h[êệ]$/i] },
];

type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certifications"
  | "publications"
  | "honors"
  | "contact";

export async function parseLinkedInPdf(file: File): Promise<LinkedInImport> {
  const text = await extractPdfText(file);
  return parseLinkedInText(text);
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let last = 0;
    for (const item of content.items) {
      if ("str" in item) {
        const it = item as { str: string; transform: number[]; hasEOL?: boolean };
        const y = it.transform?.[5] ?? 0;
        if (last && Math.abs(y - last) > 3) out += "\n";
        out += it.str;
        if (it.hasEOL) out += "\n";
        last = y;
      }
    }
    out += "\n\n";
  }
  return out;
}

function parseLinkedInText(text: string): LinkedInImport {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const warnings: string[] = [];
  const fullName = lines[0] && /^[A-ZÀ-Ỹ]/.test(lines[0]) ? lines[0] : undefined;
  const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) ?? [])[0];

  const sections = sliceSections(lines);

  const summary = sections.summary?.join("\n").trim();
  const skills = (sections.skills ?? [])
    .flatMap((l) => l.split(/[,•|]/))
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 60);
  const languages = (sections.languages ?? [])
    .map((l) => l.replace(/\s*\((.*?)\)\s*$/, "").trim())
    .filter((l) => l.length > 0 && l.length < 60);

  const experience = parseExperience(sections.experience ?? []);
  const education = parseEducation(sections.education ?? []);

  if (lines.length === 0) warnings.push("Không trích xuất được nội dung từ PDF.");
  if (!fullName) warnings.push("Không nhận ra dòng tên ở đầu PDF — bạn có thể tự nhập.");
  if (experience.length === 0 && (sections.experience ?? []).length > 0) {
    warnings.push(
      "Đã thấy mục Experience nhưng không tách được entry — kết quả có thể thiếu, hãy kiểm tra.",
    );
  }

  return {
    fullName,
    email,
    summary,
    skills: dedupe(skills),
    experience,
    education,
    languages: dedupe(languages),
    warnings,
  };
}

function sliceSections(lines: string[]): Partial<Record<SectionKey, string[]>> {
  const result: Partial<Record<SectionKey, string[]>> = {};
  let current: SectionKey | null = null;
  for (const line of lines) {
    const matched = matchHeader(line);
    if (matched) {
      current = matched;
      result[current] ??= [];
      continue;
    }
    if (current) result[current]!.push(line);
  }
  return result;
}

function matchHeader(line: string): SectionKey | null {
  if (line.length > 40) return null;
  for (const h of SECTION_HEADERS) {
    if (h.patterns.some((p) => p.test(line))) return h.key;
  }
  return null;
}

const DATE_RE =
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Tháng \d{1,2})[a-zà-ỹ]*\.?\s*\d{4}\b/i;
const RANGE_RE = new RegExp(
  `(${DATE_RE.source})\\s*[-–]\\s*(${DATE_RE.source}|Present|Hi[êệ]n t[ạa]i|nay)`,
  "i",
);

function parseExperience(lines: string[]): ExperienceItem[] {
  const items: ExperienceItem[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length === 0) return;
    items.push(toExperienceEntry(buf));
    buf = [];
  };
  for (const l of lines) {
    if (RANGE_RE.test(l) && buf.length > 0) {
      buf.push(l);
      flush();
      continue;
    }
    buf.push(l);
  }
  flush();
  return items.filter((x) => x.organization || x.role);
}

function toExperienceEntry(lines: string[]): ExperienceItem {
  const dateLine = lines.find((l) => RANGE_RE.test(l)) ?? "";
  const range = dateLine.match(RANGE_RE);
  const startDate = range?.[1] ?? "";
  const endDate = range?.[2] ?? "";
  const nonDate = lines.filter((l) => l !== dateLine);
  const role = nonDate[0] ?? "";
  const organization = nonDate[1] ?? "";
  const description = nonDate.slice(2).join(" ").slice(0, 800);
  return { organization, role, startDate, endDate, description };
}

function parseEducation(lines: string[]): EducationItem[] {
  const items: EducationItem[] = [];
  let buf: string[] = [];
  const yearRe = /\b\d{4}\b\s*[-–]\s*(?:\b\d{4}\b|Present|Hi[êệ]n t[ạa]i|nay)/i;
  const flush = () => {
    if (buf.length === 0) return;
    items.push(toEducationEntry(buf, yearRe));
    buf = [];
  };
  for (const l of lines) {
    if (yearRe.test(l) && buf.length > 0) {
      buf.push(l);
      flush();
      continue;
    }
    buf.push(l);
  }
  flush();
  return items.filter((e) => e.institution);
}

function toEducationEntry(lines: string[], yearRe: RegExp): EducationItem {
  const yearLine = lines.find((l) => yearRe.test(l)) ?? "";
  const range = yearLine.match(/(\d{4})\s*[-–]\s*(\d{4}|Present|Hi[êệ]n t[ạa]i|nay)/i);
  const startYear = range?.[1] ?? "";
  const endYear = range?.[2] ?? "";
  const others = lines.filter((l) => l !== yearLine);
  const institution = others[0] ?? "";
  const degreeField = others[1] ?? "";
  const [degree, field] = degreeField.includes(",")
    ? degreeField.split(",").map((s) => s.trim())
    : [degreeField, ""];
  return {
    institution,
    degree: degree ?? "",
    field: field ?? "",
    startYear,
    endYear,
    description: others.slice(2).join(" ").slice(0, 400),
  };
}

function dedupe(arr: string[]): string[] {
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
