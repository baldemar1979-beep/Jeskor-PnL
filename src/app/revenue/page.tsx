import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { SectionCard } from "@/components/section-card";
import { calculateFinancialSummary, formatCurrency } from "@/lib/finance";
import { sampleData } from "@/lib/sample-data";

export default function RevenuePage() {
  const summary = calculateFinancialSummary(sampleData);
  const currentRevenue = sampleData.revenueRecords.filter((record) => record.date.startsWith(summary.latestMonth));

  return (
    <AppShell eyebrow="Revenue" title="Income tracking and revenue trends">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Revenue this month" value={formatCurrency(summary.totalRevenue)} />
        <MetricCard label="Average monthly revenue" value={formatCurrency(summary.averageMonthlyRevenue)} />
        <MetricCard label="YTD revenue" value={formatCurrency(summary.ytdRevenue)} />
        <MetricCard label="Revenue categories" value={String(summary.revenueByCategory.length)} />
      </div>

      <SectionCard
        title="Revenue records"
        subtitle="Phase 1 manual-entry shape for date, customer, description, category, amount, invoice/reference number, notes, and optional truck/driver assignment."
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {currentRevenue.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3">{record.date}</td>
                  <td className="px-4 py-3">{record.customer}</td>
                  <td className="px-4 py-3">{record.description}</td>
                  <td className="px-4 py-3">{record.category}</td>
                  <td className="px-4 py-3">{record.invoiceNumber}</td>
                  <td className="px-4 py-3">{formatCurrency(record.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
