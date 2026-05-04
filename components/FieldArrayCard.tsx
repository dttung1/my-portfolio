"use client";

import { ReactNode } from "react";

type Props = {
  title: string;
  onAdd: () => void;
  addLabel?: string;
  children: ReactNode;
};

export function FieldArrayCard({ title, onAdd, addLabel = "Thêm", children }: Props) {
  return (
    <section className="card">
      <div className="section-title">
        <span>{title}</span>
        <button type="button" onClick={onAdd} className="btn-secondary text-xs">
          + {addLabel}
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
