import { AppShell } from "@/components/app-shell";
import { ImportReview } from "@/components/import-review";
import { SectionCard } from "@/components/section-card";
import { sampleData } from "@/lib/sample-data";

export default function ImportsPage() {
  return (
    <AppShell eyebrow="Imports" title="Transaction import workflow and vendor rules">
      <SectionCard
        title="Import Transactions"
        subtitle="Upload-ready workflow for bank and payroll files. The review layer detects columns, supports category suggestions, flags duplicates, and shows what needs attention before finalizing an import."
      >
        <div className="mb-6 grid gap-4 md:grid-cols-5">
          {[
            "1. Upload CSV or bank-export data",
            "2. Detect and map columns",
            "3. Separate deposits and expenses",
            "4. Suggest categories with vendor rules",
            "5. Review duplicates before import",
          ].map((step) => (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-700" key={step}>
              {step}
            </div>
          ))}
        </div>
        <ImportReview existingExpenses={sampleData.expenseRecords} vendorRules={sampleData.vendorRules} />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <SectionCard title="Import history" subtitle="Operational visibility for past uploads.">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">File</th>
                  <th className="px-4 py-3 text-left font-semibold">Import date</th>
                  <th className="px-4 py-3 text-left font-semibold">Transactions</th>
                  <th className="px-4 py-3 text-left font-semibold">Imported</th>
                  <th className="px-4 py-3 text-left font-semibold">Skipped</th>
                  <th className="px-4 py-3 text-left font-semibold">Duplicates</th>
                  <th className="px-4 py-3 text-left font-semibold">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sampleData.importHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">{item.fileName}</td>
                    <td className="px-4 py-3">{item.importedAt}</td>
                    <td className="px-4 py-3">{item.transactionCount}</td>
                    <td className="px-4 py-3">{item.imported}</td>
                    <td className="px-4 py-3">{item.skipped}</td>
                    <td className="px-4 py-3">{item.duplicates}</td>
                    <td className="px-4 py-3">{item.requiringReview}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Vendor rules" subtitle="Teach the system how recurring vendors should be categorized.">
          <div className="space-y-3">
            {sampleData.vendorRules.map((rule) => (
              <article className="rounded-2xl border border-slate-200 p-4" key={rule.id}>
                <p className="font-semibold">{rule.matchText}</p>
                <p className="mt-1 text-sm text-slate-600">Suggested category: {rule.category}</p>
                <p className="mt-2 text-sm text-slate-500">{rule.rationale}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
