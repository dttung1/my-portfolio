# Portfolio Builder

App tạo, lưu và xuất hồ sơ cá nhân (CV / lý lịch). MVP bước 1: schema profile + form nhập liệu responsive + lưu cục bộ + xuất PDF.

## Chạy local

```bash
npm install
cp .env.local.example .env.local   # rồi điền ANTHROPIC_API_KEY nếu muốn dùng "Học mẫu mới (AI)"
npm run dev
```

Mở http://localhost:3000.

> Tính năng "Học mẫu mới (AI)" gọi Claude Opus 4.7 server-side, cần `ANTHROPIC_API_KEY` trong `.env.local`. Lấy key tại <https://console.anthropic.com>. Các tính năng khác chạy hoàn toàn offline-first.

## Tính năng

- Form chia mục: thông tin cơ bản, học vấn, kinh nghiệm, dự án, công bố, giải thưởng, kỹ năng, ngôn ngữ, liên kết, **viên chức (Đảng/Đoàn, ngạch, gia đình, kỷ luật…)**.
- Tự lưu localStorage sau mỗi lần chỉnh sửa (debounce 400ms).
- Import / Export JSON (đồng bộ thủ công, dễ chia sẻ).
- **Import từ MXH / hồ sơ public**:
  - **GitHub**: hồ sơ public, top 8 repo (loại fork & archived), 8 ngôn ngữ phổ biến → kỹ năng.
  - **ORCID**: tên, tiểu sử, học vấn, công tác, công bố (kèm DOI), liên kết — chỉ trường public.
  - **BibTeX**: dán export từ Google Scholar / Mendeley / Zotero → công bố (parser tự viết, không deps).
  - **LinkedIn PDF**: upload file PDF "Save to PDF" → tên, email, tóm tắt, kỹ năng, ngôn ngữ, học vấn, kinh nghiệm (best-effort, hoạt động tốt nhất với CV tiếng Anh).
  - Khi gộp: tự dedupe links/projects/publications/skills, mặc định không ghi đè trường cơ bản đang có.
- **4 template PDF có sẵn** chọn từ dropdown:
  - **Modern CV** — bố cục 1 cột gọn.
  - **Sinh viên / Học sinh** — banner màu, hai cột.
  - **Nhà khoa học** — học thuật, công bố đánh số.
  - **Sơ yếu lý lịch 2C** — mẫu 2C-BNV/2008 dạng bảng.
- **Học mẫu mới (AI)**: upload DOCX bất kỳ → Claude Opus 4.7 chèn token `{{path.to.field}}` vào đúng ô, người dùng duyệt mapping rồi lưu. Render bằng "Mở bản in" (HTML → in / Save as PDF).
- Font Roboto Vietnamese tải qua CDN khi xuất PDF.
- Responsive: tab "Chỉnh sửa / Xem trước" trên mobile, hai cột trên desktop.

## Roadmap

1. ✅ MVP — schema, form, localStorage, PDF.
2. ✅ 4 template (HS/SV, nhà khoa học, viên chức 2C).
3. ✅ Import GitHub & ORCID public.
4. ✅ BibTeX (Google Scholar export) & LinkedIn PDF.
5. ✅ Upload mẫu DOCX → auto-map field bằng Claude, lưu template để dùng lại.
6. Render DOCX gốc (giữ nguyên format Word) thay vì HTML print, cloud sync (tuỳ chọn) qua Supabase.

## Cấu trúc

- `lib/profile-schema.ts` — Zod schema, kiểu `Profile` dùng chung (gồm block `civilServant`).
- `lib/templates.ts` — danh mục template (id, tên, mô tả, đối tượng).
- `lib/storage.ts` — đọc/ghi localStorage, import/export JSON.
- `lib/import-github.ts`, `lib/import-orcid.ts` — fetch public API.
- `lib/import-bibtex.ts` — parser BibTeX không phụ thuộc thư viện ngoài.
- `lib/import-linkedin-pdf.ts` — đọc text từ PDF qua `pdfjs-dist` rồi tách section heuristic.
- `components/ImportPanel.tsx` — modal 4 tab (GitHub / ORCID / BibTeX / LinkedIn), preview, gộp dữ liệu.
- `lib/profile-paths.ts`, `lib/template-engine.ts`, `lib/custom-templates-storage.ts` — định nghĩa profile paths cho LLM, thay token, lưu template tự học.
- `app/api/analyze-template/route.ts` — server route gọi Claude Opus 4.7 (`messages.parse` + JSON schema output) để chèn token vào HTML từ DOCX.
- `components/CustomTemplateUploader.tsx`, `components/CustomTemplatePrint.tsx` — UI upload + duyệt mapping + mở print preview.
- `components/ProfileForm.tsx` — form chính (react-hook-form + field arrays).
- `components/CivilServantSection.tsx` — section thu gọn cho dữ liệu viên chức.
- `components/templates/shared.ts` — đăng ký font + style chung.
- `components/templates/{Modern,Student,Scientist,CivilServant2C}CvPdf.tsx` — 4 template PDF.
- `components/PdfDownloadButton.tsx` — nút tải PDF, nhận `templateId`.
- `app/page.tsx` — layout chính + template picker + xem trước + import/export.
