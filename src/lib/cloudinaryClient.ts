import { parseCloudinaryPublicId } from "@/lib/cloudinaryUrl";

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY ?? "";
const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET ?? "";
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function isCloudinaryUploadConfigured(): boolean {
  return Boolean(cloudName && (uploadPreset || (apiKey && apiSecret)));
}

function assertImageFile(file: File): void {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be under 5MB");
  }
}

async function sha1Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function paramsToSignString(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sorted + secret;
}

async function cloudinarySignature(
  params: Record<string, string>,
  secret: string,
): Promise<string> {
  const payload = paramsToSignString(params, secret);
  return sha1Hex(payload);
}

async function uploadSigned(file: File, userId: string): Promise<string> {
  const timestamp = String(Math.round(Date.now() / 1000));
  const folder = `trades/${userId}`;
  const paramsToSign = { timestamp, folder };
  const signature = await cloudinarySignature(paramsToSign, apiSecret);

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", timestamp);
  body.append("signature", signature);
  body.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  const json = (await res.json()) as { secure_url?: string; error?: { message: string } };
  if (!res.ok) {
    throw new Error(json.error?.message ?? "Upload failed");
  }
  if (!json.secure_url) {
    throw new Error("Upload succeeded but no URL returned");
  }
  return json.secure_url;
}

async function uploadUnsigned(file: File, userId: string): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);
  body.append("folder", `trades/${userId}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  const json = (await res.json()) as { secure_url?: string; error?: { message: string } };
  if (!res.ok) {
    throw new Error(json.error?.message ?? "Upload failed");
  }
  if (!json.secure_url) {
    throw new Error("Upload succeeded but no URL returned");
  }
  return json.secure_url;
}

export async function uploadCloudinaryImageClient(file: File, userId: string): Promise<string> {
  if (!cloudName) {
    throw new Error("Cloudinary cloud name missing. Set VITE_CLOUDINARY_CLOUD_NAME.");
  }
  assertImageFile(file);

  if (uploadPreset) {
    return uploadUnsigned(file, userId);
  }
  if (apiKey && apiSecret) {
    return uploadSigned(file, userId);
  }

  throw new Error(
    "Cloudinary upload not configured. Set VITE_CLOUDINARY_UPLOAD_PRESET (recommended) or VITE_CLOUDINARY_API_KEY + VITE_CLOUDINARY_API_SECRET.",
  );
}

export async function destroyCloudinaryImageClient(imageUrl: string): Promise<void> {
  const publicId = parseCloudinaryPublicId(imageUrl);
  if (!publicId) return;

  if (!apiKey || !apiSecret) {
    console.warn("Skipping Cloudinary delete: API credentials not available in the client.");
    return;
  }

  const timestamp = String(Math.round(Date.now() / 1000));
  const paramsToSign = { public_id: publicId, timestamp };
  const signature = await cloudinarySignature(paramsToSign, apiSecret);

  const body = new FormData();
  body.append("public_id", publicId);
  body.append("api_key", apiKey);
  body.append("timestamp", timestamp);
  body.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body,
  });

  const json = (await res.json()) as { result?: string; error?: { message: string } };
  if (!res.ok) {
    throw new Error(json.error?.message ?? "Failed to delete image from Cloudinary");
  }
}
