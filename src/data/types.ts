// Domain types. These mirror the Supabase schema in HANDOFF.md §5 so that
// swapping the mock repository for real Supabase queries later is a drop-in.
import type { TradeId } from "./trades";

// A listing is either an employer's JOB, a WORKER advertising availability, or
// a TOOL for sale (the secondary "plus"). Jobs and workers carry a trade.
export type ListingType = "job" | "tool" | "available";

export interface Profile {
  id: string;
  fullName: string;
  trade: string; // "Framing", "Drywall", "Electrical", "Roofing", ...
  yearsExp: number;
  region: string; // "Ottawa, ON"
  available: boolean;
  trustScore: number; // aggregate, recomputed from ratings
  dealsClosed: number;
  verified?: boolean;
  hoursVerified?: number; // aspirational / phase-2 (OnSite Timekeeper)
  createdAt: string;
}

export interface Listing {
  id: string;
  authorId: string;
  type: ListingType;
  trade: TradeId | null; // set for job/worker; null for tools
  title: string;
  pay: string; // free text — "$34/hr", "$180"
  detail: string; // short extra ("weekend", "1 day", "used, 2 batteries")
  city: string; // region gate — Ottawa only at launch
  location: string; // neighbourhood within the city ("Kanata", "Nepean")
  distanceKm?: number; // distance from the viewer — decisive hiring factor.
  // Mocked for now; later computed from listing coords vs user location.
  urgent: boolean;
  photoUrl: string | null; // Supabase Storage path; null => gradient placeholder
  status: "open" | "closed";
  createdAt: string;
  // Denormalized author info for fast feed rendering (joined from profiles).
  author: Pick<Profile, "fullName" | "trustScore" | "dealsClosed" | "verified">;
  // Human-friendly relative time for the mock; server can compute from createdAt.
  when: string;
  // Application state, denormalized for the feed (jobs only).
  applicants?: number; // how many applied (shown to the job's author)
  appliedByMe?: boolean; // whether the current user already applied
  mine?: boolean; // authored by the current user (computed by the repository)
}

// A worker's application to a job — the Upwork/Workana-style lightweight
// proposal: a short message plus an optional proposed rate.
export interface Application {
  id: string;
  listingId: string;
  applicantId: string;
  message: string;
  proposedRate: string; // free text ("$30/hr"), may be empty
  status: "pending" | "accepted" | "declined";
  when: string;
  createdAt: string;
  // Denormalized applicant info for the applicants list.
  applicant: Pick<Profile, "fullName" | "trade" | "yearsExp" | "trustScore" | "dealsClosed" | "verified">;
}

export interface Conversation {
  id: string;
  listingId: string | null;
  participantAId: string;
  participantBId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface PortfolioPhoto {
  id: string;
  profileId: string;
  photoUrl: string | null;
  caption: string;
}

// A reference = a rating left after a closed deal (Uber-style: stars + short
// comment + who left it). Shown on the public worker profile.
export interface Reference {
  id: string;
  profileId: string; // who this reference is about
  raterName: string;
  raterTrust: number;
  stars: number; // 1..5
  comment: string;
  when: string;
}

// --- Chat-list view model (denormalized for the messages screen) ---
export interface ChatSummary {
  id: string; // conversation id
  conversationId: string;
  otherId: string; // the other participant's profile id
  name: string;
  avatar: string;
  trust: number;
  lastMessage: string;
  when: string;
  unread: number;
  online: boolean;
  // Job context the conversation is about (for the thread header bar).
  jobContext?: { title: string; pay: string; detail: string };
}

export interface ThreadMessage {
  id: string;
  me: boolean;
  text: string;
  at: string;
}
