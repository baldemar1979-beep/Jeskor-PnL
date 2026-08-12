import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { SectionCard } from "@/components/section-card";
import { calculateFinancialSummary, formatCurrency } from "@/lib/finance";
import { sampleData } from "@/lib/sample-data";

export default function ExpensesPage() {
  const summary = calculateFinancialSummary(sampleData);
  const currentExpenses = sampleData.expenseRecords.filter((record) => record.date.startsWith(summary.latestMonth));

  return (
    <AppShell eyebrow="Expenses" title="Expense management and operating cost visibility">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Expenses this month" value={formatCurrency(summary.totalExpenses)} />
        <MetricCard label="Monthly burn rate" value={formatCurrency(summary.burnRate)} />
        <MetricCard label="Recurring expenses tracked" value={String(summary.recurringExpenses.length)} />
        <MetricCard label="Top vendors reviewed" value={String(summary.topVendors.length)} />
      </div>

      <SectionCard
        title="Expense ledger"
        subtitle="Each record supports vendor, description, amount, category, payment account, recurring/fixed flags, notes, source, transaction ID, and optional truck/driver assignment."
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Vendor</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Account</th>
                <th className="px-4 py-3 text-left font-semibold">Recurring</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {currentExpenses.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3">{record.date}</td>
                  <td className="px-4 py-3">{record.vendor}</td>
                  <td className="px-4 py-3">{record.category}</td>
                  <td className="px-4 py-3">{record.paymentAccount}</td>
                  <td className="px-4 py-3">{record.recurring ? "Recurring" : "One-time"}</td>
                  <td className="px-4 py-3">{formatCurrency(record.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Recurring expenses" subtitle="Automatically detected across prior months.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summary.recurringExpenses.map((expense) => (
            <div className="rounded-2xl border border-slate-200 p-4" key={expense.vendor}>
              <p className="font-semibold">{expense.vendor}</p>
              <p className="mt-1 text-sm text-slate-600">{expense.category}</p>
              <p className="mt-3 text-2xl font-semibold">{formatCurrency(expense.monthlyCost)}</p>
              <p className="text-sm text-slate-600">Annualized {formatCurrency(expense.annualizedCost)}</p>
              <p className="mt-2 text-sm text-slate-600">
                Last payment {expense.lastPayment} · Next expected {expense.nextExpectedPayment}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
