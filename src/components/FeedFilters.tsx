import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { TypeFilter } from "@/data/repository";
import { CATEGORIES, categoryLabel } from "@/data/categories";
import { useResponsive } from "@/lib/responsive";
import { useFeedFilter } from "@/store/useFeedFilter";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { PressableScale } from "./PressableScale";

// Feed filters, one pattern per breakpoint (marketplace convention —
// FB Marketplace / Kijiji / Airbnb):
// - mobile/tablet: ONE compact row — type chips + a "Category ▾" chip that
//   opens a sheet with every framing category (FeedFilterBar + CategorySheet).
// - desktop: the filters live in the left sidebar as grouped lists
//   (SidebarFilters, rendered by SideNav on the Jobs route only).
// State is shared via useFeedFilter so all surfaces stay in sync.

const TYPES: TypeFilter[] = ["All", "Jobs", "Workers", "Tools"];

// --- mobile / tablet: single-row bar --------------------------------------

export function FeedFilterBar() {
  const { type, category, setType } = useFeedFilter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const categoryActive = category !== "All";

  return (
    <View style={bar.block}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={bar.row}
      >
        {TYPES.map((k) => {
          const active = type === k;
          return (
            <PressableScale
              key={k}
              onPress={() => setType(k)}
              style={[bar.chip, active && bar.chipActive]}
            >
              <Text style={[bar.chipText, active && bar.chipTextActive]}>{k}</Text>
            </PressableScale>
          );
        })}

        <View style={bar.divider} />

        <PressableScale
          onPress={() => setSheetOpen(true)}
          style={[bar.chip, bar.tradeChip, categoryActive && bar.tradeChipActive]}
        >
          <Text style={[bar.chipText, categoryActive && bar.tradeChipTextActive]}>
            {categoryActive ? categoryLabel(category) : "Category"} ▾
          </Text>
        </PressableScale>
      </ScrollView>

      <CategorySheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

// --- category picker sheet (bottom sheet on mobile, centered card on md+) --

function CategorySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { category, setCategory } = useFeedFilter();
  const { isMobile } = useResponsive();

  const pick = (c: typeof category) => {
    setCategory(c);
    onClose();
  };

  const options: { key: typeof category; label: string }[] = [
    { key: "All", label: "All categories" },
    ...CATEGORIES.map((c) => ({ key: c.id as typeof category, label: c.label })),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[sheet.backdrop, !isMobile && sheet.backdropCenter]} onPress={onClose}>
        {/* Stop backdrop-press from closing when tapping the card itself. */}
        <Pressable style={[sheet.card, isMobile ? sheet.cardBottom : sheet.cardFloating]}>
          <Text style={sheet.title}>Category</Text>
          {options.map((o) => {
            const active = category === o.key;
            return (
              <PressableScale
                key={o.key}
                onPress={() => pick(o.key)}
                style={[sheet.option, active && sheet.optionActive]}
              >
                <Text style={[sheet.optionText, active && sheet.optionTextActive]}>{o.label}</Text>
                {active && <Text style={sheet.check}>✓</Text>}
              </PressableScale>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- desktop: sidebar filter panel -----------------------------------------

export function SidebarFilters() {
  const { type, category, setType, setCategory } = useFeedFilter();

  return (
    <View style={panel.wrap}>
      <Text style={panel.heading}>Browse</Text>
      {TYPES.map((k) => (
        <PanelRow key={k} label={k} active={type === k} onPress={() => setType(k)} />
      ))}

      <Text style={[panel.heading, panel.headingGap]}>Category</Text>
      <PanelRow label="All categories" active={category === "All"} onPress={() => setCategory("All")} />
      {CATEGORIES.map((c) => (
        <PanelRow
          key={c.id}
          label={c.label}
          active={category === c.id}
          onPress={() => setCategory(c.id)}
        />
      ))}
    </View>
  );
}

function PanelRow({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} style={[panel.row, active && panel.rowActive]}>
      <Text style={[panel.rowText, active && panel.rowTextActive]}>{label}</Text>
    </PressableScale>
  );
}

// --- styles -----------------------------------------------------------------

const bar = StyleSheet.create({
  block: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.inkBrand,
    borderColor: colors.inkBrand,
  },
  chipText: { fontSize: 12.5, fontFamily: fonts.bodySemi, color: colors.secondary },
  chipTextActive: { color: colors.white },
  divider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 2 },
  tradeChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  tradeChipActive: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accent,
  },
  tradeChipTextActive: { color: colors.accentDark },
});

const sheet = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(30,27,24,0.4)", justifyContent: "flex-end" },
  backdropCenter: { justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    paddingBottom: 28,
  },
  cardBottom: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  cardFloating: { borderRadius: 16, width: 320, paddingBottom: 16 },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.inkBrand,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  optionActive: { backgroundColor: colors.accentTint },
  optionText: { fontSize: 14.5, fontFamily: fonts.bodySemi, color: colors.inkBrand },
  optionTextActive: { color: colors.accentDark },
  check: { fontSize: 14, color: colors.accentDark, fontFamily: fonts.bodyBold },
});

const panel = StyleSheet.create({
  wrap: { marginTop: 22 },
  heading: {
    fontSize: 11,
    fontFamily: fonts.bodySemi,
    color: colors.tertiary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  headingGap: { marginTop: 18 },
  row: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  rowActive: { backgroundColor: colors.accentTint },
  rowText: { fontSize: 13.5, fontFamily: fonts.bodySemi, color: colors.secondary },
  rowTextActive: { color: colors.accentDark, fontFamily: fonts.bodyBold },
});
