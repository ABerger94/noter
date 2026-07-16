const COMPRESS_THRESHOLD_BYTES = 2 * 1024 * 1024;

// Vercel's serverless functions hard-cap request bodies at ~4.5MB. We leave
// headroom under that for form fields and multipart overhead, and because
// multiple compressed photos in one note can still add up past a single
// photo's own budget.
const MAX_TOTAL_BYTES = 3.5 * 1024 * 1024;

// Each retry pass shrinks harder (smaller max dimension, lower quality) when
// the batch as a whole is still over budget after the first pass.
const DIMENSION_STEPS = [1920, 1600, 1280, 1024, 800];
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.55, 0.5];

async function compressOne(file: File, maxDimension: number, quality: number): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function totalSize(files: File[]) {
  return files.reduce((sum, f) => sum + f.size, 0);
}

export async function compressImages(
  files: File[]
): Promise<{ files: File[]; stillOverBudget: boolean }> {
  const images = files.filter((f) => f.size > 0 && f.type.startsWith("image/"));
  if (images.length === 0) {
    return { files: [], stillOverBudget: false };
  }

  let processed = await Promise.all(
    images.map((f) =>
      f.size > COMPRESS_THRESHOLD_BYTES ? compressOne(f, DIMENSION_STEPS[0], QUALITY_STEPS[0]) : f
    )
  );

  for (let step = 1; totalSize(processed) > MAX_TOTAL_BYTES && step < DIMENSION_STEPS.length; step++) {
    processed = await Promise.all(
      images.map((f) => compressOne(f, DIMENSION_STEPS[step], QUALITY_STEPS[step]))
    );
  }

  return { files: processed, stillOverBudget: totalSize(processed) > MAX_TOTAL_BYTES };
}
