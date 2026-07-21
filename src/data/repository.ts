// Data access facade. Every screen reads/writes through these functions.
//
// Backed by Supabase (`yoinkr` schema on onsite-core; DDL lives in the
// onsite-core-db repo). Reads of public data (open listings, profiles,
// references) work without a session; writes ensure an anonymous session
// first (see src/data/supabase.ts). Chat runs on Supabase Realtime.
//
// Reputation numbers (avg stars, deals closed, vouch count) come from the
// yoinkr.profile_stats view — the profile row stores no aggregates. Screens
// therefore get them via a batched second query (statsFor), keyed by user id.
import type { CategoryId, PayModel } from "./categories";
import { payLabel } from "./categories";
import type {
  Application,
  ChatSummary,
  Deal,
  Listing,
  ListingType,
  PortfolioPhoto,
  Profile,
  Reference,
  ThreadMessage,
  Vouch,
} from "./types";
import { currentUserId, ensureUserId, supabase } from "./supabase";

// ---- mapping helpers ----

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// ---- reputation stats (profile_stats view) ----

export interface ProfileStats {
  trustScore: number | null; // null until 3+ ratings (enforced by the view)
  ratingCount: number;
  dealsClosed: number;
  vouchCount: number;
}

const NO_STATS: ProfileStats = { trustScore: null, ratingCount: 0, dealsClosed: 0, vouchCount: 0 };

/* eslint-disable @typescript-eslint/no-explicit-any */
async function statsFor(ids: string[]): Promise<Record<string, ProfileStats>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase
    .from("profile_stats")
    .select("*")
    .in("profile_id", unique);
  if (error) throw error;
  const map: Record<string, ProfileStats> = {};
  for (const r of data ?? []) {
    map[r.profile_id] = {
      trustScore: r.avg_stars != null ? Number(r.avg_stars) : null,
      ratingCount: r.rating_count ?? 0,
      dealsClosed: r.deals_closed ?? 0,
      vouchCount: r.vouch_count ?? 0,
    };
  }
  return map;
}

function mapProfile(row: any, stats: ProfileStats): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    categories: (row.categories ?? []) as CategoryId[],
    hires: !!row.hires,
    yearsExp: row.years_exp ?? 0,
    region: row.region ?? "Ottawa, ON",
    available: !!row.available,
    acceptsHourly: row.accepts_hourly ?? true,
    acceptsPiecework: !!row.accepts_piecework,
    crewSize: row.crew_size ?? 1,
    trustScore: stats.trustScore,
    ratingCount: stats.ratingCount,
    dealsClosed: stats.dealsClosed,
    vouchCount: stats.vouchCount,
    verified: !!row.verified,
    createdAt: row.created_at,
  };
}

function mapListing(row: any, myId: string | null, stats: Record<string, ProfileStats>): Listing {
  const apps: any[] = row.applications ?? [];
  const s = stats[row.author_id] ?? NO_STATS;
  const sqft = row.sqft != null ? Number(row.sqft) : null;
  const crewSize = row.crew_size ?? 1;
  // Fold sqft + crew into the meta line so cards stay a single "pay · detail".
  const detail = [
    sqft ? `${sqft.toLocaleString("en-CA")} sqft` : null,
    crewSize === 2 ? (row.type === "job" ? "crew of 2" : "duo") : null,
    row.detail || null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    id: row.id,
    authorId: row.author_id,
    type: row.type as ListingType,
    category: (row.category as CategoryId) ?? null,
    payModel: (row.pay_model as PayModel) ?? null,
    rate: row.rate != null ? Number(row.rate) : null,
    sqft,
    crewSize,
    pay: payLabel(row.pay_model ?? null, row.rate != null ? Number(row.rate) : null),
    title: row.title,
    detail,
    description: row.description ?? "",
    city: row.city,
    location: row.location,
    distanceKm: row.distance_km != null ? Number(row.distance_km) : undefined,
    urgent: !!row.urgent,
    photoUrl: row.photo_url,
    status: row.status,
    createdAt: row.created_at,
    when: timeAgo(row.created_at),
    author: {
      fullName: row.author?.full_name ?? "—",
      trustScore: s.trustScore,
      dealsClosed: s.dealsClosed,
      verified: !!row.author?.verified,
    },
    // RLS already limits application rows to "mine or on my listing".
    applicants: apps.length,
    appliedByMe: myId ? apps.some((a) => a.applicant_id === myId) : false,
    mine: myId != null && row.author_id === myId,
  };
}

const LISTING_SELECT = "*, author:profiles(full_name,verified), applications(applicant_id)";

// ---- Profile ----

export async function getMyProfile(): Promise<Profile> {
  const uid = await ensureUserId();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).single();
  if (error) throw error;
  const stats = await statsFor([uid]);
  return mapProfile(data, stats[uid] ?? NO_STATS);
}

export async function updateMyProfile(input: {
  fullName: string;
  categories: CategoryId[];
  hires: boolean;
  yearsExp: number;
  acceptsHourly: boolean;
  acceptsPiecework: boolean;
  crewSize: number;
}): Promise<Profile> {
  const uid = await ensureUserId();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      categories: input.categories,
      hires: input.hires,
      years_exp: input.yearsExp,
      accepts_hourly: input.acceptsHourly,
      accepts_piecework: input.acceptsPiecework,
      crew_size: input.crewSize,
    })
    .eq("id", uid)
    .select()
    .single();
  if (error) throw error;
  const stats = await statsFor([uid]);
  return mapProfile(data, stats[uid] ?? NO_STATS);
}

// Complete = named, plus a role: worker profiles carry categories; a pure
// hirer completes with the name alone (hires = true).
export function isProfileIncomplete(p: Profile): boolean {
  return p.fullName === "New worker" || (p.categories.length === 0 && !p.hires);
}

export async function setAvailability(available: boolean): Promise<Profile> {
  const uid = await ensureUserId();
  const { data, error } = await supabase
    .from("profiles")
    .update({ available })
    .eq("id", uid)
    .select()
    .single();
  if (error) throw error;
  const stats = await statsFor([uid]);
  return mapProfile(data, stats[uid] ?? NO_STATS);
}

export async function getProfile(profileId: string): Promise<Profile | undefined> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const stats = await statsFor([profileId]);
  return mapProfile(data, stats[profileId] ?? NO_STATS);
}

export async function getPortfolio(profileId: string): Promise<PortfolioPhoto[]> {
  // "me" = the signed-in user (kept for the Profile tab call site).
  const id = profileId === "me" ? await ensureUserId() : profileId;
  const { data, error } = await supabase
    .from("portfolio_photos")
    .select("*")
    .eq("profile_id", id)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    profileId: r.profile_id,
    photoUrl: r.photo_url,
    caption: r.caption ?? "",
  }));
}

// Ratings the server has revealed (double-blind: hidden until both sides
// rated the deal, or 14 days pass — RLS decides, not the client).
export async function getReferences(profileId: string): Promise<Reference[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select("*, rater:profiles!ratings_rater_id_fkey(full_name)")
    .eq("ratee_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    profileId: r.ratee_id,
    raterName: r.rater?.full_name ?? "—",
    stars: r.stars,
    comment: r.comment ?? "",
    when: timeAgo(r.created_at),
  }));
}

// ---- Listings / feed ----
// Two filter axes (type + category) scoped to a city (region gate). "Workers"
// maps to the `available` listing type; category is ignored for tools.
export type TypeFilter = "All" | "Jobs" | "Workers" | "Tools";
export interface FeedFilter {
  type: TypeFilter;
  category: CategoryId | "All";
  city: string;
}

export async function getListings(filter: FeedFilter): Promise<Listing[]> {
  const typeFor: Record<TypeFilter, ListingType | null> = {
    All: null,
    Jobs: "job",
    Workers: "available",
    Tools: "tool",
  };
  const myId = await currentUserId();
  let q = supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "open")
    .eq("city", filter.city)
    .order("created_at", { ascending: false });
  const wantedType = typeFor[filter.type];
  if (wantedType) q = q.eq("type", wantedType);
  if (filter.category !== "All") q = q.eq("category", filter.category);
  const { data, error } = await q;
  if (error) throw error;
  const rows = data ?? [];
  const stats = await statsFor(rows.map((r: any) => r.author_id));
  return rows.map((r) => mapListing(r, myId, stats));
}

export async function getListing(id: string): Promise<Listing | undefined> {
  const myId = await currentUserId();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const stats = await statsFor([data.author_id]);
  return mapListing(data, myId, stats);
}

export async function getWeekendJobCount(city: string): Promise<number> {
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "open")
    .eq("type", "job")
    .eq("city", city);
  if (error) throw error;
  return count ?? 0;
}

export interface NewListing {
  type: ListingType;
  category: CategoryId | null;
  payModel: PayModel | null;
  rate: number | null;
  sqft: number | null;
  crewSize: number;
  title: string;
  detail: string;
  description: string;
  city: string;
  location: string;
  urgent: boolean;
  photoUrl: string | null;
}

export async function createListing(input: NewListing): Promise<Listing> {
  const uid = await ensureUserId();
  const { data, error } = await supabase
    .from("listings")
    .insert({
      author_id: uid,
      type: input.type,
      category: input.category,
      pay_model: input.payModel,
      rate: input.rate,
      sqft: input.sqft,
      crew_size: input.crewSize,
      title: input.title,
      detail: input.detail,
      description: input.description,
      city: input.city,
      location: input.location,
      urgent: input.urgent,
      photo_url: input.photoUrl,
    })
    .select(LISTING_SELECT)
    .single();
  if (error) throw error;
  const stats = await statsFor([uid]);
  return mapListing(data, uid, stats);
}

// ---- Applications (worker → job proposals) ----

export async function getApplications(listingId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*, applicant:profiles(full_name,categories,years_exp,verified)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const stats = await statsFor(rows.map((a: any) => a.applicant_id));
  return rows.map((a: any) => {
    const s = stats[a.applicant_id] ?? NO_STATS;
    return {
      id: a.id,
      listingId: a.listing_id,
      applicantId: a.applicant_id,
      message: a.message,
      proposedRate: a.proposed_rate ?? "",
      status: a.status,
      when: timeAgo(a.created_at),
      createdAt: a.created_at,
      applicant: {
        fullName: a.applicant?.full_name ?? "—",
        categories: (a.applicant?.categories ?? []) as CategoryId[],
        yearsExp: a.applicant?.years_exp ?? 0,
        trustScore: s.trustScore,
        dealsClosed: s.dealsClosed,
        verified: !!a.applicant?.verified,
      },
    };
  });
}

export async function applyToListing(
  listingId: string,
  message: string,
  proposedRate: string
): Promise<void> {
  const uid = await ensureUserId();
  const { error } = await supabase.from("applications").insert({
    listing_id: listingId,
    applicant_id: uid,
    message,
    proposed_rate: proposedRate,
  });
  // 23505 = unique violation: already applied — treat as success (idempotent).
  if (error && error.code !== "23505") throw error;
}

// ---- Deals (accept → done → rate) ----

function mapDeal(row: any): Deal {
  return {
    id: row.id,
    listingId: row.listing_id,
    applicationId: row.application_id,
    workerId: row.worker_id,
    hirerId: row.hirer_id,
    state: row.state,
    createdAt: row.created_at,
  };
}

// Accepting is what creates the deal: the job's author (hirer) takes the
// applicant (worker). Idempotent — re-accepting returns the existing deal.
export async function acceptApplication(application: Application): Promise<Deal> {
  const uid = await ensureUserId();
  const { error: statusErr } = await supabase
    .from("applications")
    .update({ status: "accepted" })
    .eq("id", application.id);
  if (statusErr) throw statusErr;

  const { data, error } = await supabase
    .from("deals")
    .insert({
      listing_id: application.listingId,
      application_id: application.id,
      worker_id: application.applicantId,
      hirer_id: uid,
      state: "agreed",
      proposed_by: uid,
    })
    .select()
    .single();
  if (!error) return mapDeal(data);
  if (error.code !== "23505") throw error; // unique(application_id) → already accepted
  const { data: existing, error: findErr } = await supabase
    .from("deals")
    .select("*")
    .eq("application_id", application.id)
    .single();
  if (findErr) throw findErr;
  return mapDeal(existing);
}

export async function declineApplication(applicationId: string): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({ status: "declined" })
    .eq("id", applicationId);
  if (error) throw error;
}

// The deal between me and `otherId` about `listingId` (chat banner lookup).
// RLS already scopes deals to my own, so filtering by the other party is safe.
export async function getDealWith(otherId: string, listingId: string): Promise<Deal | undefined> {
  await ensureUserId();
  const { data, error } = await supabase.from("deals").select("*").eq("listing_id", listingId);
  if (error) throw error;
  const row = (data ?? []).find((d: any) => d.worker_id === otherId || d.hirer_id === otherId);
  return row ? mapDeal(row) : undefined;
}

export async function markDealDone(dealId: string): Promise<void> {
  const { error } = await supabase.from("deals").update({ state: "done" }).eq("id", dealId);
  if (error) throw error;
}

// My side of the double-blind rating (RLS always shows me my own rating).
export async function getMyRatingForDeal(dealId: string): Promise<boolean> {
  const uid = await ensureUserId();
  const { data, error } = await supabase
    .from("ratings")
    .select("id")
    .eq("deal_id", dealId)
    .eq("rater_id", uid)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function rateDeal(deal: Deal, stars: number, comment: string): Promise<void> {
  const uid = await ensureUserId();
  const rateeId = deal.workerId === uid ? deal.hirerId : deal.workerId;
  const { error } = await supabase.from("ratings").insert({
    deal_id: deal.id,
    rater_id: uid,
    ratee_id: rateeId,
    stars,
    comment,
  });
  if (error && error.code !== "23505") throw error; // already rated → idempotent
  // Both sides in? Close the loop. (Counterpart rows become visible to me the
  // moment mine lands — the reveal rule — so this count is reliable.)
  const { count } = await supabase
    .from("ratings")
    .select("id", { count: "exact", head: true })
    .eq("deal_id", deal.id);
  if ((count ?? 0) >= 2) {
    await supabase.from("deals").update({ state: "rated" }).eq("id", deal.id);
  }
}

// ---- Vouches (named peer endorsements) ----

export async function getVouches(profileId: string): Promise<Vouch[]> {
  const { data, error } = await supabase
    .from("vouches")
    .select("*, voucher:profiles!vouches_voucher_id_fkey(full_name,verified)")
    .eq("vouchee_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const stats = await statsFor(rows.map((v: any) => v.voucher_id));
  return rows.map((v: any) => ({
    id: v.id,
    voucherId: v.voucher_id,
    voucheeId: v.vouchee_id,
    category: v.category as CategoryId,
    comment: v.comment ?? "",
    when: timeAgo(v.created_at),
    voucher: {
      fullName: v.voucher?.full_name ?? "—",
      trustScore: (stats[v.voucher_id] ?? NO_STATS).trustScore,
      verified: !!v.voucher?.verified,
    },
  }));
}

export async function haveIVouched(voucheeId: string): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  const { data, error } = await supabase
    .from("vouches")
    .select("id")
    .eq("voucher_id", uid)
    .eq("vouchee_id", voucheeId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function addVouch(
  voucheeId: string,
  category: CategoryId,
  comment: string
): Promise<void> {
  const uid = await ensureUserId();
  const { error } = await supabase.from("vouches").insert({
    voucher_id: uid,
    vouchee_id: voucheeId,
    category,
    comment,
  });
  // one vouch per (voucher, vouchee) — re-vouching is a no-op.
  if (error && error.code !== "23505") throw error;
}

export async function removeVouch(voucheeId: string): Promise<void> {
  const uid = await ensureUserId();
  const { error } = await supabase
    .from("vouches")
    .delete()
    .eq("voucher_id", uid)
    .eq("vouchee_id", voucheeId);
  if (error) throw error;
}

// ---- Reports (founder reviews these in the dashboard — no client read) ----

export type ReportKind = "non_payment" | "no_show" | "abuse" | "spam" | "other";

export async function reportUser(
  targetId: string,
  kind: ReportKind,
  reason: string,
  dealId?: string
): Promise<void> {
  const uid = await ensureUserId();
  const { error } = await supabase.from("reports").insert({
    reporter_id: uid,
    target_type: "user",
    target_id: targetId,
    kind,
    reason,
    deal_id: dealId ?? null,
  });
  if (error) throw error;
}

// ---- Chat (Supabase + Realtime) ----

const CONV_SELECT = `*,
  a:profiles!conversations_participant_a_fkey(id,full_name),
  b:profiles!conversations_participant_b_fkey(id,full_name),
  listing:listings(id,title,detail,pay_model,rate),
  messages(body,sender_id,created_at)`;

function mapChat(row: any, uid: string, stats: Record<string, ProfileStats>): ChatSummary {
  const other = row.a?.id === uid ? row.b : row.a;
  const last = (row.messages ?? [])[0];
  const myLastRead = row.a?.id === uid ? row.a_last_read : row.b_last_read;
  const unread =
    last && last.sender_id !== uid && new Date(last.created_at) > new Date(myLastRead) ? 1 : 0;
  return {
    id: row.id,
    conversationId: row.id,
    otherId: other?.id ?? "",
    listingId: row.listing_id ?? null,
    name: other?.full_name ?? "—",
    avatar: (other?.full_name ?? "?")[0],
    trust: (stats[other?.id] ?? NO_STATS).trustScore,
    lastMessage: last?.body ?? "Say hi 👋",
    when: last ? timeAgo(last.created_at) : timeAgo(row.created_at),
    unread,
    online: false, // presence is a nice-to-have — not v1
    jobContext: row.listing
      ? {
          title: row.listing.title,
          pay: payLabel(row.listing.pay_model ?? null, row.listing.rate != null ? Number(row.listing.rate) : null),
          detail: row.listing.detail ?? "",
        }
      : undefined,
  };
}

export async function getChats(): Promise<ChatSummary[]> {
  const uid = await ensureUserId();
  const { data, error } = await supabase
    .from("conversations")
    .select(CONV_SELECT)
    .or(`participant_a.eq.${uid},participant_b.eq.${uid}`)
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" });
  if (error) throw error;
  // Most recent activity first (last message, falling back to creation time).
  const rows = (data ?? []).sort((x: any, y: any) => {
    const lx = x.messages?.[0]?.created_at ?? x.created_at;
    const ly = y.messages?.[0]?.created_at ?? y.created_at;
    return lx < ly ? 1 : -1;
  });
  const stats = await statsFor(
    rows.map((r: any) => (r.a?.id === uid ? r.b?.id : r.a?.id)).filter(Boolean)
  );
  return rows.map((r) => mapChat(r, uid, stats));
}

export async function getChat(conversationId: string): Promise<ChatSummary | undefined> {
  const uid = await ensureUserId();
  const { data, error } = await supabase
    .from("conversations")
    .select(CONV_SELECT)
    .eq("id", conversationId)
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const otherId = (data as any).a?.id === uid ? (data as any).b?.id : (data as any).a?.id;
  const stats = await statsFor(otherId ? [otherId] : []);
  return mapChat(data, uid, stats);
}

// Find or start the conversation between me and `otherId` about `listingId`
// (null = general, profile-to-profile). Used by every "Message" button.
export async function getOrCreateConversation(
  otherId: string,
  listingId: string | null
): Promise<string> {
  const uid = await ensureUserId();
  let q = supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_a.eq.${uid},participant_b.eq.${otherId}),and(participant_a.eq.${otherId},participant_b.eq.${uid})`
    );
  q = listingId ? q.eq("listing_id", listingId) : q.is("listing_id", null);
  const { data: existing, error: findErr } = await q.maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ participant_a: uid, participant_b: otherId, listing_id: listingId })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

export async function getThread(conversationId: string): Promise<ThreadMessage[]> {
  const uid = await ensureUserId();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  void markRead(conversationId);
  return (data ?? []).map((m: any) => ({
    id: m.id,
    me: m.sender_id === uid,
    text: m.body,
    at: timeAgo(m.created_at),
  }));
}

export async function sendMessage(conversationId: string, text: string): Promise<ThreadMessage> {
  const uid = await ensureUserId();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: uid, body: text })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, me: true, text: data.body, at: "now" };
}

// Mark the conversation read for my side (two conditional updates — only the
// one matching my seat takes effect; RLS restricts to participants anyway).
export async function markRead(conversationId: string): Promise<void> {
  const uid = await ensureUserId();
  const now = new Date().toISOString();
  await supabase
    .from("conversations")
    .update({ a_last_read: now })
    .eq("id", conversationId)
    .eq("participant_a", uid);
  await supabase
    .from("conversations")
    .update({ b_last_read: now })
    .eq("id", conversationId)
    .eq("participant_b", uid);
}

// Live INSERT stream for one conversation. Returns an unsubscribe fn.
export function subscribeToThread(
  conversationId: string,
  onMessage: (msg: ThreadMessage & { senderId: string }) => void,
  myId: string
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "yoinkr",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const m = payload.new as any;
        onMessage({
          id: m.id,
          me: m.sender_id === myId,
          senderId: m.sender_id,
          text: m.body,
          at: timeAgo(m.created_at),
        });
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
