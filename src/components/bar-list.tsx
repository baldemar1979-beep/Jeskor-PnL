import { formatCurrency } from "@/lib/finance";

export function BarList({
  items,
}: {
  items: Array<{ label: string; amount: number }>;
}) {
  const max = Math.max(...items.map((item) => item.amount), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{formatCurrency(item.amount)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-slate-900"
              style={{ width: `${Math.max((item.amount / max) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
