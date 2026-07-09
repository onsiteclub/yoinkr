import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { Placeholder } from "@/components/Placeholder";
import { PressableScale } from "@/components/PressableScale";
import { Verified } from "@/components/Verified";
import {
  getOrCreateConversation,
  getPortfolio,
  getProfile,
  getReferences,
} from "@/data/repository";
import type { PortfolioPhoto, Profile, Reference } from "@/data/types";
import { useResponsive } from "@/lib/responsive";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Public profile — what an employer sees before offering work (and what a
// worker sees of an employer). Photo, trade, stars, references, portfolio.
export default function WorkerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isMobile, contentWidth } = useResponsive();
  const [profile, setProfile] = useState<Profile | undefined>();
  const [portfolio, setPortfolio] = useState<PortfolioPhoto[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);

  useEffect(() => {
    if (!id) return;
    getProfile(id).then(setProfile);
    getPortfolio(id).then(setPortfolio);
    getReferences(id).then(setReferences);
  }, [id]);

  if (!profile) {
    return <View style={styles.screen} />;
  }

  const isNew = profile.dealsClosed === 0;

  return (
    <View style={styles.screen}>
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      {/* nav */}
      <View style={styles.nav}>
        <PressableScale onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </PressableScale>
        <Text style={styles.navTitle}>Profile</Text>
        <View style={{ width: 18 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          { paddingBottom: insets.bottom + 24 },
          !isMobile && { maxWidth: contentWidth, width: "100%", alignSelf: "center" },
        ]}
      >
        {/* identity */}
        <View style={styles.identity}>
          <Avatar letter={profile.fullName[0] ?? "?"} size={66} />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.fullName}</Text>
              {profile.verified && <Verified />}
            </View>
            <Text style={styles.trade}>{profile.trade} · {profile.yearsExp} yrs</Text>
            <Text style={styles.region}>📍 {profile.region}</Text>
          </View>
          {profile.available && (
            <View style={styles.availablePill}>
              <Text style={styles.availableText}>● AVAILABLE</Text>
            </View>
          )}
        </View>

        {/* trust summary */}
        <View style={styles.trustBadge}>
          <View style={styles.trustScoreCol}>
            {isNew ? (
              <Text style={styles.newBadge}>NEW</Text>
            ) : (
              <>
                <Text style={styles.trustScore}>{profile.trustScore.toFixed(1)}</Text>
                <Text style={styles.trustStars}>{stars(profile.trustScore)}</Text>
              </>
            )}
          </View>
          <View style={styles.trustText}>
            <Text style={styles.trustTitle}>
              {isNew ? "New on Yoinkr" : "Trusted"}
            </Text>
            <Text style={styles.trustBody}>
              {isNew
                ? `${profile.yearsExp} yrs of ${profile.trade} — no in-app deals yet`
                : `${profile.dealsClosed} jobs closed in-app · rated by real hirers`}
            </Text>
          </View>
        </View>

        {/* action */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <PressableScale
            style={styles.messageBtn}
            onPress={() =>
              getOrCreateConversation(profile.id, null).then((convId) =>
                router.push({ pathname: "/chat/[id]", params: { id: convId } })
              )
            }
          >
            <Text style={styles.messageText}>Message {profile.fullName.split(" ")[0]}</Text>
          </PressableScale>
        </View>

        {/* references */}
        <Text style={styles.sectionTitle}>References ({references.length})</Text>
        {references.length === 0 ? (
          <Text style={styles.noRefs}>No references yet — be the first to close a deal.</Text>
        ) : (
          references.map((r) => (
            <View key={r.id} style={styles.refCard}>
              <View style={styles.refHead}>
                <Avatar letter={r.raterName[0] ?? "?"} size={28} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.refName}>{r.raterName}</Text>
                  <Text style={styles.refWhen}>{r.when}</Text>
                </View>
                <Text style={styles.refStars}>{stars(r.stars)}</Text>
              </View>
              <Text style={styles.refComment}>“{r.comment}”</Text>
            </View>
          ))
        )}

        {/* portfolio */}
        {portfolio.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Work photos</Text>
            <View style={styles.grid}>
              {portfolio.map((p) => (
                <Placeholder key={p.id} photoUrl={p.photoUrl} style={styles.gridItem}>
                  <Text style={styles.gridLabel}>{p.caption}</Text>
                </Placeholder>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function stars(score: number): string {
  const n = Math.round(score);
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
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
  identity: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    padding: 18,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 20, fontWeight: "700", color: colors.ink },
  trade: { fontSize: 13.5, color: colors.inkMid, marginTop: 2 },
  region: { fontSize: 12, color: colors.inkLo, marginTop: 2 },
  availablePill: {
    backgroundColor: colors.goodBg,
    borderWidth: 1,
    borderColor: colors.goodLine,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  availableText: { fontSize: 9.5, fontWeight: "800", color: colors.good, letterSpacing: 0.5 },
  trustBadge: {
    margin: 14,
    marginBottom: 0,
    backgroundColor: colors.goodBg,
    borderWidth: 1,
    borderColor: colors.goodLine,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  trustScoreCol: { alignItems: "center", minWidth: 56 },
  trustScore: { fontFamily: fonts.display, fontSize: 30, fontWeight: "800", color: colors.good },
  trustStars: { fontSize: 14, color: colors.good, marginTop: 1 },
  newBadge: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.safetyInk,
    backgroundColor: colors.safetyBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    overflow: "hidden",
    letterSpacing: 1,
  },
  trustText: { flex: 1, borderLeftWidth: 1, borderLeftColor: colors.goodLine, paddingLeft: 14 },
  trustTitle: { fontSize: 13, fontWeight: "700", color: "#0a6b41" },
  trustBody: { fontSize: 11.5, color: "#3c7a5a", marginTop: 2, lineHeight: 16 },
  messageBtn: {
    backgroundColor: colors.safety,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  messageText: { color: colors.white, fontFamily: fonts.display, fontSize: 14.5 },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.inkMid,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 8,
  },
  noRefs: { paddingHorizontal: 18, fontSize: 12.5, color: colors.inkLo },
  refCard: {
    marginHorizontal: 14,
    marginBottom: 9,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 13,
  },
  refHead: { flexDirection: "row", alignItems: "center", gap: 9 },
  refName: { fontSize: 12.5, fontWeight: "700", color: colors.ink },
  refWhen: { fontSize: 10.5, color: colors.inkLo, marginTop: 1 },
  refStars: { fontSize: 13, color: colors.good, fontWeight: "700" },
  refComment: { fontSize: 13, color: colors.inkMid, lineHeight: 18, marginTop: 9 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14 },
  gridItem: {
    width: "48%",
    aspectRatio: 4 / 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: "flex-end",
    padding: 9,
  },
  gridLabel: { fontSize: 11, color: colors.white, fontWeight: "700", textShadowColor: "rgba(0,0,0,.4)", textShadowRadius: 3 },
});
