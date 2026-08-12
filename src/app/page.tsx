import { AppShell } from "@/components/app-shell";
import { BarList } from "@/components/bar-list";
import { MetricCard } from "@/components/metric-card";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { calculateFinancialSummary, formatCurrency, formatPercent } from "@/lib/finance";
import { sampleData } from "@/lib/sample-data";

export default function Home() {
  const summary = calculateFinancialSummary(sampleData);

  return (
    <AppShell eyebrow="Jeskor P&L" title="Business financial command center">
      <SectionCard title={summary.latestMonthLabel} subtitle={summary.plainEnglishStatus}>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <StatusPill status={summary.status} />
          <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
            {summary.profitStatusText}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} tone="success" />
          <MetricCard
            label="Total Expenses"
            value={formatCurrency(summary.totalExpenses)}
            tone={summary.totalExpenses > summary.totalRevenue ? "danger" : "default"}
          />
          <MetricCard label="Gross Profit" value={formatCurrency(summary.grossProfit)} />
          <MetricCard
            label="Net Profit / Loss"
            value={formatCurrency(summary.netProfit)}
            tone={summary.netProfit >= 0 ? "success" : "danger"}
          />
          <MetricCard
            label="Current Profit Margin"
            value={formatPercent(summary.profitMargin)}
            detail={summary.netProfit >= 0 ? "Profitable this month" : "Below break-even this month"}
            tone={summary.netProfit >= 0 ? "success" : "warning"}
          />
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title="Five answers for today"
          subtitle="The home screen is tuned to answer revenue, spending, profitability, distance from break-even, and the items that need attention."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Monthly Burn Rate" value={formatCurrency(summary.burnRate)} />
            <MetricCard label="Average Monthly Revenue" value={formatCurrency(summary.averageMonthlyRevenue)} />
            <MetricCard label="Average Monthly Expenses" value={formatCurrency(summary.averageMonthlyExpenses)} />
            <MetricCard label="Cash Flow" value={formatCurrency(summary.cashFlow)} />
            <MetricCard label="Break-Even Revenue" value={formatCurrency(summary.breakEvenRevenue)} />
            <MetricCard
              label="Additional Revenue Needed"
              value={formatCurrency(summary.additionalRevenueNeeded)}
              detail={`${formatPercent(summary.revenueIncreasePctToBreakEven)} more revenue needed`}
            />
            <MetricCard
              label="Expense Reduction Needed"
              value={formatCurrency(summary.expenseReductionNeeded)}
              detail={`${formatPercent(summary.expenseReductionPctToBreakEven)} cost reduction needed`}
            />
            <MetricCard label="YTD Revenue" value={formatCurrency(summary.ytdRevenue)} />
            <MetricCard label="YTD Expenses" value={formatCurrency(summary.ytdExpenses)} />
            <MetricCard
              label="YTD Profit / Loss"
              value={formatCurrency(summary.ytdProfit)}
              tone={summary.ytdProfit >= 0 ? "success" : "danger"}
            />
          </div>
        </SectionCard>

        <SectionCard title="Areas of concern" subtitle="Automatically generated from the financial data.">
          <div className="space-y-3">
            {summary.alerts.map((alert) => (
              <article className="rounded-2xl border border-slate-200 p-4" key={alert.title}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                    {alert.severity}
                  </span>
                </div>
                <h3 className="font-semibold">{alert.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{alert.explanation}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Expense drivers" subtitle="Largest operating costs this month.">
          <BarList items={summary.expenseByCategory} />
        </SectionCard>
        <SectionCard title="Revenue mix" subtitle="Current month revenue sources and categories.">
          <BarList items={summary.revenueByCategory} />
        </SectionCard>
        <SectionCard title="Top vendors" subtitle="Largest vendor spend this month.">
          <BarList items={summary.topVendors} />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <SectionCard title="Revenue vs expenses by month" subtitle="Basic Phase 1 trend view.">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Month</th>
                  <th className="px-4 py-3 text-left font-semibold">Revenue</th>
                  <th className="px-4 py-3 text-left font-semibold">Expenses</th>
                  <th className="px-4 py-3 text-left font-semibold">Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {summary.monthlyTrend.map((month) => (
                  <tr key={month.month}>
                    <td className="px-4 py-3">{month.month}</td>
                    <td className="px-4 py-3">{formatCurrency(month.revenue)}</td>
                    <td className="px-4 py-3">{formatCurrency(month.expenses)}</td>
                    <td className="px-4 py-3">{formatCurrency(month.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Executive insights" subtitle="Mathematically generated business-owner guidance.">
          <ul className="space-y-3 text-sm text-slate-700">
            {summary.insights.map((insight) => (
              <li className="rounded-2xl bg-slate-50 p-4" key={insight}>
                {insight}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
