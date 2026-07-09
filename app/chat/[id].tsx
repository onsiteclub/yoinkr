import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
  getChat,
  getThread,
  markRead,
  sendMessage,
  subscribeToThread,
} from "@/data/repository";
import { ensureUserId } from "@/data/supabase";
import type { ChatSummary, ThreadMessage } from "@/data/types";
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
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [id]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !chat) return;
    setDraft("");
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
        <Avatar letter={chat.avatar} size={36} />
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{chat.name}</Text>
            <Text style={styles.trust}>★{chat.trust}</Text>
          </View>
          {chat.online && <Text style={[styles.presence, { color: colors.good }]}>online</Text>}
        </View>
        <Text style={styles.more}>⋯</Text>
      </View>

      {/* job context bar */}
      {chat.jobContext && (
        <View style={styles.jobBar}>
          <Text style={{ fontSize: 18 }}>🏗️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle}>Job: {chat.jobContext.title}</Text>
            <Text style={styles.jobPay}>
              {chat.jobContext.pay} · {chat.jobContext.detail}
            </Text>
          </View>
          <PressableScale style={styles.closeDeal}>
            <Text style={styles.closeDealText}>Close deal</Text>
          </PressableScale>
        </View>
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
              Deal agreed? Tap <Text style={{ fontWeight: "700" }}>Close deal</Text> — both of you earn trust points.
            </Text>
          </View>
        </ScrollView>

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
    </View>
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
  thread: { padding: 14, gap: 8 },
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
