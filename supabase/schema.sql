-- ============================================================================
-- CareSlot AI — Database Initialization Script
-- Run this once in the SQL Editor of a BRAND NEW Supabase project
-- (Project → SQL Editor → New query → paste this whole file → Run).
-- Safe to re-run: it drops and recreates CareSlot's own tables only.
-- ============================================================================

-- Clean slate (only affects CareSlot's own tables — nothing else in the project)
drop table if exists public.medication_reminders cascade;
drop table if exists public.appointments cascade;
drop table if exists public.clinics_slots cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user cascade;

-- Extensions -----------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABLE: profiles
-- One row per authenticated user. Created automatically on signup via trigger.
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'patient' check (role in ('patient', 'doctor', 'admin')),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- SECURITY DEFINER helper: reads the caller's own role WITHOUT going through
-- RLS on `profiles` again. Referencing `public.profiles` directly inside a
-- policy on `public.profiles` itself causes infinite recursion in Postgres
-- (the policy re-triggers itself), which Supabase surfaces as a generic
-- "500 Internal Server Error" on every request touching that table (and any
-- table whose policy also references profiles, like clinics_slots and
-- appointments). This function breaks that recursion.
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "Profiles are viewable by the owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins and doctors can view all profiles"
  on public.profiles for select
  using (public.current_user_role() in ('admin', 'doctor'));

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up -----------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'patient')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- TABLE: clinics_slots
-- ============================================================================
create table if not exists public.clinics_slots (
  id             uuid primary key default uuid_generate_v4(),
  doctor_name    text not null,
  specialty      text not null,
  available_date date not null default current_date,
  time_slot      text not null,
  is_booked      boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.clinics_slots enable row level security;

create policy "Anyone authenticated can view slots"
  on public.clinics_slots for select
  using (auth.role() = 'authenticated');

create policy "Patients can book an open slot"
  on public.clinics_slots for update
  using (auth.role() = 'authenticated')
  with check (true);

create policy "Doctors and Admins manage slots"
  on public.clinics_slots for all
  using (public.current_user_role() in ('admin', 'doctor'));

-- ============================================================================
-- TABLE: appointments
-- ============================================================================
create table if not exists public.appointments (
  id                  uuid primary key default uuid_generate_v4(),
  patient_id          uuid not null references public.profiles (id) on delete cascade,
  slot_id             uuid not null references public.clinics_slots (id) on delete cascade,
  ai_symptom_summary  text,
  triage_priority     text check (triage_priority in ('Low', 'Medium', 'High')),
  status              text not null default 'Booked' check (status in ('Booked', 'Completed', 'Cancelled')),
  created_at          timestamptz not null default now()
);

alter table public.appointments enable row level security;

create policy "Patients view their own appointments"
  on public.appointments for select
  using (auth.uid() = patient_id);

create policy "Doctors and Admins view all appointments"
  on public.appointments for select
  using (public.current_user_role() in ('admin', 'doctor'));

create policy "Patients create their own appointments"
  on public.appointments for insert
  with check (auth.uid() = patient_id);

create policy "Patients update their own appointments"
  on public.appointments for update
  using (auth.uid() = patient_id);

create policy "Doctors and Admins update appointments"
  on public.appointments for update
  using (public.current_user_role() in ('admin', 'doctor'));

-- ============================================================================
-- TABLE: medication_reminders
-- ============================================================================
create table if not exists public.medication_reminders (
  id               uuid primary key default uuid_generate_v4(),
  patient_id       uuid not null references public.profiles (id) on delete cascade,
  medicine_name    text not null,
  dosage_schedule  jsonb not null default '[]'::jsonb,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

alter table public.medication_reminders enable row level security;

create policy "Patients manage their own reminders"
  on public.medication_reminders for all
  using (auth.uid() = patient_id)
  with check (auth.uid() = patient_id);

create policy "Doctors and Admins view all reminders"
  on public.medication_reminders for select
  using (public.current_user_role() in ('admin', 'doctor'));

-- ============================================================================
-- Helpful indexes
-- ============================================================================
create index if not exists idx_slots_date on public.clinics_slots (available_date);
create index if not exists idx_slots_booked on public.clinics_slots (is_booked);
create index if not exists idx_appointments_patient on public.appointments (patient_id);
create index if not exists idx_reminders_patient on public.medication_reminders (patient_id);

-- ============================================================================
-- Seed data covering all doctor specialties
-- time_slot is stored as a full ISO datetime string (date + time) so it
-- parses consistently with slots created later via the doctor dashboard.
-- ============================================================================
insert into public.clinics_slots (doctor_name, specialty, available_date, time_slot, is_booked) values
  ('Dr. Rohan Gupta',      'General Physician',  current_date,     current_date || 'T18:00:00', false),
  ('Dr. Ananya Rao',       'Dentist',            current_date + 1, (current_date + 1) || 'T10:00:00', false),
  ('Dr. Vikram Shah',      'Cardiologist',       current_date + 1, (current_date + 1) || 'T09:30:00', false),
  ('Dr. Meera Iyer',       'Dermatologist',      current_date + 1, (current_date + 1) || 'T16:00:00', false),
  ('Dr. Priya Sharma',     'Neurologist',        current_date + 1, (current_date + 1) || 'T11:30:00', false),
  ('Dr. Suresh Kumar',     'Orthopedist',        current_date + 1, (current_date + 1) || 'T15:00:00', false),
  ('Dr. Kavita Deshmukh',  'Pediatrician',       current_date,     current_date || 'T14:30:00', false),
  ('Dr. Rajesh Nambiar',   'Ophthalmologist',    current_date + 1, (current_date + 1) || 'T10:00:00', false),
  ('Dr. Sameer Sen',       'ENT Specialist',     current_date,     current_date || 'T17:00:00', false),
  ('Dr. Sunita Kulkarni',  'Psychiatrist',       current_date + 1, (current_date + 1) || 'T16:30:00', false),
  ('Dr. Pooja Hegde',      'Gynecologist',       current_date,     current_date || 'T13:00:00', false),
  ('Dr. Arvind Menon',     'Gastroenterologist', current_date + 1, (current_date + 1) || 'T12:00:00', false),
  ('Dr. Farhan Khan',      'Pulmonologist',      current_date,     current_date || 'T11:30:00', false),
  ('Dr. Neha Kapoor',      'Endocrinologist',    current_date + 1, (current_date + 1) || 'T17:30:00', false),
  ('Dr. Alok Nath',        'Oncologist',         current_date + 2, (current_date + 2) || 'T10:30:00', false),
  ('Dr. Devendra Roy',     'Nephrologist',       current_date + 2, (current_date + 2) || 'T14:00:00', false),
  ('Dr. Sanjeev Bajaj',    'Urologist',          current_date + 1, (current_date + 1) || 'T18:30:00', false),
  ('Dr. Radhika Mehta',    'Nutritionist',       current_date,     current_date || 'T15:30:00', false);
