import { describe, expect, it } from "vitest";

import { buildImportReview, calculateFinancialSummary, calculateScenario, parseCsv } from "@/lib/finance";
import { sampleData } from "@/lib/sample-data";

describe("calculateFinancialSummary", () => {
  it("calculates profitability and break-even metrics for the latest month", () => {
    const summary = calculateFinancialSummary(sampleData);

    expect(summary.latestMonth).toBe("2026-08");
    expect(summary.totalRevenue).toBe(51400);
    expect(summary.totalExpenses).toBe(53120);
    expect(summary.additionalRevenueNeeded).toBe(1720);
    expect(summary.expenseReductionNeeded).toBe(1720);
    expect(summary.profitStatusText).toBe("NOT YET PROFITABLE");
  });

  it("creates concern alerts when costs are rising faster than revenue", () => {
    const summary = calculateFinancialSummary(sampleData);

    expect(summary.alerts.some((alert) => alert.title.includes("Fuel expense is increasing faster than revenue"))).toBe(
      true,
    );
    expect(summary.alerts.some((alert) => alert.title.includes("Payroll increased"))).toBe(true);
  });
});

describe("calculateScenario", () => {
  it("applies concurrent revenue and cost changes", () => {
    const result = calculateScenario(sampleData, {
      revenueChangePct: 10,
      payrollChangePct: -5,
      fuelChangePct: 5,
      insuranceChangePct: 0,
      maintenanceChangePct: -10,
      softwareChangePct: -15,
    });

    expect(result.revenue).toBeCloseTo(56540);
    expect(Math.round(result.expenses)).toBe(51462);
    expect(Math.round(result.profit)).toBe(5078);
  });
});

describe("import review flow", () => {
  it("parses csv rows and flags duplicates while preserving vendor rule suggestions", () => {
    const rows = parseCsv(
      "Date,Vendor,Description,Amount,TransactionID\n2026-08-04,Love's,Fuel fill-up,-11100,fuel-0804\n2026-08-28,Indeed,Recruiting ad,-550,new-123",
    );

    const review = buildImportReview(rows, sampleData.vendorRules, sampleData.expenseRecords);

    expect(review[0]).toMatchObject({
      duplicate: true,
      categorySuggestion: "Fuel",
      transactionType: "Expense",
    });
    expect(review[1]).toMatchObject({
      duplicate: false,
      categorySuggestion: "Recruiting",
      requiresReview: false,
    });
  });

  it("keeps quoted comma values together during csv parsing", () => {
    const rows = parseCsv(
      'Date,Vendor,Description,Amount,TransactionID\n2026-08-28,"Smith, John","Dispatch, after hours",-125,new-456',
    );

    expect(rows[0]).toMatchObject({
      Vendor: "Smith, John",
      Description: "Dispatch, after hours",
    });
  });
});
