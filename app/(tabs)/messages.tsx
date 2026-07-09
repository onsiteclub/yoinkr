import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/Avatar";
import { Header } from "@/components/Header";
import { PressableScale } from "@/components/PressableScale";
import { getChats } from "@/data/repository";
import type { ChatSummary } from "@/data/types";
import { useResponsive } from "@/lib/responsive";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function MessagesScreen() {
  const { isMobile, contentWidth } = useResponsive();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getChats()
        .then(setChats)
        .finally(() => setLoaded(true));
    }, [])
  );

  return (
    <View style={styles.screen}>
      <Header subtitle={<Text style={styles.sectionTitle}>Messages</Text>} />
      <ScrollView
        style={{ backgroundColor: colors.card }}
        contentContainerStyle={[
          { paddingBottom: 30 },
          !isMobile && { maxWidth: contentWidth, width: "100%", alignSelf: "center" },
        ]}
      >
        {loaded && chats.length === 0 && (
          <Text style={styles.empty}>No conversations yet — yoink a job to start one.</Text>
        )}
        {chats.map((c) => (
          <PressableScale key={c.id} style={styles.row} onPress={() => router.push(`/chat/${c.id}`)}>
            <View>
              <Avatar letter={c.avatar} size={46} />
              {c.online && <View style={styles.onlineDot} />}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.topLine}>
                <View style={styles.nameWrap}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.trust}>★{c.trust}</Text>
                </View>
                <Text style={styles.when}>{c.when}</Text>
              </View>
              <View style={styles.bottomLine}>
                <Text
                  numberOfLines={1}
                  style={[styles.last, { color: c.unread ? colors.ink : colors.inkLo }]}
                >
                  {c.lastMessage}
                </Text>
                {c.unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{c.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.inkMid,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.good,
    borderWidth: 2,
    borderColor: colors.card,
  },
  topLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nameWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 14.5, fontWeight: "700", color: colors.ink },
  trust: { fontSize: 11, color: colors.good, fontWeight: "700" },
  when: { fontSize: 11, color: colors.inkLo },
  bottomLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 3 },
  last: { fontSize: 13, flex: 1, marginRight: 8 },
  badge: {
    backgroundColor: colors.hazard,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  empty: { textAlign: "center", color: colors.inkLo, marginTop: 40, fontSize: 13, paddingHorizontal: 30 },
});
