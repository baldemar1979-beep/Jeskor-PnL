create table if not exists users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('Owner', 'Administrator', 'Accountant', 'Bookkeeper', 'View Only')),
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key,
  name text not null,
  account_type text not null,
  institution text,
  external_provider text,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key,
  name text not null unique,
  category_type text not null check (category_type in ('revenue', 'expense'))
);

create table if not exists vendors (
  id uuid primary key,
  name text not null unique,
  default_category_id uuid references categories(id)
);

create table if not exists drivers (
  id uuid primary key,
  name text not null
);

create table if not exists trucks (
  id uuid primary key,
  number text not null unique
);

create table if not exists transactions (
  id uuid primary key,
  transaction_date date not null,
  counterparty text not null,
  description text not null,
  amount numeric(12,2) not null,
  category_id uuid references categories(id),
  account_id uuid references accounts(id),
  source text not null,
  source_transaction_id text,
  is_revenue boolean not null default false,
  is_recurring boolean not null default false,
  is_fixed boolean not null default false,
  is_personal boolean not null default false,
  is_reimbursement boolean not null default false,
  excluded_from_profitability boolean not null default false,
  truck_id uuid references trucks(id),
  driver_id uuid references drivers(id),
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, source_transaction_id)
);

create table if not exists revenue_records (
  transaction_id uuid primary key references transactions(id) on delete cascade,
  invoice_number text
);

create table if not exists expense_records (
  transaction_id uuid primary key references transactions(id) on delete cascade,
  payment_account text
);

create table if not exists vendor_rules (
  id uuid primary key,
  vendor_id uuid references vendors(id),
  match_text text not null,
  category_id uuid references categories(id),
  auto_apply boolean not null default true
);

create table if not exists imports (
  id uuid primary key,
  file_name text not null,
  imported_at timestamptz not null default now(),
  transaction_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  duplicate_count integer not null default 0,
  review_count integer not null default 0
);

create table if not exists payroll_imports (
  id uuid primary key,
  import_id uuid references imports(id) on delete cascade,
  gross_payroll numeric(12,2) not null default 0,
  overtime numeric(12,2) not null default 0,
  employer_taxes numeric(12,2) not null default 0,
  benefits numeric(12,2) not null default 0,
  processing_fees numeric(12,2) not null default 0
);

create table if not exists budgets (
  id uuid primary key,
  budget_month date not null,
  category_id uuid references categories(id),
  amount numeric(12,2) not null
);

create table if not exists scenarios (
  id uuid primary key,
  name text not null,
  assumptions jsonb not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists financial_alerts (
  id uuid primary key,
  severity text not null,
  title text not null,
  explanation text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key,
  table_name text not null,
  record_id uuid not null,
  action text not null,
  changed_by uuid references users(id),
  changed_at timestamptz not null default now(),
  before_state jsonb,
  after_state jsonb
);
