-- Chat: read tracking, get-or-create uniqueness, update policy, Realtime.

-- Per-side "last read" timestamps → cheap unread detection at 100-user scale.
alter table conversations add column if not exists a_last_read timestamptz not null default now();
alter table conversations add column if not exists b_last_read timestamptz not null default now();

-- One conversation per (pair, listing); listing may be null (profile-to-profile).
create unique index if not exists idx_conv_pair
  on conversations (participant_a, participant_b, listing_id) nulls not distinct;

-- Participants may update (read timestamps).
drop policy if exists conv_update on conversations;
create policy conv_update on conversations for update to authenticated
  using (participant_a = auth.uid() or participant_b = auth.uid());

-- Realtime: broadcast INSERTs on messages (RLS still applies per subscriber).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
