const KEY = "my-portfolio:custom-templates:v1";

export type FieldMapping = {
  label: string;
  token: string;
  profilePath: string;
  confidence: "high" | "medium" | "low";
};

export type CustomTemplate = {
  id: string;
  name: string;
  templatedHtml: string;
  mappings: FieldMapping[];
  unmatched: string[];
  createdAt: string;
};

export function loadCustomTemplates(): CustomTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplates(templates: CustomTemplate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(templates));
}

export function addCustomTemplate(template: CustomTemplate) {
  const list = loadCustomTemplates();
  list.unshift(template);
  saveCustomTemplates(list);
}

export function deleteCustomTemplate(id: string) {
  saveCustomTemplates(loadCustomTemplates().filter((t) => t.id !== id));
}
