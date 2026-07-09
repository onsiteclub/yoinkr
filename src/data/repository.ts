// Data access facade. Every screen reads/writes through these functions.
//
// Backed by Supabase (schema in supabase/migrations/). Reads of public data
// (open listings, profiles, references) work without a session; writes ensure
// an anonymous session first (see src/data/supabase.ts). Chat is still mock —
// it moves to Supabase Realtime next.
import type {
  Application,
  ChatSummary,
  Listing,
  ListingType,
  PortfolioPhoto,
  Profile,
  Reference,
  ThreadMessage,
} from "./types";
import type { TradeId } from "./trades";
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProfile(row: any): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    trade: row.trade ?? "",
    yearsExp: row.years_exp ?? 0,
    region: row.region ?? "Ottawa, ON",
    available: !!row.available,
    trustScore: Number(row.trust_score ?? 0),
    dealsClosed: row.deals_closed ?? 0,
    verified: !!row.verified,
    createdAt: row.created_at,
  };
}

function mapListing(row: any, myId: string | null): Listing {
  const apps: any[] = row.applications ?? [];
  return {
    id: row.id,
    authorId: row.author_id,
    type: row.type as ListingType,
    trade: (row.trade as TradeId) ?? null,
    title: row.title,
    pay: row.pay,
    detail: row.detail ?? "",
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
      trustScore: Number(row.author?.trust_score ?? 0),
      dealsClosed: row.author?.deals_closed ?? 0,
      verified: !!row.author?.verified,
    },
    // RLS already limits application rows to "mine or on my listing".
    applicants: apps.length,
    appliedByMe: myId ? apps.some((a) => a.applicant_id === myId) : false,
    mine: myId != null && row.author_id === myId,
  };
}

const LISTING_SELECT =
  "*, author:profiles(full_name,trust_score,deals_closed,verified), applications(applicant_id)";

// ---- Profile ----

export async function getMyProfile(): Promise<Profile> {
  const uid = await ensureUserId();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).single();
  if (error) throw error;
  return mapProfile(data);
}

export async function updateMyProfile(input: {
  fullName: string;
  trade: string;
  yearsExp: number;
}): Promise<Profile> {
  const uid = await ensureUserId();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName, trade: input.trade, years_exp: input.yearsExp })
    .eq("id", uid)
    .select()
    .single();
  if (error) throw error;
  return mapProfile(data);
}

// Default profiles (fresh anonymous users) still carry the DB default name.
export function isProfileIncomplete(p: Profile): boolean {
  return p.fullName === "New worker" || !p.trade;
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
  return mapProfile(data);
}

export async function getProfile(profileId: string): Promise<Profile | undefined> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : undefined;
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

export async function getReferences(profileId: string): Promise<Reference[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select("*, rater:profiles!ratings_rater_id_fkey(full_name,trust_score)")
    .eq("ratee_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    profileId: r.ratee_id,
    raterName: r.rater?.full_name ?? "—",
    raterTrust: Number(r.rater?.trust_score ?? 0),
    stars: r.stars,
    comment: r.comment ?? "",
    when: timeAgo(r.created_at),
  }));
}

// ---- Listings / feed ----
// Two filter axes (type + trade) scoped to a city (region gate). "Workers"
// maps to the `available` listing type; trade filtering is ignored for tools.
export type TypeFilter = "All" | "Jobs" | "Workers" | "Tools";
export interface FeedFilter {
  type: TypeFilter;
  trade: TradeId | "All";
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
  if (filter.trade !== "All") q = q.eq("trade", filter.trade);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapListing(r, myId));
}

export async function getListing(id: string): Promise<Listing | undefined> {
  const myId = await currentUserId();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapListing(data, myId) : undefined;
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
  trade: TradeId | null;
  title: string;
  pay: string;
  detail: string;
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
      trade: input.trade,
      title: input.title,
      pay: input.pay,
      detail: input.detail,
      city: input.city,
      location: input.location,
      urgent: input.urgent,
      photo_url: input.photoUrl,
    })
    .select(LISTING_SELECT)
    .single();
  if (error) throw error;
  return mapListing(data, uid);
}

// ---- Applications (worker → job proposals) ----

export async function getApplications(listingId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*, applicant:profiles(full_name,trade,years_exp,trust_score,deals_closed,verified)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((a: any) => ({
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
      trade: a.applicant?.trade ?? "",
      yearsExp: a.applicant?.years_exp ?? 0,
      trustScore: Number(a.applicant?.trust_score ?? 0),
      dealsClosed: a.applicant?.deals_closed ?? 0,
      verified: !!a.applicant?.verified,
    },
  }));
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

// ---- Chat (Supabase + Realtime) ----

const CONV_SELECT = `*,
  a:profiles!conversations_participant_a_fkey(id,full_name,trust_score),
  b:profiles!conversations_participant_b_fkey(id,full_name,trust_score),
  listing:listings(title,pay,detail),
  messages(body,sender_id,created_at)`;

function mapChat(row: any, uid: string): ChatSummary {
  const other = row.a?.id === uid ? row.b : row.a;
  const last = (row.messages ?? [])[0];
  const myLastRead = row.a?.id === uid ? row.a_last_read : row.b_last_read;
  const unread =
    last && last.sender_id !== uid && new Date(last.created_at) > new Date(myLastRead) ? 1 : 0;
  return {
    id: row.id,
    conversationId: row.id,
    otherId: other?.id ?? "",
    name: other?.full_name ?? "—",
    avatar: (other?.full_name ?? "?")[0],
    trust: Number(other?.trust_score ?? 0),
    lastMessage: last?.body ?? "Say hi 👋",
    when: last ? timeAgo(last.created_at) : timeAgo(row.created_at),
    unread,
    online: false, // presence is a nice-to-have (HANDOFF §6) — not v1
    jobContext: row.listing
      ? { title: row.listing.title, pay: row.listing.pay, detail: row.listing.detail }
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
  return rows.map((r) => mapChat(r, uid));
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
  return data ? mapChat(data, uid) : undefined;
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
        schema: "public",
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
