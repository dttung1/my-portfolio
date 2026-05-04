"use client";

import dynamic from "next/dynamic";
import { Profile } from "@/lib/profile-schema";
import { CvPdf } from "./CvPdf";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <span className="btn-secondary">Chuẩn bị PDF…</span> },
);

export function PdfDownloadButton({ profile }: { profile: Profile }) {
  const safeName = (profile.basic.fullName || "portfolio")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return (
    <PDFDownloadLink
      document={<CvPdf profile={profile} />}
      fileName={`${safeName || "portfolio"}.pdf`}
      className="btn-primary"
    >
      {({ loading }) => (loading ? "Đang tạo PDF…" : "Tải PDF")}
    </PDFDownloadLink>
  );
}
