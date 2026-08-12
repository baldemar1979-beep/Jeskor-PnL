import { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-white";

  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {detail ? <div className="mt-3 text-sm text-slate-600">{detail}</div> : null}
    </article>
  );
}
