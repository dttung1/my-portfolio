"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Profile } from "@/lib/profile-schema";
import { baseStyles, ensureFont, joinDate } from "./shared";

ensureFont();

const styles = StyleSheet.create({
  ...baseStyles,
  banner: {
    backgroundColor: "#0ea5e9",
    color: "#ffffff",
    padding: 14,
    borderRadius: 6,
    marginBottom: 14,
  },
  name: { fontSize: 22, fontWeight: 700 },
  role: { fontSize: 11, marginTop: 2, opacity: 0.9 },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
    fontSize: 9.5,
  },
  twoCol: { flexDirection: "row", gap: 16 },
  left: { width: 170 },
  right: { flex: 1 },
  block: {
    borderLeftWidth: 3,
    borderLeftColor: "#0ea5e9",
    paddingLeft: 8,
    marginBottom: 10,
  },
  blockTitle: {
    fontWeight: 700,
    color: "#0369a1",
    fontSize: 11.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  itemTitle: { fontWeight: 700 },
  itemSub: { color: "#475569", fontSize: 9.5 },
  pill: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 9,
    marginRight: 4,
    marginBottom: 4,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap" },
});

export function StudentCvPdf({ profile }: { profile: Profile }) {
  const b = profile.basic;

  return (
    <Document title={`${b.fullName || "Student"} - CV`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.banner}>
          <Text style={styles.name}>{b.fullName || "Họ và tên"}</Text>
          {b.summary ? <Text style={styles.role}>{b.summary}</Text> : null}
          <View style={styles.contactRow}>
            {[b.email, b.phone, b.address].filter(Boolean).map((c, i) => (
              <Text key={i}>{c}</Text>
            ))}
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.left}>
            {profile.skills.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Kỹ năng</Text>
                <View style={styles.pillRow}>
                  {profile.skills.map((s, i) => (
                    <Text key={i} style={styles.pill}>
                      {s}
                    </Text>
                  ))}
                </View>
              </View>
            )}
            {profile.languages.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Ngôn ngữ</Text>
                {profile.languages.map((s, i) => (
                  <Text key={i}>• {s}</Text>
                ))}
              </View>
            )}
            {profile.awards.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Thành tích</Text>
                {profile.awards.map((a, i) => (
                  <View key={i} style={{ marginBottom: 3 }}>
                    <Text style={styles.itemTitle}>{a.name}</Text>
                    <Text style={styles.itemSub}>
                      {[a.issuer, a.year].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {profile.links.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Liên kết</Text>
                {profile.links.map((l, i) => (
                  <Text key={i} style={styles.itemSub}>
                    {l.label}: {l.url}
                  </Text>
                ))}
              </View>
            )}
          </View>

          <View style={styles.right}>
            {profile.education.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Học vấn</Text>
                {profile.education.map((e, i) => (
                  <View key={i} style={{ marginBottom: 5 }}>
                    <Text style={styles.itemTitle}>
                      {e.institution}
                      {e.degree ? ` — ${e.degree}` : ""}
                    </Text>
                    <Text style={styles.itemSub}>
                      {[e.field, joinDate(e.startYear, e.endYear)].filter(Boolean).join(" · ")}
                    </Text>
                    {e.description ? <Text>{e.description}</Text> : null}
                  </View>
                ))}
              </View>
            )}

            {profile.experience.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Hoạt động & Kinh nghiệm</Text>
                {profile.experience.map((x, i) => (
                  <View key={i} style={{ marginBottom: 5 }}>
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

            {profile.projects.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Dự án</Text>
                {profile.projects.map((p, i) => (
                  <View key={i} style={{ marginBottom: 5 }}>
                    <Text style={styles.itemTitle}>
                      {p.name}
                      {p.year ? ` (${p.year})` : ""}
                    </Text>
                    {p.role ? <Text style={styles.itemSub}>Vai trò: {p.role}</Text> : null}
                    {p.description ? <Text>{p.description}</Text> : null}
                    {p.url ? <Text style={styles.itemSub}>{p.url}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
