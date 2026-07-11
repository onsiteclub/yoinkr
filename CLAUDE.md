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

Sign-in is native `supabase.auth` against `onsite-core` — the same project as the data.
(The separate `onsite-identity` project was deleted 2026-07-09; see "Why one project, not two" in `onsite-core-db/CLAUDE.md`.)

One account works across every company of the Onsite Inc holding; what Yoinkr allows is decided by RLS in the `yoinkr` schema. Never create auth tables or user tables. The `service_role` key never enters this repo; test RLS with the `authenticated` role, never `postgres`.

## Environment

Secrets live in `.env`, never committed. Never hardcode a Supabase key or URL.

**Status — DONE, do not redo (2026-07-09):** `.env` already points at `onsite-core` and was smoke-tested (auth + REST respond with these exact values). Do not re-investigate, edit, or print Supabase credentials. What remains for the agent:

1. **Hunt hardcoded leftovers in source code** — the old ref `lbdaigeyekdgbnldnhdq` must not appear outside `.env.example` placeholders.
2. **The `yoinkr` schema exists but is EMPTY.** List the tables the app needs (listings, profiles, messages) and request migrations via `onsite-core-db` — never create them yourself.
3. **Data API exposes only `public, graphql_public` today.** `.schema('yoinkr')` fails with `PGRST106` until product schemas are exposed in project settings. If you hit it, report it — do not change project config.
