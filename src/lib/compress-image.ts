const MAX_DIMENSION = 1920;
const COMPRESS_THRESHOLD_BYTES = 2 * 1024 * 1024;
const JPEG_QUALITY = 0.82;

// Vercel's serverless functions hard-cap request bodies at ~4.5MB, so large
// photos (e.g. straight from a phone camera) need to be shrunk client-side
// before upload or the save silently fails.
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
