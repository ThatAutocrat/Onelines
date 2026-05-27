-- ============================================
-- ONELINE v2 — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Profiles
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  created_at  timestamptz default now()
);

-- Matchmaking queue
create table if not exists queue (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade unique,
  genre       text not null default 'any',
  joined_at   timestamptz default now()
);

-- Stories
create table if not exists stories (
  id          uuid primary key default gen_random_uuid(),
  player1_id  uuid not null references profiles(id),
  player2_id  uuid references profiles(id),
  status      text not null default 'active' check (status in ('active', 'complete')),
  turn        uuid references profiles(id),
  genre       text not null default 'any',
  prompt      text,
  total_votes int not null default 0,
  created_at  timestamptz default now()
);

-- Sentences
create table if not exists sentences (
  id          uuid primary key default gen_random_uuid(),
  story_id    uuid not null references stories(id) on delete cascade,
  user_id     uuid not null references profiles(id),
  text        text not null,
  votes       int not null default 0,
  reported    boolean not null default false,
  created_at  timestamptz default now()
);

-- Saved stories
create table if not exists saved_stories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  story_id    uuid not null references stories(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, story_id)
);

-- Typing presence
create table if not exists typing (
  user_id     uuid primary key references profiles(id) on delete cascade,
  story_id    uuid not null references stories(id) on delete cascade,
  updated_at  timestamptz default now()
);

-- ============================================
-- ATOMIC MATCHMAKING FUNCTION
-- Prevents race condition where two users
-- simultaneously create duplicate stories
-- ============================================
create or replace function match_players(p_user_id uuid, p_genre text)
returns uuid language plpgsql security definer as $$
declare
  v_partner_id uuid;
  v_story_id   uuid;
  v_prompt     text;
  v_prompts    text[] := array[
    'The lighthouse had been dark for thirty years when she finally climbed its rusted stairs.',
    'Nobody believed him until the photographs surfaced three weeks later.',
    'Every morning the bakery smelled of cinnamon — until the day it didn''t.',
    'The map had one road that didn''t exist on any satellite image.',
    'He returned the library book forty years late with a single apology note.',
    'The door at the end of the hall had never been locked before tonight.',
    'She found a voicemail on her phone from a number that didn''t exist.',
    'The last train had already left when she noticed the envelope on the bench.',
    'They said the old house was haunted — but nobody mentioned it was lonely.',
    'The note read: "Don''t open the blue drawer." There was no blue drawer.'
  ];
begin
  -- Lock and find a waiting partner
  select user_id into v_partner_id
  from queue
  where user_id != p_user_id
    and (genre = p_genre or genre = 'any' or p_genre = 'any')
  order by joined_at asc
  limit 1
  for update skip locked;

  if v_partner_id is null then
    return null;
  end if;

  -- Pick random prompt
  v_prompt := v_prompts[floor(random() * array_length(v_prompts, 1) + 1)];

  -- Remove both from queue
  delete from queue where user_id in (p_user_id, v_partner_id);

  -- Create story
  insert into stories (player1_id, player2_id, status, turn, genre, prompt)
  values (p_user_id, v_partner_id, 'active', p_user_id, p_genre, v_prompt)
  returning id into v_story_id;

  return v_story_id;
end;
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table profiles      enable row level security;
alter table queue         enable row level security;
alter table stories       enable row level security;
alter table sentences     enable row level security;
alter table saved_stories enable row level security;
alter table typing        enable row level security;

-- Profiles
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Queue
create policy "queue_select" on queue for select using (true);
create policy "queue_insert" on queue for insert with check (auth.uid() = user_id);
create policy "queue_delete" on queue for delete using (auth.uid() = user_id);

-- Stories: both players can read AND update
create policy "stories_select" on stories for select using (
  auth.uid() = player1_id or auth.uid() = player2_id
);
create policy "stories_insert" on stories for insert with check (auth.uid() = player1_id);
create policy "stories_update" on stories for update using (
  auth.uid() = player1_id or auth.uid() = player2_id
);

-- Public feed: completed stories visible to all
create policy "stories_public_feed" on stories for select using (status = 'complete');

-- Sentences
create policy "sentences_select" on sentences for select using (
  exists (
    select 1 from stories s
    where s.id = story_id
      and (s.player1_id = auth.uid() or s.player2_id = auth.uid() or s.status = 'complete')
  )
);
create policy "sentences_insert" on sentences for insert with check (auth.uid() = user_id);
create policy "sentences_update" on sentences for update using (true);

-- Saved stories
create policy "saved_select" on saved_stories for select using (auth.uid() = user_id);
create policy "saved_insert" on saved_stories for insert with check (auth.uid() = user_id);

-- Typing
create policy "typing_select" on typing for select using (true);
create policy "typing_upsert" on typing for insert with check (auth.uid() = user_id);
create policy "typing_update" on typing for update using (auth.uid() = user_id);
create policy "typing_delete" on typing for delete using (auth.uid() = user_id);

-- ============================================
-- REALTIME — enable on these tables:
-- stories, sentences, queue, typing
-- Go to: Table Editor → table → Realtime ON
-- ============================================
