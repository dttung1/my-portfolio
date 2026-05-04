"use client";

import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { Profile } from "@/lib/profile-schema";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-vietnamese-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-vietnamese-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10.5,
    fontFamily: "Roboto",
    color: "#0f172a",
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  photo: { width: 64, height: 64, borderRadius: 4, objectFit: "cover" },
  name: { fontSize: 20, fontWeight: 700, color: "#1d4ed8" },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    color: "#475569",
    fontSize: 9.5,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#1d4ed8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 2,
    marginTop: 14,
    marginBottom: 6,
  },
  itemRow: { marginBottom: 6 },
  itemTitle: { fontWeight: 700 },
  itemSub: { color: "#475569", fontSize: 9.5 },
  body: { marginTop: 1 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  tag: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 9,
  },
});

function joinDate(a?: string, b?: string) {
  const left = a || "";
  const right = b || "";
  if (!left && !right) return "";
  return `${left} – ${right || "Hiện tại"}`;
}

export function CvPdf({ profile }: { profile: Profile }) {
  const b = profile.basic;
  const contacts = [b.email, b.phone, b.website, b.address].filter(Boolean) as string[];

  return (
    <Document title={`${b.fullName || "Portfolio"} - CV`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {b.photoDataUrl ? <Image src={b.photoDataUrl} style={styles.photo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{b.fullName || "Họ và tên"}</Text>
            {b.summary ? <Text style={{ marginTop: 2 }}>{b.summary}</Text> : null}
            {contacts.length > 0 && (
              <View style={styles.contactRow}>
                {contacts.map((c, i) => (
                  <Text key={i}>{c}</Text>
                ))}
              </View>
            )}
            {profile.links.length > 0 && (
              <View style={styles.contactRow}>
                {profile.links.map((l, i) => (
                  <Text key={i}>
                    {l.label}: {l.url}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {(b.dateOfBirth || b.gender || b.nationality || b.ethnicity || b.hometown) && (
          <View>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            {b.dateOfBirth ? <Text>Ngày sinh: {b.dateOfBirth}</Text> : null}
            {b.gender ? (
              <Text>
                Giới tính:{" "}
                {b.gender === "male" ? "Nam" : b.gender === "female" ? "Nữ" : "Khác"}
              </Text>
            ) : null}
            {b.nationality ? <Text>Quốc tịch: {b.nationality}</Text> : null}
            {b.ethnicity ? <Text>Dân tộc: {b.ethnicity}</Text> : null}
            {b.hometown ? <Text>Quê quán: {b.hometown}</Text> : null}
          </View>
        )}

        {profile.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Học vấn</Text>
            {profile.education.map((e, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemTitle}>
                  {e.institution}
                  {e.degree ? ` — ${e.degree}` : ""}
                  {e.field ? `, ${e.field}` : ""}
                </Text>
                {(e.startYear || e.endYear) && (
                  <Text style={styles.itemSub}>{joinDate(e.startYear, e.endYear)}</Text>
                )}
                {e.description ? <Text style={styles.body}>{e.description}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {profile.experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Kinh nghiệm</Text>
            {profile.experience.map((x, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemTitle}>
                  {x.role ? `${x.role} — ` : ""}
                  {x.organization}
                </Text>
                {(x.startDate || x.endDate) && (
                  <Text style={styles.itemSub}>{joinDate(x.startDate, x.endDate)}</Text>
                )}
                {x.description ? <Text style={styles.body}>{x.description}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {profile.projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Dự án</Text>
            {profile.projects.map((p, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemTitle}>
                  {p.name}
                  {p.role ? ` — ${p.role}` : ""}
                  {p.year ? ` (${p.year})` : ""}
                </Text>
                {p.url ? <Text style={styles.itemSub}>{p.url}</Text> : null}
                {p.description ? <Text style={styles.body}>{p.description}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {profile.publications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Công bố</Text>
            {profile.publications.map((pb, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemTitle}>{pb.title}</Text>
                <Text style={styles.itemSub}>
                  {[pb.authors, pb.venue, pb.year].filter(Boolean).join(" · ")}
                </Text>
                {pb.doi ? <Text style={styles.itemSub}>DOI: {pb.doi}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {profile.awards.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Giải thưởng</Text>
            {profile.awards.map((a, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemTitle}>{a.name}</Text>
                <Text style={styles.itemSub}>
                  {[a.issuer, a.year].filter(Boolean).join(" · ")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {(profile.skills.length > 0 || profile.languages.length > 0) && (
          <View>
            <Text style={styles.sectionTitle}>Kỹ năng & Ngôn ngữ</Text>
            {profile.skills.length > 0 && (
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.itemTitle}>Kỹ năng</Text>
                <View style={styles.tagsRow}>
                  {profile.skills.map((s, i) => (
                    <Text key={i} style={styles.tag}>
                      {s}
                    </Text>
                  ))}
                </View>
              </View>
            )}
            {profile.languages.length > 0 && (
              <View>
                <Text style={styles.itemTitle}>Ngôn ngữ</Text>
                <View style={styles.tagsRow}>
                  {profile.languages.map((s, i) => (
                    <Text key={i} style={styles.tag}>
                      {s}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
