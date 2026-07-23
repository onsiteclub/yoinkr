import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AccountGate } from "@/components/AccountGate";
import { Avatar } from "@/components/Avatar";
import { CategoryPhoto, SamplePill, categoryPhotoCount } from "@/components/CategoryPhoto";
import { Header } from "@/components/Header";
import { Placeholder } from "@/components/Placeholder";
import { PressableScale } from "@/components/PressableScale";
import { ProfileGlance } from "@/components/ProfileGlance";
import { Verified } from "@/components/Verified";
import { categoryLabel } from "@/data/categories";
import { addPortfolioPhoto, pickAndUploadPhoto } from "@/data/photos";
import { getMyProfile, getPortfolio, setAvailability, setAvatar } from "@/data/repository";
import { hasAccount } from "@/data/supabase";
import type { PortfolioPhoto, Profile } from "@/data/types";
import { useResponsive } from "@/lib/responsive";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function ProfileScreen() {
  const { isMobile, contentWidth } = useResponsive();
  const [me, setMe] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      hasAccount().then((ok) => {
        setSignedIn(ok);
        if (!ok) return;
        getMyProfile().then(setMe);
        getPortfolio("me").then(setPortfolio);
      });
    }, [])
  );

  const toggleAvailable = async () => {
    if (!me) return;
    const next = await setAvailability(!me.available);
    setMe({ ...next });
  };

  const myCategory = me?.categories[0] ?? null;

  const onAddPhoto = async () => {
    try {
      setUploading(true);
      const url = await addPortfolioPhoto();
      if (url) setPortfolio(await getPortfolio("me"));
    } catch (e) {
      console.warn("portfolio upload failed", e);
    } finally {
      setUploading(false);
    }
  };

  // Tap the avatar → pick a photo → same pipeline as every other upload.
  const onChangeAvatar = async () => {
    try {
      const url = await pickAndUploadPhoto();
      if (url) {
        await setAvatar(url);
        setMe(await getMyProfile());
      }
    } catch (e) {
      console.warn("avatar upload failed", e);
    }
  };

  if (signedIn === false) {
    return (
      <View style={styles.screen}>
        <Header subtitle={<SectionTitle text="Profile" />} />
        <AccountGate blurb="Your profile is your reputation — categories, portfolio, stars and vouches live on your account." />
      </View>
    );
  }

  if (!me) {
    return (
      <View style={styles.screen}>
        <Header subtitle={<SectionTitle text="Profile" />} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header subtitle={<SectionTitle text="Profile" />} />
      <ScrollView
        contentContainerStyle={[
          { paddingBottom: 30 },
          !isMobile && { maxWidth: contentWidth, width: "100%", alignSelf: "center" },
        ]}
      >
        {/* identity — tap the avatar to set a profile photo */}
        <View style={styles.identity}>
          <PressableScale onPress={onChangeAvatar} hitSlop={6}>
            <Avatar letter={me.publicName[0] ?? "?"} photoUrl={me.avatarUrl} size={66} />
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>📷</Text>
            </View>
          </PressableScale>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{me.publicName}</Text>
              {me.verified && <Verified />}
            </View>
            {me.nickname && <Text style={styles.realName}>{me.fullName}</Text>}
            <Text style={styles.region}>📍 {me.region}</Text>
          </View>
          <PressableScale onPress={() => router.push("/setup")} hitSlop={8}>
            <Text style={styles.editLink}>Edit</Text>
          </PressableScale>
        </View>

        {/* at-a-glance: stars · closed · years + category chips (2026-07-23
            redesign — the prose boxes that used to explain trust are gone) */}
        <ProfileGlance profile={me} />

        {/* my ads — where everything I posted lives (edit from there) */}
        <PressableScale style={styles.myAdsRow} onPress={() => router.push("/my-ads")}>
          <Text style={styles.myAdsIcon}>▤</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.myAdsTitle}>My ads</Text>
            <Text style={styles.myAdsBody}>See and edit everything you posted</Text>
          </View>
          <Text style={styles.myAdsArrow}>›</Text>
        </PressableScale>

        {/* optional email verification — badge + account recovery, never a gate */}
        {!me.verified && (
          <PressableScale style={styles.verifyRow} onPress={() => router.push("/verify")}>
            <Verified size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.verifyTitle}>Get the verified badge</Text>
              <Text style={styles.verifyBody}>Confirm your email — badge + account recovery.</Text>
            </View>
            <Text style={styles.myAdsArrow}>›</Text>
          </PressableScale>
        )}

        {/* availability toggle */}
        <View style={{ padding: 16 }}>
          <PressableScale
            onPress={toggleAvailable}
            style={[
              styles.availBtn,
              { backgroundColor: me.available ? colors.good : colors.inkMid },
            ]}
          >
            <Text style={styles.availText}>
              {me.available ? "● Available for work" : "○ Not available"}
            </Text>
          </PressableScale>
        </View>

        {/* portfolio */}
        <View style={styles.portfolioHead}>
          <Text style={styles.portfolioTitle}>Portfolio</Text>
          <PressableScale onPress={onAddPhoto} disabled={uploading} hitSlop={8}>
            <Text style={styles.addPhoto}>{uploading ? "Uploading…" : "+ Add photo"}</Text>
          </PressableScale>
        </View>
        <View style={styles.grid}>
          {portfolio.map((p) => (
            <Placeholder key={p.id} photoUrl={p.photoUrl} style={styles.gridItem}>
              <Text style={styles.gridLabel}>{p.caption}</Text>
            </Placeholder>
          ))}
          {/* Bundled category photos until the user adds real work photos. */}
          {portfolio.length === 0 &&
            myCategory &&
            Array.from({ length: categoryPhotoCount(myCategory) }, (_, v) => (
              <CategoryPhoto key={v} category={myCategory} variant={v} style={styles.gridItem}>
                <SamplePill />
              </CategoryPhoto>
            ))}
        </View>
        {portfolio.length === 0 && myCategory && (
          <Text style={styles.sampleNote}>
            Sample {categoryLabel(myCategory)} images — add photos of your own work to stand out.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ text }: { text: string }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
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
  realName: { fontSize: 11.5, color: colors.inkLo, marginTop: 1 },
  myAdsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 14,
    marginTop: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  myAdsIcon: { fontSize: 20, color: colors.accentDark },
  myAdsTitle: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
  myAdsBody: { fontSize: 11.5, color: colors.inkMid, marginTop: 1 },
  myAdsArrow: { fontSize: 22, color: colors.inkLo },
  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: colors.goodBg,
    borderWidth: 1,
    borderColor: colors.goodLine,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  verifyTitle: { fontSize: 13.5, fontWeight: "700", color: "#0a6b41" },
  verifyBody: { fontSize: 11.5, color: "#3c7a5a", marginTop: 2, lineHeight: 16 },
  region: { fontSize: 12, color: colors.inkLo, marginTop: 2 },
  editLink: { fontSize: 12.5, color: colors.blue, fontWeight: "700" },
  avatarBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadgeText: { fontSize: 10 },
  availBtn: { borderRadius: 9, paddingVertical: 13, alignItems: "center" },
  availText: { color: colors.white, fontWeight: "800", fontSize: 14 },
  portfolioHead: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  portfolioTitle: {
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.inkMid,
  },
  addPhoto: { fontSize: 11, color: colors.blue, fontWeight: "700" },
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
});
