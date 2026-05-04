import type { Profile } from "./profile-schema";

export type DocumentImport = Partial<Profile> & {
  sourceName?: string;
  usage?: { input: number; output: number };
};

export async function importDocument(file: File): Promise<DocumentImport> {
  const lower = file.name.toLowerCase();
  const fd = new FormData();

  if (lower.endsWith(".pdf")) {
    const text = await extractPdfText(file);
    if (!text.trim()) throw new Error("Không trích xuất được text từ PDF.");
    fd.append("text", text);
    fd.append("sourceName", file.name);
  } else if (
    lower.endsWith(".docx") ||
    lower.endsWith(".txt") ||
    file.type.startsWith("text/")
  ) {
    fd.append("file", file);
  } else {
    throw new Error("Định dạng không hỗ trợ. Hãy dùng DOCX, PDF, hoặc TXT.");
  }

  const res = await fetch("/api/import-document", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
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
    for (const item of content.items) {
      if ("str" in item) {
        out += (item as { str: string; hasEOL?: boolean }).str + " ";
        if ((item as { hasEOL?: boolean }).hasEOL) out += "\n";
      }
    }
    out += "\n\n";
  }
  return out;
}
