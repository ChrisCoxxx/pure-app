-- =============================================
-- PURE APP — SUPABASE SETUP SCRIPT
-- Run this in: Supabase > SQL Editor > New query
-- =============================================

-- 1. TABLE PROFILES (members)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  is_active boolean default false,
  start_date date,
  lang text default 'fr',
  created_at timestamp with time zone default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. TABLE BATCHES
create table if not exists batches (
  id uuid default gen_random_uuid() primary key,
  batch_number int not null unique check (batch_number >= 1 and batch_number <= 24),
  title text not null,
  description text,
  pdf_url text,
  is_published boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table batches enable row level security;

-- Users can only read/update their own profile
create policy "Users read own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users update own profile" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can read published batches (access control is handled in the app)
create policy "Users read published batches" on batches
  for select using (is_published = true);

-- 4. SAMPLE BATCH DATA (first 4 batches to get started)
insert into batches (batch_number, title, description, is_published) values
  (1, 'Fondations légères / Light Foundations', 'Repas simples pour démarrer en douceur. Simple meals to start smoothly.', true),
  (2, 'Équilibre & couleurs / Balance & Colors', 'Des assiettes colorées, riches en nutriments. Colorful plates, rich in nutrients.', true),
  (3, 'Satiété durable / Lasting Satiety', 'Repas rassasiants qui tiennent jusqu''au soir. Filling meals that last till evening.', true),
  (4, 'Saveurs du monde / World Flavors', 'Voyage culinaire méditerranéen et asiatique. Mediterranean and Asian culinary journey.', true)
on conflict (batch_number) do nothing;

-- =============================================
-- DONE! Now go to Authentication > Users to
-- create your first member, then set their
-- is_active = true and start_date in the
-- profiles table.
-- =============================================
