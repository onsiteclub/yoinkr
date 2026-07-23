import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Placeholder } from "@/components/Placeholder";
import { PressableScale } from "@/components/PressableScale";
import { track } from "@/data/analytics";
import { getMyListings } from "@/data/repository";
import type { Listing } from "@/data/types";
import { useResponsive } from "@/lib/responsive";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Everything I posted — jobs, worker offers and tools, whatever the status.
// The missing "where are my ads?" view: each row opens the edit form, and
// jobs expose their crew (applicants) directly.
const STATUS_LABEL: Record<Listing["status"], string> = {
  open: "OPEN",
  pending: "⏳ PENDING",
  closed: "✓ CLOSED",
};

export default function MyAdsScreen() {
  const insets = useSafeAreaInsets();
  const { isMobile, contentWidth } = useResponsive();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      track("my_ads_view");
      getMyListings()
        .then(setListings)
        .catch(() => {
          // Guests have no ads — this screen is reached from Profile, which
          // already gates, but deep links land here signed out.
          router.replace({ pathname: "/welcome", params: { gate: "1" } });
        })
        .finally(() => setLoaded(true));
    }, [])
  );

  return (
    <View style={styles.screen}>
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      <View style={styles.nav}>
        <PressableScale onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </PressableScale>
        <Text style={styles.navTitle}>My ads</Text>
        <View style={{ width: 18 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          { padding: 14, paddingBottom: insets.bottom + 24 },
          !isMobile && { maxWidth: contentWidth, width: "100%", alignSelf: "center" },
        ]}
      >
        {loaded && listings.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>Nothing posted yet.</Text>
            <PressableScale style={styles.emptyBtn} onPress={() => router.push("/post")}>
              <Text style={styles.emptyBtnText}>＋ Post something</Text>
            </PressableScale>
          </View>
        )}

        {listings.map((l) => (
          <PressableScale
            key={l.id}
            style={styles.row}
            onPress={() => router.push({ pathname: "/post", params: { edit: l.id } })}
          >
            <Placeholder photoUrl={l.photoUrl} category={l.category} seed={l.id} style={styles.thumb} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={1}>
                {l.title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {l.pay}
                {l.detail ? ` · ${l.detail}` : ""}
              </Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.statusPill,
                    l.status === "open"
                      ? styles.statusOpen
                      : l.status === "pending"
                        ? styles.statusPending
                        : styles.statusClosed,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          l.status === "open"
                            ? colors.success
                            : l.status === "pending"
                              ? colors.accentDark
                              : colors.tertiary,
                      },
                    ]}
                  >
                    {STATUS_LABEL[l.status]}
                  </Text>
                </View>
                <Text style={styles.when}>{l.when}</Text>
              </View>
            </View>
            <View style={styles.actionsCol}>
              <Text style={styles.editLink}>Edit</Text>
              {l.type === "job" && (
                <PressableScale
                  hitSlop={8}
                  onPress={() => router.push({ pathname: "/applicants/[id]", params: { id: l.id } })}
                >
                  <Text style={styles.crewLink}>Crew ({l.applicants ?? 0})</Text>
                </PressableScale>
              )}
            </View>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.card,
  },
  back: { fontSize: 28, color: colors.inkMid, lineHeight: 30, width: 18 },
  navTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.inkMid,
  },
  emptyWrap: { alignItems: "center", marginTop: 46, gap: 14 },
  empty: { color: colors.inkLo, fontSize: 13 },
  emptyBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  emptyBtnText: { color: colors.white, fontFamily: fonts.display, fontSize: 13.5 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 11,
    marginBottom: 10,
  },
  thumb: { width: 64, height: 64, borderRadius: 10, overflow: "hidden" },
  title: { fontSize: 14, fontWeight: "700", color: colors.ink },
  meta: { fontSize: 12, color: colors.inkMid, marginTop: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  statusPill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusOpen: { backgroundColor: colors.successBg, borderColor: colors.successLine },
  statusPending: { backgroundColor: colors.accentTint, borderColor: "#F5C9B5" },
  statusClosed: { backgroundColor: colors.paper, borderColor: colors.border },
  statusText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.5 },
  when: { fontSize: 11, color: colors.inkLo },
  actionsCol: { alignItems: "flex-end", gap: 8 },
  editLink: { fontSize: 12.5, color: colors.blue, fontWeight: "700" },
  crewLink: { fontSize: 12.5, color: colors.accentDark, fontWeight: "700" },
});
