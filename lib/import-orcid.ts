import type {
  EducationItem,
  ExperienceItem,
  LinkItem,
  PublicationItem,
} from "./profile-schema";

export type OrcidImport = {
  fullName?: string;
  summary?: string;
  email?: string;
  links: LinkItem[];
  education: EducationItem[];
  experience: ExperienceItem[];
  publications: PublicationItem[];
  skills: string[];
};

const API = "https://pub.orcid.org/v3.0";
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

type OrcidValue = { value?: string | number | null } | null | undefined;
type OrcidYearMonth = {
  year?: OrcidValue;
  month?: OrcidValue;
  day?: OrcidValue;
} | null;

function v(x: OrcidValue): string {
  return x?.value != null ? String(x.value) : "";
}

function fmtDate(d: OrcidYearMonth): string {
  if (!d) return "";
  const year = v(d.year);
  const month = v(d.month);
  return [year, month].filter(Boolean).join("-");
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ORCID API lỗi: ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchOrcidProfile(rawId: string): Promise<OrcidImport> {
  const id = rawId.trim().replace(/^https?:\/\/orcid\.org\//i, "");
  if (!ORCID_RE.test(id)) {
    throw new Error("ORCID iD phải có dạng 0000-0000-0000-0000.");
  }

  type PersonResp = {
    name?: {
      "given-names"?: OrcidValue;
      "family-name"?: OrcidValue;
      "credit-name"?: OrcidValue;
    };
    biography?: { content?: string };
    emails?: { email?: { email: string }[] };
    "researcher-urls"?: {
      "researcher-url"?: { "url-name"?: string; url?: OrcidValue }[];
    };
    keywords?: { keyword?: { content?: string }[] };
  };
  type WorksResp = {
    group?: {
      "work-summary"?: {
        title?: { title?: OrcidValue };
        "journal-title"?: OrcidValue;
        "publication-date"?: OrcidYearMonth;
        "external-ids"?: {
          "external-id"?: {
            "external-id-type"?: string;
            "external-id-value"?: string;
          }[];
        };
      }[];
    }[];
  };
  type AffiliationsResp<K extends string> = {
    "affiliation-group"?: {
      summaries?: Record<K, {
        "department-name"?: string | null;
        "role-title"?: string | null;
        "start-date"?: OrcidYearMonth;
        "end-date"?: OrcidYearMonth;
        organization?: { name?: string; address?: { city?: string; country?: string } };
      }>[];
    }[];
  };

  const [person, works, educations, employments] = await Promise.all([
    getJson<PersonResp>(`/${id}/person`),
    getJson<WorksResp>(`/${id}/works`),
    getJson<AffiliationsResp<"education-summary">>(`/${id}/educations`),
    getJson<AffiliationsResp<"employment-summary">>(`/${id}/employments`),
  ]);

  const fullName = [v(person.name?.["given-names"]), v(person.name?.["family-name"])]
    .filter(Boolean)
    .join(" ") || v(person.name?.["credit-name"]) || undefined;

  const summary = person.biography?.content || undefined;
  const email = person.emails?.email?.[0]?.email;

  const links: LinkItem[] = [{ label: "ORCID", url: `https://orcid.org/${id}` }];
  for (const u of person["researcher-urls"]?.["researcher-url"] ?? []) {
    const url = v(u.url);
    if (url) links.push({ label: u["url-name"] || "Website", url });
  }

  const skills = (person.keywords?.keyword ?? [])
    .map((k) => k.content?.trim())
    .filter((x): x is string => !!x)
    .slice(0, 12);

  const publications: PublicationItem[] = (works.group ?? [])
    .map((g) => g["work-summary"]?.[0])
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => {
      const doi =
        s["external-ids"]?.["external-id"]?.find(
          (e) => e["external-id-type"]?.toLowerCase() === "doi",
        )?.["external-id-value"] ?? "";
      return {
        title: v(s.title?.title) || "(không có tiêu đề)",
        authors: "",
        venue: v(s["journal-title"]),
        year: v(s["publication-date"]?.year),
        doi,
      } satisfies PublicationItem;
    })
    .sort((a, b) => (b.year || "").localeCompare(a.year || ""));

  const education: EducationItem[] = (educations["affiliation-group"] ?? [])
    .flatMap((g) => g.summaries ?? [])
    .map((s) => s["education-summary"])
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((s) => ({
      institution: s.organization?.name ?? "",
      degree: s["role-title"] ?? "",
      field: s["department-name"] ?? "",
      startYear: fmtDate(s["start-date"] ?? null),
      endYear: fmtDate(s["end-date"] ?? null),
      description: "",
    }));

  const experience: ExperienceItem[] = (employments["affiliation-group"] ?? [])
    .flatMap((g) => g.summaries ?? [])
    .map((s) => s["employment-summary"])
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((s) => ({
      organization: s.organization?.name ?? "",
      role: [s["role-title"], s["department-name"]].filter(Boolean).join(" — "),
      startDate: fmtDate(s["start-date"] ?? null),
      endDate: fmtDate(s["end-date"] ?? null),
      description: "",
    }));

  return {
    fullName,
    summary,
    email,
    links,
    education,
    experience,
    publications,
    skills,
  };
}
