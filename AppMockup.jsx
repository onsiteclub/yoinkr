import React, { useState } from "react";

// =============================================================
// MOCKUP v3 — Construction Marketplace (working name: Yoinkr)
// Light mode · built for SPEED ("Friday -> any work Saturday?")
// Screens: Feed (Jobs) · Profile · Chat
// Bilateral trust score (worker + employer)
// Target stack: Expo + React Native + Supabase
// =============================================================

const C = {
  bg: "#F4F5F7",
  card: "#FFFFFF",
  cardAlt: "#FBFBFC",
  line: "#E4E6EB",
  lineSoft: "#EEF0F3",
  ink: "#16181D",
  inkMid: "#5B616E",
  inkLo: "#9499A3",
  safety: "#FFB300",
  safetyInk: "#7A5200",
  safetyBg: "#FFF6E0",
  good: "#13A463",
  goodBg: "#E6F6EE",
  hazard: "#E8442B",
  hazardBg: "#FCEBE8",
  blue: "#2563EB",
};

const FD = "'Arial Narrow','Oswald','Helvetica Neue',sans-serif";
const FB = "'Inter',system-ui,sans-serif";

const PH = (a, b) => `linear-gradient(135deg, ${a}, ${b})`;

const FEED = [
  {
    id: 1, type: "job", urgent: true,
    title: "2 framers — starts SATURDAY 7am",
    place: "Kanata", pay: "$34/hr", extra: "weekend",
    by: "Ahmad Const.", trust: 4.8, jobs: 23, when: "40m ago",
    avatar: "A", photo: PH("#cfd6e6", "#aab4c8"),
  },
  {
    id: 2, type: "job", urgent: true,
    title: "Roofing helper — tomorrow",
    place: "Nepean", pay: "$28/hr", extra: "1 day",
    by: "Roof Masters", trust: 4.6, jobs: 11, when: "2h ago",
    avatar: "R", photo: PH("#e6d9cf", "#c8b4aa"),
  },
  {
    id: 3, type: "tool",
    title: "Milwaukee M18 drill — full kit",
    place: "Orleans", pay: "$180", extra: "used, 2 batteries",
    by: "Carlos M.", trust: 4.9, jobs: 8, when: "5h ago",
    avatar: "C", photo: PH("#d2e6cf", "#aac8b1"),
  },
  {
    id: 4, type: "available",
    title: "Drywall — available this weekend",
    place: "Ottawa area", pay: "Drywall", extra: "6 yrs",
    by: "You", trust: 4.7, jobs: 14, when: "yesterday", verified: true,
    avatar: "Y", photo: null,
  },
];

const CATS = ["All", "Jobs", "Tools", "Available"];

const CHATS = [
  { id: 1, name: "Ahmad Const.", last: "Can you start Saturday 7am?", when: "2:20pm", unread: 2, avatar: "A", online: true, trust: 4.8 },
  { id: 2, name: "Carlos M.", last: "Drill's still available", when: "12:05pm", unread: 0, avatar: "C", online: false, trust: 4.9 },
  { id: 3, name: "Roof Masters", last: "Send me your profile", when: "yesterday", unread: 0, avatar: "R", online: false, trust: 4.6 },
];

const THREAD = [
  { me: false, t: "Saw your profile, 6 yrs drywall. Need people Saturday in Kanata.", at: "2:02pm" },
  { me: false, t: "Can you start 7am?", at: "2:03pm" },
  { me: true, t: "I can. Wrapping a job Friday, free Saturday.", at: "2:10pm" },
  { me: false, t: "Done. $34/hr, paid end of day.", at: "2:18pm" },
];

// =============================================================

export default function App() {
  const [tab, setTab] = useState("feed");
  const [cat, setCat] = useState("All");
  const [openChat, setOpenChat] = useState(null);

  return (
    <div style={{ display: "flex", justifyContent: "center", background: "#D8DADF", minHeight: "100vh", padding: "24px 12px", fontFamily: FB }}>
      <div style={{
        width: 390, maxWidth: "100%", height: 800, background: C.bg,
        borderRadius: 28, overflow: "hidden", position: "relative",
        border: `1px solid #d0d3da`, boxShadow: "0 30px 80px rgba(0,0,0,.25)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ height: 4, background: `repeating-linear-gradient(45deg, ${C.safety} 0 14px, #1c1c1c 14px 28px)` }} />
        <Header tab={tab} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tab === "feed" && <Feed cat={cat} setCat={setCat} />}
          {tab === "perfil" && <Perfil />}
          {tab === "chat" && (openChat
            ? <ChatThread chat={openChat} onBack={() => setOpenChat(null)} />
            : <ChatList onOpen={setOpenChat} />)}
        </div>
        {!(tab === "chat" && openChat) && <TabBar tab={tab} setTab={(t) => { setTab(t); setOpenChat(null); }} />}
      </div>
    </div>
  );
}

function Header({ tab }) {
  const titles = { feed: null, perfil: "Profile", chat: "Messages" };
  return (
    <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${C.line}`, background: C.card }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: FD, fontWeight: 800, fontSize: 26, letterSpacing: 1.5, color: C.ink }}>Yoinkr</span>
          <span style={{ fontSize: 9, color: C.safetyInk, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", background: C.safetyBg, padding: "2px 6px", borderRadius: 4 }}>Ottawa</span>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.inkMid, fontSize: 17, border: `1px solid ${C.line}` }}>⌕</div>
      </div>
      {tab === "feed" && (
        <div style={{ marginTop: 11, fontSize: 13, color: C.inkMid, fontWeight: 500 }}>
          <span style={{ color: C.hazard, fontWeight: 800 }}>4 jobs</span> for this weekend
        </div>
      )}
      {titles[tab] && (
        <div style={{ marginTop: 11, fontFamily: FD, fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.inkMid }}>{titles[tab]}</div>
      )}
    </div>
  );
}

// ---------------- FEED ----------------

function Feed({ cat, setCat }) {
  const f = FEED.filter(p => {
    if (cat === "All") return true;
    if (cat === "Jobs") return p.type === "job";
    if (cat === "Tools") return p.type === "tool";
    if (cat === "Available") return p.type === "available";
    return true;
  });
  return (
    <div>
      <div style={{ display: "flex", gap: 8, padding: "12px 14px", overflowX: "auto", background: C.card, borderBottom: `1px solid ${C.line}` }}>
        {CATS.map(k => (
          <button key={k} onClick={() => setCat(k)} style={{
            whiteSpace: "nowrap", padding: "7px 15px", borderRadius: 20, cursor: "pointer",
            fontSize: 12.5, fontWeight: 700,
            border: `1px solid ${cat === k ? C.ink : C.line}`,
            background: cat === k ? C.ink : C.card,
            color: cat === k ? "#fff" : C.inkMid,
          }}>{k}</button>
        ))}
      </div>
      <div style={{ padding: "12px 14px 90px" }}>
        {f.map(p => <FeedCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

const TLAB = {
  job: { txt: "JOB", ink: C.safetyInk, bg: C.safetyBg },
  tool: { txt: "TOOL", ink: "#1746a2", bg: "#E7EEFC" },
  available: { txt: "AVAILABLE", ink: "#0a6b41", bg: C.goodBg },
};

function FeedCard({ p }) {
  const lab = TLAB[p.type];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, marginBottom: 11, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.03)" }}>
      {p.photo && (
        <div style={{ height: 130, background: p.photo, position: "relative" }}>
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: lab.ink, background: lab.bg, padding: "3px 7px", borderRadius: 5 }}>{lab.txt}</span>
            {p.urgent && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: .5, color: "#fff", background: C.hazard, padding: "3px 7px", borderRadius: 5 }}>● URGENT</span>}
          </div>
        </div>
      )}
      <div style={{ padding: 14 }}>
        {!p.photo && (
          <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: lab.ink, background: lab.bg, padding: "3px 7px", borderRadius: 5 }}>{lab.txt}</span>
          </div>
        )}
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.3, marginBottom: 8 }}>{p.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontFamily: FD, fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: .3 }}>{p.pay}</span>
          <span style={{ fontSize: 12.5, color: C.inkMid }}>· {p.extra}</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.inkLo }}>📍 {p.place}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 11, borderTop: `1px solid ${C.lineSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Avatar letter={p.avatar} size={30} />
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 650, display: "flex", alignItems: "center", gap: 4 }}>
                {p.by} {p.verified && <Verified />}
              </div>
              <TrustInline trust={p.trust} jobs={p.jobs} />
            </div>
          </div>
          <button style={{ background: C.safety, color: "#1c1300", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>
            {p.type === "available" ? "Edit" : "Message"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TrustInline({ trust, jobs }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5 }}>
      <span style={{ color: C.good, fontWeight: 800 }}>★ {trust.toFixed(1)}</span>
      <span style={{ color: C.inkLo }}>· {jobs} closed</span>
    </div>
  );
}

// ---------------- PROFILE ----------------

function Perfil() {
  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "20px 18px", background: C.card, borderBottom: `1px solid ${C.line}`, display: "flex", gap: 14, alignItems: "center" }}>
        <Avatar letter="Y" size={66} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 750, color: C.ink }}>You</span>
            <Verified />
          </div>
          <div style={{ fontSize: 13.5, color: C.inkMid, marginTop: 2 }}>Drywall & Finishing</div>
          <div style={{ fontSize: 12, color: C.inkLo, marginTop: 2 }}>📍 Ottawa, ON</div>
        </div>
      </div>

      {/* TRUST BADGE */}
      <div style={{ margin: "14px 14px 0", background: C.goodBg, border: `1px solid #BCE7CF`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: FD, fontSize: 30, fontWeight: 800, color: C.good, lineHeight: 1 }}>4.7</div>
          <div style={{ fontSize: 16, color: C.good, marginTop: 1 }}>★★★★★</div>
        </div>
        <div style={{ flex: 1, borderLeft: `1px solid #BCE7CF`, paddingLeft: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0a6b41" }}>High trust</div>
          <div style={{ fontSize: 11.5, color: "#3c7a5a", marginTop: 2, lineHeight: 1.35 }}>
            14 jobs closed in-app · always shows up · pays/gets paid on time
          </div>
        </div>
      </div>
      <div style={{ padding: "8px 18px 0", fontSize: 10.5, color: C.inkLo, lineHeight: 1.4 }}>
        Your score grows with every job closed <b>inside the app</b> — both sides, worker and hirer.
      </div>

      {/* stats */}
      <div style={{ display: "flex", margin: "14px 14px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
        <Stat n="6" l="years" />
        <Stat n="1,840" l="verified hrs" hi />
        <Stat n="14" l="closed" />
      </div>
      <div style={{ padding: "7px 18px 0", fontSize: 11, color: C.good, display: "flex", alignItems: "center", gap: 6 }}>
        <Verified /> Hours verified by presence (OnSite Timekeeper)
      </div>

      <div style={{ padding: 16 }}>
        <button style={{ width: "100%", background: C.good, color: "#fff", border: "none", borderRadius: 9, padding: "13px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          ● Available for work
        </button>
      </div>

      <div style={{ padding: "4px 18px 8px", fontFamily: FD, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.inkMid, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Portfolio</span>
        <span style={{ fontSize: 11, color: C.blue, fontWeight: 700, fontFamily: FB, textTransform: "none", letterSpacing: 0, cursor: "pointer" }}>+ Add photo</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 14px" }}>
        {[["Roofing","#cfd6e6","#aab4c8"],["Deck","#e6d9cf","#c8b4aa"],["Framing","#d2e6cf","#aac8b1"],["Finishing","#e6cfdf","#c8aabf"]].map(([t,a,b],i)=>(
          <div key={i} style={{ aspectRatio: "4/3", borderRadius: 10, background: PH(a,b), border: `1px solid ${C.line}`, position: "relative", display: "flex", alignItems: "flex-end", padding: 9 }}>
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,.4)" }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ n, l, hi }) {
  return (
    <div style={{ flex: 1, padding: "13px 6px", textAlign: "center", borderRight: `1px solid ${C.line}` }}>
      <div style={{ fontFamily: FD, fontSize: 23, fontWeight: 800, color: hi ? C.safetyInk : C.ink }}>{n}</div>
      <div style={{ fontSize: 10, color: C.inkLo, marginTop: 2, textTransform: "uppercase", letterSpacing: .4 }}>{l}</div>
    </div>
  );
}

// ---------------- CHAT ----------------

function ChatList({ onOpen }) {
  return (
    <div style={{ paddingBottom: 90, background: C.card, minHeight: "100%" }}>
      {CHATS.map(c => (
        <div key={c.id} onClick={() => onOpen(c)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.lineSoft}`, cursor: "pointer" }}>
          <div style={{ position: "relative" }}>
            <Avatar letter={c.avatar} size={46} />
            {c.online && <span style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, background: C.good, border: `2px solid ${C.card}` }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
                {c.name} <span style={{ fontSize: 11, color: C.good, fontWeight: 700 }}>★{c.trust}</span>
              </span>
              <span style={{ fontSize: 11, color: C.inkLo }}>{c.when}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
              <span style={{ fontSize: 13, color: c.unread ? C.ink : C.inkLo, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 230 }}>{c.last}</span>
              {c.unread > 0 && <span style={{ background: C.hazard, color: "#fff", fontSize: 11, fontWeight: 800, borderRadius: 10, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{c.unread}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatThread({ chat, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${C.line}`, background: C.card }}>
        <span onClick={onBack} style={{ fontSize: 24, color: C.inkMid, cursor: "pointer", lineHeight: 1 }}>‹</span>
        <Avatar letter={chat.avatar} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
            {chat.name} <span style={{ fontSize: 11, color: C.good, fontWeight: 700 }}>★{chat.trust}</span>
          </div>
          <div style={{ fontSize: 11, color: chat.online ? C.good : C.inkLo }}>{chat.online ? "online" : "last seen 12:05pm"}</div>
        </div>
        <span style={{ fontSize: 18, color: C.inkLo, cursor: "pointer" }}>⋯</span>
      </div>

      <div style={{ padding: "10px 14px", background: C.safetyBg, borderBottom: `1px solid ${C.line}`, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 18 }}>🏗️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 700 }}>Job: 2 framers — Kanata, Saturday</div>
          <div style={{ fontSize: 11, color: C.safetyInk, fontWeight: 700 }}>$34/hr · weekend</div>
        </div>
        <button style={{ background: C.good, color: "#fff", border: "none", borderRadius: 7, padding: "7px 11px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>Close deal</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        {THREAD.map((m, i) => (
          <div key={i} style={{ alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: "78%" }}>
            <div style={{ background: m.me ? C.safety : C.card, color: C.ink, padding: "9px 12px", borderRadius: 13, borderBottomRightRadius: m.me ? 3 : 13, borderBottomLeftRadius: m.me ? 13 : 3, fontSize: 13.5, lineHeight: 1.35, border: m.me ? "none" : `1px solid ${C.line}` }}>{m.t}</div>
            <div style={{ fontSize: 10, color: C.inkLo, marginTop: 3, textAlign: m.me ? "right" : "left" }}>{m.at}</div>
          </div>
        ))}
        <div style={{ alignSelf: "center", background: C.goodBg, border: `1px dashed #9ed4b8`, borderRadius: 10, padding: "9px 14px", fontSize: 11.5, color: "#0a6b41", textAlign: "center", maxWidth: "90%", marginTop: 4 }}>
          Deal agreed? Tap <b>Close deal</b> — both of you earn trust points.
        </div>
      </div>

      <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.line}`, display: "flex", gap: 8, alignItems: "center", background: C.card }}>
        <div style={{ flex: 1, background: C.bg, borderRadius: 20, padding: "10px 14px", fontSize: 13.5, color: C.inkLo, border: `1px solid ${C.line}` }}>Type a message…</div>
        <button style={{ width: 40, height: 40, borderRadius: 20, background: C.safety, border: "none", color: "#1c1300", fontSize: 18, cursor: "pointer", fontWeight: 800 }}>↑</button>
      </div>
    </div>
  );
}

// ---------------- TAB BAR ----------------

function TabBar({ tab, setTab }) {
  const items = [
    { k: "feed", icon: "▦", label: "Jobs" },
    { k: "post", icon: "＋", label: "Post", center: true },
    { k: "chat", icon: "✉", label: "Messages" },
    { k: "perfil", icon: "◉", label: "Profile" },
  ];
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${C.line}`, background: C.card, paddingBottom: 6 }}>
      {items.map(it => {
        if (it.center) {
          return (
            <div key={it.k} style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <button style={{ width: 50, height: 50, borderRadius: 14, marginTop: -14, background: C.safety, border: `3px solid ${C.card}`, color: "#1c1300", fontSize: 26, fontWeight: 300, cursor: "pointer", lineHeight: 1, boxShadow: "0 6px 16px rgba(255,179,0,.4)" }}>＋</button>
            </div>
          );
        }
        const active = tab === it.k;
        return (
          <button key={it.k} onClick={() => setTab(it.k)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "11px 0 7px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 19, color: active ? C.ink : C.inkLo, lineHeight: 1 }}>{it.icon}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: .3, color: active ? C.ink : C.inkLo, textTransform: "uppercase" }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Avatar({ letter, size }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size > 50 ? 14 : 9, background: PH("#2A2D34", "#454953"), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FD, fontWeight: 800, color: C.safety, fontSize: size * 0.42, flexShrink: 0 }}>{letter}</div>
  );
}

function Verified() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: 8, background: C.good, color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>
  );
}
