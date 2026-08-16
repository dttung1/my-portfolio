import { Ledger, emptyLedger, ledgerSchema, todayISO } from "./types";

const KEY = "gqvl:ledger:v1";

export function loadLedger(): Ledger {
  if (typeof window === "undefined") return emptyLedger();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyLedger();
    const parsed = ledgerSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyLedger();
  } catch {
    return emptyLedger();
  }
}

export function saveLedger(ledger: Ledger) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ledger));
}

export function clearLedger() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function exportLedgerJson(ledger: Ledger) {
  const blob = new Blob([JSON.stringify(ledger, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nguon-von-gqvl-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importLedgerJson(file: File): Promise<Ledger> {
  const text = await file.text();
  const parsed = ledgerSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(
      "File JSON không đúng định dạng sổ nguồn vốn GQVL (kiểm tra lại file sao lưu)."
    );
  }
  return parsed.data;
}
