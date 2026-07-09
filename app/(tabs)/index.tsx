import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { FeedCard } from "@/components/FeedCard";
import { FeedCardWide } from "@/components/FeedCardWide";
import { Header } from "@/components/Header";
import { PressableScale } from "@/components/PressableScale";
import { CARD_HORIZONTAL_MIN, useResponsive } from "@/lib/responsive";
import {
  getListings,
  getOrCreateConversation,
  getWeekendJobCount,
  type TypeFilter,
} from "@/data/repository";
import { REGIONS } from "@/data/regions";
import { TRADES, type TradeId } from "@/data/trades";
import type { Listing } from "@/data/types";
import { useRegion } from "@/store/useRegion";
import { colors } from "@/theme/colors";

const TYPES: TypeFilter[] = ["All", "Jobs", "Workers", "Tools"];
type TradeFilter = TradeId | "All";

export default function FeedScreen() {
  const { isMobile, contentWidth } = useResponsive();
  // Card layout is decided by the card's own width, not the viewport (§4).
  const gutters = isMobile ? 28 : 48;
  const horizontalCards = contentWidth - gutters >= CARD_HORIZONTAL_MIN;
  const city = useRegion((s) => s.city);
  const cityIsLive = REGIONS.find((r) => r.name === city)?.live ?? false;

  const [type, setType] = useState<TypeFilter>("All");
  const [trade, setTrade] = useState<TradeFilter>("All");
  const [listings, setListings] = useState<Listing[]>([]);
  const [count, setCount] = useState(0);

  const load = useCallback(() => {
    getListings({ type, trade, city }).then(setListings);
    getWeekendJobCount(city).then(setCount);
  }, [type, trade, city]);

  useEffect(() => {
    load();
  }, [load]);

  // Refetch when returning to the feed (e.g. after posting a new listing).
  useFocusEffect(useCallback(() => load(), [load]));

  const onAction = useCallback((listing: Listing) => {
    const isMine = listing.mine ?? false;
    if (isMine && listing.type === "available") {
      router.push("/post");
    } else if (isMine && listing.type === "job") {
      // My job → review who applied.
      router.push({ pathname: "/applicants/[id]", params: { id: listing.id } });
    } else if (listing.type === "job") {
      // Someone's job → send a proposal.
      router.push({ pathname: "/apply/[id]", params: { id: listing.id } });
    } else if (listing.type === "available") {
      // Worker card → public profile (references first, then message from there).
      router.push({ pathname: "/worker/[id]", params: { id: listing.authorId } });
    } else {
      // Tool (or anything else) → open the conversation about this listing.
      getOrCreateConversation(listing.authorId, listing.id).then((convId) =>
        router.push({ pathname: "/chat/[id]", params: { id: convId } })
      );
    }
  }, []);

  const onAuthor = useCallback((listing: Listing) => {
    router.push({ pathname: "/worker/[id]", params: { id: listing.authorId } });
  }, []);

  return (
    <View style={styles.screen}>
      <Header
        subtitle={
          cityIsLive ? (
            <Text style={styles.subtitle}>
              <Text style={styles.count}>{count} jobs</Text> for this weekend in {city}
            </Text>
          ) : (
            <Text style={styles.subtitle}>Yoinkr isn’t in {city} yet</Text>
          )
        }
      />

      {/* Filter chips — horizontal scroll on mobile, inline (wrap) at md+ (§3) */}
      <View style={styles.chipsBlock}>
        <View style={!isMobile && { maxWidth: contentWidth, width: "100%" }}>
          {isMobile ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {TYPES.map((k) => (
                  <TypeChip key={k} label={k} active={type === k} onPress={() => setType(k)} />
                ))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipsRow, styles.tradeRow]}>
                <TradeChip label="All" active={trade === "All"} onPress={() => setTrade("All")} />
                {TRADES.map((t) => (
                  <TradeChip key={t.id} label={t.label} active={trade === t.id} onPress={() => setTrade(t.id)} />
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <View style={[styles.chipsRow, styles.chipsInline]}>
                {TYPES.map((k) => (
                  <TypeChip key={k} label={k} active={type === k} onPress={() => setType(k)} />
                ))}
              </View>
              <View style={[styles.chipsRow, styles.tradeRow, styles.chipsInline]}>
                <TradeChip label="All" active={trade === "All"} onPress={() => setTrade("All")} />
                {TRADES.map((t) => (
                  <TradeChip key={t.id} label={t.label} active={trade === t.id} onPress={() => setTrade(t.id)} />
                ))}
              </View>
            </>
          )}
        </View>
      </View>

      {/* Content column: full-width on mobile, capped at contentWidth on md+ (§3) */}
      <ScrollView contentContainerStyle={[styles.list, !isMobile && styles.listWide]}>
        <View style={!isMobile && { maxWidth: contentWidth, width: "100%", alignSelf: "center" }}>
          {!cityIsLive ? (
            <ComingSoon city={city} />
          ) : listings.length === 0 ? (
            <Text style={styles.empty}>No listings match this filter yet.</Text>
          ) : (
            listings.map((l) =>
              horizontalCards ? (
                <FeedCardWide key={l.id} listing={l} onPressAction={onAction} onPressAuthor={onAuthor} />
              ) : (
                <FeedCard key={l.id} listing={l} onPressAction={onAction} onPressAuthor={onAuthor} />
              )
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function TypeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.chip, { borderColor: active ? colors.ink : colors.line, backgroundColor: active ? colors.ink : colors.card }]}
    >
      <Text style={[styles.chipText, { color: active ? colors.white : colors.inkMid }]}>{label}</Text>
    </PressableScale>
  );
}

function TradeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.tradeChip, { borderColor: active ? colors.safety : colors.line, backgroundColor: active ? colors.safetyBg : colors.card }]}
    >
      <Text style={[styles.tradeChipText, { color: active ? colors.safetyInk : colors.inkMid }]}>{label}</Text>
    </PressableScale>
  );
}

function ComingSoon({ city }: { city: string }) {
  return (
    <View style={styles.comingSoon}>
      <Text style={styles.comingSoonPin}>📍</Text>
      <Text style={styles.comingSoonTitle}>Ottawa only — for now</Text>
      <Text style={styles.comingSoonBody}>
        There are no listings in {city} yet — we’re live in Ottawa and expanding city by city.
      </Text>
      <PressableScale style={styles.switchBtn} onPress={() => router.push("/region")}>
        <Text style={styles.switchText}>Switch to Ottawa</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  subtitle: { fontSize: 13, color: colors.inkMid, fontWeight: "500" },
  count: { color: colors.hazard, fontWeight: "800" },
  chipsBlock: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 6,
  },
  chipsRow: { gap: 8, paddingHorizontal: 14, paddingTop: 12 },
  tradeRow: { paddingTop: 8 },
  chip: { paddingHorizontal: 15, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12.5, fontWeight: "700" },
  tradeChip: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  tradeChipText: { fontSize: 12, fontWeight: "700" },
  list: { padding: 14, paddingBottom: 30 },
  listWide: { paddingHorizontal: 24, paddingTop: 20 },
  chipsInline: { flexWrap: "wrap" },
  empty: { textAlign: "center", color: colors.inkLo, marginTop: 40, fontSize: 13 },
  comingSoon: { alignItems: "center", paddingHorizontal: 30, paddingTop: 50 },
  comingSoonPin: { fontSize: 34, marginBottom: 12 },
  comingSoonTitle: { fontSize: 17, fontWeight: "800", color: colors.ink, textAlign: "center" },
  comingSoonBody: { fontSize: 13, color: colors.inkMid, textAlign: "center", lineHeight: 19, marginTop: 8 },
  switchBtn: {
    marginTop: 18,
    backgroundColor: colors.safety,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  switchText: { color: colors.white, fontWeight: "800", fontSize: 14 },
});
