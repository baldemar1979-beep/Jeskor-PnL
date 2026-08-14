import { describe, expect, it } from "vitest";

import {
  calculateDashboardMetrics,
  detectRecurringExpenses,
  filterTransactions,
  normalizeTransaction,
  parseCsv,
} from "./app.js";

describe("parseCsv", () => {
  it("keeps quoted commas together and ignores blank lines", () => {
    const rows = parseCsv(
      'Card,Transaction Date,Post Date,Description,Category,Type,Amount,Memo\n0162,08/09/2026,08/10/2026,"Smith, John","Food & Drink",Sale,-25.00,\n\n0162,08/10/2026,08/11/2026,Coffee,Food & Drink,Sale,-4.00,',
    );

    expect(rows).toHaveLength(2);
    expect(rows[0].Description).toBe("Smith, John");
  });
});

describe("transaction normalization and metrics", () => {
  it("treats returns as inflows and excludes payment thank you transfers from spend metrics", () => {
    const transactions = [
      normalizeTransaction({
        Card: "0162",
        "Transaction Date": "08/01/2026",
        "Post Date": "08/02/2026",
        Description: "Payment Thank You-Mobile",
        Category: "Fees",
        Type: "Sale",
        Amount: "-500.00",
        Memo: "",
      }),
      normalizeTransaction({
        Card: "0162",
        "Transaction Date": "08/03/2026",
        "Post Date": "08/03/2026",
        Description: "Client refund",
        Category: "Income",
        Type: "Return",
        Amount: "71.00",
        Memo: "",
      }),
      normalizeTransaction({
        Card: "0162",
        "Transaction Date": "08/04/2026",
        "Post Date": "08/04/2026",
        Description: "Waffle House 1295",
        Category: "Food & Drink",
        Type: "Sale",
        Amount: "-14.75",
        Memo: "",
      }),
    ];

    expect(calculateDashboardMetrics(transactions)).toMatchObject({
      totalExpenses: 14.75,
      totalIncome: 71,
      netCashflow: 56.25,
      transactionCount: 2,
    });
  });

  it("filters by category and date range", () => {
    const transactions = [
      normalizeTransaction({
        Card: "0162",
        "Transaction Date": "08/01/2026",
        "Post Date": "08/01/2026",
        Description: "Indeed charge",
        Category: "Professional Services",
        Type: "Sale",
        Amount: "-50.00",
        Memo: "",
      }),
      normalizeTransaction({
        Card: "0162",
        "Transaction Date": "08/15/2026",
        "Post Date": "08/15/2026",
        Description: "Fuel",
        Category: "Gas",
        Type: "Sale",
        Amount: "-40.00",
        Memo: "",
      }),
    ];

    const filtered = filterTransactions(transactions, {
      category: "Gas",
      startDate: "2026-08-10",
      endDate: "2026-08-31",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].category).toBe("Gas");
  });
});

describe("detectRecurringExpenses", () => {
  it("flags weekly-ish or monthly-ish recurring negative merchants", () => {
    const recurring = detectRecurringExpenses([
      normalizeTransaction({
        Card: "0162",
        "Transaction Date": "08/01/2026",
        "Post Date": "08/01/2026",
        Description: "OpenPhone",
        Category: "Bills & Utilities",
        Type: "Sale",
        Amount: "-100.00",
        Memo: "",
      }),
      normalizeTransaction({
        Card: "0162",
        "Transaction Date": "08/08/2026",
        "Post Date": "08/08/2026",
        Description: "OpenPhone",
        Category: "Bills & Utilities",
        Type: "Sale",
        Amount: "-100.00",
        Memo: "",
      }),
    ]);

    expect(recurring).toHaveLength(1);
    expect(recurring[0]).toMatchObject({
      merchant: "OPENPHONE",
      count: 2,
      avgIntervalDays: 7,
    });
  });
});
