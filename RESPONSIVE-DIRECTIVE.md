# YOINKR — RESPONSIVE DIRECTIVE
### Make the app adapt from phone to desktop · v1.0

**Stack context:** Expo / React Native Web (Metro on :8081). One codebase, three targets: iOS, Android, web.
**Current state:** mobile layout stretched full-width on desktop — cards span 1900px, bottom tab bar spans the whole screen, FAB floats mid-screen.
**Goal:** mobile-first responsive system with three modes. No visual redesign — same brand (Site Orange), same components, adaptive layout.

---

## 1. Breakpoints (single source of truth)

Create `src/lib/responsive.ts`:

```ts
import { useWindowDimensions } from 'react-native';

export const BP = { md: 768, lg: 1024 } as const;

export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const mode: LayoutMode =
    width >= BP.lg ? 'desktop' : width >= BP.md ? 'tablet' : 'mobile';
  return {
    width, height, mode,
    isMobile: mode === 'mobile',
    isTablet: mode === 'tablet',
    isDesktop: mode === 'desktop',
    // content column width for feed-style screens:
    contentWidth: Math.min(width, 720),
  };
}
```

Rules:
- **Never** read `Dimensions.get()` directly in components — always this hook (it re-renders on resize/rotation; `Dimensions.get` does not).
- **Never** hardcode pixel widths in screens. Only `BP` and `contentWidth`.
- Base styles = mobile. Tablet/desktop are additive overrides. Mobile-first, always.

---

## 2. Navigation: component swap, not resize

The bottom tab bar is a mobile-only component. Per Material guidance: bottom nav (mobile) → navigation rail (tablet) → sidebar (desktop).

| Mode | Primary nav | Post action |
|---|---|---|
| mobile (<768) | Bottom tab bar: Jobs · [FAB +] · Messages · Profile | Floating FAB, center-docked |
| tablet (768–1023) | **Nav rail**: 72px fixed left column, icons + labels, brand mark on top | "+" button at top of rail |
| desktop (≥1024) | **Sidebar**: 240px fixed left column — lockup, nav items with labels, Ottawa selector | Solid "Post a job" button (accent, full-width of sidebar) |

Implementation:
- `AppShell` component wraps every screen. It reads `useResponsive().mode` and renders `<BottomTabs/>`, `<NavRail/>`, or `<Sidebar/>` + a content slot.
- The FAB component renders `null` when `!isMobile`.
- Header: on mobile keep current (logo + Ottawa chip + search icon). On desktop the logo/Ottawa move into the sidebar; the top of the content column keeps only the context line ("4 jobs for this weekend in Ottawa") + a real search input (not icon-only — there is room).

---

## 3. Content layout

### Feed (Jobs / Workers / Tools)
- **mobile:** current single column, cards full-width minus 16px gutters.
- **tablet:** single column, `maxWidth: 720`, centered.
- **desktop:** single column `maxWidth: 720` centered in the content area (to the right of sidebar). *Do not* do a multi-column masonry feed in v1 — it breaks scan rhythm and doubles the card variants to maintain.

### Detail screens (job detail, worker profile)
- mobile: full-screen push (current behavior).
- desktop: render as centered modal/panel `maxWidth: 640` over the feed (list stays visible behind). If routing makes this expensive, fallback: full page with `maxWidth: 720` centered. Modal is nice-to-have, not blocker.

### Filter chips (type row + trade row)
- mobile: horizontal `ScrollView`, current behavior.
- md+: chips fit inline, no scroll; left-aligned with the content column.

---

## 4. Component-level rules

Responsiveness is a property of the component, not the page. Each component decides its own layout from the space it receives (pass `mode` via context from AppShell, or measure with `onLayout` where needed).

**JobCard / WorkerCard:**
- mobile: stacked — image top (16:9), content below. (Current desktop screenshot shows horizontal image-left; keep that ONLY when card width ≥ 560px.)
- ≥560px card width: horizontal — image left (fixed 200px), content right.
- "Yoink it" button: full-width at bottom on mobile; right-aligned inline on horizontal layout.

**Touch targets:** min 44×44 (48 preferred) on ALL modes — web included. Min 8px spacing between adjacent targets. Do not shrink buttons on desktop.

**Typography:** do not scale fonts by screen width. Fixed scale: title 16, body 13–14, meta 11–12 (as today). Desktop gets more whitespace, not bigger text.

---

## 5. Known bug (fix in same pass)

First feed card renders literal `44` in title, subtitle and location, with avatar "New worker". Placeholder/seed data is leaking through the card bind — check the mock data mapper for missing fields defaulting to an id or count. Cards with incomplete data should not render in the feed at all.

---

## 6. Implementation order

1. `useResponsive` hook + `BP` constants (`src/lib/responsive.ts`).
2. `AppShell` with the three nav variants (BottomTabs / NavRail / Sidebar). FAB hidden when not mobile.
3. Feed content column: `contentWidth` cap + centering (this alone kills 80% of the "stretched" look).
4. JobCard adaptive layout (stacked ↔ horizontal at 560px card width).
5. Filter chips inline at md+.
6. Header simplification on desktop (search input, context line).
7. Fix the `44` seed-data bug.
8. QA matrix: 375 (iPhone SE-ish), 390, 768, 1024, 1440. Resize the browser window across breakpoints — layout must swap live without reload.

## 7. Out of scope (do not do)

- No multi-column feed grid.
- No font scaling by viewport.
- No separate web-only codebase or `.web.tsx` forks unless a component is impossible to share (try props/context first).
- No new colors, radii, or type styles — this is layout only.
