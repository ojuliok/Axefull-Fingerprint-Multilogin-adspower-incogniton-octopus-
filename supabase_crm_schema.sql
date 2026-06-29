-- Axefull CRM Pipeline Schema (Based on Monday.com reverse engineering)

-- 1. Pipelines
create table if not exists pipelines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name varchar(120) not null,
  code varchar(60) not null,
  is_default boolean not null default false,
  currency varchar(10) not null default 'BRL',
  created_at timestamptz not null default now()
);

-- 2. Pipeline Stages
create table if not exists pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  name varchar(80) not null,
  slug varchar(80) not null,
  position int not null,
  color varchar(20),
  win_probability_default numeric(5,2) default 0,
  is_open boolean not null default true,
  is_won boolean not null default false,
  is_lost boolean not null default false
);

-- 3. Accounts
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name varchar(180) not null,
  industry varchar(120),
  website varchar(255),
  created_at timestamptz not null default now()
);

-- 4. Contacts
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  name varchar(180) not null,
  email varchar(180),
  phone varchar(40),
  job_title varchar(120),
  created_at timestamptz not null default now()
);

-- 5. Deals
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  stage_id uuid not null references pipeline_stages(id),
  account_id uuid references accounts(id) on delete set null,
  primary_contact_id uuid references contacts(id) on delete set null,
  title varchar(180) not null,
  description text,
  deal_value numeric(14,2) not null default 0,
  close_probability numeric(5,2) not null default 0,
  forecast_value numeric(14,2) not null default 0,
  expected_close_date date,
  status varchar(30) not null default 'open',
  source varchar(60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

-- 6. Deal Contacts
create table if not exists deal_contacts (
  deal_id uuid not null references deals(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  role varchar(60),
  is_primary boolean not null default false,
  primary key (deal_id, contact_id)
);

-- 7. Activities
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid references deals(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  account_id uuid references accounts(id) on delete cascade,
  type varchar(30) not null,
  subject varchar(180),
  body text,
  due_at timestamptz,
  done_at timestamptz,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 8. Deal Stage History
create table if not exists deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  from_stage_id uuid references pipeline_stages(id),
  to_stage_id uuid not null references pipeline_stages(id),
  moved_by uuid references auth.users(id),
  moved_at timestamptz not null default now(),
  reason text
);

-- Indexes
create index if not exists idx_deals_pipeline_stage on deals(pipeline_id, stage_id);
create index if not exists idx_deals_owner on deals(owner_id);
create index if not exists idx_deals_expected_close_date on deals(expected_close_date);
create index if not exists idx_activities_deal on activities(deal_id);

-- RLS (Row Level Security) Setup
alter table pipelines enable row level security;
alter table pipeline_stages enable row level security;
alter table accounts enable row level security;
alter table contacts enable row level security;
alter table deals enable row level security;
alter table deal_contacts enable row level security;
alter table activities enable row level security;
alter table deal_stage_history enable row level security;

-- RLS Policies (Owner only access)
create policy "Users can manage their own pipelines" on pipelines for all using (auth.uid() = owner_id);
create policy "Users can manage their own pipeline_stages" on pipeline_stages for all using (
  exists (select 1 from pipelines p where p.id = pipeline_id and p.owner_id = auth.uid())
);
create policy "Users can manage their own accounts" on accounts for all using (auth.uid() = owner_id);
create policy "Users can manage their own contacts" on contacts for all using (auth.uid() = owner_id);
create policy "Users can manage their own deals" on deals for all using (auth.uid() = owner_id);
create policy "Users can manage their own deal_contacts" on deal_contacts for all using (
  exists (select 1 from deals d where d.id = deal_id and d.owner_id = auth.uid())
);
create policy "Users can manage their own activities" on activities for all using (auth.uid() = owner_id);
create policy "Users can manage their own deal history" on deal_stage_history for all using (
  exists (select 1 from deals d where d.id = deal_id and d.owner_id = auth.uid())
);
