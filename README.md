# Jeskor Cashflow Calculator

Starter single-page cashflow calculator for reviewing Chase-style card exports, expected income, payroll coverage, recurring expenses, and expense reduction opportunities.

## Features

- CSV upload for Chase-style exports with safe quoted-field parsing
- Dashboard cards for expenses, income, net cashflow, and transaction count
- Filterable transaction table by category and date range
- Category summary and merchant spend summary
- Recurring expense detector for weekly-ish and monthly-ish charges
- Income planner with weighted expected income totals
- Payroll planner with payroll obligation, coverage ratio, and cash remaining
- Expense reduction insights for meals/food spend and likely subscriptions
- Inline charts for category spend and daily net cashflow

## How to run locally

This starter app is fully static and runs client-side only.

1. Open `index.html` from the repository root in a browser.
2. Upload a Chase-style CSV export.
3. Review the dashboard, summaries, planners, and insights.

You can also validate the repository with:

```bash
npm install
npm run lint
npm run test
npm run build
```

## Expected CSV format

The importer expects these headers:

```text
Card,Transaction Date,Post Date,Description,Category,Type,Amount,Memo
```

Notes:

- Quoted fields and embedded commas are supported.
- Blank lines are ignored.
- `Payment Thank You` transfers are excluded from expense-driven metrics.
- Positive amounts and `Type == Return` are treated as inflows.

## Known limitations

- Merchant normalization is rule-based and may still split some vendors into multiple names.
- Recurring detection uses simple cadence heuristics and does not inspect statement cycles.
- Income planner entries are kept in memory only and reset on refresh.
- Charts are lightweight SVG renderings meant for a starter prototype.

## Next steps for a fuller app

- Save uploads, planner rows, and user settings in localStorage or a database
- Add transaction tagging and custom merchant/category rules
- Support multiple statement/account uploads and month-over-month comparisons
- Add export, printing, and richer forecasting scenarios
