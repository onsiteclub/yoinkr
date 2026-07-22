import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { CategoryPhoto, SamplePill, categoryPhotoCount } from "@/components/CategoryPhoto";
import { Placeholder } from "@/components/Placeholder";
import { PressableScale } from "@/components/PressableScale";
import { Verified } from "@/components/Verified";
import {
  CATEGORIES,
  type CategoryId,
  categoryLabel,
  roleLabel,
} from "@/data/categories";
import {
  addVouch,
  getOrCreateConversation,
  getPortfolio,
  getProfile,
  getReferences,
  getVouches,
  haveIVouched,
  removeVouch,
} from "@/data/repository";
import { currentUserId } from "@/data/supabase";
import { requireAccount } from "@/lib/gate";
import type { PortfolioPhoto, Profile, Reference, Vouch } from "@/data/types";
import { useResponsive } from "@/lib/responsive";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Public profile — what a hirer sees before offering work (and what a worker
// sees of a hirer). Two trust signals, deliberately separate:
//   stars/references = transactional truth (deals closed in-app, double-blind)
//   vouches          = named social proof from other pros ("indicado por")
export default function WorkerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isMobile, contentWidth } = useResponsive();
  const [profile, setProfile] = useState<Profile | undefined>();
  const [portfolio, setPortfolio] = useState<PortfolioPhoto[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [myVouch, setMyVouch] = useState(false);
  const [isMe, setIsMe] = useState(false);
  const [vouchOpen, setVouchOpen] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    getProfile(id).then(setProfile);
    getPortfolio(id).then(setPortfolio);
    getReferences(id).then(setReferences);
    getVouches(id).then(setVouches);
    haveIVouched(id).then(setMyVouch);
    currentUserId().then((uid) => setIsMe(uid === id));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!profile) {
    return <View style={styles.screen} />;
  }

  const hasScore = profile.trustScore != null;
  const artCategory = profile.categories[0] ?? null;

  const onVouch = async (category: CategoryId, comment: string) => {
    await addVouch(profile.id, category, comment);
    setVouchOpen(false);
    load();
  };

  const onUnvouch = async () => {
    await removeVouch(profile.id);
    load();
  };

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
          <Avatar letter={profile.fullName[0] ?? "?"} photoUrl={profile.avatarUrl} size={66} />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.fullName}</Text>
              {profile.verified && <Verified />}
            </View>
            <Text style={styles.trade}>
              {roleLabel(profile.categories, profile.hires) || "—"}
              {profile.categories.length > 0 ? ` · ${profile.yearsExp} yrs` : ""}
              {profile.crewSize === 2 && profile.categories.length > 0 ? " · duo" : ""}
            </Text>
            <Text style={styles.region}>📍 {profile.region}</Text>
          </View>
          {profile.available && (
            <View style={styles.availablePill}>
              <Text style={styles.availableText}>● AVAILABLE</Text>
            </View>
          )}
        </View>

        {/* trust summary — avg only exists at 3+ ratings (server rule) */}
        <View style={styles.trustBadge}>
          <View style={styles.trustScoreCol}>
            {hasScore ? (
              <>
                <Text style={styles.trustScore}>{profile.trustScore!.toFixed(1)}</Text>
                <Text style={styles.trustStars}>{stars(profile.trustScore!)}</Text>
              </>
            ) : (
              <Text style={styles.newBadge}>NEW</Text>
            )}
          </View>
          <View style={styles.trustText}>
            <Text style={styles.trustTitle}>
              {hasScore ? "Trusted" : profile.ratingCount > 0 ? "Building reputation" : "New on Yoinkr"}
            </Text>
            <Text style={styles.trustBody}>
              {hasScore
                ? `${profile.dealsClosed} jobs closed in-app · rated by real hirers`
                : profile.ratingCount > 0
                  ? `${profile.ratingCount} rating${profile.ratingCount > 1 ? "s" : ""} so far — the average shows at 3`
                  : `${profile.yearsExp} yrs of experience — no in-app deals yet`}
            </Text>
          </View>
        </View>

        {/* actions */}
        {!isMe && (
          <View style={styles.actionRow}>
            <PressableScale
              style={styles.messageBtn}
              onPress={async () => {
                if (!(await requireAccount())) return;
                const convId = await getOrCreateConversation(profile.id, null);
                router.push({ pathname: "/chat/[id]", params: { id: convId } });
              }}
            >
              <Text style={styles.messageText}>Message {profile.fullName.split(" ")[0]}</Text>
            </PressableScale>
            <PressableScale
              style={[styles.vouchBtn, myVouch && styles.vouchBtnDone]}
              onPress={async () => {
                if (!(await requireAccount())) return;
                if (myVouch) onUnvouch();
                else setVouchOpen(true);
              }}
            >
              <Text style={[styles.vouchBtnText, myVouch && styles.vouchBtnTextDone]}>
                {myVouch ? "Vouched ✓" : "Vouch"}
              </Text>
            </PressableScale>
          </View>
        )}

        {/* vouches — named, with the category they stand behind */}
        {vouches.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Vouched by ({vouches.length})</Text>
            {vouches.map((v) => (
              <View key={v.id} style={styles.vouchCard}>
                <Avatar letter={v.voucher.fullName[0] ?? "?"} photoUrl={v.voucher.avatarUrl} size={28} />
                <View style={{ flex: 1 }}>
                  <View style={styles.vouchNameRow}>
                    <Text style={styles.vouchName}>{v.voucher.fullName}</Text>
                    {v.voucher.verified && <Verified size={12} />}
                    {v.voucher.trustScore != null && (
                      <Text style={styles.vouchTrust}>★ {v.voucher.trustScore.toFixed(1)}</Text>
                    )}
                  </View>
                  <Text style={styles.vouchMeta}>
                    as {categoryLabel(v.category)} · {v.when}
                  </Text>
                  {!!v.comment && <Text style={styles.vouchComment}>“{v.comment}”</Text>}
                </View>
              </View>
            ))}
          </>
        )}

        {/* references — only the server-revealed ones (double-blind) */}
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
              {!!r.comment && <Text style={styles.refComment}>“{r.comment}”</Text>}
            </View>
          ))
        )}

        {/* portfolio — category-default art when the worker hasn't added photos */}
        {(portfolio.length > 0 || artCategory) && (
          <>
            <Text style={styles.sectionTitle}>Work photos</Text>
            <View style={styles.grid}>
              {portfolio.length > 0
                ? portfolio.map((p) => (
                    <Placeholder key={p.id} photoUrl={p.photoUrl} style={styles.gridItem}>
                      <Text style={styles.gridLabel}>{p.caption}</Text>
                    </Placeholder>
                  ))
                : artCategory &&
                  Array.from({ length: categoryPhotoCount(artCategory) }, (_, v) => (
                    <CategoryPhoto key={v} category={artCategory} variant={v} style={styles.gridItem}>
                      <SamplePill />
                    </CategoryPhoto>
                  ))}
            </View>
            {portfolio.length === 0 && artCategory && (
              <Text style={styles.sampleNote}>
                Sample {categoryLabel(artCategory)} images — {profile.fullName.split(" ")[0]} hasn’t
                added work photos yet.
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <VouchModal
        visible={vouchOpen}
        name={profile.fullName.split(" ")[0]}
        categories={profile.categories.length > 0 ? profile.categories : CATEGORIES.map((c) => c.id)}
        onClose={() => setVouchOpen(false)}
        onSubmit={onVouch}
      />
    </View>
  );
}

// One vouch per person, tied to a category — "I stand behind him as a framer".
function VouchModal({
  visible,
  name,
  categories,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  name: string;
  categories: CategoryId[];
  onClose: () => void;
  onSubmit: (category: CategoryId, comment: string) => void;
}) {
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [comment, setComment] = useState("");
  const picked = category ?? categories[0] ?? null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <Text style={styles.modalTitle}>Vouch for {name}</Text>
          <Text style={styles.modalHint}>
            Your name goes on it. Only vouch for someone you've actually worked with.
          </Text>
          <View style={styles.modalChips}>
            {categories.map((c) => {
              const active = picked === c;
              return (
                <PressableScale
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.modalChip,
                    {
                      borderColor: active ? colors.safety : colors.line,
                      backgroundColor: active ? colors.safetyBg : colors.card,
                    },
                  ]}
                >
                  <Text style={[styles.modalChipText, { color: active ? colors.safetyInk : colors.inkMid }]}>
                    {categoryLabel(c)}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <TextInput
            style={styles.modalInput}
            placeholder="Framed two houses together in Stittsville… (optional)"
            placeholderTextColor={colors.inkLo}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <PressableScale
            style={[styles.modalBtn, { opacity: picked ? 1 : 0.5 }]}
            disabled={!picked}
            onPress={() => picked && onSubmit(picked, comment.trim())}
          >
            <Text style={styles.modalBtnText}>Vouch</Text>
          </PressableScale>
        </Pressable>
      </Pressable>
    </Modal>
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
  actionRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  messageBtn: {
    flex: 1,
    backgroundColor: colors.safety,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  messageText: { color: colors.white, fontFamily: fonts.display, fontSize: 14.5 },
  vouchBtn: {
    borderWidth: 1,
    borderColor: colors.safety,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  vouchBtnText: { color: colors.safetyInk, fontFamily: fonts.display, fontSize: 14.5 },
  vouchBtnDone: { backgroundColor: colors.goodBg, borderColor: colors.goodLine },
  vouchBtnTextDone: { color: colors.good },
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
  vouchCard: {
    marginHorizontal: 14,
    marginBottom: 9,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 13,
    flexDirection: "row",
    gap: 9,
  },
  vouchNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  vouchName: { fontSize: 12.5, fontWeight: "700", color: colors.ink },
  vouchTrust: { fontSize: 11, color: colors.good, fontWeight: "700" },
  vouchMeta: { fontSize: 10.5, color: colors.inkLo, marginTop: 1 },
  vouchComment: { fontSize: 12.5, color: colors.inkMid, lineHeight: 17, marginTop: 6 },
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
  sampleNote: { paddingHorizontal: 18, paddingTop: 8, fontSize: 10.5, color: colors.inkLo, lineHeight: 15 },
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
  modalHint: { fontSize: 11.5, color: colors.inkLo, marginTop: 8, lineHeight: 16 },
  modalChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  modalChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  modalChipText: { fontSize: 12.5, fontWeight: "700" },
  modalInput: {
    marginTop: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.ink,
    minHeight: 60,
    textAlignVertical: "top",
  },
  modalBtn: {
    marginTop: 14,
    backgroundColor: colors.safety,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnText: { color: colors.white, fontFamily: fonts.display, fontSize: 14 },
});
