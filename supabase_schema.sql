-- Set up the Brand Profiles table
create table public.brand_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  name text,
  industry text,
  description text,
  tone text
);

-- Set up Row Level Security (RLS) for brand_profiles
alter table public.brand_profiles enable row level security;

create policy "Users can view their own brand profile."
  on brand_profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own brand profile."
  on brand_profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own brand profile."
  on brand_profiles for update
  using ( auth.uid() = id );

-- Set up the Global Intel table
create table public.global_intel (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  strategy_history jsonb default '[]'::jsonb,
  market_analysis text,
  content_drafts text[] default '{}'::text[],
  logistics text
);

-- Set up Row Level Security (RLS) for global_intel
alter table public.global_intel enable row level security;

create policy "Users can view their own global intel."
  on global_intel for select
  using ( auth.uid() = id );

create policy "Users can insert their own global intel."
  on global_intel for insert
  with check ( auth.uid() = id );

create policy "Users can update their own global intel."
  on global_intel for update
  using ( auth.uid() = id );

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.brand_profiles (id)
  values (new.id);
  
  insert into public.global_intel (id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
