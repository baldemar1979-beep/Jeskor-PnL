export function StatusPill({ status }: { status: "healthy" | "needs-attention" | "high-concern" }) {
  const config = {
    healthy: "bg-emerald-100 text-emerald-800",
    "needs-attention": "bg-amber-100 text-amber-800",
    "high-concern": "bg-rose-100 text-rose-800",
  } as const;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${config[status]}`}>
      {status === "healthy" ? "Healthy" : status === "needs-attention" ? "Needs Attention" : "High Concern"}
    </span>
  );
}
