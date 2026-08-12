import Link from "next/link";
import { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/revenue", label: "Revenue" },
  { href: "/expenses", label: "Expenses" },
  { href: "/imports", label: "Imports" },
  { href: "/break-even", label: "Break-Even" },
  { href: "/scenarios", label: "What-If" },
];

export function AppShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                <p className="max-w-3xl text-sm text-slate-600">
                  A plain-English financial command center focused on Phase 1 visibility: revenue,
                  expenses, profitability, imports, and break-even.
                </p>
              </div>
              <nav className="flex flex-wrap gap-2">
                {navigation.map((item) => (
                  <Link
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8">{children}</main>
    </div>
  );
}
