# Yoinkr — app rules

Hyperlocal construction trades marketplace, Ottawa.

## Database

This app talks to `onsite-core` (Supabase, `tuxtzfmzhmgasqzugyod`, ca-central-1).

**Schema rules live in `/c/Dev/onsite-core-db/CLAUDE.md`. Read that file before writing any query.**

Key constraints:
- Yoinkr tables live in the `yoinkr` schema. Never `public`.
- Every table has RLS enabled. Data is owned by `user_id`, never by an organization.
- One profile table: `yoinkr.profiles`. No hirer/worker split.

**Never write migrations from this repo.** All DDL belongs in `onsite-core-db`.
If this app needs a schema change, say so — do not create the table yourself.

## Auth

Users authenticate against `onsite-identity`, a separate Supabase project.
`onsite-core` trusts tokens issued by identity. Never create auth tables in either.

## Environment

Secrets live in `.env`, never committed. Never hardcode a Supabase key or URL.
