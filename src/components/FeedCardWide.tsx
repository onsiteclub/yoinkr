import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { tradeLabel } from "@/data/trades";
import type { Listing } from "@/data/types";
import { Avatar } from "./Avatar";
import { TypeBadge, UrgentBadge } from "./Badge";
import { LocationLine } from "./LocationLine";
import { Placeholder } from "./Placeholder";
import { PressableScale } from "./PressableScale";
import { TrustInline } from "./TrustInline";
import { Verified } from "./Verified";

// Kijiji-style horizontal listing row for wide screens (web): photo left,
// price prominent, title, meta line, poster + trust at the bottom, primary
// action on the right. Same data & actions as FeedCard — layout only.
export function FeedCardWide({
  listing,
  onPressAction,
  onPressAuthor,
}: {
  listing: Listing;
  onPressAction: (listing: Listing) => void;
  onPressAuthor?: (listing: Listing) => void;
}) {
  const isMine = listing.mine ?? false;

  let action = "Message";
  let disabled = false;
  if (isMine && listing.type === "available") action = "Edit";
  else if (isMine && listing.type === "job") action = `Crew (${listing.applicants ?? 0})`;
  else if (listing.type === "job" && listing.appliedByMe) {
    action = "Yoinked ✓";
    disabled = true;
  } else if (listing.type === "job") action = "Yoink it";
  else if (listing.type === "available") action = "View profile";

  return (
    <View style={styles.card}>
      {/* photo (left) */}
      <Placeholder
        photoUrl={listing.photoUrl}
        trade={listing.trade}
        seed={listing.id}
        style={styles.photo}
      >
        <View style={styles.photoBadges}>
          <TypeBadge type={listing.type} />
          {listing.urgent && <UrgentBadge />}
        </View>
      </Placeholder>

      {/* content (right) */}
      <View style={styles.body}>
        <View style={styles.headRow}>
          <Text style={styles.pay}>{listing.pay}</Text>
          {listing.trade && (
            <View style={styles.tradeTag}>
              <Text style={styles.tradeTagText}>{tradeLabel(listing.trade)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        <View style={styles.locationRow}>
          <LocationLine listing={listing} size={13.5} />
        </View>

        <Text style={styles.meta}>
          {listing.when}
          {listing.detail ? `  ·  ${listing.detail}` : ""}
        </Text>

        <View style={styles.footer}>
          <PressableScale style={styles.author} onPress={() => onPressAuthor?.(listing)}>
            <Avatar letter={listing.author.fullName[0] ?? "?"} size={26} />
            <Text style={styles.authorName}>{listing.author.fullName}</Text>
            {listing.author.verified && <Verified size={13} />}
            <TrustInline trust={listing.author.trustScore} dealsClosed={listing.author.dealsClosed} />
          </PressableScale>

          <PressableScale
            style={[styles.actionBtn, disabled && styles.actionBtnDone]}
            disabled={disabled}
            onPress={() => onPressAction(listing)}
          >
            <Text style={[styles.actionText, disabled && styles.actionTextDone]}>{action}</Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  photo: { width: 200, minHeight: 156, justifyContent: "flex-start" },
  photoBadges: { flexDirection: "row", gap: 6, padding: 10 },
  body: { flex: 1, padding: 18, justifyContent: "space-between" },
  headRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pay: { fontFamily: fonts.display, fontSize: 24, color: colors.inkBrand },
  tradeTag: {
    backgroundColor: colors.accentTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tradeTagText: { fontSize: 10.5, fontFamily: fonts.bodySemi, letterSpacing: 0.5, color: colors.accentDark },
  title: { fontSize: 16.5, fontFamily: fonts.bodyBold, color: colors.inkBrand, lineHeight: 22, marginTop: 6 },
  locationRow: { marginTop: 6 },
  meta: { fontSize: 12.5, color: colors.tertiary, marginTop: 4 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  author: { flexDirection: "row", alignItems: "center", gap: 8 },
  authorName: { fontSize: 12.5, fontFamily: fonts.bodySemi, color: colors.inkBrand },
  actionBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: "center",
  },
  actionText: { color: colors.white, fontFamily: fonts.display, fontSize: 13 },
  actionBtnDone: { backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.successLine },
  actionTextDone: { color: colors.success },
});
