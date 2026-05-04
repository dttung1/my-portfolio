# Portfolio Builder

App tạo, lưu và xuất hồ sơ cá nhân (CV / lý lịch). MVP bước 1: schema profile + form nhập liệu responsive + lưu cục bộ + xuất PDF.

## Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000.

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
- **4 template PDF** chọn từ dropdown:
  - **Modern CV** — bố cục 1 cột gọn.
  - **Sinh viên / Học sinh** — banner màu, hai cột.
  - **Nhà khoa học** — học thuật, công bố đánh số.
  - **Sơ yếu lý lịch 2C** — mẫu 2C-BNV/2008 dạng bảng.
- Font Roboto Vietnamese tải qua CDN khi xuất PDF.
- Responsive: tab "Chỉnh sửa / Xem trước" trên mobile, hai cột trên desktop.

## Roadmap

1. ✅ MVP — schema, form, localStorage, PDF.
2. ✅ 4 template (HS/SV, nhà khoa học, viên chức 2C).
3. ✅ Import GitHub & ORCID public.
4. ✅ BibTeX (Google Scholar export) & LinkedIn PDF.
5. Upload mẫu DOCX/PDF của viên chức → auto-map field bằng LLM, lưu template để dùng lại.
6. Cloud sync (tuỳ chọn) qua Supabase.

## Cấu trúc

- `lib/profile-schema.ts` — Zod schema, kiểu `Profile` dùng chung (gồm block `civilServant`).
- `lib/templates.ts` — danh mục template (id, tên, mô tả, đối tượng).
- `lib/storage.ts` — đọc/ghi localStorage, import/export JSON.
- `lib/import-github.ts`, `lib/import-orcid.ts` — fetch public API.
- `lib/import-bibtex.ts` — parser BibTeX không phụ thuộc thư viện ngoài.
- `lib/import-linkedin-pdf.ts` — đọc text từ PDF qua `pdfjs-dist` rồi tách section heuristic.
- `components/ImportPanel.tsx` — modal 4 tab (GitHub / ORCID / BibTeX / LinkedIn), preview, gộp dữ liệu.
- `components/ProfileForm.tsx` — form chính (react-hook-form + field arrays).
- `components/CivilServantSection.tsx` — section thu gọn cho dữ liệu viên chức.
- `components/templates/shared.ts` — đăng ký font + style chung.
- `components/templates/{Modern,Student,Scientist,CivilServant2C}CvPdf.tsx` — 4 template PDF.
- `components/PdfDownloadButton.tsx` — nút tải PDF, nhận `templateId`.
- `app/page.tsx` — layout chính + template picker + xem trước + import/export.
