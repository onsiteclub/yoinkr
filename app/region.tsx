import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/PressableScale";
import { REGIONS } from "@/data/regions";
import { useRegion } from "@/store/useRegion";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function RegionScreen() {
  const insets = useSafeAreaInsets();
  const { city, setCity } = useRegion();

  const pick = (name: string) => {
    setCity(name);
    router.back();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Region</Text>
        <PressableScale onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.done}>Done</Text>
        </PressableScale>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          <Text style={{ fontWeight: "800" }}>Ottawa only — for now.</Text> More Canadian cities
          are coming — pick yours to get notified.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {REGIONS.map((r) => {
          const selected = r.name === city;
          return (
            <PressableScale
              key={r.id}
              style={styles.row}
              onPress={() => pick(r.name)}
            >
              <Text style={[styles.pin, { color: r.live ? colors.good : colors.inkLo }]}>
                📍
              </Text>
              <Text style={[styles.city, { color: r.live ? colors.ink : colors.inkMid }]}>
                {r.name}
              </Text>
              {r.live ? (
                <Text style={styles.live}>● LIVE</Text>
              ) : (
                <Text style={styles.soon}>Coming soon</Text>
              )}
              {selected && <Text style={styles.check}>✓</Text>}
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.card,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.ink,
  },
  done: { fontSize: 15, fontWeight: "800", color: colors.ink },
  banner: {
    margin: 14,
    backgroundColor: colors.safetyBg,
    borderWidth: 1,
    borderColor: "#F0D68A",
    borderRadius: 12,
    padding: 14,
  },
  bannerText: { fontSize: 12.5, color: colors.safetyInk, lineHeight: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    backgroundColor: colors.card,
  },
  pin: { fontSize: 15 },
  city: { flex: 1, fontSize: 15.5, fontWeight: "700" },
  live: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.good,
    letterSpacing: 0.5,
  },
  soon: { fontSize: 11.5, color: colors.inkLo, fontStyle: "italic" },
  check: { fontSize: 16, fontWeight: "900", color: colors.good, marginLeft: 8 },
});
