-- ============================================================
-- RISE AND SHINE — PORTAL DATABASE SETUP
-- Paste this whole file into Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. BRANCHES ---------------------------------------------------
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

insert into branches (name) values
  ('Branch One'),
  ('Branch Two'),
  ('Branch Three');

-- 2. PROFILES (one row per staff member: their role + branch) --
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'head_teacher' check (role in ('head_teacher','proprietor')),
  branch_id uuid references branches(id),
  created_at timestamptz default now()
);

-- Automatically create a profile row whenever a new staff account is created.
-- Defaults to head_teacher with no branch — the proprietor assigns the real
-- role and branch afterwards in Table Editor (see README step 4).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'head_teacher');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. PAYMENT RECORDS (one row per pupil, per item paid for) -----
create table if not exists payment_records (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) not null,
  pupil_name text not null,
  class text,
  item text not null,
  amount numeric not null default 0,
  status text not null default 'due' check (status in ('paid','partial','due')),
  added_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- 4. ROW LEVEL SECURITY — this is what actually enforces the rules
-- ============================================================
alter table branches enable row level security;
alter table profiles enable row level security;
alter table payment_records enable row level security;

-- BRANCHES: any signed-in staff member can see the branch list.
create policy "branches_select_all_staff"
  on branches for select
  using (auth.uid() is not null);

-- PROFILES: you can see your own profile; the proprietor can see everyone's.
create policy "profiles_select_own_or_proprietor"
  on profiles for select
  using (
    id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'proprietor')
  );

-- PROFILES: only the proprietor can change someone's role/branch assignment.
create policy "profiles_update_proprietor_only"
  on profiles for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'proprietor'));

-- PAYMENT RECORDS: head teachers see only their branch; proprietor sees all.
create policy "payments_select_scoped"
  on payment_records for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.role = 'proprietor' or p.branch_id = payment_records.branch_id)
    )
  );

-- PAYMENT RECORDS: head teachers can only add records for THEIR OWN branch.
-- The proprietor can add for any branch.
create policy "payments_insert_scoped"
  on payment_records for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.role = 'proprietor' or p.branch_id = payment_records.branch_id)
    )
  );

-- PAYMENT RECORDS: only the proprietor can edit a record after it is saved.
create policy "payments_update_proprietor_only"
  on payment_records for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'proprietor'));

-- PAYMENT RECORDS: only the proprietor can delete a record.
create policy "payments_delete_proprietor_only"
  on payment_records for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'proprietor'));

-- ============================================================
-- Done. Next: Authentication → Users → invite yourself and your
-- head teachers (see README.md, Step 4).
-- ============================================================
