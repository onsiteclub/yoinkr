import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Placeholder } from "@/components/Placeholder";
import { PressableScale } from "@/components/PressableScale";
import { pickAndUploadPhoto } from "@/data/photos";
import { createListing } from "@/data/repository";
import { hasAccount } from "@/data/supabase";
import {
  CATEGORIES,
  type CategoryId,
  type PayModel,
  allowsPiecework,
} from "@/data/categories";
import type { ListingType } from "@/data/types";
import { useRegion } from "@/store/useRegion";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Both sides post here: hirers put up jobs, workers put up themselves.
const TYPES: { key: ListingType; label: string }[] = [
  { key: "job", label: "I'm hiring" },
  { key: "available", label: "I want work" },
  { key: "tool", label: "Tool" },
];

const TYPE_HINTS: Record<ListingType, string> = {
  job: "You need hands — workers see your post and Yoink it.",
  available: "You're offering your work — hirers see you in the feed and message you.",
  tool: "Selling or renting a tool.",
};

// The category decides how pay works: any category can be hourly; $/sqft and
// fixed price exist only for the skilled three (general labour is hourly-only,
// enforced here and by a DB check). Tools are just a fixed price.
export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const city = useRegion((s) => s.city);
  const [type, setType] = useState<ListingType>("job");
  const [category, setCategory] = useState<CategoryId>("framing");
  const [payModel, setPayModel] = useState<PayModel>("hourly");
  const [rate, setRate] = useState("");
  const [sqft, setSqft] = useState("");
  const [crewSize, setCrewSize] = useState(1);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [location, setLocation] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Posting is an interaction — guests get the welcome screen instead.
  useEffect(() => {
    hasAccount().then((ok) => {
      if (!ok) router.replace({ pathname: "/welcome", params: { gate: "1" } });
    });
  }, []);

  const isTool = type === "tool";
  const effectiveModel: PayModel = isTool ? "fixed" : payModel;
  const pieceworkOk = !isTool && allowsPiecework(category);

  const pickCategory = (id: CategoryId) => {
    setCategory(id);
    if (!allowsPiecework(id)) setPayModel("hourly");
  };

  // Real titles only — blocks junk like "44" from reaching the feed.
  const titleOk = title.trim().length >= 4 && !/^\d+$/.test(title.trim());
  const rateNum = parseFloat(rate.replace(",", "."));
  const rateOk = Number.isFinite(rateNum) && rateNum > 0;
  const sqftNum = parseInt(sqft, 10);
  const sqftOk = effectiveModel !== "per_sqft" || (Number.isFinite(sqftNum) && sqftNum > 0);
  const canPost = titleOk && rateOk && sqftOk && !saving && !uploading;

  const rateLabel =
    effectiveModel === "hourly" ? "Rate ($/hr)" : effectiveModel === "per_sqft" ? "Rate ($/sqft)" : "Price ($)";
  const ratePlaceholder =
    effectiveModel === "hourly" ? "34" : effectiveModel === "per_sqft" ? "2.10" : "2400";

  const addPhoto = async () => {
    try {
      setUploading(true);
      const url = await pickAndUploadPhoto();
      if (url) setPhotoUrl(url);
    } catch (e) {
      console.warn("photo upload failed", e);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!canPost) return;
    setSaving(true);
    await createListing({
      type,
      category: isTool ? null : category,
      payModel: effectiveModel,
      rate: rateNum,
      sqft: Number.isFinite(sqftNum) && sqftNum > 0 ? sqftNum : null,
      crewSize: isTool ? 1 : crewSize,
      title: title.trim(),
      detail: detail.trim(),
      city,
      location: location.trim() || "Ottawa area",
      urgent,
      photoUrl,
    });
    router.back();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </PressableScale>
        <Text style={styles.headerTitle}>New listing</Text>
        <PressableScale onPress={submit} hitSlop={10} disabled={!canPost}>
          <Text style={[styles.post, { color: canPost ? colors.ink : colors.inkLo }]}>Post</Text>
        </PressableScale>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.form}>
          {/* type selector — hirer and worker are both first-class here */}
          <Text style={styles.label}>What are you posting?</Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => {
              const active = type === t.key;
              return (
                <PressableScale
                  key={t.key}
                  onPress={() => setType(t.key)}
                  style={[
                    styles.typeChip,
                    { borderColor: active ? colors.ink : colors.line, backgroundColor: active ? colors.ink : colors.card },
                  ]}
                >
                  <Text style={[styles.typeText, { color: active ? colors.white : colors.inkMid }]}>{t.label}</Text>
                </PressableScale>
              );
            })}
          </View>
          <Text style={styles.hint}>{TYPE_HINTS[type]}</Text>

          {/* category selector (jobs & workers) */}
          {!isTool && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.tradeWrap}>
                {CATEGORIES.map((c) => {
                  const active = category === c.id;
                  return (
                    <PressableScale
                      key={c.id}
                      onPress={() => pickCategory(c.id)}
                      style={[styles.tradeChip, { borderColor: active ? colors.safety : colors.line, backgroundColor: active ? colors.safetyBg : colors.card }]}
                    >
                      <Text style={[styles.tradeChipText, { color: active ? colors.safetyInk : colors.inkMid }]}>{c.label}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          )}

          {/* pay model — hourly for everyone; piecework only for skilled categories */}
          {!isTool && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>Pay</Text>
              <View style={styles.typeRow}>
                <PayChip label="Hourly" active={payModel === "hourly"} onPress={() => setPayModel("hourly")} />
                {pieceworkOk && (
                  <>
                    <PayChip label="Per sqft" active={payModel === "per_sqft"} onPress={() => setPayModel("per_sqft")} />
                    <PayChip label="Fixed" active={payModel === "fixed"} onPress={() => setPayModel("fixed")} />
                  </>
                )}
              </View>
              {!pieceworkOk && <Text style={styles.hint}>General labour is hourly-only.</Text>}
            </View>
          )}

          <View style={styles.payRow}>
            <View style={{ flex: 1 }}>
              <Field
                label={rateLabel}
                value={rate}
                onChangeText={(v: string) => setRate(v.replace(/[^0-9.,]/g, ""))}
                placeholder={ratePlaceholder}
                keyboardType="decimal-pad"
              />
            </View>
            {!isTool && effectiveModel !== "hourly" && (
              <View style={{ flex: 1 }}>
                <Field
                  label={effectiveModel === "per_sqft" ? "Job size (sqft)" : "Sqft (optional)"}
                  value={sqft}
                  onChangeText={(v: string) => setSqft(v.replace(/[^0-9]/g, ""))}
                  placeholder="1850"
                  keyboardType="number-pad"
                />
              </View>
            )}
          </View>

          {/* crew — piecework framers run solo or in twos */}
          {!isTool && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>{type === "job" ? "Crew needed" : "Crew"}</Text>
              <View style={styles.typeRow}>
                <PayChip label="Solo" active={crewSize === 1} onPress={() => setCrewSize(1)} />
                <PayChip label="2-man" active={crewSize === 2} onPress={() => setCrewSize(2)} />
              </View>
            </View>
          )}

          {/* region (Ottawa only for now) */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Region</Text>
            <View style={styles.regionPill}>
              <Text style={styles.regionText}>📍 {city}</Text>
              <Text style={styles.regionHint}>Ottawa only — for now</Text>
            </View>
          </View>

          <Field label="Title" value={title} onChangeText={setTitle} placeholder="2 framers — starts Saturday 7am" />
          <Field label="Detail" value={detail} onChangeText={setDetail} placeholder="weekend · 1 day · used, 2 batteries" />
          <Field label="Location" value={location} onChangeText={setLocation} placeholder="Kanata" />

          <View style={styles.urgentRow}>
            <View>
              <Text style={styles.label}>Urgent</Text>
              <Text style={styles.urgentHint}>Starting today / this weekend</Text>
            </View>
            <Switch
              value={urgent}
              onValueChange={setUrgent}
              trackColor={{ true: colors.hazard, false: colors.line }}
            />
          </View>

          {/* photo */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Photo</Text>
            {photoUrl ? (
              <Placeholder photoUrl={photoUrl} style={styles.photoPreview}>
                <PressableScale style={styles.photoRemove} onPress={() => setPhotoUrl(null)}>
                  <Text style={styles.photoRemoveText}>✕</Text>
                </PressableScale>
              </Placeholder>
            ) : (
              <>
                <PressableScale style={styles.photoBtn} onPress={addPhoto} disabled={uploading}>
                  <Text style={styles.photoBtnText}>
                    {uploading ? "Uploading…" : "＋ Add photo"}
                  </Text>
                </PressableScale>
                <Text style={styles.photoHint}>
                  📷 Photos make a real difference — listings with a real photo get more replies
                  and fewer back-and-forth questions.
                </Text>
              </>
            )}
          </View>

          <PressableScale
            onPress={submit}
            disabled={!canPost}
            style={[styles.submitBtn, { opacity: canPost ? 1 : 0.5 }]}
          >
            <Text style={styles.submitText}>Post listing</Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function PayChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.typeChip,
        { borderColor: active ? colors.ink : colors.line, backgroundColor: active ? colors.ink : colors.card },
      ]}
    >
      <Text style={[styles.typeText, { color: active ? colors.white : colors.inkMid }]}>{label}</Text>
    </PressableScale>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.inkLo} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.card,
  },
  cancel: { fontSize: 14, color: colors.inkMid },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.ink,
  },
  post: { fontSize: 15, fontWeight: "800" },
  form: { padding: 18, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: "700", color: colors.inkMid, textTransform: "uppercase", letterSpacing: 0.4 },
  hint: { fontSize: 11.5, color: colors.inkLo, marginTop: 6 },
  typeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  typeText: { fontSize: 13, fontWeight: "700" },
  tradeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  tradeChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  tradeChipText: { fontSize: 12.5, fontWeight: "700" },
  payRow: { flexDirection: "row", gap: 10 },
  regionPill: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.safetyBg,
    borderWidth: 1,
    borderColor: "#F0D68A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  regionText: { fontSize: 14, fontWeight: "800", color: colors.safetyInk },
  regionHint: { fontSize: 11, color: colors.safetyInk, fontStyle: "italic" },
  input: {
    marginTop: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
  },
  urgentRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  urgentHint: { fontSize: 11, color: colors.inkLo, marginTop: 2 },
  submitBtn: {
    marginTop: 24,
    backgroundColor: colors.safety,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: { color: colors.white, fontFamily: fonts.display, fontSize: 15 },
  photoBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 26,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  photoBtnText: { fontSize: 13.5, fontWeight: "700", color: colors.inkMid },
  photoHint: { marginTop: 8, fontSize: 11.5, color: colors.inkLo, lineHeight: 16 },
  photoPreview: {
    marginTop: 8,
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  photoRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: { color: colors.white, fontSize: 13, fontWeight: "800" },
});
