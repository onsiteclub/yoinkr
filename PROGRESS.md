# Yoinkr — build progress

Implementation of the app described in `HANDOFF.md`, visual reference `AppMockup.jsx`.
Stack: Expo SDK 53 + React Native 0.79 + Expo Router 5 + Zustand (matching onsite-timekeeper).

## Product model (updated 2026-07-01)
Freelance-marketplace hybrid (Upwork/Fiverr/Workana style), carpentry-focused, **Ottawa-only at launch**:
- Feed with two filter axes: type (All / Jobs / Workers / Tools) + trade (Framing / Roofing / Backframe / General Labor).
- Workers post availability AND apply to jobs; employers post jobs AND browse worker profiles.
- Tools/sales = secondary "plus" (just a chip).
- Region picker: Ottawa LIVE, other CA cities "coming soon" (empty state + banner).
- Reputation: bilateral stars + written references (Uber-style), shown on public profiles.

### Added since the first skeleton
- Rename ZYBY → Yoinkr everywhere.
- `src/data/trades.ts`, `src/data/regions.ts`, `src/store/useRegion.ts`, `app/region.tsx` (region modal).
- Two-axis feed filters + trade tags on cards (`app/(tabs)/index.tsx`, `FeedCard`).
- Public profile `app/worker/[id].tsx`: identity, trust block (or NEW badge), references list, work photos, Message. Author row on any card opens the poster's profile.
- Apply flow: `app/apply/[id].tsx` (proposal modal: message + optional rate), `app/applicants/[id].tsx` (employer sees applicants w/ trust + proposed rate). Job cards: Apply / Applied ✓ / Applicants (N).
- Gotcha: expo-router typed routes go stale when the dev server is down → use object-form `router.push({ pathname, params })`.

## ✅ Done (v1 skeleton, mock data)

All three screens build and bundle clean (`npx tsc --noEmit` + `expo export` both pass).

- **Project scaffold** — `package.json`, `app.json`, `tsconfig.json` (with `@/*` → `src/*`), `babel.config.js`, `.gitignore`.
- **Theme** — `src/theme/colors.ts` (the mockup palette), `src/theme/fonts.ts` (condensed display vs body).
- **Navigation** — Expo Router file-based:
  - `app/_layout.tsx` — root Stack (tabs + chat thread + post modal).
  - `app/(tabs)/_layout.tsx` — Tabs with a **custom tab bar** (`src/components/TabBar.tsx`): Jobs · Post (elevated center +) · Messages · Profile. The center + routes to the Post modal.
- **Screen 1 — Profile** (`app/(tabs)/profile.tsx`): identity, trust badge, stats row, **Available-for-work toggle** (live), portfolio grid.
- **Screen 2 — Feed** (`app/(tabs)/index.tsx`): category chips (All/Jobs/Tools/Available), newest-first cards, weekend job count header, refetch-on-focus. **Post** flow (`app/post.tsx`): type picker, title/pay/detail/location, urgent toggle, creates a listing.
- **Screen 3 — Chat**: list (`app/(tabs)/messages.tsx`) + thread (`app/chat/[id].tsx`) with the **job-context bar**, **Close deal** button, message bubbles, working input that appends to the mock thread.
- **Shared components** — `Header` (hazard stripe + wordmark + Ottawa chip), `Avatar`, `Verified`, `TrustInline` (incl. NEW badge for cold-start), `Badge` (type + urgent), `FeedCard`, `Placeholder` (gradient stand-in for photos), `PressableScale`, `HazardStripe`.

### Data layer — the key design for the Supabase swap
Screens never touch mock data directly. They call **`src/data/repository.ts`**, an async facade that today resolves from `src/data/mock.ts`. Types in `src/data/types.ts` already mirror the HANDOFF §5 schema. When Supabase is added, **only `repository.ts` changes** — each function becomes a query.

## ⏳ Not done yet (deliberately deferred)

- **Supabase** (waiting on the new project + keys). See plan below.
- **Auth** (Supabase Auth — email + Apple + Google).
- **Real photos** (Supabase Storage + `expo-image-manipulator` compression). Today photos are gradient placeholders (`Placeholder`).
- **Trust system write path** — Close deal is UI-only; mutual confirmation → ratings → score recompute needs the `deals`/`ratings` tables.
- **Realtime chat** — currently local mock; needs Supabase Realtime subscription on `messages`.
- **Push** (`expo-notifications`), **safety** (block / report / terms / account deletion), **app icons/splash**.

## 🔌 When Supabase keys arrive
1. `npx expo install @supabase/supabase-js @react-native-async-storage/async-storage` (async-storage already in).
2. Add `src/data/supabase.ts` (client from `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`).
3. Rewrite `src/data/repository.ts` functions as Supabase queries (signatures stay identical → screens untouched).
4. Run the schema in HANDOFF §5 with **RLS on every table**.

## Run it
```
npm install
npx expo start        # press w for web, or scan QR for device
```
