"use client";

import { useMemo, useState } from "react";

import { calculateScenario, formatCurrency, formatPercent, type FinancialDataset } from "@/lib/finance";

const controls = [
  { key: "revenueChangePct", label: "Revenue change %" },
  { key: "payrollChangePct", label: "Payroll change %" },
  { key: "fuelChangePct", label: "Fuel change %" },
  { key: "insuranceChangePct", label: "Insurance change %" },
  { key: "maintenanceChangePct", label: "Maintenance change %" },
  { key: "softwareChangePct", label: "Software change %" },
] as const;

export function ScenarioSimulator({ data }: { data: FinancialDataset }) {
  const [adjustments, setAdjustments] = useState({
    revenueChangePct: 0,
    payrollChangePct: 0,
    fuelChangePct: 0,
    insuranceChangePct: 0,
    maintenanceChangePct: 0,
    softwareChangePct: 0,
  });

  const scenario = useMemo(() => calculateScenario(data, adjustments), [adjustments, data]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {controls.map((control) => (
          <label className="block" key={control.key}>
            <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
              <span>{control.label}</span>
              <span>{adjustments[control.key]}%</span>
            </div>
            <input
              className="w-full accent-slate-900"
              max={25}
              min={-25}
              onChange={(event) =>
                setAdjustments((current) => ({
                  ...current,
                  [control.key]: Number(event.target.value),
                }))
              }
              type="range"
              value={adjustments[control.key]}
            />
          </label>
        ))}
        <button
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium hover:border-slate-900"
          onClick={() =>
            setAdjustments({
              revenueChangePct: 0,
              payrollChangePct: 0,
              fuelChangePct: 0,
              insuranceChangePct: 0,
              maintenanceChangePct: 0,
              softwareChangePct: 0,
            })
          }
          type="button"
        >
          Reset Scenario
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Scenario revenue</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(scenario.revenue)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Scenario expenses</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(scenario.expenses)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Profit / loss</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(scenario.profit)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Profit margin</p>
          <p className="mt-2 text-3xl font-semibold">{formatPercent(scenario.profitMargin)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Break-even point</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(scenario.breakEvenPoint)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Monthly cash flow</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(scenario.monthlyCashFlow)}</p>
        </div>
      </div>
    </div>
  );
}
