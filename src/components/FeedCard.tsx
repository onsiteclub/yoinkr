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

export function FeedCard({
  listing,
  onPressAction,
  onPressAuthor,
}: {
  listing: Listing;
  onPressAction: (listing: Listing) => void;
  onPressAuthor?: (listing: Listing) => void;
}) {
  const isMine = listing.mine ?? false;

  // Primary action per card type/ownership (vocabulary per brand doc §9:
  // Apply → "Yoink it", candidates → crew):
  //   my worker post → Edit · my job → Crew (N) · someone's job →
  //   Yoink it / Yoinked ✓ · someone's worker post → View profile · tool → Message
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
      {listing.photoUrl || listing.trade ? (
        <Placeholder
          photoUrl={listing.photoUrl}
          trade={listing.trade}
          seed={listing.id}
          style={styles.photo}
        >
          <View style={styles.photoBadges}>
            <TypeBadge type={listing.type} />
            {listing.trade && <TradeTag trade={listing.trade} />}
            {listing.urgent && <UrgentBadge />}
          </View>
        </Placeholder>
      ) : (
        <View style={styles.noPhotoBadges}>
          <TypeBadge type={listing.type} />
          {listing.trade && <TradeTag trade={listing.trade} />}
          {listing.urgent && <UrgentBadge />}
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title}>{listing.title}</Text>

        <View style={styles.locationRow}>
          <LocationLine listing={listing} />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.pay}>{listing.pay}</Text>
          <Text style={styles.detail}>· {listing.detail}</Text>
        </View>

        <View style={styles.footer}>
          <PressableScale style={styles.author} onPress={() => onPressAuthor?.(listing)}>
            <Avatar letter={listing.author.fullName[0] ?? "?"} size={30} />
            <View>
              <View style={styles.authorName}>
                <Text style={styles.authorNameText}>{listing.author.fullName}</Text>
                {listing.author.verified && <Verified />}
              </View>
              <TrustInline
                trust={listing.author.trustScore}
                dealsClosed={listing.author.dealsClosed}
              />
            </View>
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

function TradeTag({ trade }: { trade: NonNullable<Listing["trade"]> }) {
  return (
    <View style={styles.tradeTag}>
      <Text style={styles.tradeTagText}>{tradeLabel(trade)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tradeTag: {
    backgroundColor: colors.accentTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  tradeTagText: { fontSize: 10, fontFamily: fonts.bodySemi, letterSpacing: 0.5, color: colors.accentDark },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    marginBottom: 11,
    overflow: "hidden",
  },
  photo: { height: 130, justifyContent: "flex-start" },
  photoBadges: { flexDirection: "row", gap: 6, padding: 10 },
  noPhotoBadges: { flexDirection: "row", gap: 6, paddingTop: 14, paddingHorizontal: 14 },
  body: { padding: 14 },
  title: { fontSize: 16, fontWeight: "700", color: colors.ink, lineHeight: 21, marginBottom: 5 },
  locationRow: { marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  pay: { fontFamily: fonts.display, fontSize: 19, fontWeight: "800", color: colors.ink },
  detail: { fontSize: 12.5, color: colors.inkMid },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  author: { flexDirection: "row", alignItems: "center", gap: 9 },
  authorName: { flexDirection: "row", alignItems: "center", gap: 4 },
  authorNameText: { fontSize: 12.5, color: colors.ink, fontWeight: "600" },
  actionBtn: {
    backgroundColor: colors.safety,
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: "center",
  },
  actionText: { color: colors.white, fontFamily: fonts.display, fontSize: 12.5 },
  actionBtnDone: { backgroundColor: colors.goodBg, borderWidth: 1, borderColor: colors.goodLine },
  actionTextDone: { color: colors.good },
});
