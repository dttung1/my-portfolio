# Portfolio Builder

App tạo, lưu và xuất hồ sơ cá nhân (CV / lý lịch). MVP bước 1: schema profile + form nhập liệu responsive + lưu cục bộ + xuất PDF.

## Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000.

## Tính năng MVP

- Form chia mục: thông tin cơ bản, học vấn, kinh nghiệm, dự án, công bố, giải thưởng, kỹ năng, ngôn ngữ, liên kết.
- Tự lưu localStorage sau mỗi lần chỉnh sửa (debounce 400ms).
- Import / Export JSON (đồng bộ thủ công, dễ chia sẻ).
- Xuất PDF với template CV mặc định (font Roboto Vietnamese).
- Responsive: tab "Chỉnh sửa / Xem trước" trên mobile, hai cột trên desktop.

## Roadmap

1. ✅ MVP — schema, form, localStorage, PDF.
2. Thêm template: học sinh, sinh viên, nhà khoa học, viên chức (Sơ yếu LL 2C…).
3. Import dữ liệu: GitHub, ORCID, Google Scholar (BibTeX), LinkedIn (PDF export).
4. Upload mẫu DOCX/PDF của viên chức → auto-map field bằng LLM, lưu template để dùng lại.
5. Cloud sync (tuỳ chọn) qua Supabase.

## Cấu trúc

- `lib/profile-schema.ts` — Zod schema, kiểu `Profile` dùng chung.
- `lib/storage.ts` — đọc/ghi localStorage, import/export JSON.
- `components/ProfileForm.tsx` — form chính (react-hook-form + field arrays).
- `components/CvPdf.tsx` — template PDF mặc định (`@react-pdf/renderer`).
- `components/PdfDownloadButton.tsx` — nút tải PDF (dynamic import, no SSR).
- `app/page.tsx` — layout chính + xem trước + nút import/export.
