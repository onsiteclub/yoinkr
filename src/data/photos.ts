import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { ensureUserId, supabase } from "./supabase";

// Image pipeline (HANDOFF §2: compress before upload):
//   pick → resize to ≤1280px wide JPEG @ 75% → upload to Storage bucket
//   `yoinkr-photos` under {uid}/{timestamp}.jpg → return the public URL.
//   (Bucket is prefixed because Storage on onsite-core is holding-wide.)
// The bucket is public-read; writes are locked to the owner's folder (RLS).

const MAX_WIDTH = 1280;

export async function pickAndUploadPhoto(): Promise<string | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1, // compression happens in the manipulator below
    allowsMultipleSelection: false,
  });
  if (picked.canceled || !picked.assets?.[0]) return null;
  const asset = picked.assets[0];

  // Resize + compress (skip resize when already small).
  const actions: ImageManipulator.Action[] =
    asset.width && asset.width > MAX_WIDTH ? [{ resize: { width: MAX_WIDTH } }] : [];
  const manipulated = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: 0.75,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!manipulated.base64) throw new Error("Could not read image data");

  const uid = await ensureUserId();
  const path = `${uid}/${Date.now()}.jpg`;
  const bytes = base64ToBytes(manipulated.base64);

  const { error } = await supabase.storage.from("yoinkr-photos").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("yoinkr-photos").getPublicUrl(path);
  return data.publicUrl;
}

// Upload + register a portfolio photo for the signed-in user.
export async function addPortfolioPhoto(caption = ""): Promise<string | null> {
  const url = await pickAndUploadPhoto();
  if (!url) return null;
  const uid = await ensureUserId();
  const { error } = await supabase
    .from("portfolio_photos")
    .insert({ profile_id: uid, photo_url: url, caption });
  if (error) throw error;
  return url;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = globalThis.atob(b64); // available on web and Hermes (RN ≥ 0.76)
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
