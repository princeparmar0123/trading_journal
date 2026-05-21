import { deleteTradeImageServer } from "@/services/deleteTradeImage.functions";
import { uploadTradeImageServer } from "@/services/uploadTradeImage.functions";
import { parseCloudinaryPublicId } from "@/lib/cloudinaryUrl";

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "dfs2e4c4i";

export const isCloudinaryConfigured = Boolean(cloudName);

const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadTradeImage(userId: string, file: File): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary not configured.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be under 5MB");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("userId", userId);

  const { url } = await uploadTradeImageServer({ data: form });
  return url;
}

/** Delete chart image from Cloudinary when a trade is removed. */
export async function deleteTradeImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl || !parseCloudinaryPublicId(imageUrl)) return;

  try {
    await deleteTradeImageServer({ data: { imageUrl } });
  } catch (err) {
    console.error("Cloudinary image delete failed:", err);
    throw err;
  }
}
