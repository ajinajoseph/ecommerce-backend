const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export function resolveImageUrl(imageUrl) {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  const normalizedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${DEFAULT_BASE_URL}${normalizedPath}`;
}

export function getPrimaryImage(product) {
  const images = Array.isArray(product?.images) ? product.images : [];
  if (images.length === 0) {
    return null;
  }

  return images[0]?.image_url || images[0]?.thumbnail_url || null;
}
