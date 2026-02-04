-- ===========================================================================
-- Prompt and Smell -- Supabase Database Schema
-- ===========================================================================
-- Run this file against your Supabase SQL editor to bootstrap the database.
-- It creates all tables, indexes, RLS policies, functions, and triggers.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for fuzzy text search

-- ---------------------------------------------------------------------------
-- Table: users (extends Supabase auth.users)
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  scent_genome  jsonb default '{
    "citrus": 0, "floral": 0, "woody": 0, "fresh": 0, "oriental": 0,
    "gourmand": 0, "spicy": 0, "aquatic": 0, "green": 0, "fruity": 0
  }'::jsonb,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

comment on table public.users is 'Public user profiles that extend the built-in auth.users table.';

-- ---------------------------------------------------------------------------
-- Table: scents
-- ---------------------------------------------------------------------------

create table if not exists public.scents (
  id                uuid primary key default uuid_generate_v4(),
  creator_id        uuid not null references public.users(id) on delete cascade,
  name              text not null,
  description       text,
  prompt            text,
  formula           jsonb not null,
  tags              text[] default '{}',
  mood              text,
  season            text,
  intensity         integer check (intensity >= 1 and intensity <= 10),
  is_public         boolean default true,
  is_remix          boolean default false,
  original_scent_id uuid references public.scents(id) on delete set null,
  like_count        integer default 0 not null,
  remix_count       integer default 0 not null,
  version           integer default 1 not null,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

comment on table public.scents is 'Fragrance formulas created by users.';

-- ---------------------------------------------------------------------------
-- Table: scent_iterations
-- ---------------------------------------------------------------------------

create table if not exists public.scent_iterations (
  id                uuid primary key default uuid_generate_v4(),
  scent_id          uuid not null references public.scents(id) on delete cascade,
  iteration_number  integer not null,
  prompt            text,
  formula           jsonb not null,
  created_at        timestamptz default now() not null
);

comment on table public.scent_iterations is 'History of iterative modifications to a scent formula.';

-- ---------------------------------------------------------------------------
-- Table: likes
-- ---------------------------------------------------------------------------

create table if not exists public.likes (
  user_id    uuid not null references public.users(id) on delete cascade,
  scent_id   uuid not null references public.scents(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (user_id, scent_id)
);

comment on table public.likes is 'Tracks which users have liked which scents.';

-- ---------------------------------------------------------------------------
-- Table: favorites
-- ---------------------------------------------------------------------------

create table if not exists public.favorites (
  user_id    uuid not null references public.users(id) on delete cascade,
  scent_id   uuid not null references public.scents(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (user_id, scent_id)
);

comment on table public.favorites is 'Tracks which scents a user has saved to their favorites.';

-- ---------------------------------------------------------------------------
-- Table: comments
-- ---------------------------------------------------------------------------

create table if not exists public.comments (
  id         uuid primary key default uuid_generate_v4(),
  scent_id   uuid not null references public.scents(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now() not null
);

comment on table public.comments is 'User comments on scent formulas.';

-- ===========================================================================
-- Indexes
-- ===========================================================================

create index if not exists idx_scents_creator_id  on public.scents (creator_id);
create index if not exists idx_scents_created_at  on public.scents (created_at desc);
create index if not exists idx_scents_mood        on public.scents (mood);
create index if not exists idx_scents_season      on public.scents (season);
create index if not exists idx_likes_scent_id     on public.likes (scent_id);
create index if not exists idx_comments_scent_id  on public.comments (scent_id);
create index if not exists idx_favorites_user_id  on public.favorites (user_id);
create index if not exists idx_scent_iterations_scent_id on public.scent_iterations (scent_id);

-- Full-text search index
create index if not exists idx_scents_name_trgm
  on public.scents using gin (name gin_trgm_ops);
create index if not exists idx_scents_description_trgm
  on public.scents using gin (description gin_trgm_ops);

-- ===========================================================================
-- Row Level Security (RLS)
-- ===========================================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.scents enable row level security;
alter table public.scent_iterations enable row level security;
alter table public.likes enable row level security;
alter table public.favorites enable row level security;
alter table public.comments enable row level security;

-- ---- users ----------------------------------------------------------------

create policy "Users are viewable by everyone"
  on public.users for select
  using (true);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- scents ---------------------------------------------------------------

create policy "Public scents are viewable by everyone"
  on public.scents for select
  using (is_public = true or auth.uid() = creator_id);

create policy "Authenticated users can create scents"
  on public.scents for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their own scents"
  on public.scents for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Creators can delete their own scents"
  on public.scents for delete
  using (auth.uid() = creator_id);

-- ---- scent_iterations -----------------------------------------------------

create policy "Iterations are viewable by everyone for public scents"
  on public.scent_iterations for select
  using (
    exists (
      select 1 from public.scents
      where scents.id = scent_iterations.scent_id
        and (scents.is_public = true or scents.creator_id = auth.uid())
    )
  );

create policy "Authenticated users can insert iterations for their scents"
  on public.scent_iterations for insert
  with check (
    exists (
      select 1 from public.scents
      where scents.id = scent_iterations.scent_id
        and scents.creator_id = auth.uid()
    )
  );

-- ---- likes ----------------------------------------------------------------

create policy "Likes are viewable by everyone"
  on public.likes for select
  using (true);

create policy "Authenticated users can like scents"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ---- favorites ------------------------------------------------------------

create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Authenticated users can add favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ---- comments -------------------------------------------------------------

create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Authenticated users can add comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- ===========================================================================
-- Functions and Triggers
-- ===========================================================================

-- ---- Auto-update updated_at timestamp -------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_scents_updated_at
  before update on public.scents
  for each row execute function public.handle_updated_at();

-- ---- Increment like count on insert ---------------------------------------

create or replace function public.increment_like_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.scents
    set like_count = like_count + 1
    where id = new.scent_id;
  return new;
end;
$$;

create trigger on_like_inserted
  after insert on public.likes
  for each row execute function public.increment_like_count();

-- ---- Decrement like count on delete ---------------------------------------

create or replace function public.decrement_like_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.scents
    set like_count = greatest(like_count - 1, 0)
    where id = old.scent_id;
  return old;
end;
$$;

create trigger on_like_deleted
  after delete on public.likes
  for each row execute function public.decrement_like_count();

-- ---- Increment remix count when a remix is created ------------------------

create or replace function public.increment_remix_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.original_scent_id is not null and new.is_remix = true then
    update public.scents
      set remix_count = remix_count + 1
      where id = new.original_scent_id;
  end if;
  return new;
end;
$$;

create trigger on_remix_created
  after insert on public.scents
  for each row execute function public.increment_remix_count();

-- ---- Auto-create user profile on auth signup ------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- Stored query functions
-- ===========================================================================

-- ---- get_trending_scents --------------------------------------------------
-- Returns scents ordered by the number of likes they received in the last
-- 7 days. Falls back to total like_count for ties.

create or replace function public.get_trending_scents(limit_count integer default 20)
returns setof public.scents
language sql
stable
security definer
as $$
  select s.*
  from public.scents s
  left join (
    select scent_id, count(*) as recent_likes
    from public.likes
    where created_at > now() - interval '7 days'
    group by scent_id
  ) rl on rl.scent_id = s.id
  where s.is_public = true
  order by coalesce(rl.recent_likes, 0) desc, s.like_count desc, s.created_at desc
  limit limit_count;
$$;

-- ---- search_scents --------------------------------------------------------
-- Full-text search across name, description, and tags.

create or replace function public.search_scents(query text)
returns setof public.scents
language sql
stable
security definer
as $$
  select s.*
  from public.scents s
  where s.is_public = true
    and (
      s.name ilike '%' || query || '%'
      or s.description ilike '%' || query || '%'
      or exists (
        select 1
        from unnest(s.tags) as tag
        where tag ilike '%' || query || '%'
      )
    )
  order by
    case
      when s.name ilike query then 0
      when s.name ilike query || '%' then 1
      when s.name ilike '%' || query || '%' then 2
      else 3
    end,
    s.like_count desc,
    s.created_at desc;
$$;
