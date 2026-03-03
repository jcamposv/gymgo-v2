-- Push tokens table for FCM device token storage
-- Used for sending targeted notifications to specific users
create table if not exists public.push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  device_id text,
  app_version text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Each user can have one token per platform
  unique (user_id, platform)
);

-- Index for querying active tokens by organization
create index if not exists idx_push_tokens_org_active
  on public.push_tokens (organization_id, is_active)
  where is_active = true;

-- Index for querying tokens by user
create index if not exists idx_push_tokens_user
  on public.push_tokens (user_id);

-- Enable RLS
alter table public.push_tokens enable row level security;

-- Users can manage their own tokens
create policy "Users can insert their own push tokens"
  on public.push_tokens for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own push tokens"
  on public.push_tokens for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read their own push tokens"
  on public.push_tokens for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own push tokens"
  on public.push_tokens for delete
  to authenticated
  using (auth.uid() = user_id);

-- Service role can access all tokens (for sending notifications from backend)
create policy "Service role can manage all push tokens"
  on public.push_tokens for all
  to service_role
  using (true)
  with check (true);
