import { uploadTradeImage } from "./cloudinary";

/** Upload chart screenshot to Cloudinary; returns the public image URL for Firestore. */
export async function uploadScreenshot(userId: string, file: File): Promise<string> {
  return uploadTradeImage(userId, file);
}
