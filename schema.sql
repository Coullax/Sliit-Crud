-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create candidates table
create table public.candidates (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text not null,
  phone text,
  status text check (status in ('in_progress', 'hired', 'rejected')) default 'in_progress',
  user_id uuid references auth.users not null default auth.uid()
);

-- Create interviews table
create table public.interviews (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  candidate_id uuid references public.candidates(id) on delete cascade not null,
  round_type text check (round_type in ('technical', 'hr', 'director')) not null,
  round_index integer default 1, -- For multiple technical rounds
  score numeric,
  feedback text,
  user_id uuid references auth.users not null default auth.uid()
);

-- Enable RLS
alter table public.candidates enable row level security;
alter table public.interviews enable row level security;

-- Policies for candidates
create policy "Users can view their own candidates"
  on public.candidates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own candidates"
  on public.candidates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own candidates"
  on public.candidates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own candidates"
  on public.candidates for delete
  using (auth.uid() = user_id);

-- Policies for interviews
create policy "Users can view their own interviews"
  on public.interviews for select
  using (auth.uid() = user_id);

create policy "Users can insert their own interviews"
  on public.interviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own interviews"
  on public.interviews for update
  using (auth.uid() = user_id);

create policy "Users can delete their own interviews"
  on public.interviews for delete
  using (auth.uid() = user_id);
