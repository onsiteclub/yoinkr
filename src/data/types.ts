// Domain types. These mirror the yoinkr schema on onsite-core so the
// repository mapping stays a thin translation layer.
import type { CategoryId, PayModel } from "./categories";

// A listing is either an employer's JOB, a WORKER advertising availability, or
// a TOOL for sale (the secondary "plus"). Jobs and workers carry a category.
export type ListingType = "job" | "tool" | "available";

// Reputation numbers come from the profile_stats view, never stored on the
// profile row. trustScore is null until 3 ratings exist (server-enforced).
export interface Profile {
  id: string;
  fullName: string;
  avatarUrl: string | null; // profile photo; null → initial-letter fallback
  categories: CategoryId[]; // what they do — empty for hirer-only profiles
  hires: boolean; // posts jobs / takes crews — true for contractors
  yearsExp: number;
  region: string; // "Ottawa, ON"
  available: boolean;
  acceptsHourly: boolean;
  acceptsPiecework: boolean;
  crewSize: number; // 1 = solo, 2 = duo
  trustScore: number | null; // avg stars; null until 3+ ratings
  ratingCount: number;
  dealsClosed: number;
  vouchCount: number;
  verified?: boolean;
  hoursVerified?: number; // aspirational / phase-2 (OnSite Timekeeper)
  createdAt: string;
}

export interface Listing {
  id: string;
  authorId: string;
  type: ListingType;
  category: CategoryId | null; // set for job/worker; null for tools
  payModel: PayModel | null; // general_labour listings are always hourly
  rate: number | null; // $/hr, $/sqft or total $, per payModel
  sqft: number | null; // job size — piecework listings
  crewSize: number; // crew needed (jobs) / crew offered (workers)
  pay: string; // display string composed from payModel + rate
  title: string;
  detail: string; // short extra ("weekend", "1 day", "used, 2 batteries")
  description: string; // long body — scope/schedule on jobs, pitch on offers
  city: string; // region gate — Ottawa only at launch
  location: string; // neighbourhood within the city ("Kanata", "Nepean")
  distanceKm?: number; // distance from the viewer — decisive hiring factor.
  urgent: boolean;
  photoUrl: string | null; // Supabase Storage path; null => category artwork
  // Lifecycle follows the deal (DB trigger): open → pending (deal agreed) →
  // closed (work done). Pending/closed ads stay visible with a status bar;
  // closed ones take no new yoinks or messages.
  status: "open" | "pending" | "closed";
  createdAt: string;
  // Denormalized author info for fast feed rendering.
  author: Pick<Profile, "fullName" | "avatarUrl" | "trustScore" | "dealsClosed" | "verified">;
  when: string;
  // Application state, denormalized for the feed (jobs only).
  applicants?: number; // how many applied (shown to the job's author)
  appliedByMe?: boolean; // whether the current user already applied
  mine?: boolean; // authored by the current user (computed by the repository)
}

// A worker's application to a job — a short message plus an optional rate.
export interface Application {
  id: string;
  listingId: string;
  applicantId: string;
  message: string;
  proposedRate: string; // free text ("$30/hr"), may be empty
  status: "pending" | "accepted" | "declined";
  when: string;
  createdAt: string;
  applicant: Pick<
    Profile,
    "fullName" | "avatarUrl" | "categories" | "yearsExp" | "trustScore" | "dealsClosed" | "verified"
  >;
}

// The Uber-style loop: accepting an application creates the deal ('agreed');
// either party marks the work 'done'; both double-blind ratings in → 'rated'.
export interface Deal {
  id: string;
  listingId: string | null;
  applicationId: string | null;
  workerId: string;
  hirerId: string;
  state: "agreed" | "done" | "rated";
  createdAt: string;
}

// A named peer endorsement — "vouched by Ahmad (Framer)". Social signal on
// the profile, deliberately separate from the star average.
export interface Vouch {
  id: string;
  voucherId: string;
  voucheeId: string;
  category: CategoryId;
  comment: string;
  when: string;
  voucher: Pick<Profile, "fullName" | "avatarUrl" | "trustScore" | "verified">;
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

// A reference = a rating left after a done deal (stars + short comment + who
// left it). The server only reveals it once both sides rated (or 14 days pass).
export interface Reference {
  id: string;
  profileId: string; // who this reference is about
  raterName: string;
  stars: number; // 1..5
  comment: string;
  when: string;
}

// --- Chat-list view model (denormalized for the messages screen) ---
export interface ChatSummary {
  id: string; // conversation id
  conversationId: string;
  otherId: string; // the other participant's profile id
  listingId: string | null; // listing the conversation is about (deal lookup)
  name: string;
  avatar: string; // initial-letter fallback
  avatarUrl: string | null;
  trust: number | null;
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
