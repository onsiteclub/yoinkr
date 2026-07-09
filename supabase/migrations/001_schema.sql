-- Yoinkr v1 schema (HANDOFF.md §5 + applications for the Yoink flow).
-- RLS ON for every table (HANDOFF §7). Scale target: ~100 users — keep simple.

-- ============ TABLES ============

create table if not exists profiles (
  id            uuid primary key,           -- = auth.users.id (anonymous or full account)
  full_name     text not null default 'New worker',
  trade         text,                       -- 'Framing', 'Roofing', ...
  years_exp     int not null default 0,
  region        text not null default 'Ottawa, ON',
  available     boolean not null default false,
  trust_score   numeric not null default 0, -- aggregate, recomputed from ratings
  deals_closed  int not null default 0,
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists listings (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references profiles(id) on delete cascade,
  type          text not null check (type in ('job','tool','available')),
  trade         text,                       -- trade id ('framing', ...); null for tools
  title         text not null,
  pay           text not null default '—',
  detail        text not null default '',
  city          text not null default 'Ottawa',
  location      text not null default 'Ottawa area',
  distance_km   numeric,                    -- placeholder until real geo (phase 2)
  urgent        boolean not null default false,
  photo_url     text,
  status        text not null default 'open' check (status in ('open','closed')),
  created_at    timestamptz not null default now()
);

create table if not exists applications (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references listings(id) on delete cascade,
  applicant_id  uuid not null references profiles(id) on delete cascade,
  message       text not null,
  proposed_rate text not null default '',
  status        text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at    timestamptz not null default now(),
  unique (listing_id, applicant_id)         -- one application per job per worker
);

create table if not exists portfolio_photos (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  photo_url     text not null,
  caption       text not null default '',
  created_at    timestamptz not null default now()
);

create table if not exists conversations (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references listings(id) on delete set null,
  participant_a uuid not null references profiles(id) on delete cascade,
  participant_b uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

create table if not exists deals (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references listings(id) on delete set null,
  worker_id     uuid not null references profiles(id) on delete cascade,
  hirer_id      uuid not null references profiles(id) on delete cascade,
  state         text not null default 'proposed' check (state in ('proposed','confirmed','rated')),
  proposed_by   uuid,
  created_at    timestamptz not null default now()
);

create table if not exists ratings (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid references deals(id) on delete set null,
  rater_id      uuid not null references profiles(id) on delete cascade,
  ratee_id      uuid not null references profiles(id) on delete cascade,
  stars         int not null check (stars between 1 and 5),
  comment       text not null default '',   -- shown as a "reference" on profiles
  created_at    timestamptz not null default now()
);

create table if not exists reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references profiles(id) on delete cascade,
  target_type   text not null check (target_type in ('user','listing','message')),
  target_id     uuid not null,
  reason        text not null default '',
  created_at    timestamptz not null default now()
);

create table if not exists blocks (
  id            uuid primary key default gen_random_uuid(),
  blocker_id    uuid not null references profiles(id) on delete cascade,
  blocked_id    uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

-- ============ INDEXES (HANDOFF §5) ============
create index if not exists idx_listings_created  on listings (created_at desc);
create index if not exists idx_listings_type     on listings (type);
create index if not exists idx_listings_city     on listings (city);
create index if not exists idx_messages_conv     on messages (conversation_id, created_at);
create index if not exists idx_conv_a            on conversations (participant_a);
create index if not exists idx_conv_b            on conversations (participant_b);
create index if not exists idx_apps_listing      on applications (listing_id, created_at desc);
create index if not exists idx_ratings_ratee     on ratings (ratee_id, created_at desc);

-- ============ RLS ============
alter table profiles         enable row level security;
alter table listings         enable row level security;
alter table applications     enable row level security;
alter table portfolio_photos enable row level security;
alter table conversations    enable row level security;
alter table messages         enable row level security;
alter table deals            enable row level security;
alter table ratings          enable row level security;
alter table reports          enable row level security;
alter table blocks           enable row level security;

-- profiles: public read (marketplace identity); write own row only.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated, anon using (true);
drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated using (id = auth.uid());

-- listings: open listings are public; authors manage their own.
drop policy if exists listings_select on listings;
create policy listings_select on listings for select to authenticated, anon
  using (status = 'open' or author_id = auth.uid());
drop policy if exists listings_insert on listings;
create policy listings_insert on listings for insert to authenticated with check (author_id = auth.uid());
drop policy if exists listings_update on listings;
create policy listings_update on listings for update to authenticated using (author_id = auth.uid());
drop policy if exists listings_delete on listings;
create policy listings_delete on listings for delete to authenticated using (author_id = auth.uid());

-- applications: visible to the applicant and to the listing's author.
drop policy if exists applications_select on applications;
create policy applications_select on applications for select to authenticated
  using (
    applicant_id = auth.uid()
    or exists (select 1 from listings l where l.id = listing_id and l.author_id = auth.uid())
  );
drop policy if exists applications_insert on applications;
create policy applications_insert on applications for insert to authenticated
  with check (applicant_id = auth.uid());

-- portfolio photos: public read; write own.
drop policy if exists portfolio_select on portfolio_photos;
create policy portfolio_select on portfolio_photos for select to authenticated, anon using (true);
drop policy if exists portfolio_write on portfolio_photos;
create policy portfolio_write on portfolio_photos for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists portfolio_delete on portfolio_photos;
create policy portfolio_delete on portfolio_photos for delete to authenticated using (profile_id = auth.uid());

-- conversations/messages: participants only.
drop policy if exists conv_select on conversations;
create policy conv_select on conversations for select to authenticated
  using (participant_a = auth.uid() or participant_b = auth.uid());
drop policy if exists conv_insert on conversations;
create policy conv_insert on conversations for insert to authenticated
  with check (participant_a = auth.uid() or participant_b = auth.uid());

drop policy if exists msg_select on messages;
create policy msg_select on messages for select to authenticated
  using (exists (
    select 1 from conversations c
    where c.id = conversation_id and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
  ));
drop policy if exists msg_insert on messages;
create policy msg_insert on messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

-- deals: participants only.
drop policy if exists deals_select on deals;
create policy deals_select on deals for select to authenticated
  using (worker_id = auth.uid() or hirer_id = auth.uid());
drop policy if exists deals_insert on deals;
create policy deals_insert on deals for insert to authenticated
  with check (worker_id = auth.uid() or hirer_id = auth.uid());
drop policy if exists deals_update on deals;
create policy deals_update on deals for update to authenticated
  using (worker_id = auth.uid() or hirer_id = auth.uid());

-- ratings: public read (they are the references shown on profiles); rater writes own.
drop policy if exists ratings_select on ratings;
create policy ratings_select on ratings for select to authenticated, anon using (true);
drop policy if exists ratings_insert on ratings;
create policy ratings_insert on ratings for insert to authenticated with check (rater_id = auth.uid());

-- reports: insert own; no client read (founder reviews in dashboard).
drop policy if exists reports_insert on reports;
create policy reports_insert on reports for insert to authenticated with check (reporter_id = auth.uid());

-- blocks: own rows only.
drop policy if exists blocks_select on blocks;
create policy blocks_select on blocks for select to authenticated using (blocker_id = auth.uid());
drop policy if exists blocks_insert on blocks;
create policy blocks_insert on blocks for insert to authenticated with check (blocker_id = auth.uid());
drop policy if exists blocks_delete on blocks;
create policy blocks_delete on blocks for delete to authenticated using (blocker_id = auth.uid());
