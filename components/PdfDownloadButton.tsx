"use client";

import dynamic from "next/dynamic";
import { Profile } from "@/lib/profile-schema";
import { TemplateId } from "@/lib/templates";
import { CustomTemplate } from "@/lib/custom-templates-storage";
import { ModernCvPdf } from "./templates/ModernCvPdf";
import { StudentCvPdf } from "./templates/StudentCvPdf";
import { ScientistCvPdf } from "./templates/ScientistCvPdf";
import { CivilServant2CPdf } from "./templates/CivilServant2CPdf";
import { openPrintWindow } from "./CustomTemplatePrint";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <span className="btn-secondary">Chuẩn bị PDF…</span> },
);

function renderTemplate(id: TemplateId, profile: Profile) {
  switch (id) {
    case "student":
      return <StudentCvPdf profile={profile} />;
    case "scientist":
      return <ScientistCvPdf profile={profile} />;
    case "civil-servant-2c":
      return <CivilServant2CPdf profile={profile} />;
    case "modern":
    default:
      return <ModernCvPdf profile={profile} />;
  }
}

export function PdfDownloadButton({
  profile,
  templateId,
  customTemplate,
}: {
  profile: Profile;
  templateId: TemplateId | string;
  customTemplate?: CustomTemplate;
}) {
  const safeName = (profile.basic.fullName || "portfolio")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  if (customTemplate) {
    return (
      <button
        type="button"
        className="btn-primary"
        onClick={() => openPrintWindow(customTemplate, profile)}
      >
        Mở bản in
      </button>
    );
  }

  return (
    <PDFDownloadLink
      key={templateId}
      document={renderTemplate(templateId as TemplateId, profile)}
      fileName={`${safeName || "portfolio"}-${templateId}.pdf`}
      className="btn-primary"
    >
      {({ loading }) => (loading ? "Đang tạo PDF…" : "Tải PDF")}
    </PDFDownloadLink>
  );
}
