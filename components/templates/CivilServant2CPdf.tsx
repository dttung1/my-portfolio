"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Profile } from "@/lib/profile-schema";
import { baseStyles, ensureFont } from "./shared";

ensureFont();

const styles = StyleSheet.create({
  ...baseStyles,
  page: {
    ...baseStyles.page,
    paddingHorizontal: 36,
    paddingTop: 30,
    paddingBottom: 30,
    fontSize: 10,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  topLeft: { width: "55%", alignItems: "center" },
  topRight: { width: "35%", alignItems: "center" },
  national: { fontSize: 9.5, fontWeight: 700, textAlign: "center" },
  motto: { fontSize: 10, fontWeight: 700, textAlign: "center", marginTop: 1 },
  underline: {
    width: 90,
    borderBottomWidth: 0.7,
    borderBottomColor: "#0f172a",
    marginTop: 2,
    marginBottom: 4,
    alignSelf: "center",
  },
  photoBox: {
    width: 90,
    height: 110,
    borderWidth: 0.7,
    borderColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  photoNote: { fontSize: 8.5, color: "#475569", textAlign: "center", padding: 4 },
  title: {
    fontSize: 15,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 14,
  },
  subtitle: { textAlign: "center", fontStyle: "italic", marginTop: 2 },
  sectionHeader: {
    backgroundColor: "#e2e8f0",
    fontWeight: 700,
    padding: 4,
    marginTop: 10,
    fontSize: 10.5,
  },
  fieldRow: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: "#0f172a",
    borderTopWidth: 0,
  },
  fieldRowFirst: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: "#0f172a",
  },
  fieldLabel: {
    width: "42%",
    padding: 4,
    backgroundColor: "#f8fafc",
    borderRightWidth: 0.5,
    borderRightColor: "#0f172a",
  },
  fieldValue: { flex: 1, padding: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    fontWeight: 700,
  },
  tableRow: { flexDirection: "row" },
  cell: {
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#0f172a",
    borderBottomWidth: 0.5,
    borderBottomColor: "#0f172a",
  },
  cellLast: {
    padding: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#0f172a",
  },
  table: {
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderColor: "#0f172a",
    marginTop: 2,
  },
  signRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  signCol: { width: "45%", alignItems: "center" },
  signTitle: { fontStyle: "italic", fontSize: 9.5 },
  signRole: { fontWeight: 700, marginTop: 2 },
  paragraph: { marginTop: 4 },
});

function Row({
  label,
  value,
  first,
}: {
  label: string;
  value?: string;
  first?: boolean;
}) {
  return (
    <View style={first ? styles.fieldRowFirst : styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || ""}</Text>
    </View>
  );
}

const widths = {
  no: "6%",
  date: "16%",
  text: "auto",
};

export function CivilServant2CPdf({ profile }: { profile: Profile }) {
  const b = profile.basic;
  const cs = profile.civilServant;

  const genderText =
    b.gender === "male" ? "Nam" : b.gender === "female" ? "Nữ" : b.gender === "other" ? "Khác" : "";

  return (
    <Document title={`${b.fullName || "So yeu ly lich"} - 2C`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Text style={styles.national}>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
            <Text style={styles.motto}>Độc lập - Tự do - Hạnh phúc</Text>
            <View style={styles.underline} />
          </View>
          <View style={styles.topRight}>
            <View style={styles.photoBox}>
              <Text style={styles.photoNote}>
                Ảnh màu (4 x 6 cm){"\n"}đóng dấu giáp lai
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>SƠ YẾU LÝ LỊCH</Text>
        <Text style={styles.subtitle}>
          (Mẫu 2C-BNV/2008 — Ban hành kèm Quyết định số 02/2008/QĐ-BNV)
        </Text>

        <Text style={styles.sectionHeader}>I. THÔNG TIN CHUNG</Text>
        <View>
          <Row first label="1) Họ và tên khai sinh (chữ in hoa)" value={(b.fullName || "").toUpperCase()} />
          <Row label="2) Tên gọi khác" value="" />
          <Row
            label="3) Sinh ngày, tháng, năm — Giới tính"
            value={`${b.dateOfBirth || ""}${genderText ? `  —  ${genderText}` : ""}`}
          />
          <Row label="4) Nơi sinh" value={cs.placeOfBirth} />
          <Row label="5) Quê quán" value={b.hometown} />
          <Row
            label="6) Dân tộc / Tôn giáo"
            value={[b.ethnicity, cs.religion].filter(Boolean).join(" / ")}
          />
          <Row label="7) Nơi đăng ký HKTT" value={cs.permanentAddress} />
          <Row label="8) Nơi ở hiện nay" value={b.address} />
          <Row label="9) Cơ quan tuyển dụng / Ngày tuyển dụng" value={[cs.recruitmentAgency, cs.recruitmentDate].filter(Boolean).join(" — ")} />
          <Row label="10) Chức vụ (chức danh) hiện tại" value={cs.currentPosition} />
          <Row label="11) Công việc chính được giao" value={cs.mainAssignedWork} />
          <Row
            label="12) Ngạch công chức (viên chức) — Mã ngạch"
            value={[cs.civilServantRank, cs.rankCode].filter(Boolean).join(" — ")}
          />
          <Row label="13.1) Trình độ giáo dục phổ thông" value={cs.educationLevel} />
          <Row label="13.2) Trình độ chuyên môn cao nhất" value={cs.highestQualification} />
          <Row label="13.3) Lý luận chính trị" value={cs.politicalTheoryLevel} />
          <Row label="13.4) Quản lý nhà nước" value={cs.stateManagementLevel} />
          <Row label="13.5) Ngoại ngữ" value={cs.foreignLanguages || profile.languages.join(", ")} />
          <Row label="13.6) Tin học" value={cs.itLevel} />
          <Row label="14) Ngày vào Đảng / Ngày chính thức" value={[cs.partyJoinDate, cs.partyOfficialDate].filter(Boolean).join(" — ")} />
          <Row label="15) Ngày tham gia Đoàn TNCS HCM" value={cs.youthLeagueJoinDate} />
          <Row
            label="16) Tình trạng sức khoẻ — Cao (cm) — Nặng (kg) — Nhóm máu"
            value={[cs.healthStatus, cs.height && `${cs.height} cm`, cs.weight && `${cs.weight} kg`, cs.bloodType]
              .filter(Boolean)
              .join(" — ")}
          />
          <Row label="17) Gia đình chính sách / Thương binh" value={cs.policyFamilyStatus} />
          <Row
            label="18) Số CMND/CCCD — Ngày cấp"
            value={[cs.idNumber, cs.idIssueDate].filter(Boolean).join(" — ")}
          />
          <Row label="19) Số sổ BHXH" value={cs.socialInsuranceNumber} />
          <Row
            label="20) Email — Điện thoại"
            value={[b.email, b.phone].filter(Boolean).join(" — ")}
          />
        </View>

        <Text style={styles.sectionHeader}>II. QUÁ TRÌNH ĐÀO TẠO</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { width: widths.no }]}>TT</Text>
            <Text style={[styles.cell, { width: "32%" }]}>Tên trường / Cơ sở đào tạo</Text>
            <Text style={[styles.cell, { width: "20%" }]}>Chuyên ngành</Text>
            <Text style={[styles.cell, { width: "16%" }]}>Văn bằng</Text>
            <Text style={[styles.cellLast, { flex: 1 }]}>Thời gian</Text>
          </View>
          {profile.education.map((e, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, { width: widths.no }]}>{i + 1}</Text>
              <Text style={[styles.cell, { width: "32%" }]}>{e.institution}</Text>
              <Text style={[styles.cell, { width: "20%" }]}>{e.field || ""}</Text>
              <Text style={[styles.cell, { width: "16%" }]}>{e.degree || ""}</Text>
              <Text style={[styles.cellLast, { flex: 1 }]}>
                {[e.startYear, e.endYear].filter(Boolean).join(" – ")}
              </Text>
            </View>
          ))}
          {profile.education.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.cellLast, { flex: 1, color: "#94a3b8" }]}>
                (Chưa có dữ liệu — bổ sung trong mục Học vấn)
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeader}>III. TÓM TẮT QUÁ TRÌNH CÔNG TÁC</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { width: "20%" }]}>Từ tháng/năm</Text>
            <Text style={[styles.cell, { width: "20%" }]}>Đến tháng/năm</Text>
            <Text style={[styles.cell, { width: "30%" }]}>Cơ quan / Đơn vị</Text>
            <Text style={[styles.cellLast, { flex: 1 }]}>Chức vụ — Công việc</Text>
          </View>
          {profile.experience.map((x, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, { width: "20%" }]}>{x.startDate || ""}</Text>
              <Text style={[styles.cell, { width: "20%" }]}>{x.endDate || ""}</Text>
              <Text style={[styles.cell, { width: "30%" }]}>{x.organization}</Text>
              <Text style={[styles.cellLast, { flex: 1 }]}>
                {[x.role, x.description].filter(Boolean).join(" — ")}
              </Text>
            </View>
          ))}
          {profile.experience.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.cellLast, { flex: 1, color: "#94a3b8" }]}>
                (Chưa có dữ liệu — bổ sung trong mục Kinh nghiệm)
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeader}>IV. QUAN HỆ GIA ĐÌNH</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { width: "18%" }]}>Quan hệ</Text>
            <Text style={[styles.cell, { width: "26%" }]}>Họ và tên</Text>
            <Text style={[styles.cell, { width: "16%" }]}>Năm sinh</Text>
            <Text style={[styles.cell, { width: "20%" }]}>Nghề nghiệp</Text>
            <Text style={[styles.cellLast, { flex: 1 }]}>Nơi ở</Text>
          </View>
          {cs.family.map((f, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, { width: "18%" }]}>{f.relation}</Text>
              <Text style={[styles.cell, { width: "26%" }]}>{f.fullName || ""}</Text>
              <Text style={[styles.cell, { width: "16%" }]}>{f.dateOfBirth || ""}</Text>
              <Text style={[styles.cell, { width: "20%" }]}>{f.occupation || ""}</Text>
              <Text style={[styles.cellLast, { flex: 1 }]}>{f.address || ""}</Text>
            </View>
          ))}
          {cs.family.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.cellLast, { flex: 1, color: "#94a3b8" }]}>
                (Bổ sung trong mục Viên chức → Quan hệ gia đình)
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeader}>V. KHEN THƯỞNG — KỶ LUẬT</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700, marginTop: 4 }}>Khen thưởng</Text>
            {profile.awards.length === 0 && (
              <Text style={{ color: "#94a3b8" }}>(Chưa có)</Text>
            )}
            {profile.awards.map((a, i) => (
              <Text key={i}>
                • {a.name}
                {a.issuer ? ` — ${a.issuer}` : ""}
                {a.year ? ` (${a.year})` : ""}
              </Text>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700, marginTop: 4 }}>Kỷ luật</Text>
            {cs.disciplines.length === 0 && (
              <Text style={{ color: "#94a3b8" }}>(Chưa có)</Text>
            )}
            {cs.disciplines.map((d, i) => (
              <Text key={i}>
                • {[d.date, d.form, d.reason, d.authority].filter(Boolean).join(" — ")}
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.sectionHeader}>VI. LỜI CAM ĐOAN</Text>
        <Text style={styles.paragraph}>
          Tôi xin cam đoan những lời khai trên đây là đúng sự thật. Nếu có điều
          gì sai, tôi xin chịu hoàn toàn trách nhiệm.
        </Text>

        <View style={styles.signRow}>
          <View style={styles.signCol}>
            <Text style={styles.signTitle}>XÁC NHẬN CỦA CƠ QUAN</Text>
            <Text style={styles.signTitle}>QUẢN LÝ TRỰC TIẾP</Text>
          </View>
          <View style={styles.signCol}>
            <Text style={styles.signTitle}>
              ......., ngày ...... tháng ...... năm ......
            </Text>
            <Text style={styles.signRole}>NGƯỜI KHAI</Text>
            <Text style={styles.signTitle}>(Ký, ghi rõ họ tên)</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
