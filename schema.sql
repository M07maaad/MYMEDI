-- ============================================
-- MediGuard — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  age integer,
  weight numeric(5,2),
  height numeric(5,2),
  blood_type text,
  role text default 'patient' check (role in ('patient', 'pharmacist')),
  created_at timestamp with time zone default now()
);

-- ─── CHRONIC CONDITIONS ───────────────────────
create table conditions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

-- ─── MEDICATIONS ─────────────────────────────
create table medications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  generic_name text not null,
  trade_name text,
  dose text not null,
  dose_times text[] not null,         -- e.g. ['صبح', 'مساء']
  with_food boolean default true,
  stock_count integer default 0,
  color text default '#10D9A0',
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- ─── DOSE LOGS ───────────────────────────────
create table dose_logs (
  id uuid default uuid_generate_v4() primary key,
  medication_id uuid references medications(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  scheduled_time text not null,       -- 'صبح' | 'ظهر' | 'مساء' | 'ليل'
  taken_at timestamp with time zone,
  was_taken boolean default false,
  date date default current_date,
  created_at timestamp with time zone default now(),
  unique(medication_id, scheduled_time, date)
);

-- ─── LAB RESULTS ─────────────────────────────
create table lab_results (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  test_name text not null,
  result_value text,
  unit text,
  normal_range text,
  is_abnormal boolean default false,
  test_date date not null,
  file_url text,                      -- Supabase Storage URL
  notes text,
  created_at timestamp with time zone default now()
);

-- ─── DRUG INTERACTIONS DB ────────────────────
create table drug_interactions (
  id uuid default uuid_generate_v4() primary key,
  drug1_name text not null,
  drug2_name text not null,
  severity text check (severity in ('خفيف', 'متوسط', 'خطير')),
  description text,
  alternative text,
  created_at timestamp with time zone default now()
);

-- ─── PHARMACIST PATIENTS ─────────────────────
create table pharmacist_patients (
  id uuid default uuid_generate_v4() primary key,
  pharmacist_id uuid references profiles(id) on delete cascade,
  patient_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(pharmacist_id, patient_id)
);

-- ─── ROW LEVEL SECURITY ──────────────────────
alter table profiles enable row level security;
alter table conditions enable row level security;
alter table medications enable row level security;
alter table dose_logs enable row level security;
alter table lab_results enable row level security;
alter table pharmacist_patients enable row level security;

-- Users can only see/edit their own data
create policy "Own profile" on profiles for all using (auth.uid() = id);
create policy "Own conditions" on conditions for all using (auth.uid() = user_id);
create policy "Own medications" on medications for all using (auth.uid() = user_id);
create policy "Own dose logs" on dose_logs for all using (auth.uid() = user_id);
create policy "Own lab results" on lab_results for all using (auth.uid() = user_id);

-- Pharmacist can see their patients' data
create policy "Pharmacist sees patients" on medications for select
  using (
    exists (
      select 1 from pharmacist_patients
      where pharmacist_id = auth.uid() and patient_id = medications.user_id
    )
  );

-- Drug interactions are public read
alter table drug_interactions enable row level security;
create policy "Public read interactions" on drug_interactions for select using (true);

-- ─── STORAGE BUCKET ──────────────────────────
-- Run in Supabase Dashboard > Storage > New Bucket
-- Name: lab-files | Public: false

-- ─── SAMPLE INTERACTIONS DATA ────────────────
insert into drug_interactions (drug1_name, drug2_name, severity, description, alternative) values
('Metformin', 'Aspirin', 'متوسط', 'قد يزيد الأسبرين من تأثير الميتفورمين على سكر الدم — راقب مستوى السكر بانتظام.', 'يمكن استخدام Clopidogrel كبديل للأسبرين'),
('Warfarin', 'Aspirin', 'خطير', 'يزيد خطر النزيف بشكل كبير عند استخدامهما معاً.', 'استشر الطبيب فوراً'),
('Simvastatin', 'Amlodipine', 'متوسط', 'قد يزيد تركيز Simvastatin في الدم مما يرفع خطر آلام العضلات.', 'تخفيض جرعة Simvastatin أو التحويل لـ Rosuvastatin'),
('Ciprofloxacin', 'Calcium', 'خفيف', 'الكالسيوم يقلل امتصاص المضاد الحيوي — خذهم بفارق ساعتين.', 'فصل الجرعتين بساعتين على الأقل');
