import { router } from "expo-router";
import { useState } from "react";
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
import { TRADES, type TradeId } from "@/data/trades";
import type { ListingType } from "@/data/types";
import { useRegion } from "@/store/useRegion";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const TYPES: { key: ListingType; label: string }[] = [
  { key: "job", label: "Job" },
  { key: "available", label: "Worker" },
  { key: "tool", label: "Tool" },
];

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const city = useRegion((s) => s.city);
  const [type, setType] = useState<ListingType>("job");
  const [trade, setTrade] = useState<TradeId>("framing");
  const [title, setTitle] = useState("");
  const [pay, setPay] = useState("");
  const [detail, setDetail] = useState("");
  const [location, setLocation] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const needsTrade = type !== "tool";
  // Real titles only — blocks junk like "44" from reaching the feed.
  const titleOk = title.trim().length >= 4 && !/^\d+$/.test(title.trim());
  const canPost = titleOk && !saving && !uploading;

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
      trade: needsTrade ? trade : null,
      title: title.trim(),
      pay: pay.trim() || "—",
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
          {/* type selector */}
          <Text style={styles.label}>Type</Text>
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

          {/* trade selector (jobs & workers) */}
          {needsTrade && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>Trade</Text>
              <View style={styles.tradeWrap}>
                {TRADES.map((t) => {
                  const active = trade === t.id;
                  return (
                    <PressableScale
                      key={t.id}
                      onPress={() => setTrade(t.id)}
                      style={[styles.tradeChip, { borderColor: active ? colors.safety : colors.line, backgroundColor: active ? colors.safetyBg : colors.card }]}
                    >
                      <Text style={[styles.tradeChipText, { color: active ? colors.safetyInk : colors.inkMid }]}>{t.label}</Text>
                    </PressableScale>
                  );
                })}
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
          <Field label="Pay" value={pay} onChangeText={setPay} placeholder="$34/hr" />
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
              <PressableScale style={styles.photoBtn} onPress={addPhoto} disabled={uploading}>
                <Text style={styles.photoBtnText}>
                  {uploading ? "Uploading…" : "＋ Add photo"}
                </Text>
              </PressableScale>
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
  typeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  typeText: { fontSize: 13, fontWeight: "700" },
  tradeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  tradeChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  tradeChipText: { fontSize: 12.5, fontWeight: "700" },
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
