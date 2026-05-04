import { Font, StyleSheet } from "@react-pdf/renderer";

let fontRegistered = false;
export function ensureFont() {
  if (fontRegistered) return;
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
      {
        src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-vietnamese-400-italic.woff",
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  });
  fontRegistered = true;
}

export const baseStyles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10.5,
    fontFamily: "Roboto",
    color: "#0f172a",
    lineHeight: 1.45,
  },
});

export function joinDate(a?: string, b?: string) {
  const left = a || "";
  const right = b || "";
  if (!left && !right) return "";
  return `${left} – ${right || "Hiện tại"}`;
}
