import { Profile } from "./profile-schema";

const TOKEN_RE = /\{\{([\w.]+)\}\}/g;

export function substituteTokens(html: string, profile: Profile): string {
  return html.replace(TOKEN_RE, (_, path: string) => {
    const v = resolvePath(profile, path);
    if (v == null || v === "") return "";
    return escapeHtml(formatValue(path, v));
  });
}

export function findUsedPaths(html: string): string[] {
  const seen = new Set<string>();
  for (const m of html.matchAll(TOKEN_RE)) seen.add(m[1]);
  return [...seen];
}

function resolvePath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined),
    obj,
  );
}

function formatValue(path: string, v: unknown): string {
  if (path === "basic.gender") {
    return v === "male" ? "Nam" : v === "female" ? "Nữ" : v === "other" ? "Khác" : "";
  }
  return String(v);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}
