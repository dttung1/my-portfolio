"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardPanel } from "@/components/gqvl/DashboardPanel";
import { Kt740Panel } from "@/components/gqvl/Kt740Panel";
import { MatrixPanel } from "@/components/gqvl/MatrixPanel";
import { ReceiptsPanel } from "@/components/gqvl/ReceiptsPanel";
import { ReservationsPanel } from "@/components/gqvl/ReservationsPanel";
import { SettingsPanel } from "@/components/gqvl/SettingsPanel";
import { SlipsPanel } from "@/components/gqvl/SlipsPanel";
import { SourcesPanel } from "@/components/gqvl/SourcesPanel";
import { computeStats, computeTotals, reconcile } from "@/lib/gqvl/compute";
import { formatMoney, unitShort } from "@/lib/gqvl/format";
import { loadLedger, saveLedger } from "@/lib/gqvl/storage";
import { Ledger, emptyLedger, todayISO } from "@/lib/gqvl/types";

const TABS = [
  { id: "dashboard", label: "Bảng khả dụng" },
  { id: "reserve", label: "Giữ chỗ & cấp mã" },
  { id: "receipts", label: "Thu nợ tại xã" },
  { id: "kt740", label: "Nhập KT740 & đối chiếu" },
  { id: "slips", label: "Phiếu duyệt giải ngân" },
  { id: "matrix", label: "Ma trận gán mã" },
  { id: "sources", label: "Danh mục nguồn" },
  { id: "settings", label: "Thiết lập" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function GqvlPage() {
  const [ledger, setLedger] = useState<Ledger>(emptyLedger());
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [today, setToday] = useState("");

  useEffect(() => {
    setLedger(loadLedger());
    setToday(todayISO());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => {
      saveLedger(ledger);
      setSavedAt(new Date());
    }, 300);
    return () => window.clearTimeout(id);
  }, [ledger, hydrated]);

  const stats = useMemo(() => computeStats(ledger, today), [ledger, today]);
  const reconcileRows = useMemo(() => reconcile(ledger), [ledger]);
  const totals = useMemo(() => computeTotals(stats), [stats]);

  const update = (fn: (l: Ledger) => Ledger) => setLedger((prev) => fn(prev));
  const replace = (l: Ledger) => setLedger(l);

  const blockedCount = stats.filter((s) => s.status === "blocked").length;

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-brand-700">
              Kiểm soát nguồn vốn GQVL
            </h1>
            <p className="text-xs text-slate-500">
              {ledger.settings.unitName || "Chưa đặt tên đơn vị"} · Tiền kiểm chỉ
              tiêu tại thời điểm cho vay
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="rounded-md bg-slate-100 px-3 py-1.5">
              <span className="text-xs text-slate-500">Khả dụng toàn đơn vị </span>
              <strong
                className={`tabular-nums ${
                  totals.available <= 0 ? "text-red-600" : "text-emerald-700"
                }`}
              >
                {formatMoney(totals.available, ledger.settings.displayUnit)}{" "}
                {unitShort(ledger.settings.displayUnit)}
              </strong>
            </div>
            {blockedCount > 0 && (
              <span className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                {blockedCount} nguồn đã cạn chỉ tiêu
              </span>
            )}
            <span className="hidden text-xs text-slate-400 lg:block">
              {savedAt ? `Đã lưu ${savedAt.toLocaleTimeString("vi-VN")}` : "Chưa lưu"}
            </span>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition ${
                tab === t.id
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-4">
        {!hydrated ? (
          <div className="card text-sm text-slate-500">Đang tải dữ liệu…</div>
        ) : tab === "dashboard" ? (
          <DashboardPanel
            ledger={ledger}
            stats={stats}
            reconcileRows={reconcileRows}
            today={today}
          />
        ) : tab === "reserve" ? (
          <ReservationsPanel
            ledger={ledger}
            stats={stats}
            today={today}
            update={update}
          />
        ) : tab === "receipts" ? (
          <ReceiptsPanel ledger={ledger} today={today} update={update} />
        ) : tab === "kt740" ? (
          <Kt740Panel
            ledger={ledger}
            reconcileRows={reconcileRows}
            today={today}
            update={update}
          />
        ) : tab === "slips" ? (
          <SlipsPanel ledger={ledger} today={today} />
        ) : tab === "matrix" ? (
          <MatrixPanel ledger={ledger} update={update} />
        ) : tab === "sources" ? (
          <SourcesPanel ledger={ledger} update={update} />
        ) : (
          <SettingsPanel
            ledger={ledger}
            today={today}
            update={update}
            replace={replace}
          />
        )}
      </main>

      <footer className="p-4 text-center text-xs text-slate-400 print:hidden">
        Công cụ giai đoạn 2 của đề án kiểm soát nguồn vốn GQVL · Dữ liệu lưu cục
        bộ trên trình duyệt ·{" "}
        <Link href="/" className="underline hover:text-slate-600">
          Về Portfolio Builder
        </Link>
      </footer>
    </div>
  );
}
