import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiểm soát nguồn vốn GQVL",
  description:
    "Bảng chỉ tiêu khả dụng, giữ chỗ chỉ tiêu, nhập KT740 và in phiếu duyệt giải ngân có sẵn mã nguồn cho vốn vay giải quyết việc làm.",
};

export default function GqvlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
