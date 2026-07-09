import { StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import type { Listing } from "@/data/types";

// Location is a decisive hiring/search factor — it gets its own prominent
// line on every card ("📍 Kanata · 18 km away"), per brand doc §10.
export function LocationLine({
  listing,
  size = 13,
}: {
  listing: Pick<Listing, "location" | "distanceKm">;
  size?: number;
}) {
  return (
    <Text style={[styles.line, { fontSize: size }]} numberOfLines={1}>
      📍 <Text style={styles.place}>{listing.location}</Text>
      {typeof listing.distanceKm === "number" && (
        <Text style={styles.distance}> · {listing.distanceKm} km away</Text>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { lineHeight: 18 },
  place: { fontFamily: fonts.bodySemi, color: colors.inkBrand },
  distance: { fontFamily: fonts.body, color: colors.secondary },
});
