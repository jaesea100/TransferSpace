-- Notification preferences (synced from frontend settings panel)
create table if not exists public.user_notification_prefs (
  user_id       uuid primary key references auth.users on delete cascade,
  email_on      boolean not null default true,
  inapp_on      boolean not null default true,
  digest_on     boolean not null default true,
  lor_on        boolean not null default true,
  sms_on        boolean not null default false,
  deadline_days int[]   not null default '{30}',
  updated_at    timestamptz not null default now()
);
alter table public.user_notification_prefs enable row level security;
drop policy if exists "user owns prefs" on public.user_notification_prefs;
create policy "user owns prefs"
  on public.user_notification_prefs for all
  using (auth.uid() = user_id);

-- In-app notification queue (Realtime enabled)
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  title      text not null,
  body       text,
  type       text not null default 'info', -- info | warning | success
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
drop policy if exists "user owns notifications" on public.notifications;
create policy "user owns notifications"
  on public.notifications for all
  using (auth.uid() = user_id);
alter publication supabase_realtime add table public.notifications;

-- Email dedup log (service-role write only)
create table if not exists public.email_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  email_type text not null,   -- deadline | lor | digest
  ref_key    text not null,   -- e.g. schoolId-term-days or lorId
  sent_at    timestamptz not null default now(),
  unique (user_id, email_type, ref_key)
);
alter table public.email_log enable row level security;
drop policy if exists "user reads own email log" on public.email_log;
create policy "user reads own email log"
  on public.email_log for select
  using (auth.uid() = user_id);

-- Schedule LOR reminder cron (runs daily at 08:00 UTC)
-- Requires pg_cron + pg_net extensions (enabled in Supabase dashboard)
-- Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY before running.
/*
select cron.schedule(
  'lor-reminder-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url    := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/lor-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body   := '{}'::jsonb
  );
  $$
);
*/
