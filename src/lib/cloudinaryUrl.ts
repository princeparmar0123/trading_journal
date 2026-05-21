/** Extract Cloudinary public_id from a secure_url (for destroy API). */
export function parseCloudinaryPublicId(imageUrl: string): string | null {
  if (!imageUrl.includes("res.cloudinary.com")) return null;
  const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?(?:\?.*)?$/);
  return match ? decodeURIComponent(match[1]) : null;
}
