"use client";

import { useMemo, useState } from "react";

import { buildImportReview, parseCsv, type ExpenseRecord, type VendorRule } from "@/lib/finance";

export function ImportReview({
  vendorRules,
  existingExpenses,
}: {
  vendorRules: VendorRule[];
  existingExpenses: ExpenseRecord[];
}) {
  const [csvText, setCsvText] = useState(
    "Date,Vendor,Description,Amount,TransactionID\n2026-08-28,Love's,Fuel top-up,-980,imp-2801\n2026-08-28,Amazon,Settlement deposit,3200,imp-2802",
  );

  const review = useMemo(
    () => buildImportReview(parseCsv(csvText), vendorRules, existingExpenses),
    [csvText, existingExpenses, vendorRules],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700" htmlFor="csv-preview">
          Paste CSV data to preview the review flow
        </label>
        <textarea
          className="min-h-56 w-full rounded-2xl border border-slate-200 p-4 font-mono text-sm outline-none ring-0"
          id="csv-preview"
          onChange={(event) => setCsvText(event.target.value)}
          value={csvText}
        />
        <p className="text-sm text-slate-600">
          Phase 1 includes CSV review logic now. The schema and import history are ready for Excel/OFX
          adapters without rebuilding the workflow.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Row</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Vendor / Customer</th>
              <th className="px-4 py-3 text-left font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Suggested category</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {review.map((item) => (
              <tr key={item.rowNumber}>
                <td className="px-4 py-3">{item.rowNumber}</td>
                <td className="px-4 py-3">{item.transactionType}</td>
                <td className="px-4 py-3">{item.vendorOrCustomer}</td>
                <td className="px-4 py-3">${item.amount.toLocaleString()}</td>
                <td className="px-4 py-3">{item.categorySuggestion}</td>
                <td className="px-4 py-3">
                  {item.duplicate ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
                      Duplicate
                    </span>
                  ) : item.requiresReview ? (
                    <span className="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-800">
                      Review
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
                      Ready
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
