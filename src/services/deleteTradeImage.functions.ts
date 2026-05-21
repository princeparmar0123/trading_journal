import { createServerFn } from "@tanstack/react-start";
import { parseCloudinaryPublicId } from "@/lib/cloudinaryUrl";

export const deleteTradeImageServer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object" || !("imageUrl" in data)) {
      throw new Error("Expected { imageUrl: string }");
    }
    const imageUrl = (data as { imageUrl: unknown }).imageUrl;
    if (typeof imageUrl !== "string" || !imageUrl) {
      throw new Error("Missing image URL");
    }
    return { imageUrl };
  })
  .handler(async ({ data }) => {
    const publicId = parseCloudinaryPublicId(data.imageUrl);
    if (!publicId) {
      return { deleted: false, reason: "not_cloudinary" as const };
    }

    const { destroyCloudinaryImage } = await import("./cloudinaryAdmin.server");
    await destroyCloudinaryImage(publicId);
    return { deleted: true as const };
  });
