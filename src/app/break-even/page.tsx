import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { SectionCard } from "@/components/section-card";
import { calculateFinancialSummary, formatCurrency, formatPercent } from "@/lib/finance";
import { sampleData } from "@/lib/sample-data";

export default function BreakEvenPage() {
  const summary = calculateFinancialSummary(sampleData);

  return (
    <AppShell eyebrow="Break-Even" title="Break-even analysis">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Current monthly revenue" value={formatCurrency(summary.totalRevenue)} />
        <MetricCard label="Current monthly expenses" value={formatCurrency(summary.totalExpenses)} />
        <MetricCard label="Current monthly profit / loss" value={formatCurrency(summary.netProfit)} />
        <MetricCard label="Break-even revenue" value={formatCurrency(summary.breakEvenRevenue)} />
        <MetricCard label="Additional revenue needed" value={formatCurrency(summary.additionalRevenueNeeded)} />
        <MetricCard label="Expense reduction needed" value={formatCurrency(summary.expenseReductionNeeded)} />
        <MetricCard
          label="Revenue increase needed"
          value={formatPercent(summary.revenueIncreasePctToBreakEven)}
        />
        <MetricCard
          label="Expense reduction needed %"
          value={formatPercent(summary.expenseReductionPctToBreakEven)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Operational break-even targets" subtitle="Useful for truck and driver planning.">
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard label="Revenue per truck to break even" value={formatCurrency(summary.breakEvenPerTruck)} />
            <MetricCard label="Revenue per driver to break even" value={formatCurrency(summary.breakEvenPerDriver)} />
          </div>
        </SectionCard>

        <SectionCard title="Profitability by truck" subtitle="Designed so truck-level economics can be added cleanly over time.">
          <div className="space-y-3">
            {summary.expenseByTruck.map((truck) => (
              <div className="rounded-2xl border border-slate-200 p-4" key={truck.truck}>
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">{truck.truck}</p>
                  <p className="text-sm text-slate-600">{formatPercent(truck.margin)} margin</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Revenue {formatCurrency(truck.revenue)} · Expenses {formatCurrency(truck.expenses)} · Profit{" "}
                  {formatCurrency(truck.profit)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
