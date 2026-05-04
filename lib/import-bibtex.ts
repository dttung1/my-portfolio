import type { PublicationItem } from "./profile-schema";

export type BibtexImport = {
  publications: PublicationItem[];
  warnings: string[];
};

export function parseBibtex(input: string): BibtexImport {
  const publications: PublicationItem[] = [];
  const warnings: string[] = [];

  const re = /@(\w+)\s*\{\s*([^,\s]+)\s*,/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const type = m[1].toLowerCase();
    if (type === "comment" || type === "preamble" || type === "string") continue;

    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    while (i < input.length && depth > 0) {
      const c = input[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      i++;
    }
    if (depth !== 0) {
      warnings.push(`Mục "${m[2]}" có dấu ngoặc không cân bằng, đã bỏ qua.`);
      continue;
    }
    const body = input.slice(start, i - 1);
    const fields = parseFields(body);
    publications.push({
      title: fields.title || "(không có tiêu đề)",
      authors: formatAuthors(fields.author || ""),
      venue: fields.journal || fields.booktitle || fields.publisher || fields.school || "",
      year: fields.year || "",
      doi: fields.doi || "",
    });
    re.lastIndex = i;
  }

  return { publications, warnings };
}

function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /[\s,]/.test(body[i])) i++;
    const nameMatch = /^[a-zA-Z][a-zA-Z0-9_-]*/.exec(body.slice(i));
    if (!nameMatch) break;
    const name = nameMatch[0].toLowerCase();
    i += nameMatch[0].length;
    while (i < body.length && /\s/.test(body[i])) i++;
    if (body[i] !== "=") break;
    i++;
    while (i < body.length && /\s/.test(body[i])) i++;

    let value = "";
    if (body[i] === "{") {
      let depth = 1;
      i++;
      const startVal = i;
      while (i < body.length && depth > 0) {
        if (body[i] === "{") depth++;
        else if (body[i] === "}") depth--;
        if (depth > 0) i++;
      }
      value = body.slice(startVal, i);
      i++;
    } else if (body[i] === '"') {
      i++;
      const startVal = i;
      while (i < body.length && body[i] !== '"') i++;
      value = body.slice(startVal, i);
      i++;
    } else {
      const startVal = i;
      while (i < body.length && !/[,\s}]/.test(body[i])) i++;
      value = body.slice(startVal, i);
    }
    fields[name] = cleanValue(value);
  }
  return fields;
}

function cleanValue(s: string): string {
  return s
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\\$/g, "$")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatAuthors(s: string): string {
  if (!s) return "";
  return s
    .split(/\s+and\s+/i)
    .map((name) => {
      const parts = name.split(",").map((p) => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) return `${parts[1]} ${parts[0]}`;
      return name.trim();
    })
    .filter(Boolean)
    .join(", ");
}
