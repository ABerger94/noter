"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

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

async function filesToAttachments(files: File[]) {
  const images = files.filter((f) => f && f.size > 0);
  return Promise.all(
    images.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return {
        filename: file.name || "image",
        mimeType: file.type || "application/octet-stream",
        data: buffer,
        size: buffer.byteLength,
      };
    })
  );
}

export async function createNote(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const courseId = String(formData.get("courseId") ?? "") || null;
  const tagNames = parseTags(String(formData.get("tags") ?? ""));
  const files = formData.getAll("images") as File[];

  if (!title) {
    throw new Error("Title is required");
  }

  const tagIds = await connectTags(tagNames);
  const attachments = await filesToAttachments(files);

  const note = await prisma.note.create({
    data: {
      title,
      content,
      courseId,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
      attachments: { create: attachments },
    },
  });

  revalidatePath("/");
  redirect(`/notes/${note.id}`);
}

export async function updateNote(noteId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const courseId = String(formData.get("courseId") ?? "") || null;
  const tagNames = parseTags(String(formData.get("tags") ?? ""));
  const files = (formData.getAll("images") as File[]).filter((f) => f && f.size > 0);
  const removeAttachmentIds = formData
    .getAll("removeAttachments")
    .map((v) => String(v));

  if (!title) {
    throw new Error("Title is required");
  }

  const tagIds = await connectTags(tagNames);
  const attachments = await filesToAttachments(files);

  await prisma.$transaction([
    prisma.noteTag.deleteMany({ where: { noteId } }),
    prisma.attachment.deleteMany({
      where: { id: { in: removeAttachmentIds }, noteId },
    }),
    prisma.note.update({
      where: { id: noteId },
      data: {
        title,
        content,
        courseId,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
        attachments: { create: attachments },
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath(`/notes/${noteId}`);
  redirect(`/notes/${noteId}`);
}

export async function deleteNote(noteId: string) {
  await prisma.note.delete({ where: { id: noteId } });
  revalidatePath("/");
  redirect("/");
}
