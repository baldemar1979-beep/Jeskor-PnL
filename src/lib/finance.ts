export type Severity = "healthy" | "needs-attention" | "high-concern";
export type AlertSeverity = "Information" | "Watch" | "Concern" | "Critical";

export type RevenueRecord = {
  id: string;
  date: string;
  customer: string;
  description: string;
  category: string;
  amount: number;
  invoiceNumber: string;
  notes?: string;
  truckId?: string;
  driverId?: string;
};

export type ExpenseRecord = {
  id: string;
  date: string;
  vendor: string;
  description: string;
  amount: number;
  category: string;
  paymentAccount: string;
  recurring: boolean;
  fixed: boolean;
  notes?: string;
  source: string;
  transactionId: string;
  truckId?: string;
  driverId?: string;
  excludedFromProfitability?: boolean;
};

export type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

export type VendorRule = {
  id: string;
  matchText: string;
  category: string;
  rationale: string;
};

export type ImportHistoryItem = {
  id: string;
  fileName: string;
  importedAt: string;
  transactionCount: number;
  imported: number;
  skipped: number;
  duplicates: number;
  requiringReview: number;
};

export type BudgetEntry = {
  category: string;
  month: string;
  amount: number;
};

export type Driver = {
  id: string;
  name: string;
};

export type Truck = {
  id: string;
  number: string;
};

export type FinancialAlert = {
  severity: AlertSeverity;
  title: string;
  explanation: string;
};

export type MonthlyTrendPoint = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export type ScenarioAdjustments = {
  revenueChangePct: number;
  payrollChangePct: number;
  fuelChangePct: number;
  insuranceChangePct: number;
  maintenanceChangePct: number;
  softwareChangePct: number;
};

export type ImportPreviewRow = Record<string, string>;

export type ImportReviewItem = {
  rowNumber: number;
  transactionType: "Revenue" | "Expense";
  vendorOrCustomer: string;
  amount: number;
  categorySuggestion: string;
  duplicate: boolean;
  requiresReview: boolean;
};

export type FinancialDataset = {
  revenueRecords: RevenueRecord[];
  expenseRecords: ExpenseRecord[];
  accounts: Account[];
  vendorRules: VendorRule[];
  importHistory: ImportHistoryItem[];
  budgets: BudgetEntry[];
  drivers: Driver[];
  trucks: Truck[];
};

const recurringDetectionThreshold = 3;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currency.format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function toMonthKey(date: string) {
  return date.slice(0, 7);
}

function sumAmounts<T extends { amount: number }>(items: T[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

function monthLabel(month: string) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function groupByMonth(records: Array<{ date: string; amount: number }>) {
  return records.reduce<Record<string, number>>((accumulator, record) => {
    const key = toMonthKey(record.date);
    accumulator[key] = (accumulator[key] ?? 0) + record.amount;
    return accumulator;
  }, {});
}

function groupExpensesByCategory(records: ExpenseRecord[], latestMonth: string) {
  return records
    .filter((record) => toMonthKey(record.date) === latestMonth)
    .reduce<Record<string, number>>((accumulator, record) => {
      accumulator[record.category] = (accumulator[record.category] ?? 0) + record.amount;
      return accumulator;
    }, {});
}

function groupRevenueByCategory(records: RevenueRecord[], latestMonth: string) {
  return records
    .filter((record) => toMonthKey(record.date) === latestMonth)
    .reduce<Record<string, number>>((accumulator, record) => {
      accumulator[record.category] = (accumulator[record.category] ?? 0) + record.amount;
      return accumulator;
    }, {});
}

function groupVendors(records: ExpenseRecord[], latestMonth: string) {
  return records
    .filter((record) => toMonthKey(record.date) === latestMonth)
    .reduce<Record<string, number>>((accumulator, record) => {
      accumulator[record.vendor] = (accumulator[record.vendor] ?? 0) + record.amount;
      return accumulator;
    }, {});
}

function monthRange(revenueRecords: RevenueRecord[], expenseRecords: ExpenseRecord[]) {
  const months = Array.from(
    new Set([...revenueRecords.map((item) => toMonthKey(item.date)), ...expenseRecords.map((item) => toMonthKey(item.date))]),
  ).sort();

  return months;
}

export function calculateFinancialSummary(data: FinancialDataset) {
  const months = monthRange(data.revenueRecords, data.expenseRecords);
  const latestMonth = months.at(-1) ?? new Date().toISOString().slice(0, 7);
  const currentYear = latestMonth.slice(0, 4);

  const currentRevenueRecords = data.revenueRecords.filter((record) => toMonthKey(record.date) === latestMonth);
  const currentExpenseRecords = data.expenseRecords.filter((record) => toMonthKey(record.date) === latestMonth);
  const profitabilityExpenseRecords = currentExpenseRecords.filter(
    (record) => !record.excludedFromProfitability,
  );
  const ytdRevenueRecords = data.revenueRecords.filter((record) => record.date.startsWith(currentYear));
  const ytdExpenseRecords = data.expenseRecords.filter((record) => record.date.startsWith(currentYear));
  const monthlyRevenueMap = groupByMonth(data.revenueRecords);
  const monthlyExpenseMap = groupByMonth(data.expenseRecords);

  const totalRevenue = sumAmounts(currentRevenueRecords);
  const totalExpenses = sumAmounts(currentExpenseRecords);
  const grossProfit = totalRevenue - sumAmounts(
    currentExpenseRecords.filter((record) =>
      ["Fuel", "Maintenance", "Repairs", "Tires", "Tolls"].includes(record.category),
    ),
  );
  const netProfit = totalRevenue - sumAmounts(profitabilityExpenseRecords);
  const profitMargin = totalRevenue === 0 ? 0 : (netProfit / totalRevenue) * 100;
  const burnRate = Math.max(totalExpenses - totalRevenue, 0);
  const averageMonthlyRevenue =
    months.length === 0 ? 0 : Object.values(monthlyRevenueMap).reduce((sum, amount) => sum + amount, 0) / months.length;
  const averageMonthlyExpenses =
    months.length === 0
      ? 0
      : Object.values(monthlyExpenseMap).reduce((sum, amount) => sum + amount, 0) / months.length;
  const cashFlow = totalRevenue - totalExpenses;
  const breakEvenRevenue = totalExpenses;
  const additionalRevenueNeeded = Math.max(totalExpenses - totalRevenue, 0);
  const expenseReductionNeeded = additionalRevenueNeeded;
  const ytdRevenue = sumAmounts(ytdRevenueRecords);
  const ytdExpenses = sumAmounts(ytdExpenseRecords);
  const ytdProfit = ytdRevenue - ytdExpenses;
  const revenueIncreasePctToBreakEven =
    totalRevenue === 0 ? 0 : (additionalRevenueNeeded / totalRevenue) * 100;
  const expenseReductionPctToBreakEven =
    totalExpenses === 0 ? 0 : (expenseReductionNeeded / totalExpenses) * 100;

  const monthlyTrend = months.map((month) => ({
    month,
    revenue: monthlyRevenueMap[month] ?? 0,
    expenses: monthlyExpenseMap[month] ?? 0,
    profit: (monthlyRevenueMap[month] ?? 0) - (monthlyExpenseMap[month] ?? 0),
  }));

  const status: Severity =
    netProfit >= 0 && profitMargin >= 8
      ? "healthy"
      : netProfit >= 0 || profitMargin > -5
        ? "needs-attention"
        : "high-concern";

  const expenseByCategory = Object.entries(groupExpensesByCategory(data.expenseRecords, latestMonth))
    .sort(([, left], [, right]) => right - left)
    .map(([category, amount]) => ({ label: category, amount }));

  const revenueByCategory = Object.entries(groupRevenueByCategory(data.revenueRecords, latestMonth))
    .sort(([, left], [, right]) => right - left)
    .map(([category, amount]) => ({ label: category, amount }));

  const topVendors = Object.entries(groupVendors(data.expenseRecords, latestMonth))
    .sort(([, left], [, right]) => right - left)
    .slice(0, 5)
    .map(([label, amount]) => ({ label, amount }));

  const expenseByTruck = data.trucks.map((truck) => {
    const revenue = sumAmounts(currentRevenueRecords.filter((record) => record.truckId === truck.id));
    const expenses = sumAmounts(currentExpenseRecords.filter((record) => record.truckId === truck.id));
    const profit = revenue - expenses;
    return {
      truck: truck.number,
      revenue,
      expenses,
      profit,
      margin: revenue === 0 ? 0 : (profit / revenue) * 100,
    };
  });

  const expenseByDriver = data.drivers.map((driver) => {
    const revenue = sumAmounts(currentRevenueRecords.filter((record) => record.driverId === driver.id));
    const payroll = sumAmounts(
      currentExpenseRecords.filter(
        (record) => record.driverId === driver.id && ["Payroll", "Benefits"].includes(record.category),
      ),
    );
    const associatedExpenses = sumAmounts(
      currentExpenseRecords.filter(
        (record) =>
          record.driverId === driver.id &&
          !["Payroll", "Benefits"].includes(record.category),
      ),
    );
    return {
      driver: driver.name,
      revenue,
      payroll,
      associatedExpenses,
      contributionMargin: revenue - payroll - associatedExpenses,
    };
  });

  const recurringExpenses = detectRecurringExpenses(data.expenseRecords, latestMonth);
  const forecasts = buildForecasts(monthlyTrend);
  const alerts = generateFinancialAlerts(data, monthlyTrend, totalExpenses, totalRevenue);
  const insights = generateExecutiveInsights(data, latestMonth, totalExpenses, totalRevenue, expenseByCategory);

  return {
    latestMonth,
    latestMonthLabel: monthLabel(latestMonth),
    months,
    totalRevenue,
    totalExpenses,
    grossProfit,
    netProfit,
    profitMargin,
    burnRate,
    averageMonthlyRevenue,
    averageMonthlyExpenses,
    cashFlow,
    breakEvenRevenue,
    additionalRevenueNeeded,
    expenseReductionNeeded,
    ytdRevenue,
    ytdExpenses,
    ytdProfit,
    revenueIncreasePctToBreakEven,
    expenseReductionPctToBreakEven,
    profitStatusText: netProfit >= 0 ? "PROFITABLE" : "NOT YET PROFITABLE",
    plainEnglishStatus:
      netProfit >= 0
        ? `The company is profitable this month by ${formatCurrency(netProfit)} with a ${formatPercent(
            profitMargin,
          )} margin.`
        : `The company is currently operating at a ${formatPercent(
            Math.abs(profitMargin),
          )} loss. At the current expense level, approximately ${formatCurrency(
            additionalRevenueNeeded,
          )} in additional monthly revenue would bring the business to break-even.`,
    status,
    monthlyTrend,
    expenseByCategory,
    revenueByCategory,
    topVendors,
    expenseByTruck,
    expenseByDriver,
    recurringExpenses,
    forecasts,
    alerts,
    insights,
    breakEvenPerTruck: data.trucks.length === 0 ? 0 : breakEvenRevenue / data.trucks.length,
    breakEvenPerDriver: data.drivers.length === 0 ? 0 : breakEvenRevenue / data.drivers.length,
  };
}

export function generateFinancialAlerts(
  data: FinancialDataset,
  monthlyTrend: MonthlyTrendPoint[],
  currentExpenses: number,
  currentRevenue: number,
): FinancialAlert[] {
  const latest = monthlyTrend.at(-1);
  const prior = monthlyTrend.at(-2);
  const alerts: FinancialAlert[] = [];

  if (latest && prior && prior.expenses > 0) {
    const latestPayroll = monthlyCategorySpend(data.expenseRecords, latest.month, "Payroll");
    const priorPayroll = monthlyCategorySpend(data.expenseRecords, prior.month, "Payroll");
    if (priorPayroll > 0) {
      const payrollChange = ((latestPayroll - priorPayroll) / priorPayroll) * 100;
      if (payrollChange >= 10) {
        alerts.push({
          severity: payrollChange >= 18 ? "Concern" : "Watch",
          title: `Payroll increased ${payrollChange.toFixed(0)}% compared with last month.`,
          explanation:
            "Payroll growth is outpacing normal monthly movement and should be reviewed against revenue growth, overtime, and staffing levels.",
        });
      }
    }

    const latestFuel = monthlyCategorySpend(data.expenseRecords, latest.month, "Fuel");
    const priorFuel = monthlyCategorySpend(data.expenseRecords, prior.month, "Fuel");
    const revenueGrowth =
      prior.revenue === 0 ? 0 : ((latest.revenue - prior.revenue) / prior.revenue) * 100;
    const fuelGrowth = priorFuel === 0 ? 0 : ((latestFuel - priorFuel) / priorFuel) * 100;
    if (fuelGrowth > revenueGrowth + 5) {
      alerts.push({
        severity: fuelGrowth >= revenueGrowth + 10 ? "Concern" : "Watch",
        title: "Fuel expense is increasing faster than revenue.",
        explanation:
          "Fuel growth is putting margin pressure on the business and can erase gains from new loads if left unchecked.",
      });
    }

    const latestMaintenance = monthlyCategorySpend(data.expenseRecords, latest.month, "Maintenance");
    const priorMaintenance = monthlyCategorySpend(data.expenseRecords, prior.month, "Maintenance");
    if (priorMaintenance > 0) {
      const maintenanceChange = ((latestMaintenance - priorMaintenance) / priorMaintenance) * 100;
      if (maintenanceChange >= 20) {
        alerts.push({
          severity: maintenanceChange >= 35 ? "Critical" : "Concern",
          title: "Maintenance expenses increased significantly this month.",
          explanation:
            "A spike in maintenance spend can indicate unplanned repairs, reliability issues, or deferred maintenance catching up.",
        });
      }
    }
  }

  const softwareExpense = latest ? monthlyCategorySpend(data.expenseRecords, latest.month, "Software") : 0;
  const softwareShare = currentExpenses === 0 ? 0 : (softwareExpense / currentExpenses) * 100;
  if (softwareShare >= 7) {
    alerts.push({
      severity: softwareShare >= 10 ? "Concern" : "Information",
      title: `Software expenses represent ${softwareShare.toFixed(0)}% of operating expenses.`,
      explanation:
        "Recurring software spend compounds quickly; this is worth reviewing against dispatch, compliance, and fleet-management value.",
    });
  }

  const lastThreeMonths = monthlyTrend.slice(-3);
  if (
    lastThreeMonths.length === 3 &&
    lastThreeMonths[2].revenue < lastThreeMonths[1].revenue &&
    lastThreeMonths[1].revenue < lastThreeMonths[0].revenue
  ) {
    alerts.push({
      severity: "Critical",
      title: "Revenue decreased for two consecutive months.",
      explanation:
        "A sustained revenue slide increases burn risk and should be reviewed alongside load mix, equipment utilization, and customer demand.",
    });
  }

  if (currentRevenue < currentExpenses) {
    alerts.push({
      severity: "Concern",
      title: "Your current burn rate suggests additional revenue is needed.",
      explanation:
        "The current month is running below break-even, so either revenue must rise or costs must come down to restore profitability.",
    });
  }

  return alerts.slice(0, 6);
}

export function generateExecutiveInsights(
  data: FinancialDataset,
  latestMonth: string,
  totalExpenses: number,
  totalRevenue: number,
  expenseByCategory: Array<{ label: string; amount: number }>,
) {
  const topThree = expenseByCategory.slice(0, 3);
  const payroll = monthlyCategorySpend(data.expenseRecords, latestMonth, "Payroll");
  const priorRevenue = monthlySpend(data.revenueRecords, offsetMonth(latestMonth, -1));
  const priorExpenses = monthlySpend(data.expenseRecords, offsetMonth(latestMonth, -1));
  const revenueGrowth = priorRevenue === 0 ? 0 : ((totalRevenue - priorRevenue) / priorRevenue) * 100;
  const expenseGrowth = priorExpenses === 0 ? 0 : ((totalExpenses - priorExpenses) / priorExpenses) * 100;
  const recurringSavings = detectRecurringExpenses(data.expenseRecords, latestMonth)
    .filter((expense) => expense.status !== "Essential")
    .reduce((total, expense) => total + expense.monthlyCost, 0);

  return [
    topThree.length > 0
      ? `Your three largest expenses this month are ${topThree.map((item) => item.label).join(", ")}.`
      : "Add expense records to start seeing largest-cost insights.",
    totalExpenses === 0
      ? "Payroll share will appear once expenses are loaded."
      : `Payroll represents ${formatPercent((payroll / totalExpenses) * 100)} of total operating expenses.`,
    `Revenue changed ${formatPercent(revenueGrowth)} while expenses changed ${formatPercent(
      expenseGrowth,
    )} versus the prior month.`,
    `Reducing recurring expenses by ${formatCurrency(
      recurringSavings,
    )} per month would lower the break-even revenue requirement by the same amount.`,
  ];
}

function buildForecasts(monthlyTrend: MonthlyTrendPoint[]) {
  const averageRevenue =
    monthlyTrend.length === 0
      ? 0
      : monthlyTrend.reduce((sum, month) => sum + month.revenue, 0) / monthlyTrend.length;
  const averageExpenses =
    monthlyTrend.length === 0
      ? 0
      : monthlyTrend.reduce((sum, month) => sum + month.expenses, 0) / monthlyTrend.length;
  const averageProfit = averageRevenue - averageExpenses;

  return [
    { label: "Next month", revenue: averageRevenue, expenses: averageExpenses, profit: averageProfit },
    { label: "3 months", revenue: averageRevenue * 3, expenses: averageExpenses * 3, profit: averageProfit * 3 },
    { label: "6 months", revenue: averageRevenue * 6, expenses: averageExpenses * 6, profit: averageProfit * 6 },
    { label: "12 months", revenue: averageRevenue * 12, expenses: averageExpenses * 12, profit: averageProfit * 12 },
  ];
}

function monthlySpend(records: Array<{ date: string; amount: number }>, month: string) {
  return sumAmounts(records.filter((record) => toMonthKey(record.date) === month));
}

function monthlyCategorySpend(records: ExpenseRecord[], month: string, category: string) {
  return sumAmounts(
    records.filter((record) => toMonthKey(record.date) === month && record.category === category),
  );
}

function offsetMonth(month: string, delta: number) {
  const date = new Date(`${month}-01T00:00:00`);
  date.setMonth(date.getMonth() + delta);
  return date.toISOString().slice(0, 7);
}

function detectRecurringExpenses(records: ExpenseRecord[], latestMonth: string) {
  const grouped = records.reduce<Record<string, ExpenseRecord[]>>((accumulator, record) => {
    accumulator[record.vendor] = [...(accumulator[record.vendor] ?? []), record];
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([vendor, vendorRecords]) => {
      const recentRecords = vendorRecords
        .filter((record) => toMonthKey(record.date) <= latestMonth)
        .sort((left, right) => left.date.localeCompare(right.date));
      const uniqueMonths = new Set(recentRecords.map((record) => toMonthKey(record.date)));
      if (uniqueMonths.size < recurringDetectionThreshold) {
        return null;
      }

      const monthlyCost = recentRecords.reduce((sum, record) => sum + record.amount, 0) / uniqueMonths.size;
      return {
        vendor,
        monthlyCost,
        annualizedCost: monthlyCost * 12,
        category: recentRecords.at(-1)?.category ?? "Other",
        lastPayment: recentRecords.at(-1)?.date ?? latestMonth,
        nextExpectedPayment: offsetMonth(toMonthKey(recentRecords.at(-1)?.date ?? latestMonth), 1),
        status: recentRecords.at(-1)?.fixed ? "Essential" : "Under Review",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => right.monthlyCost - left.monthlyCost)
    .slice(0, 6);
}

export function calculateScenario(data: FinancialDataset, adjustments: ScenarioAdjustments) {
  const summary = calculateFinancialSummary(data);
  const expenseAdjustments: Record<string, number> = {
    Payroll: adjustments.payrollChangePct,
    Benefits: adjustments.payrollChangePct,
    Fuel: adjustments.fuelChangePct,
    Insurance: adjustments.insuranceChangePct,
    Maintenance: adjustments.maintenanceChangePct,
    Software: adjustments.softwareChangePct,
  };

  const adjustedRevenue = summary.totalRevenue * (1 + adjustments.revenueChangePct / 100);
  const adjustedExpenses = data.expenseRecords
    .filter((record) => toMonthKey(record.date) === summary.latestMonth)
    .reduce((total, record) => {
      const pct = expenseAdjustments[record.category] ?? 0;
      return total + record.amount * (1 + pct / 100);
    }, 0);

  const profit = adjustedRevenue - adjustedExpenses;
  return {
    revenue: adjustedRevenue,
    expenses: adjustedExpenses,
    profit,
    profitMargin: adjustedRevenue === 0 ? 0 : (profit / adjustedRevenue) * 100,
    breakEvenPoint: adjustedExpenses,
    monthlyCashFlow: profit,
  };
}

export function parseCsv(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/).filter(Boolean);
  if (!headerLine) {
    return [];
  }

  const headers = headerLine.split(",").map((header) => header.trim());
  return lines.map<ImportPreviewRow>((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce<ImportPreviewRow>((accumulator, header, index) => {
      accumulator[header] = values[index] ?? "";
      return accumulator;
    }, {});
  });
}

export function buildImportReview(
  rows: ImportPreviewRow[],
  vendorRules: VendorRule[],
  existingExpenses: ExpenseRecord[],
) {
  return rows.map<ImportReviewItem>((row, index) => {
    const amount = Number(row.Amount ?? row.amount ?? 0);
    const description = row.Description ?? row.description ?? "";
    const payee = row.Vendor ?? row.vendor ?? row.Customer ?? row.customer ?? description;
    const rule = vendorRules.find((candidate) =>
      `${payee} ${description}`.toLowerCase().includes(candidate.matchText.toLowerCase()),
    );
    const transactionId = row.TransactionID ?? row.transactionId ?? "";
    const date = row.Date ?? row.date ?? "";
    const duplicate = existingExpenses.some(
      (expense) =>
        (transactionId && expense.transactionId === transactionId) ||
        (expense.date === date &&
          expense.amount === Math.abs(amount) &&
          expense.description.toLowerCase() === description.toLowerCase()),
    );

    return {
      rowNumber: index + 1,
      transactionType: amount >= 0 ? "Revenue" : "Expense",
      vendorOrCustomer: payee,
      amount: Math.abs(amount),
      categorySuggestion: rule?.category ?? (amount >= 0 ? "Other Revenue" : "Needs review"),
      duplicate,
      requiresReview: !rule || !date || amount === 0,
    };
  });
}
