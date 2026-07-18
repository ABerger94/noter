"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { extractPdfText } from "@/lib/pdf-text";

// Vercel's serverless functions hard-cap request bodies at ~4.5MB; leave
// headroom under that for form fields and multipart overhead (mirrors the
// budget note attachments already use).
const MAX_FILE_BYTES = 4 * 1024 * 1024;

function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

async function connectTags(tagNames: string[]) {
  const tagRecords = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  return tagRecords.map((t) => t.id);
}

export async function createDocument(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "") || null;
  const tagNames = parseTags(String(formData.get("tags") ?? ""));
  const file = formData.get("file") as File | null;

  if (!title) {
    throw new Error("Title is required");
  }
  if (!file || file.size === 0) {
    throw new Error("A PDF file is required");
  }
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("PDF is too large (max 4MB)");
  }

  const tagIds = await connectTags(tagNames);
  const buffer = Buffer.from(await file.arrayBuffer());
  const content = await extractPdfText(new Uint8Array(buffer));

  const document = await prisma.document.create({
    data: {
      title,
      courseId,
      filename: file.name || "document.pdf",
      mimeType: file.type,
      data: buffer,
      size: buffer.byteLength,
      content,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
  });

  revalidatePath("/");
  revalidatePath("/documents");
  redirect(`/documents/${document.id}`);
}

export async function deleteDocument(documentId: string) {
  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath("/");
  revalidatePath("/documents");
  redirect("/documents");
}
