export type TemplateId = "modern" | "student" | "scientist" | "civil-servant-2c";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
  audience: string;
};

export const templates: TemplateMeta[] = [
  {
    id: "modern",
    name: "Modern CV",
    description: "Bố cục một cột, gọn — phù hợp đa số công việc.",
    audience: "Mọi đối tượng",
  },
  {
    id: "student",
    name: "Sinh viên / Học sinh",
    description: "Banner màu, hai cột; nhấn mạnh học vấn, hoạt động, kỹ năng.",
    audience: "Học sinh, sinh viên",
  },
  {
    id: "scientist",
    name: "Nhà khoa học",
    description: "Phong cách học thuật; danh sách công bố đánh số, ngắn gọn.",
    audience: "Giảng viên, nghiên cứu viên",
  },
  {
    id: "civil-servant-2c",
    name: "Sơ yếu lý lịch 2C",
    description:
      "Mẫu 2C-BNV/2008 (Bộ Nội vụ) — bảng ô có viền, dùng được mục Viên chức.",
    audience: "Cán bộ, công chức, viên chức",
  },
];
