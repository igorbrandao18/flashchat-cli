-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Drop existing objects if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.update_user_status(uuid, boolean);
drop table if exists public.user_status;
drop table if exists public.profiles;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Create user status table with device tracking
create table public.user_status (
  id uuid references public.profiles(id),
  device_id text not null,
  online_at timestamp with time zone default timezone('utc'::text, now()),
  status text default 'online'::text,
  last_seen_at timestamp with time zone default timezone('utc'::text, now()),
  metadata jsonb default '{}'::jsonb,
  primary key (id, device_id)
);

-- Enable RLS for user_status
alter table public.user_status enable row level security;

-- Create policies for user_status
create policy "Anyone can view user status"
  on user_status for select
  using ( true );

create policy "Users can update their own status"
  on user_status for update
  using ( auth.uid() = id );

create policy "Users can insert their own status"
  on user_status for insert
  with check ( auth.uid() = id );

-- Function to ensure profile exists
create or replace function public.ensure_profile_exists(user_id uuid)
returns void as $$
declare
  user_data record;
begin
  -- Check if profile exists
  if not exists (select 1 from public.profiles where id = user_id) then
    -- Get user data from auth.users
    select * into user_data from auth.users where id = user_id;
    
    -- Create profile if user exists
    if found then
      insert into public.profiles (id, full_name)
      values (user_id, user_data.raw_user_meta_data->>'full_name')
      on conflict (id) do nothing;
    end if;
  end if;
end;
$$ language plpgsql security definer;

-- Function to update user online status with device tracking
create or replace function public.update_user_status(
  user_id uuid,
  is_online boolean,
  device_id text default null
)
returns void as $$
declare
  current_status record;
  timeout_threshold interval = interval '1 minute';
  actual_device_id text;
begin
  -- Ensure profile exists before updating status
  perform public.ensure_profile_exists(user_id);
  
  -- Use a default device_id if none provided
  actual_device_id := coalesce(device_id, 'default-device');
  
  if is_online then
    -- Update or insert online status for this device
    insert into public.user_status (id, device_id, online_at, status, last_seen_at)
    values (user_id, actual_device_id, now(), 'online', now())
    on conflict (id, device_id) do update
    set online_at = now(),
        status = 'online',
        last_seen_at = now();
        
    -- Check and update timed out devices
    update public.user_status us
    set status = 'offline',
        last_seen_at = us.online_at
    where (us.id, us.device_id) != (user_id, actual_device_id)
      and us.status = 'online'
      and us.online_at < now() - timeout_threshold;
  else
    -- Mark only this device as offline
    update public.user_status us
    set status = 'offline',
        last_seen_at = now()
    where us.id = user_id
      and us.device_id = actual_device_id
      and us.status = 'online';
  end if;
end;
$$ language plpgsql security definer;

-- Create a trigger to create a profile entry when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  
  -- Also create initial user status
  insert into public.user_status (id, device_id, status)
  values (new.id, 'default-device', 'offline');
  
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 