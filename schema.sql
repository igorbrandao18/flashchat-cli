-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users Table with enhanced security
create table public.profiles (
  id uuid references auth.users on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc', now()),
  primary key (id)
);

-- Add RLS policy for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Messages Table with enhanced features
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  content text,
  file_url text,
  created_at timestamp with time zone default timezone('utc', now()),
  read_at timestamp with time zone,
  message_type text default 'text',
  metadata jsonb default '{}'::jsonb
);

-- Add RLS policy for messages
alter table public.messages enable row level security;

create policy "Users can view their own messages"
  on messages for select
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

create policy "Users can insert their own messages"
  on messages for insert
  with check ( auth.uid() = sender_id );

-- Presence Table with enhanced status
create table public.user_status (
  id uuid references public.profiles(id) primary key,
  online_at timestamp with time zone default timezone('utc', now()),
  status text default 'online'::text,
  last_seen_at timestamp with time zone default timezone('utc', now()),
  metadata jsonb default '{}'::jsonb
);

-- Add RLS policy for user_status
alter table public.user_status enable row level security;

create policy "Anyone can view user status"
  on user_status for select
  using ( true );

create policy "Users can update their own status"
  on user_status for update
  using ( auth.uid() = id );

-- Function to update user last seen
create or replace function public.handle_user_status()
returns trigger as $$
begin
  insert into public.user_status (id, online_at, status)
  values (new.id, now(), 'online')
  on conflict (id) do update
  set online_at = now(),
      status = 'online';
  return new;
end;
$$ language plpgsql security definer;

-- Function to update user online status
create or replace function public.update_user_status(user_id uuid, is_online boolean)
returns void as $$
begin
  if is_online then
    insert into public.user_status (id, online_at, status, last_seen_at)
    values (user_id, now(), 'online', now())
    on conflict (id) do update
    set online_at = now(),
        status = 'online';
  else
    update public.user_status
    set status = 'offline',
        last_seen_at = now()
    where id = user_id;
  end if;
end;
$$ language plpgsql security definer;

-- Trigger for user status
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_user_status(); 