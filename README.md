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
3. Import dữ liệu: GitHub, ORCID, Google Scholar (BibTeX), LinkedIn (PDF export).
4. Upload mẫu DOCX/PDF của viên chức → auto-map field bằng LLM, lưu template để dùng lại.
5. Cloud sync (tuỳ chọn) qua Supabase.

## Công cụ kiểm soát nguồn vốn GQVL (`/gqvl`)

Công cụ giai đoạn 2 của đề án tại `docs/gqvl-kiem-soat-nguon-von.html`: chuyển
việc kiểm soát nguồn vốn cho vay giải quyết việc làm từ hậu kiểm bằng báo cáo
KT740 sang tiền kiểm ngay tại thời điểm quyết định cho vay.

- **Bảng nguồn vốn khả dụng** — Khả dụng = Chỉ tiêu − Dư nợ hệ thống − Giữ chỗ
  − Giải ngân chưa hạch toán + Thu nợ đã xác nhận chưa hạch toán.
- **Giữ chỗ chỉ tiêu ngay khi duyệt**, tự hết hiệu lực sau N ngày làm việc.
- **Ma trận gán mã** — mã nguồn suy ra từ đối tượng vay, mục đích, hội nhận ủy
  thác và địa bàn; cán bộ tín dụng không tự chọn. Nguồn chuyên đề gán cứng,
  hết chỉ tiêu thì chặn thay vì rơi sang nguồn khác.
- **Thu nợ tại xã** — ghi nhận kèm căn cứ để giải phóng chỉ tiêu ngay trong
  phiên, không chờ bút toán.
- **Nhập KT740** (CSV/TSV hoặc dán từ Excel, đọc được số kiểu Việt Nam) và đối
  chiếu biến động: chênh dương báo hiệu có khoản vay gán sai mã nguồn.
- **Phiếu duyệt giải ngân** in sẵn mã nguồn, gom theo từng điểm giao dịch xã.

Dữ liệu lưu localStorage của máy đang dùng; xuất/nhập JSON để sao lưu và bàn
giao. Cần nhiều người cùng xem một bảng theo thời gian thực thì phải triển khai
bản có máy chủ và cơ sở dữ liệu.

## Cấu trúc

- `lib/profile-schema.ts` — Zod schema, kiểu `Profile` dùng chung (gồm block `civilServant`).
- `lib/templates.ts` — danh mục template (id, tên, mô tả, đối tượng).
- `lib/storage.ts` — đọc/ghi localStorage, import/export JSON.
- `components/ProfileForm.tsx` — form chính (react-hook-form + field arrays).
- `components/CivilServantSection.tsx` — section thu gọn cho dữ liệu viên chức.
- `components/templates/shared.ts` — đăng ký font + style chung.
- `components/templates/{Modern,Student,Scientist,CivilServant2C}CvPdf.tsx` — 4 template PDF.
- `components/PdfDownloadButton.tsx` — nút tải PDF, nhận `templateId`.
- `app/page.tsx` — layout chính + template picker + xem trước + import/export.
- `lib/gqvl/{types,compute,kt740,format,storage,demo}.ts` — mô hình dữ liệu, công thức khả dụng, ma trận gán mã, đối chiếu, đọc KT740.
- `components/gqvl/*.tsx` — các tab của công cụ nguồn vốn.
- `app/gqvl/page.tsx` — vỏ trang và điều hướng tab.
