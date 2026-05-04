"use client";

import { Profile } from "@/lib/profile-schema";
import { CustomTemplate } from "@/lib/custom-templates-storage";
import { substituteTokens } from "@/lib/template-engine";

const PRINT_CSS = `
  @page { size: A4; margin: 18mm; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 13px;
    color: #000;
    line-height: 1.4;
  }
  h1, h2, h3 { margin: 0.4em 0; }
  table { border-collapse: collapse; width: 100%; margin: 0.4em 0; }
  td, th { border: 0.5px solid #000; padding: 4px 6px; vertical-align: top; }
  p { margin: 0.3em 0; }
  .__print_actions { background: #f8fafc; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; }
  @media print { .__print_actions { display: none; } }
`;

export function openPrintWindow(template: CustomTemplate, profile: Profile) {
  const filled = substituteTokens(template.templatedHtml, profile);
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) {
    alert("Trình duyệt chặn cửa sổ pop-up. Cho phép pop-up cho trang này rồi thử lại.");
    return;
  }
  w.document.write(`<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8" />
<title>${escapeHtml(template.name)}</title>
<style>${PRINT_CSS}</style>
</head>
<body>
<div class="__print_actions">
  <strong>${escapeHtml(template.name)}</strong>
  &nbsp;—&nbsp;
  <button onclick="window.print()">In / Lưu PDF</button>
  &nbsp;
  <button onclick="window.close()">Đóng</button>
  <span style="float:right; color:#64748b">Mẹo: Chrome → Print → Save as PDF</span>
</div>
<div>${filled}</div>
</body></html>`);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}
