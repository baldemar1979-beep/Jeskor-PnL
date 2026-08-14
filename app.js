const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const state = {
  transactions: [],
  filteredTransactions: [],
  incomePlans: [],
};

const subscriptionKeywords = ["indeed", "adobe", "openphone", "fleetio", "facebook", "meta"];

export function parseCsv(text) {
  const rows = [];
  let currentField = "";
  let currentRow = [];
  let inQuotes = false;

  const pushField = () => {
    currentRow.push(currentField);
    currentField = "";
  };

  const pushRow = () => {
    if (currentRow.some((value) => value.trim() !== "")) {
      rows.push(currentRow);
    }

    currentRow = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      pushField();
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      pushField();
      pushRow();
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    pushField();
    pushRow();
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());

  return rows
    .slice(1)
    .map((row) =>
      headers.reduce((record, header, headerIndex) => {
        record[header] = (row[headerIndex] ?? "").trim();
        return record;
      }, {}),
    )
    .filter((row) => Object.values(row).some((value) => value !== ""));
}

export function parseAmount(value) {
  const normalized = String(value ?? "")
    .replace(/[$,\s]/g, "")
    .replace(/^\((.*)\)$/, "-$1");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export function toIsoDate(value) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const [month, day, year] = value.split("/");
  if (!month || !day || !year) {
    return "";
  }

  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeCategory(category) {
  return titleCase(String(category || "Uncategorized").replace(/[&/]+/g, " & ").replace(/\s+/g, " ").trim());
}

export function normalizeDescription(description) {
  return String(description || "Unknown Merchant")
    .toUpperCase()
    .replace(/&AMP;/g, "&")
    .replace(/[*#]+/g, " ")
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/\s+-\s+.*/g, "")
    .replace(/[^\w& ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTransaction(row, index = 0) {
  const description = row.Description || "";
  const amount = parseAmount(row.Amount);
  const type = row.Type?.trim() || "Unknown";
  const date = toIsoDate(row["Transaction Date"] || row["Post Date"]);
  const merchant = normalizeDescription(description);
  const isPaymentTransfer = description.toLowerCase().includes("payment thank you");
  const isIncome = type.toLowerCase() === "return" || amount > 0;

  return {
    id: `${date || "missing-date"}-${merchant || "merchant"}-${index}`,
    card: row.Card || "",
    transactionDate: date,
    postDate: toIsoDate(row["Post Date"]),
    description,
    merchant,
    category: normalizeCategory(row.Category),
    type,
    amount,
    memo: row.Memo || "",
    isPaymentTransfer,
    isIncome,
  };
}

export function filterTransactions(transactions, filters = {}) {
  return transactions.filter((transaction) => {
    const matchesCategory = !filters.category || transaction.category === filters.category;
    const matchesStart = !filters.startDate || transaction.transactionDate >= filters.startDate;
    const matchesEnd = !filters.endDate || transaction.transactionDate <= filters.endDate;
    return matchesCategory && matchesStart && matchesEnd;
  });
}

function analysisTransactions(transactions) {
  return transactions.filter((transaction) => !transaction.isPaymentTransfer);
}

export function calculateDashboardMetrics(transactions) {
  const relevantTransactions = analysisTransactions(transactions);

  const totals = relevantTransactions.reduce(
    (summary, transaction) => {
      summary.netCashflow += transaction.amount;

      if (transaction.amount < 0) {
        summary.totalExpenses += Math.abs(transaction.amount);
      } else if (transaction.isIncome || transaction.amount > 0) {
        summary.totalIncome += transaction.amount;
      }

      return summary;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      netCashflow: 0,
      transactionCount: relevantTransactions.length,
    },
  );

  return totals;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function summarizeByCategory(transactions) {
  const summaryMap = new Map();

  for (const transaction of analysisTransactions(transactions)) {
    const current = summaryMap.get(transaction.category) ?? { category: transaction.category, total: 0, count: 0 };
    current.total += transaction.amount;
    current.count += 1;
    summaryMap.set(transaction.category, current);
  }

  return [...summaryMap.values()].sort((left, right) => Math.abs(right.total) - Math.abs(left.total));
}

export function summarizeByMerchant(transactions) {
  const summaryMap = new Map();

  for (const transaction of analysisTransactions(transactions)) {
    if (transaction.amount >= 0) {
      continue;
    }

    const current = summaryMap.get(transaction.merchant) ?? { merchant: transaction.merchant, spend: 0, count: 0 };
    current.spend += Math.abs(transaction.amount);
    current.count += 1;
    summaryMap.set(transaction.merchant, current);
  }

  return [...summaryMap.values()].sort((left, right) => right.spend - left.spend);
}

function average(numbers) {
  if (numbers.length === 0) {
    return 0;
  }

  return numbers.reduce((total, number) => total + number, 0) / numbers.length;
}

function diffInDays(leftDate, rightDate) {
  const left = new Date(leftDate);
  const right = new Date(rightDate);
  return Math.round((right.getTime() - left.getTime()) / 86400000);
}

export function detectRecurringExpenses(transactions) {
  const merchantGroups = new Map();

  for (const transaction of analysisTransactions(transactions)) {
    if (transaction.amount >= 0) {
      continue;
    }

    const group = merchantGroups.get(transaction.merchant) ?? [];
    group.push(transaction);
    merchantGroups.set(transaction.merchant, group);
  }

  return [...merchantGroups.entries()]
    .map(([merchant, merchantTransactions]) => {
      const sorted = [...merchantTransactions].sort((left, right) =>
        left.transactionDate.localeCompare(right.transactionDate),
      );
      const intervals = [];

      for (let index = 1; index < sorted.length; index += 1) {
        intervals.push(diffInDays(sorted[index - 1].transactionDate, sorted[index].transactionDate));
      }

      const avgInterval = average(intervals);
      const monthlyish = avgInterval >= 20 && avgInterval <= 40;
      const weeklyish = avgInterval >= 5 && avgInterval <= 9;

      if (sorted.length < 2 || (!monthlyish && !weeklyish)) {
        return null;
      }

      const avgAmount = average(sorted.map((transaction) => Math.abs(transaction.amount)));
      const confidence =
        sorted.length >= 4 ? "High" : monthlyish && sorted.length >= 3 ? "Medium" : weeklyish ? "Medium" : "Low";

      return {
        merchant,
        count: sorted.length,
        avgAmount,
        avgIntervalDays: avgInterval,
        confidence,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.count - left.count || right.avgAmount - left.avgAmount);
}

export function calculateWeightedIncomeTotal(entries) {
  return entries.reduce((total, entry) => total + (entry.amount * entry.probability) / 100, 0);
}

export function calculatePayrollPlan({ payrollAmount, payrollTaxPercent, cashOnHand }) {
  const obligation = payrollAmount + payrollAmount * (payrollTaxPercent / 100);
  const coverageRatio = obligation > 0 ? cashOnHand / obligation : 0;
  const cashRemaining = cashOnHand - obligation;

  return { obligation, coverageRatio, cashRemaining };
}

export function buildExpenseInsights(transactions, recurringCandidates, payrollPlan) {
  const insights = [];
  const merchants = summarizeByMerchant(transactions);
  const mealMerchants = merchants
    .filter((merchant) =>
      analysisTransactions(transactions).some(
        (transaction) =>
          transaction.merchant === merchant.merchant &&
          /food|meal|restaurant|coffee|drink/i.test(transaction.category),
      ),
    )
    .slice(0, 3);

  if (mealMerchants.length > 0) {
    insights.push(
      `Review meal and food spend at ${mealMerchants
        .map((merchant) => `${merchant.merchant} (${currencyFormatter.format(merchant.spend)})`)
        .join(", ")}.`,
    );
  }

  const keywordMatches = merchants.filter((merchant) =>
    subscriptionKeywords.some((keyword) => merchant.merchant.toLowerCase().includes(keyword)),
  );

  if (keywordMatches.length > 0) {
    insights.push(
      `Audit likely subscriptions or ad tools: ${keywordMatches.map((merchant) => merchant.merchant).join(", ")}.`,
    );
  }

  if (recurringCandidates.length > 0) {
    insights.push(
      `Budget for ${recurringCandidates.length} likely recurring merchants before discretionary spend each week.`,
    );
  }

  if (payrollPlan.coverageRatio > 0 && payrollPlan.coverageRatio < 1) {
    insights.push("Current cash does not fully cover the next payroll obligation. Prioritize collections before payday.");
  }

  if (insights.length === 0) {
    insights.push("No major reduction flags yet. Upload more history or adjust filters for sharper recommendations.");
  }

  return insights;
}

export function buildDailyNetCashflow(transactions) {
  const grouped = new Map();

  for (const transaction of analysisTransactions(transactions)) {
    grouped.set(transaction.transactionDate, (grouped.get(transaction.transactionDate) ?? 0) + transaction.amount);
  }

  return [...grouped.entries()]
    .map(([date, total]) => ({ date, total }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

function setTextContent(id, value, className = "") {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.textContent = value;
  element.classList.remove("positive", "negative");
  if (className) {
    element.classList.add(className);
  }
}

function fillTableBody(bodyId, rowsMarkup, emptyMessage, colspan) {
  const body = document.getElementById(bodyId);
  if (!body) {
    return;
  }

  body.innerHTML =
    rowsMarkup.length > 0
      ? rowsMarkup.join("")
      : `<tr><td colspan="${colspan}" class="empty-state">${emptyMessage}</td></tr>`;
}

function createBarChartMarkup(data, maxValue) {
  const width = 520;
  const leftPad = 150;
  const topPad = 24;
  const rowHeight = 42;
  const barArea = width - leftPad - 24;
  const height = topPad + data.length * rowHeight + 20;

  const bars = data
    .map((item, index) => {
      const y = topPad + index * rowHeight;
      const barWidth = maxValue === 0 ? 0 : (item.value / maxValue) * barArea;

      return `
        <text class="chart-label" x="0" y="${y + 18}">${escapeHtml(item.label)}</text>
        <rect class="bar-fill" x="${leftPad}" y="${y}" width="${barWidth}" height="18" rx="9"></rect>
        <text class="chart-label" x="${leftPad + barWidth + 8}" y="${y + 14}">${formatCurrency(item.value)}</text>
      `;
    })
    .join("");

  return `<svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Category spend bar chart">${bars}</svg>`;
}

function createLineChartMarkup(data) {
  const width = 540;
  const height = 280;
  const padding = 40;
  const minValue = Math.min(...data.map((point) => point.total), 0);
  const maxValue = Math.max(...data.map((point) => point.total), 0);
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - ((point.total - minValue) / range) * (height - padding * 2);
    return { ...point, x, y };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const zeroY = height - padding - ((0 - minValue) / range) * (height - padding * 2);
  const labels = points
    .map(
      (point) => `
        <circle class="line-point" cx="${point.x}" cy="${point.y}" r="4"></circle>
        <text class="chart-label" x="${point.x - 24}" y="${height - 10}">${point.date.slice(5)}</text>
      `,
    )
    .join("");

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily net cashflow line chart">
      <line x1="${padding}" y1="${zeroY}" x2="${width - padding}" y2="${zeroY}" stroke="#d7deea" stroke-width="2"></line>
      <path class="line-stroke" d="${path}"></path>
      ${labels}
      <text class="chart-label" x="${padding}" y="20">${formatCurrency(maxValue)}</text>
      <text class="chart-label" x="${padding}" y="${height - padding + 16}">${formatCurrency(minValue)}</text>
    </svg>
  `;
}

function renderCharts(transactions) {
  const categoryChart = document.getElementById("categoryChart");
  const dailyChart = document.getElementById("dailyChart");

  if (!categoryChart || !dailyChart) {
    return;
  }

  const categoryData = summarizeByCategory(transactions)
    .filter((item) => item.total < 0)
    .slice(0, 6)
    .map((item) => ({ label: item.category, value: Math.abs(item.total) }));

  if (categoryData.length === 0) {
    categoryChart.classList.add("empty-state");
    categoryChart.textContent = "No expense category data available for this filter.";
  } else {
    categoryChart.classList.remove("empty-state");
    categoryChart.innerHTML = createBarChartMarkup(
      categoryData,
      Math.max(...categoryData.map((item) => item.value), 0),
    );
  }

  const dailyData = buildDailyNetCashflow(transactions);
  if (dailyData.length === 0) {
    dailyChart.classList.add("empty-state");
    dailyChart.textContent = "No daily cashflow data available for this filter.";
  } else {
    dailyChart.classList.remove("empty-state");
    dailyChart.innerHTML = createLineChartMarkup(dailyData);
  }
}

function renderDashboard() {
  const metrics = calculateDashboardMetrics(state.filteredTransactions);
  setTextContent("totalExpenses", formatCurrency(metrics.totalExpenses));
  setTextContent("totalIncome", formatCurrency(metrics.totalIncome), metrics.totalIncome >= 0 ? "positive" : "");
  setTextContent("netCashflow", formatCurrency(metrics.netCashflow), metrics.netCashflow >= 0 ? "positive" : "negative");
  setTextContent("transactionCount", String(state.filteredTransactions.length));

  fillTableBody(
    "categorySummaryBody",
    summarizeByCategory(state.filteredTransactions).map(
      (item) =>
        `<tr><td>${escapeHtml(item.category)}</td><td>${formatCurrency(item.total)}</td><td>${item.count}</td></tr>`,
    ),
    "No category totals for the current filter.",
    3,
  );

  fillTableBody(
    "merchantSummaryBody",
    summarizeByMerchant(state.filteredTransactions)
      .slice(0, 12)
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.merchant)}</td><td>${formatCurrency(item.spend)}</td><td>${item.count}</td></tr>`,
      ),
    "No merchant spend for the current filter.",
    3,
  );

  const recurringCandidates = detectRecurringExpenses(state.filteredTransactions);
  fillTableBody(
    "recurringBody",
    recurringCandidates.map(
      (item) =>
        `<tr><td>${escapeHtml(item.merchant)}</td><td>${item.count}</td><td>${formatCurrency(
          item.avgAmount,
        )}</td><td>${item.avgIntervalDays.toFixed(1)} days</td><td><span class="tag">${item.confidence}</span></td></tr>`,
    ),
    "No recurring candidates for the current filter.",
    5,
  );

  const payrollPlan = readPayrollPlan();
  const insights = buildExpenseInsights(state.filteredTransactions, recurringCandidates, payrollPlan);
  const insightsList = document.getElementById("insightsList");
  if (insightsList) {
    insightsList.innerHTML = insights.map((insight) => `<li>${escapeHtml(insight)}</li>`).join("");
  }

  fillTableBody(
    "transactionsBody",
    state.filteredTransactions.map((transaction) => {
      const typeLabel = transaction.isPaymentTransfer
        ? `<span class="tag">Transfer excluded</span>`
        : escapeHtml(transaction.type);

      return `<tr>
        <td>${transaction.transactionDate || "—"}</td>
        <td>${escapeHtml(transaction.description)}</td>
        <td>${escapeHtml(transaction.category)}</td>
        <td>${typeLabel}</td>
        <td class="${transaction.amount >= 0 ? "positive" : "negative"}">${formatCurrency(transaction.amount)}</td>
      </tr>`;
    }),
    "No transactions match the current filter.",
    5,
  );

  renderCharts(state.filteredTransactions);
}

function renderIncomePlanner() {
  fillTableBody(
    "incomePlannerBody",
    state.incomePlans.map(
      (entry) => `<tr>
        <td>${escapeHtml(entry.client)}</td>
        <td>${entry.expectedDate}</td>
        <td>${formatCurrency(entry.amount)}</td>
        <td>${entry.probability}%</td>
        <td>${formatCurrency((entry.amount * entry.probability) / 100)}</td>
      </tr>`,
    ),
    "No expected payments added yet.",
    5,
  );

  setTextContent("weightedIncomeTotal", formatCurrency(calculateWeightedIncomeTotal(state.incomePlans)));
}

function readFilters() {
  return {
    category: document.getElementById("categoryFilter")?.value || "",
    startDate: document.getElementById("startDateFilter")?.value || "",
    endDate: document.getElementById("endDateFilter")?.value || "",
  };
}

function readPayrollPlan() {
  const payrollPlan = calculatePayrollPlan({
    payrollAmount: parseAmount(document.getElementById("payrollAmount")?.value || 0),
    payrollTaxPercent: parseAmount(document.getElementById("payrollTaxPercent")?.value || 0),
    cashOnHand: parseAmount(document.getElementById("cashOnHand")?.value || 0),
  });

  setTextContent("payrollObligation", formatCurrency(payrollPlan.obligation));
  setTextContent("coverageRatio", `${payrollPlan.coverageRatio.toFixed(2)}x`);
  setTextContent("cashRemaining", formatCurrency(payrollPlan.cashRemaining), payrollPlan.cashRemaining >= 0 ? "positive" : "negative");

  return payrollPlan;
}

function populateCategoryFilter(transactions) {
  const select = document.getElementById("categoryFilter");
  if (!select) {
    return;
  }

  const selectedValue = select.value;
  const categories = [...new Set(transactions.map((transaction) => transaction.category))].sort((left, right) =>
    left.localeCompare(right),
  );
  select.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All categories";
  select.append(allOption);

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.append(option);
  }

  select.value = categories.includes(selectedValue) ? selectedValue : "";
}

function applyFiltersAndRender() {
  state.filteredTransactions = filterTransactions(state.transactions, readFilters());
  readPayrollPlan();
  renderIncomePlanner();
  renderDashboard();
}

function handleCsvUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const rawRows = parseCsv(String(reader.result ?? ""));
    state.transactions = rawRows.map(normalizeTransaction).filter((transaction) => transaction.transactionDate);
    populateCategoryFilter(state.transactions);
    const uploadStatus = document.getElementById("uploadStatus");
    if (uploadStatus) {
      uploadStatus.textContent = `Loaded ${state.transactions.length} transactions from ${file.name}.`;
    }
    applyFiltersAndRender();
  };
  reader.readAsText(file);
}

function handleIncomePlannerSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  state.incomePlans.push({
    client: String(formData.get("client") || "").trim(),
    amount: parseAmount(formData.get("amount")),
    expectedDate: String(formData.get("date") || ""),
    probability: Math.min(100, Math.max(0, parseAmount(formData.get("probability")))),
  });
  form.reset();
  const probabilityInput = document.getElementById("incomeProbability");
  if (probabilityInput) {
    probabilityInput.value = "100";
  }
  renderIncomePlanner();
}

function initApp() {
  document.getElementById("csvFileInput")?.addEventListener("change", handleCsvUpload);
  document.getElementById("incomePlannerForm")?.addEventListener("submit", handleIncomePlannerSubmit);
  document.getElementById("categoryFilter")?.addEventListener("change", applyFiltersAndRender);
  document.getElementById("startDateFilter")?.addEventListener("change", applyFiltersAndRender);
  document.getElementById("endDateFilter")?.addEventListener("change", applyFiltersAndRender);
  document.getElementById("payrollAmount")?.addEventListener("input", applyFiltersAndRender);
  document.getElementById("payrollTaxPercent")?.addEventListener("input", applyFiltersAndRender);
  document.getElementById("cashOnHand")?.addEventListener("input", applyFiltersAndRender);
  document.getElementById("clearFiltersButton")?.addEventListener("click", () => {
    const categoryFilter = document.getElementById("categoryFilter");
    const startDateFilter = document.getElementById("startDateFilter");
    const endDateFilter = document.getElementById("endDateFilter");

    if (categoryFilter) categoryFilter.value = "";
    if (startDateFilter) startDateFilter.value = "";
    if (endDateFilter) endDateFilter.value = "";
    applyFiltersAndRender();
  });

  readPayrollPlan();
  renderIncomePlanner();
}

if (typeof document !== "undefined") {
  initApp();
}
