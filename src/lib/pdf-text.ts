import { extractText, getDocumentProxy } from "unpdf";

// Best-effort: a scanned/image-only or malformed PDF shouldn't block the
// upload, it just won't be full-text searchable.
export async function extractPdfText(data: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(data);
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
  } catch {
    return "";
  }
}
