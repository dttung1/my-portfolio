import { Profile, emptyProfile, profileSchema } from "./profile-schema";

const KEY = "my-portfolio:profile:v1";

export function loadProfile(): Profile {
  if (typeof window === "undefined") return emptyProfile;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyProfile;
    const parsed = profileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyProfile;
  } catch {
    return emptyProfile;
  }
}

export function saveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(profile));
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function exportProfileJson(profile: Profile) {
  const blob = new Blob([JSON.stringify(profile, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (profile.basic.fullName || "profile")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  a.download = `${safeName || "profile"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProfileJson(file: File): Promise<Profile> {
  const text = await file.text();
  const data = JSON.parse(text);
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("File JSON không đúng định dạng schema profile.");
  }
  return parsed.data;
}
