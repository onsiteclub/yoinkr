# BUILD HANDOFF — Yoinkr (Construction Jobs Marketplace)
### Briefing for the AI agent building this in VS Code

**Read this together with `AppMockup.jsx` (the visual reference) and `VISION.md` (the product rationale).**

---

## 0. TL;DR for the agent

Build a **mobile marketplace app for construction workers** (Expo + React Native + Supabase). Three core screens: **Jobs feed**, **Profile**, **Chat**. A **bilateral trust score** is the retention engine. Target: **~100 active users in Ottawa**, so build for reliability and speed, NOT for massive scale. Light mode. The visual reference `AppMockup.jsx` is **React web** — translate its layout, colors, copy, and flows into **React Native**. Do not copy `<div>`/inline-style verbatim; reimplement with React Native primitives.

---

## 1. What this app is (and is NOT)

**IS:** A fast, intent-driven marketplace. A worker opens it Friday afternoon to answer one question — *"is there work this weekend?"* — sees jobs in seconds, messages the hirer, and closes the deal in-app to build trust. Like Facebook Marketplace, but only for construction work, tools, and available workers.

**IS NOT:** An entertainment social network. No infinite scroll for fun, no Reels-style feed, no competing for attention. People come with **intent**, get what they need, and leave.

**Design north star:** SPEED. The feed must open already showing relevant jobs, sorted by recency/urgency, with zero friction. Every extra tap before a worker sees "is there work" is a failure.

---

## 2. Tech stack (already decided — do not substitute)

| Layer | Choice | Notes |
|---|---|---|
| App | **Expo + React Native** | iOS + Android, one codebase. |
| Navigation | **Expo Router** | File-based, matches existing OnSite apps. |
| State | **Zustand** | Same as other OnSite apps. Keep it light. |
| Backend | **Supabase** | Auth, Postgres, Storage, Realtime, RLS. Founder will grant project access. |
| Auth | Supabase Auth | Email/password + Apple + Google sign-in. |
| Database | Supabase Postgres | Schema in §5. |
| Images | Supabase Storage + `expo-image-manipulator` | Compress before upload (job/tool/portfolio photos). |
| Chat | **Supabase Realtime** | Real-time messages. This is the only genuinely new/hard piece — see §6. |
| Push | `expo-notifications` | "New message", "someone replied to your post". |
| Payments | **None in v1** | People settle payment off-app. Trust score replaces enforcement. Stripe is phase 2. |
| Geofence/background location | **NOT in v1** | Critical: do NOT add Transistorsoft or background location to v1. It is the #1 cause of App Store rejection and battery complaints. "Verified hours" on the profile can be a phase-2 link to the existing OnSite Timekeeper. For v1, treat experience/hours as self-declared. |

**Why no background location in v1:** the founder spent months fighting Apple over background location in a previous app. This app does not need it to deliver value. Keeping it out = faster build, easy approval, no battery issues.

---

## 3. The three screens (build in THIS order)

Build incrementally. Each screen should work end-to-end before moving on. Match the layout, colors, and copy in `AppMockup.jsx`.

### Screen 1 — PROFILE (build first; simplest, no inter-user interaction)
The mandatory identity. Every user has one, tied to their OnSite account.
- Name, trade (Framing, Drywall, Electrical, Roofing, etc.), years of experience, region.
- **Trust badge** (the green block in the mockup): score, "jobs closed in-app", short trust summary.
- **Stats row**: years · hours · jobs closed. ("Verified hours" label is aspirational/phase-2 — in v1 hours can be self-entered or hidden.)
- **"Available for work" toggle** (green button) — flips a boolean that surfaces the user in the "Available" category of the feed.
- **Portfolio grid**: photos of past work, uploaded via Supabase Storage. "+ Add photo" flow with image compression.

### Screen 2 — JOBS FEED / MARKETPLACE (the heart; build second)
A vertical list of cards, read from Supabase, newest-first. Categories as filter chips: **All / Jobs / Tools / Available**.
- Card types (color-coded label): **JOB** (amber), **TOOL** (blue), **AVAILABLE** (green).
- Each card: optional photo, title, pay, short detail, location, poster's name + **trust score inline (★ rating · N closed)**, time posted, and a **Message** button.
- **URGENT** flag (red) for time-sensitive jobs (starting today/this weekend).
- Header shows a live count: "**N jobs** for this weekend" — reinforce the speed promise.
- The **Post** button (center + in tab bar) opens a create-listing flow: pick type (Job/Tool/Available), title, pay, location, optional photo, post. (This flow isn't drawn in the mockup — build a simple form matching the visual language.)

### Screen 3 — CHAT (build last; the only complex piece)
Real-time 1:1 messaging via Supabase Realtime.
- **Chat list**: avatar, name + **trust ★**, last message, time, unread badge, online dot.
- **Thread**: message bubbles (mine = amber/right, theirs = white/left), timestamps.
- **Job context bar** at top of thread: shows which listing this conversation is about (title + pay) — essential so people remember what they're negotiating.
- **"Close deal" button** + the green nudge: when both parties confirm, it triggers the trust-score flow (see §4).
- Standard input bar with send button.

---

## 4. THE TRUST SYSTEM (the most important mechanic — get this right)

This is what keeps deals inside the app instead of leaking to WhatsApp, and what makes the informal construction market trustworthy.

**Rules:**
- Trust is **bilateral**: both worker AND hirer have a score. After a closed deal, each rates the other.
- A score only grows when a deal is **closed inside the app**. This is the incentive to transact in-app rather than off-platform.
- **"Close deal" requires BOTH sides to confirm** — never one-sided (otherwise people inflate their own score). Flow: Party A taps "Close deal" → Party B gets a prompt to confirm → on mutual confirmation, the deal is recorded and both can rate each other (1–5).
- Display the score everywhere a person appears: feed cards, chat list, chat header, profile.
- **Cold-start problem:** a brand-new user has 0 closed deals. Give them a starting signal so a zero-profile isn't dead on arrival. Options to implement: show "New" badge (honest), and/or surface verified info (trade, years) prominently. (Phase 2: OnSite Timekeeper hours as a trust prior.)

**Data needed:** a `deals` table linking the two users + the listing, a confirmation state machine (`proposed` → `confirmed_by_both` → `rated`), and a `ratings` table. Recompute each user's aggregate score on new rating.

---

## 5. Supabase schema (starting point — the agent should refine)

The founder will grant Supabase project access. Create these tables with **Row Level Security ON for every table** (see §7). Use `auth.uid()` for ownership checks.

```
profiles
  id            uuid PK  (= auth.users.id)
  full_name     text
  trade         text          -- "Framing", "Drywall", etc.
  years_exp     int
  region        text          -- "Ottawa, ON"
  available     boolean default false
  trust_score   numeric default 0     -- aggregate, recomputed from ratings
  deals_closed  int default 0
  created_at    timestamptz default now()

listings
  id            uuid PK
  author_id     uuid FK -> profiles.id
  type          text          -- 'job' | 'tool' | 'available'
  title         text
  pay           text          -- free text ("$34/hr", "$180")
  detail        text
  location      text
  urgent        boolean default false
  photo_url     text          -- Supabase Storage path, nullable
  status        text default 'open'   -- 'open' | 'closed'
  created_at    timestamptz default now()

portfolio_photos
  id            uuid PK
  profile_id    uuid FK -> profiles.id
  photo_url     text
  caption       text
  created_at    timestamptz default now()

conversations
  id            uuid PK
  listing_id    uuid FK -> listings.id   -- the job/tool being discussed
  participant_a uuid FK -> profiles.id
  participant_b uuid FK -> profiles.id
  created_at    timestamptz default now()

messages
  id            uuid PK
  conversation_id uuid FK -> conversations.id
  sender_id     uuid FK -> profiles.id
  body          text
  created_at    timestamptz default now()

deals
  id            uuid PK
  listing_id    uuid FK -> listings.id
  worker_id     uuid FK -> profiles.id
  hirer_id      uuid FK -> profiles.id
  state         text default 'proposed'  -- 'proposed' | 'confirmed' | 'rated'
  proposed_by   uuid
  created_at    timestamptz default now()

ratings
  id            uuid PK
  deal_id       uuid FK -> deals.id
  rater_id      uuid FK -> profiles.id
  ratee_id      uuid FK -> profiles.id
  stars         int           -- 1..5
  created_at    timestamptz default now()

reports                       -- moderation (see §7)
  id            uuid PK
  reporter_id   uuid FK -> profiles.id
  target_type   text          -- 'user' | 'listing' | 'message'
  target_id     uuid
  reason        text
  created_at    timestamptz default now()

blocks                        -- user blocking (see §7)
  id            uuid PK
  blocker_id    uuid FK -> profiles.id
  blocked_id    uuid FK -> profiles.id
  created_at    timestamptz default now()
```

Add indexes on: `listings(created_at desc)`, `listings(type)`, `messages(conversation_id, created_at)`, `conversations(participant_a)`, `conversations(participant_b)`.

---

## 6. The chat (Supabase Realtime) — implementation notes

This is the only genuinely new/hard piece. Keep it simple:
- Subscribe to new rows in `messages` filtered by `conversation_id` using Supabase Realtime.
- On send: insert a row into `messages`; the subscription delivers it to both clients.
- Load history with a normal paginated query (most recent N, scroll up for older).
- Online/last-seen and typing indicators are **nice-to-have, not v1-critical** — ship without them if time-constrained.
- Trigger a push notification (`expo-notifications`) when a message arrives and the recipient isn't in the thread.

---

## 7. NON-NEGOTIABLE: safety, moderation, store approval

Because users communicate and meet in real life, these are **required for App Store / Play Store approval** — not optional. Apple rejects user-generated-content apps without them.

1. **Block user** — `blocks` table; blocked users' content and messages are hidden from the blocker.
2. **Report** — `reports` table; report a user, listing, or message. (Moderation can be manual at 100 users — founder reviews reports in the Supabase dashboard. No fancy tooling needed yet.)
3. **Terms of use + community guidelines** — must state that the app *connects* people but deals/meetings are at users' own risk (legal protection).
4. **Account deletion** — Apple requires in-app account deletion for any app with accounts.
5. **RLS on every table** — users can only read/write their own data, except public-by-design data (open listings, public profile fields). Messages readable only by conversation participants. This is the security backbone — do not skip.

---

## 8. Scale & reliability target: ~100 active users

This is **deliberately small**, and that simplifies everything:
- **Do not over-engineer.** No microservices, no caching layers, no sharding. Plain Supabase queries are far more than enough for 100 users.
- **Online-first is fine.** Unlike the old Timekeeper (which had a fragile offline-sync layer — see ARCHITECTURE_AUDIT.md), this app reads/writes directly to Supabase. The server is the source of truth; the app reflects it. This is simpler and less bug-prone. Do NOT build a complex local-sync/SQLite layer.
- **Reliability > features.** With 100 hand-picked Ottawa users, a crash or a lost message is very visible. Prioritize: posting a job works every time, messages always arrive, photos always upload. Polish the core loop; skip the extras.
- **Light moderation by hand.** At this size the founder moderates reports manually. Build the report/block plumbing; don't build automated moderation.

---

## 9. Build order (suggested milestones)

1. **Auth + Profile** — sign in, create/edit profile, upload portfolio photos, availability toggle.
2. **Listings (Feed + Post)** — create a listing with photo, read the feed with category filters, newest-first.
3. **Chat** — conversations + real-time messages + job-context bar + push notifications.
4. **Trust system** — close-deal (mutual confirmation), ratings, score display everywhere.
5. **Safety** — block, report, terms, account deletion.
6. **Polish** — empty states, loading states, error handling, the speed-focused feed header.

Ship 1–2 first as a testable slice; don't build all six in parallel (that's how the old codebase became a Frankenstein).

---

## 10. Visual language (from AppMockup.jsx — keep consistent)

- **Light mode only.**
- **Colors:** background `#F4F5F7`, cards white, ink `#16181D`, safety amber `#FFB300` (primary action/accent), trust/verified green `#13A463`, urgent red `#E8442B`.
- **Type:** condensed display face (Arial Narrow / Oswald) for the wordmark, numbers, and stats; Inter for body. Numbers (pay, hours, scores) use the condensed face for an industrial feel.
- **Signature element:** the amber-and-black hazard stripe at the top of the screen (construction tape). Keep it.
- **Tone of copy:** plain, direct, worker-to-worker. "Available for work", "Close deal", "Message" — active verbs, no fluff. Same verb through a whole flow (the "Close deal" button leads to a "Deal closed" state).
- **Tab bar:** Jobs · Post (center +) · Messages · Profile.

---

## 11. Out of scope for v1 (do NOT build these — they're phase 2+)

- Background location / geofencing / Transistorsoft.
- BLE tool tracking.
- The "Wrapped"/retrospect, titles, rankings, leaderboards.
- Trade-language reactions ("on the square", "plumb").
- The humor/memes section.
- In-app payments (Stripe).
- B2B / company-fleet version.
- Offline-first / local SQLite sync.

If something isn't in §3–§7, it's probably out of scope. Ask before adding.

---

*Build the core loop — post a job, find it fast, message, close the deal, earn trust — rock-solid for 100 people in Ottawa. Everything else waits.*
