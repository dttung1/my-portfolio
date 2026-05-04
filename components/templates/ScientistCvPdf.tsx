"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Profile } from "@/lib/profile-schema";
import { baseStyles, ensureFont, joinDate } from "./shared";

ensureFont();

const styles = StyleSheet.create({
  ...baseStyles,
  page: { ...baseStyles.page, fontSize: 10 },
  name: { fontSize: 18, fontWeight: 700 },
  meta: { fontSize: 9.5, color: "#475569", marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#0f172a", marginVertical: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 4,
  },
  pubItem: { marginBottom: 4, paddingLeft: 14, position: "relative" },
  pubMarker: { position: "absolute", left: 0, fontWeight: 700 },
  itemTitle: { fontWeight: 700 },
  itemSub: { color: "#475569", fontSize: 9.5 },
});

export function ScientistCvPdf({ profile }: { profile: Profile }) {
  const b = profile.basic;
  const cs = profile.civilServant;
  const contact = [b.email, b.phone, b.website, b.address].filter(Boolean).join(" · ");

  return (
    <Document title={`${b.fullName || "Researcher"} - CV`}>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{b.fullName || "Họ và tên"}</Text>
          {cs.currentPosition ? <Text style={styles.meta}>{cs.currentPosition}</Text> : null}
          {contact ? <Text style={styles.meta}>{contact}</Text> : null}
          {profile.links.length > 0 && (
            <Text style={styles.meta}>
              {profile.links.map((l) => `${l.label}: ${l.url}`).join("  ·  ")}
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        {b.summary ? (
          <View>
            <Text style={styles.sectionTitle}>Tóm tắt nghiên cứu</Text>
            <Text>{b.summary}</Text>
          </View>
        ) : null}

        {profile.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Học vị</Text>
            {profile.education.map((e, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <Text style={styles.itemTitle}>
                  {e.degree || "—"}{e.field ? `, ${e.field}` : ""}
                </Text>
                <Text style={styles.itemSub}>
                  {[e.institution, joinDate(e.startYear, e.endYear)].filter(Boolean).join(" · ")}
                </Text>
                {e.description ? <Text>{e.description}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {profile.experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Bổ nhiệm / Vị trí công tác</Text>
            {profile.experience.map((x, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <Text style={styles.itemTitle}>
                  {x.role ? `${x.role} — ` : ""}
                  {x.organization}
                </Text>
                <Text style={styles.itemSub}>{joinDate(x.startDate, x.endDate)}</Text>
                {x.description ? <Text>{x.description}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {profile.publications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Công bố khoa học</Text>
            {profile.publications.map((pb, i) => (
              <View key={i} style={styles.pubItem}>
                <Text style={styles.pubMarker}>{i + 1}.</Text>
                <Text>
                  {pb.authors ? `${pb.authors}. ` : ""}
                  <Text style={styles.itemTitle}>{pb.title}.</Text>
                  {pb.venue ? ` ${pb.venue}.` : ""}
                  {pb.year ? ` ${pb.year}.` : ""}
                  {pb.doi ? ` DOI: ${pb.doi}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {profile.projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Đề tài / Dự án</Text>
            {profile.projects.map((p, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <Text style={styles.itemTitle}>
                  {p.name}
                  {p.role ? ` — ${p.role}` : ""}
                  {p.year ? ` (${p.year})` : ""}
                </Text>
                {p.description ? <Text>{p.description}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {profile.awards.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Giải thưởng</Text>
            {profile.awards.map((a, i) => (
              <Text key={i}>
                • {a.name}
                {a.issuer ? ` — ${a.issuer}` : ""}
                {a.year ? ` (${a.year})` : ""}
              </Text>
            ))}
          </View>
        )}

        {(profile.skills.length > 0 || profile.languages.length > 0) && (
          <View>
            <Text style={styles.sectionTitle}>Kỹ năng & Ngôn ngữ</Text>
            {profile.skills.length > 0 && (
              <Text>Kỹ năng: {profile.skills.join(", ")}</Text>
            )}
            {profile.languages.length > 0 && (
              <Text>Ngôn ngữ: {profile.languages.join(", ")}</Text>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
