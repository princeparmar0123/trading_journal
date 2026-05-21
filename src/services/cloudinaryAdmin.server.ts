import { createHash } from "node:crypto";

export interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export function getCloudinaryCredentials(): CloudinaryCredentials {
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
    }
  }
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME ?? "dfs2e4c4i";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  if (!apiSecret) {
    throw new Error("Cloudinary API secret missing. Set CLOUDINARY_URL in .env");
  }
  return { cloudName, apiKey, apiSecret };
}

export function signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(sorted + apiSecret).digest("hex");
}

export async function destroyCloudinaryImage(publicId: string): Promise<void> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  const timestamp = String(Math.round(Date.now() / 1000));
  const paramsToSign = { public_id: publicId, timestamp };
  const signature = signCloudinaryParams(paramsToSign, apiSecret);

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

export async function uploadCloudinaryImage(file: File, userId: string): Promise<string> {
  const MAX_BYTES = 5 * 1024 * 1024;
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be under 5MB");
  }

  const timestamp = String(Math.round(Date.now() / 1000));
  const folder = `trades/${userId}`;
  const paramsToSign = { timestamp, folder };
  const signature = signCloudinaryParams(paramsToSign, apiSecret);

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
