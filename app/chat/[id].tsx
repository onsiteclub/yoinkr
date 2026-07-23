import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { PressableScale } from "@/components/PressableScale";
import {
  acceptApplication,
  getChat,
  getDealWith,
  getMyRatingForDeal,
  getPendingApplicationFrom,
  getThread,
  markDealDone,
  markRead,
  rateDeal,
  reportUser,
  sendMessage,
  subscribeToThread,
} from "@/data/repository";
import { track } from "@/data/analytics";
import { ensureUserId } from "@/data/supabase";
import type { Application, ChatSummary, Deal, ThreadMessage } from "@/data/types";
import { useResponsive } from "@/lib/responsive";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isMobile, contentWidth } = useResponsive();
  const [chat, setChat] = useState<ChatSummary | undefined>();
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  // The deal this conversation is about (accepted application on the listing).
  const [deal, setDeal] = useState<Deal | null>(null);
  // Their pending yoink on my listing → in-chat accept bar (close the deal
  // right where the talking happens, without going back to the Crew screen).
  const [pendingApp, setPendingApp] = useState<Application | null>(null);
  const [iRated, setIRated] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  // Phone numbers are allowed (framing is a phone trade) — sending one just
  // triggers a one-time nudge to close the deal in-app. Flag, never block.
  const [phoneNudge, setPhoneNudge] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const uid = await ensureUserId();
      const c = await getChat(id);
      if (cancelled || !c) return;
      setChat(c);
      track("chat_opened", { about_listing: !!c.listingId });
      if (c.listingId && c.otherId) {
        const d = await getDealWith(c.otherId, c.listingId);
        if (!cancelled && d) {
          setDeal(d);
          setIRated(await getMyRatingForDeal(d.id));
        } else if (!cancelled) {
          const app = await getPendingApplicationFrom(c.listingId, c.otherId);
          if (!cancelled && app) setPendingApp(app);
        }
      }
      const thread = await getThread(c.conversationId);
      if (cancelled) return;
      setMessages(thread);
      // Live updates — dedupe by id (our own sends also arrive here).
      unsubscribe = subscribeToThread(
        c.conversationId,
        (msg) => {
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (!msg.me) void markRead(c.conversationId);
        },
        uid
      );
    })().catch(() => {
      // No session (guest deep link) — chat is account territory.
      router.replace({ pathname: "/welcome", params: { gate: "1" } });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [id]);

  const onAcceptInChat = async () => {
    if (!pendingApp || !chat) return;
    const d = await acceptApplication(pendingApp);
    track("accept", { where: "chat" });
    setDeal(d);
    setPendingApp(null);
    // Tell the other side right here, in realtime.
    const msg = await sendMessage(chat.conversationId, "✅ Accepted your yoink — deal on. Let's line up the details.");
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  };

  const onMarkDone = async () => {
    if (!deal) return;
    await markDealDone(deal.id);
    track("deal_done");
    setDeal({ ...deal, state: "done" });
  };

  const onRate = async (stars: number, comment: string) => {
    if (!deal) return;
    await rateDeal(deal, stars, comment);
    track("rating_sent", { stars });
    setIRated(true);
    setRatingOpen(false);
    // Both sides in → the loop is closed; refresh so the banner says "Rated".
    if (chat?.listingId && chat.otherId) {
      const d = await getDealWith(chat.otherId, chat.listingId);
      if (d) setDeal(d);
    }
  };

  const onReport = async (reason: string) => {
    if (!chat) return;
    await reportUser(chat.otherId, "non_payment", reason, deal?.id);
    setReportOpen(false);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !chat) return;
    setDraft("");
    if (/(\+?\d[\d\s\-().]{6,}\d)/.test(text)) setPhoneNudge(true);
    track("message_sent");
    const msg = await sendMessage(chat.conversationId, text);
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  if (!chat) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      {/* header */}
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </PressableScale>
        <Avatar letter={chat.avatar} photoUrl={chat.avatarUrl} size={36} />
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{chat.name}</Text>
            {chat.trust != null && <Text style={styles.trust}>★{chat.trust.toFixed(1)}</Text>}
          </View>
          {chat.online && <Text style={[styles.presence, { color: colors.good }]}>online</Text>}
        </View>
        <Text style={styles.more}>⋯</Text>
      </View>

      {/* job context bar — the deal lifecycle lives here once one exists:
          agreed → "Mark done" (either side) → both rate, double-blind. */}
      {chat.jobContext && (
        <View style={styles.jobBar}>
          <Text style={{ fontSize: 18 }}>🏗️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle}>Job: {chat.jobContext.title}</Text>
            <Text style={styles.jobPay}>
              {chat.jobContext.pay}
              {chat.jobContext.detail ? ` · ${chat.jobContext.detail}` : ""}
            </Text>
          </View>
          {deal?.state === "agreed" && (
            <PressableScale style={styles.closeDeal} onPress={onMarkDone}>
              <Text style={styles.closeDealText}>Mark done</Text>
            </PressableScale>
          )}
          {deal?.state === "done" && !iRated && (
            <PressableScale style={styles.closeDeal} onPress={() => setRatingOpen(true)}>
              <Text style={styles.closeDealText}>Rate ★</Text>
            </PressableScale>
          )}
          {deal?.state === "done" && iRated && (
            <View style={[styles.closeDeal, styles.closeDealMuted]}>
              <Text style={styles.closeDealMutedText}>Rated ✓ waiting</Text>
            </View>
          )}
          {deal?.state === "rated" && (
            <View style={[styles.closeDeal, styles.closeDealMuted]}>
              <Text style={styles.closeDealMutedText}>Rated ★</Text>
            </View>
          )}
        </View>
      )}
      {deal && deal.state !== "agreed" && (
        <PressableScale onPress={() => setReportOpen(true)} style={styles.reportRow}>
          <Text style={styles.reportText}>Problem with payment? Report it — we review every case.</Text>
        </PressableScale>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.thread,
            !isMobile && { maxWidth: contentWidth, width: "100%", alignSelf: "center" },
          ]}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Safety + transparency notice (PIPEDA: say clearly that chats are
              stored and may be reviewed; Tinder/Marketplace pattern). */}
          <View style={styles.safetyNote}>
            <Text style={styles.safetyText}>
              🔒 Chats are stored and may be reviewed by automated safety systems to keep
              yoinkr safe. Keep pay and job details in the app — never share banking info,
              SIN or passwords.
            </Text>
          </View>
          {messages.map((m) => (
            <View key={m.id} style={[styles.bubbleWrap, { alignSelf: m.me ? "flex-end" : "flex-start" }]}>
              <View
                style={[
                  styles.bubble,
                  m.me ? styles.bubbleMe : styles.bubbleThem,
                ]}
              >
                <Text style={styles.bubbleText}>{m.text}</Text>
              </View>
              <Text style={[styles.at, { textAlign: m.me ? "right" : "left" }]}>{m.at}</Text>
            </View>
          ))}
          <View style={styles.nudge}>
            <Text style={styles.nudgeText}>
              {!deal
                ? "Deals start when the hirer accepts an application — then the work gets marked done here and you rate each other."
                : deal.state === "agreed"
                  ? "Work finished? Tap “Mark done” — then you both rate each other (neither sees the other's stars first)."
                  : deal.state === "done" && !iRated
                    ? "Rate this deal — your stars stay hidden until the other side rates too."
                    : deal.state === "done"
                      ? "Rated ✓ — your stars show once the other side rates (or in 14 days)."
                      : "Deal closed and rated — it now counts on both profiles."}
            </Text>
          </View>
        </ScrollView>

        {!deal && pendingApp && (
          <View style={styles.acceptBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.acceptBarTitle}>🤝 Close the deal with {chat.name}?</Text>
              <Text style={styles.acceptBarSub}>
                {pendingApp.proposedRate ? `Their offer: ${pendingApp.proposedRate}` : "They yoinked this job"}
              </Text>
            </View>
            <PressableScale style={styles.acceptBtn} onPress={onAcceptInChat}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </PressableScale>
          </View>
        )}

        {phoneNudge && (
          <PressableScale style={styles.phoneNudge} onPress={() => setPhoneNudge(false)}>
            <Text style={styles.phoneNudgeText}>
              📞 Going to the phone? No problem — just come back and close the deal here.
              That's how you both earn stars and stay covered if payment goes wrong. ✕
            </Text>
          </PressableScale>
        )}

        {/* input */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={colors.inkLo}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <PressableScale style={styles.sendBtn} onPress={send}>
            <Text style={styles.sendIcon}>↑</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>

      <RatingModal
        visible={ratingOpen}
        name={chat.name}
        onClose={() => setRatingOpen(false)}
        onSubmit={onRate}
      />
      <ReportModal
        visible={reportOpen}
        name={chat.name}
        onClose={() => setReportOpen(false)}
        onSubmit={onReport}
      />
    </View>
  );
}

// Double-blind rating: stars + short comment. The server hides it from the
// other side until they rate too — say so, or nobody rates honestly.
function RatingModal({
  visible,
  name,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  name: string;
  onClose: () => void;
  onSubmit: (stars: number, comment: string) => void;
}) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <Text style={styles.modalTitle}>Rate {name}</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <PressableScale key={n} onPress={() => setStars(n)} hitSlop={6}>
                <Text style={[styles.starBig, { color: n <= stars ? colors.safety : colors.line }]}>★</Text>
              </PressableScale>
            ))}
          </View>
          <TextInput
            style={styles.modalInput}
            placeholder="How did it go? (shows on their profile)"
            placeholderTextColor={colors.inkLo}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <Text style={styles.modalHint}>
            They won't see your stars until they rate you too.
          </Text>
          <PressableScale
            style={[styles.modalBtn, { opacity: stars > 0 ? 1 : 0.5 }]}
            disabled={stars === 0}
            onPress={() => onSubmit(stars, comment.trim())}
          >
            <Text style={styles.modalBtnText}>Submit rating</Text>
          </PressableScale>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Non-payment report — reviewed by a human, case by case (MVP rule). The
// platform polices membership, not the contract itself.
function ReportModal({
  visible,
  name,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  name: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <Text style={styles.modalTitle}>Report non-payment</Text>
          <Text style={styles.modalHint}>
            Tell us what happened with {name}. We review every report by hand — this chat is part
            of the evidence.
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Agreed $2,400 for the backframe, job done Tuesday, no payment since…"
            placeholderTextColor={colors.inkLo}
            value={reason}
            onChangeText={setReason}
            multiline
          />
          <PressableScale
            style={[styles.modalBtn, { opacity: reason.trim().length >= 10 ? 1 : 0.5 }]}
            disabled={reason.trim().length < 10}
            onPress={() => onSubmit(reason.trim())}
          >
            <Text style={styles.modalBtnText}>Send report</Text>
          </PressableScale>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.card,
  },
  back: { fontSize: 28, color: colors.inkMid, lineHeight: 30, width: 18 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 14.5, fontWeight: "700", color: colors.ink },
  trust: { fontSize: 11, color: colors.good, fontWeight: "700" },
  presence: { fontSize: 11 },
  more: { fontSize: 18, color: colors.inkLo },
  jobBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.safetyBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  jobTitle: { fontSize: 12.5, color: colors.ink, fontWeight: "700" },
  jobPay: { fontSize: 11, color: colors.safetyInk, fontWeight: "700" },
  closeDeal: { backgroundColor: colors.good, borderRadius: 7, paddingHorizontal: 11, paddingVertical: 7 },
  closeDealText: { color: colors.white, fontSize: 11.5, fontWeight: "800" },
  closeDealMuted: { backgroundColor: colors.goodBg, borderWidth: 1, borderColor: colors.goodLine },
  closeDealMutedText: { color: colors.good, fontSize: 11.5, fontWeight: "800" },
  reportRow: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  reportText: { fontSize: 11, color: colors.inkLo, textDecorationLine: "underline" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(30,27,24,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    width: "100%",
    maxWidth: 380,
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  starRow: { flexDirection: "row", gap: 10, marginTop: 14, justifyContent: "center" },
  starBig: { fontSize: 34 },
  modalInput: {
    marginTop: 14,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.ink,
    minHeight: 70,
    textAlignVertical: "top",
  },
  modalHint: { fontSize: 11.5, color: colors.inkLo, marginTop: 10, lineHeight: 16 },
  modalBtn: {
    marginTop: 14,
    backgroundColor: colors.safety,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnText: { color: colors.white, fontFamily: fonts.display, fontSize: 14 },
  thread: { padding: 14, gap: 8 },
  safetyNote: {
    alignSelf: "center",
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: "92%",
    marginBottom: 4,
  },
  safetyText: { fontSize: 10.5, color: colors.inkLo, textAlign: "center", lineHeight: 15 },
  phoneNudge: {
    backgroundColor: colors.safetyBg,
    borderTopWidth: 1,
    borderTopColor: "#F0D68A",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  phoneNudgeText: { fontSize: 11.5, color: colors.safetyInk, lineHeight: 16 },
  acceptBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.goodBg,
    borderTopWidth: 1,
    borderTopColor: colors.goodLine,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  acceptBarTitle: { fontSize: 12.5, fontWeight: "800", color: "#0a6b41" },
  acceptBarSub: { fontSize: 11, color: "#3c7a5a", marginTop: 1 },
  acceptBtn: {
    backgroundColor: colors.good,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  acceptBtnText: { color: colors.white, fontSize: 13, fontWeight: "800" },
  bubbleWrap: { maxWidth: "78%" },
  bubble: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 13 },
  bubbleMe: { backgroundColor: colors.accentTint, borderBottomRightRadius: 3 },
  bubbleThem: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: colors.line,
  },
  bubbleText: { fontSize: 13.5, lineHeight: 18, color: colors.ink },
  at: { fontSize: 10, color: colors.inkLo, marginTop: 3 },
  nudge: {
    alignSelf: "center",
    backgroundColor: colors.goodBg,
    borderWidth: 1,
    borderColor: "#9ed4b8",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: "90%",
    marginTop: 4,
  },
  nudgeText: { fontSize: 11.5, color: "#0a6b41", textAlign: "center" },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.safety,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { color: colors.white, fontSize: 18, fontWeight: "800" },
});
