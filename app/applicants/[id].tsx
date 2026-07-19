import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { PressableScale } from "@/components/PressableScale";
import { TrustInline } from "@/components/TrustInline";
import { Verified } from "@/components/Verified";
import { categoryLabels } from "@/data/categories";
import {
  acceptApplication,
  declineApplication,
  getApplications,
  getListing,
  getOrCreateConversation,
} from "@/data/repository";
import type { Application, Listing } from "@/data/types";
import { useResponsive } from "@/lib/responsive";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Applicants on one of MY job posts — each application shows the worker's
// trust signals up front (stars, deals closed, references via profile).
// Accepting is the moment the deal is born (agreed → done → both rate).
export default function ApplicantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isMobile, contentWidth } = useResponsive();
  const [listing, setListing] = useState<Listing | undefined>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [busy, setBusy] = useState<string | null>(null); // application id in flight

  const load = useCallback(() => {
    if (!id) return;
    getListing(id).then(setListing);
    getApplications(id).then(setApplications);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (a: Application) => {
    setBusy(a.id);
    try {
      await acceptApplication(a);
      // Straight into the conversation — the deal banner lives there.
      const convId = await getOrCreateConversation(a.applicantId, a.listingId);
      router.push({ pathname: "/chat/[id]", params: { id: convId } });
      load();
    } finally {
      setBusy(null);
    }
  };

  const decline = async (a: Application) => {
    setBusy(a.id);
    try {
      await declineApplication(a.id);
      load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      <View style={styles.nav}>
        <PressableScale onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </PressableScale>
        <Text style={styles.navTitle}>Crew</Text>
        <View style={{ width: 18 }} />
      </View>

      {listing && (
        <View style={styles.jobBar}>
          <Text style={{ fontSize: 18 }}>🏗️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle}>{listing.title}</Text>
            <Text style={styles.jobPay}>
              {listing.pay} · {listing.detail} · 📍 {listing.location}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          { padding: 14, paddingBottom: insets.bottom + 24 },
          !isMobile && { maxWidth: contentWidth, width: "100%", alignSelf: "center" },
        ]}
      >
        {applications.length === 0 ? (
          <Text style={styles.empty}>No hands yet — hang tight.</Text>
        ) : (
          applications.map((a) => (
            <View key={a.id} style={styles.card}>
              <PressableScale
                style={styles.head}
                onPress={() => router.push({ pathname: "/worker/[id]", params: { id: a.applicantId } })}
              >
                <Avatar letter={a.applicant.fullName[0] ?? "?"} size={40} />
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{a.applicant.fullName}</Text>
                    {a.applicant.verified && <Verified />}
                  </View>
                  <Text style={styles.tradeLine}>
                    {categoryLabels(a.applicant.categories) || "—"} · {a.applicant.yearsExp} yrs
                  </Text>
                  <TrustInline trust={a.applicant.trustScore} dealsClosed={a.applicant.dealsClosed} />
                </View>
                <View style={styles.rateCol}>
                  {a.proposedRate ? <Text style={styles.rate}>{a.proposedRate}</Text> : null}
                  <Text style={styles.when}>{a.when}</Text>
                </View>
              </PressableScale>

              <Text style={styles.message}>“{a.message}”</Text>

              {a.status === "pending" ? (
                <View style={styles.actions}>
                  <PressableScale
                    style={styles.secondaryBtn}
                    disabled={busy === a.id}
                    onPress={() => decline(a)}
                  >
                    <Text style={styles.secondaryText}>Decline</Text>
                  </PressableScale>
                  <PressableScale
                    style={styles.secondaryBtn}
                    onPress={() =>
                      getOrCreateConversation(a.applicantId, listing?.id ?? null).then((convId) =>
                        router.push({ pathname: "/chat/[id]", params: { id: convId } })
                      )
                    }
                  >
                    <Text style={styles.secondaryText}>Message</Text>
                  </PressableScale>
                  <PressableScale
                    style={styles.primaryBtn}
                    disabled={busy === a.id}
                    onPress={() => accept(a)}
                  >
                    <Text style={styles.primaryText}>{busy === a.id ? "…" : "Accept"}</Text>
                  </PressableScale>
                </View>
              ) : (
                <View style={styles.actions}>
                  <View style={[styles.statusPill, a.status === "accepted" ? styles.statusAccepted : styles.statusDeclined]}>
                    <Text
                      style={[
                        styles.statusText,
                        { color: a.status === "accepted" ? colors.good : colors.inkLo },
                      ]}
                    >
                      {a.status === "accepted" ? "✓ Accepted — deal on" : "Declined"}
                    </Text>
                  </View>
                  {a.status === "accepted" && (
                    <PressableScale
                      style={styles.primaryBtn}
                      onPress={() =>
                        getOrCreateConversation(a.applicantId, listing?.id ?? null).then((convId) =>
                          router.push({ pathname: "/chat/[id]", params: { id: convId } })
                        )
                      }
                    >
                      <Text style={styles.primaryText}>Open chat</Text>
                    </PressableScale>
                  )}
                </View>
              )}
            </View>
          ))
        )}
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
  jobPay: { fontSize: 11, color: colors.safetyInk, fontWeight: "700", marginTop: 1 },
  empty: { textAlign: "center", color: colors.inkLo, marginTop: 40, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 11,
  },
  head: { flexDirection: "row", gap: 11, alignItems: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { fontSize: 14.5, fontWeight: "700", color: colors.ink },
  tradeLine: { fontSize: 11.5, color: colors.inkMid, marginTop: 1, marginBottom: 2 },
  rateCol: { alignItems: "flex-end", gap: 3 },
  rate: { fontFamily: fonts.display, fontSize: 17, fontWeight: "800", color: colors.ink },
  when: { fontSize: 10.5, color: colors.inkLo },
  message: { fontSize: 13, color: colors.inkMid, lineHeight: 18, marginTop: 11 },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  secondaryText: { fontSize: 12.5, fontWeight: "700", color: colors.inkMid },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.safety,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  primaryText: { fontSize: 12.5, fontFamily: fonts.display, color: colors.white },
  statusPill: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
    borderWidth: 1,
  },
  statusAccepted: { backgroundColor: colors.goodBg, borderColor: colors.goodLine },
  statusDeclined: { backgroundColor: colors.bg, borderColor: colors.line },
  statusText: { fontSize: 12.5, fontWeight: "800" },
});
