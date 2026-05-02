# Family Budget

Next.js app for shared household budgeting with monthly plans, actual transactions, pockets, and plan-vs-fact analytics.

## Supabase sync (shared updates for both users)

The app can now sync state through Supabase in addition to localStorage.  
If Supabase env vars are configured, changes made by one user are pushed to the cloud and reflected for the other user (realtime).

### 1) Create Supabase table

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.family_budget_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

insert into public.family_budget_state (id, state)
values ('shared', '{"selectedMonth":"2026-01","months":{}}'::jsonb)
on conflict (id) do nothing;
```

### 2) Enable Realtime for the table

In Supabase dashboard:
- Database -> Replication
- Turn on replication for `public.family_budget_state`

### 3) Configure env vars

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_BUDGET_ROOM=family-main
```

### 4) RLS policy (recommended)

For a private shared app, configure RLS/policies according to your auth model.  
If auth is not enabled yet, temporarily disable RLS for this table only while testing.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
