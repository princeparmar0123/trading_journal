import { createServerFn } from "@tanstack/react-start";

export const uploadTradeImageServer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected FormData");
    }
    const file = data.get("file");
    const userId = data.get("userId")?.toString() ?? "";
    if (!(file instanceof File)) {
      throw new Error("Missing image file");
    }
    if (!userId) {
      throw new Error("Missing user id");
    }
    return { file, userId };
  })
  .handler(async ({ data }) => {
    const { uploadCloudinaryImage } = await import("./cloudinaryAdmin.server");
    const url = await uploadCloudinaryImage(data.file, data.userId);
    return { url };
  });
