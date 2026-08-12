# Jeskor Financial Command Center

Phase 1 starter for a business expense, profitability, and financial forecasting application using Next.js, React, TypeScript, Tailwind CSS, and a Supabase-ready schema.

## What is included

- Executive dashboard for revenue, expenses, profit/loss, burn rate, break-even, alerts, and insights
- Revenue and expense detail screens using a transportation-oriented sample dataset
- Import workflow preview with duplicate detection and vendor-rule category suggestions
- Break-even analysis and truck/driver profitability scaffolding
- What-if scenario simulator
- Supabase/PostgreSQL schema for the core finance domain
- Targeted Vitest coverage for financial calculations and import review behavior

## Development

```bash
npm install
npm run lint
npm run test
npm run build
```

## Notes

- The app is intentionally focused on the prompt's Phase 1 goals first.
- The UI uses sample data so the financial calculations and layout can be validated before live integrations are added.
- The schema is ready for future Chase, ADP, and other secure token-based integrations without storing bank or payroll passwords.
