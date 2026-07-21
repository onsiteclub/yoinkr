import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogoMark } from "@/components/Logo";
import { PressableScale } from "@/components/PressableScale";
import { CATEGORIES, type CategoryId, allowsPiecework } from "@/data/categories";
import { getMyProfile, updateMyProfile } from "@/data/repository";
import { hasAccount } from "@/data/supabase";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Profile setup (right after signup) and profile edit (from the Profile tab).
// Construction has three kinds of people (founder, 2026-07-20): some only
// hire, some work AND hire, some only get hired — so the FIRST question is
// the role. A pure hirer registers with just a name; worker fields only
// appear for people who take work. Skippable ("Later"); prefills on edit.
type Role = "hiring" | "working" | "both";

const ROLES: { id: Role; label: string }[] = [
  { id: "hiring", label: "I'm hiring" },
  { id: "working", label: "I'm looking for work" },
  { id: "both", label: "Both" },
];

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<CategoryId[]>([]);
  const [years, setYears] = useState("");
  const [acceptsHourly, setAcceptsHourly] = useState(true);
  const [acceptsPiecework, setAcceptsPiecework] = useState(false);
  const [crewSize, setCrewSize] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Profile setup is account territory — guests get the welcome screen.
    hasAccount().then((ok) => {
      if (!ok) router.replace({ pathname: "/welcome", params: { gate: "1" } });
    });
    getMyProfile()
      .then((p) => {
        if (p.fullName !== "New worker") setName(p.fullName);
        setCategories(p.categories);
        if (p.categories.length > 0 && p.hires) setRole("both");
        else if (p.hires) setRole("hiring");
        else if (p.categories.length > 0) setRole("working");
        if (p.yearsExp > 0) setYears(String(p.yearsExp));
        setAcceptsHourly(p.acceptsHourly);
        setAcceptsPiecework(p.acceptsPiecework);
        setCrewSize(p.crewSize);
      })
      .catch(() => {});
  }, []);

  const worksToo = role === "working" || role === "both";
  // Piecework only exists for the skilled categories — if none is selected,
  // the preference has nothing to apply to.
  const canPiecework = categories.some((c) => allowsPiecework(c));
  const canSave =
    role !== null &&
    name.trim().length >= 2 &&
    (!worksToo || categories.length > 0) &&
    !saving;

  const toggleCategory = (id: CategoryId) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const save = async () => {
    if (!canSave || role === null) return;
    setSaving(true);
    try {
      await updateMyProfile({
        fullName: name.trim(),
        categories: worksToo ? categories : [],
        hires: role !== "working",
        yearsExp: Math.max(0, parseInt(years, 10) || 0),
        acceptsHourly,
        acceptsPiecework: acceptsPiecework && canPiecework,
        crewSize,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.hero}>
            <LogoMark size={44} />
            <Text style={styles.title}>Set up your profile</Text>
            <Text style={styles.subtitle}>
              Your name and role show on everything you do here — it's how the other side decides.
            </Text>
          </View>

          <Text style={styles.label}>What brings you to yoinkr?</Text>
          <View style={styles.chipWrap}>
            {ROLES.map((r) => {
              const active = role === r.id;
              return (
                <PressableScale
                  key={r.id}
                  onPress={() => setRole(r.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accentTint : colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? colors.accentDark : colors.secondary }]}>
                    {active ? "✓ " : ""}
                    {r.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {role !== null && (
            <>
              <Text style={[styles.label, { marginTop: 18 }]}>
                {role === "hiring" ? "Your name or company" : "Your name"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={role === "hiring" ? "e.g. Ahmad Const." : "e.g. Carlos M."}
                placeholderTextColor={colors.tertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </>
          )}

          {worksToo && (
            <>
              <Text style={[styles.label, { marginTop: 18 }]}>What you do — pick all that apply</Text>
              <View style={styles.chipWrap}>
                {CATEGORIES.map((c) => {
                  const active = categories.includes(c.id);
                  return (
                    <PressableScale
                      key={c.id}
                      onPress={() => toggleCategory(c.id)}
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? colors.accent : colors.border,
                          backgroundColor: active ? colors.accentTint : colors.surface,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? colors.accentDark : colors.secondary }]}>
                        {active ? "✓ " : ""}
                        {c.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={[styles.label, { marginTop: 18 }]}>Work you take</Text>
              <View style={styles.chipWrap}>
                <PrefChip
                  label="Hourly"
                  active={acceptsHourly}
                  onPress={() => setAcceptsHourly((v) => !v)}
                />
                <PrefChip
                  label="Piecework ($/sqft · fixed)"
                  active={acceptsPiecework && canPiecework}
                  disabled={!canPiecework}
                  onPress={() => setAcceptsPiecework((v) => !v)}
                />
              </View>
              {!canPiecework && categories.length > 0 && (
                <Text style={styles.hint}>General labour is hourly-only.</Text>
              )}

              <Text style={[styles.label, { marginTop: 18 }]}>You work…</Text>
              <View style={styles.chipWrap}>
                <PrefChip label="Solo" active={crewSize === 1} onPress={() => setCrewSize(1)} />
                <PrefChip label="As a duo" active={crewSize === 2} onPress={() => setCrewSize(2)} />
              </View>

              <Text style={[styles.label, { marginTop: 18 }]}>Years of experience</Text>
              <TextInput
                style={[styles.input, { width: 120 }]}
                placeholder="0"
                placeholderTextColor={colors.tertiary}
                value={years}
                onChangeText={(v) => setYears(v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </>
          )}

          {role === "hiring" && (
            <Text style={styles.hint}>
              That's it — post jobs, review who yoinks them, and build your hirer reputation
              (workers rate you too).
            </Text>
          )}

          <PressableScale
            onPress={save}
            disabled={!canSave}
            style={[styles.cta, { opacity: canSave ? 1 : 0.5 }]}
          >
            <Text style={styles.ctaText}>{saving ? "Saving…" : "Start using yoinkr"}</Text>
          </PressableScale>

          <PressableScale onPress={() => router.back()} hitSlop={8} style={styles.skip}>
            <Text style={styles.skipText}>Later</Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function PrefChip({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        {
          opacity: disabled ? 0.4 : 1,
          borderColor: active ? colors.accent : colors.border,
          backgroundColor: active ? colors.accentTint : colors.surface,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? colors.accentDark : colors.secondary }]}>
        {active ? "✓ " : ""}
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.warmPaper },
  body: { padding: 24 },
  hero: { alignItems: "center", paddingTop: 28, paddingBottom: 28 },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.inkBrand,
    marginTop: 14,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.secondary,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 300,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.inkBrand,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontFamily: fonts.bodySemi },
  hint: { fontSize: 11.5, color: colors.tertiary, marginTop: 10, lineHeight: 16 },
  cta: {
    marginTop: 28,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaText: { color: colors.white, fontFamily: fonts.display, fontSize: 15.5 },
  skip: { alignSelf: "center", marginTop: 16, padding: 6 },
  skipText: { fontSize: 13.5, color: colors.tertiary, fontFamily: fonts.bodySemi },
});
