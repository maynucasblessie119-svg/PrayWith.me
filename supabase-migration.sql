-- ━━━ SUPABASE DATABASE MIGRATIONS ━━━
-- Description: Sets up prayers, hearts, comments, and reports tables for PrayWith.me
-- Also configures storage bucket and Row Level Security (RLS).

-- 1. Enable UUID Extension if not already present
create extension if not exists "uuid-ossp";

-- 2. Create PRAYERS table
create table public.prayers (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) <= 280),
  category text not null check (category in ('Healing', 'Family', 'Peace', 'Gratitude', 'Protection', 'Other')),
  image_url text, -- holds public image URLs or base64
  heart_count integer not null default 0,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'pending')),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

-- Index for speedy lookups
create index idx_prayers_category on public.prayers(category);
create index idx_prayers_status on public.prayers(status);

-- 3. Create HEARTS table (enforces unique heart per user per prayer)
create table public.hearts (
  id uuid primary key default gen_random_uuid(),
  prayer_id uuid not null references public.prayers(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  unique(prayer_id, ip_hash)
);

-- Index for checkups
create index idx_hearts_prayerip on public.hearts(prayer_id, ip_hash);

-- 4. Create COMMENTS table
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  prayer_id uuid not null references public.prayers(id) on delete cascade,
  text text not null check (char_length(text) <= 200),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index idx_comments_prayer on public.comments(prayer_id);

-- 5. Create REPORTS table
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  prayer_id uuid not null references public.prayers(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create index idx_reports_prayer on public.reports(prayer_id);


-- ━━━ ROW LEVEL SECURITY (RLS) POLICIES ━━━

-- Enable RLS on all tables
alter table public.prayers enable row level security;
alter table public.hearts enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

-- Public read policies (anyone can read visible prayers and comments)
create policy "Allow public read of visible prayers" 
  on public.prayers for select 
  using (status = 'visible');

create policy "Allow public read of comments" 
  on public.comments for select 
  using (true);

-- API writes are done through Supabase Service Role (admin client bypasses RLS)
-- But we can write public insert policies if clients ever write directly:
create policy "Allow public insert prayers with pending status"
  on public.prayers for insert
  with check (status = 'visible'); -- default status or visible status can be inserted

create policy "Allow public insert of hearts"
  on public.hearts for insert
  with check (true);

create policy "Allow public insert of comments"
  on public.comments for insert
  with check (true);

create policy "Allow public insert of reports"
  on public.reports for insert
  with check (true);


-- ━━━ HELPER FUNCTIONS FOR APP OPERATIONS ━━━

-- RPC function to increment the heart count on a prayer safely
create or replace function public.increment_heart(prayer_id uuid)
returns integer as $$
declare
  new_count integer;
begin
  update public.prayers
  set heart_count = heart_count + 1
  where id = prayer_id
  returning heart_count into new_count;
  
  return new_count;
end;
$$ language plpgsql security definer;


-- ━━━ STORAGE BUCKET CREATION (SUPABASE STORAGE) ━━━

-- Create public storage bucket for prayer images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prayer-images', 
  'prayer-images', 
  true, 
  3145728, -- 3MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Storage object Security Policies
create policy "Allow public select of prayer images"
  on storage.objects for select
  using (bucket_id = 'prayer-images');

create policy "Allow public insert of prayer images"
  on storage.objects for insert
  with check (bucket_id = 'prayer-images' AND private.owner() is null); -- public guest uploads


-- ━━━ ADDED SCHEMAS: USER ACCOUNTS, NOTIFICATIONS & PUSH SUBSCRIPTIONS ━━━

-- 6. Create USERS table
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  notify_hearts boolean not null default true,
  notify_comments boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_users_email on public.users(email);

-- 7. Add columns to prayers to associate with authenticated users
alter table public.prayers add column user_id uuid references public.users(id) on delete set null;
create index idx_prayers_user_id on public.prayers(user_id);

-- 8. Create PUSH_SUBSCRIPTIONS table
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_push_sub_user on public.push_subscriptions(user_id);

-- 9. Create NOTIFICATIONS history log table (for profile notification feed)
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  prayer_id uuid references public.prayers(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null check (type in ('heart', 'comment')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on public.notifications(user_id, read);

-- Enable RLS for new tables
alter table public.users enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;

-- Setup basic public policies (or fallback admin context bypasses them)
create policy "Allow public authentication reads" on public.users for select using (true);
create policy "Allow public inserts" on public.users for insert with check (true);
create policy "Allow public updates" on public.users for update using (true);
create policy "Allow subscription operations" on public.push_subscriptions for all using (true);
create policy "Allow notification select" on public.notifications for select using (true);
create policy "Allow notification update" on public.notifications for update using (true);

