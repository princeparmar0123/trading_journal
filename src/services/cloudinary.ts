import { parseCloudinaryPublicId } from "@/lib/cloudinaryUrl";
import {
  destroyCloudinaryImageClient,
  isCloudinaryUploadConfigured,
  uploadCloudinaryImageClient,
} from "@/lib/cloudinaryClient";

export const isCloudinaryConfigured = isCloudinaryUploadConfigured();

export async function uploadTradeImage(userId: string, file: File): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary not configured.");
  }
  return uploadCloudinaryImageClient(file, userId);
}

/** Delete chart image from Cloudinary when a trade is removed. */
export async function deleteTradeImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl || !parseCloudinaryPublicId(imageUrl)) return;

  try {
    await destroyCloudinaryImageClient(imageUrl);
  } catch (err) {
    console.error("Cloudinary image delete failed:", err);
    throw err;
  }
}
