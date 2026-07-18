import { prisma } from "@/lib/db";
import { computeRelatedItems } from "@/lib/related";

export async function getCourses() {
  return prisma.course.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function getTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function getNotes({
  q,
  courseId,
  tag,
}: {
  q?: string;
  courseId?: string;
  tag?: string;
}) {
  return prisma.note.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        courseId ? { courseId } : {},
        tag ? { tags: { some: { tag: { name: tag } } } } : {},
      ],
    },
    include: {
      course: true,
      tags: { include: { tag: true } },
      attachments: { select: { id: true, filename: true, mimeType: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getNote(id: string) {
  return prisma.note.findUnique({
    where: { id },
    include: {
      course: true,
      tags: { include: { tag: true } },
      attachments: { select: { id: true, filename: true, mimeType: true, size: true } },
    },
  });
}

export async function getDocuments({
  q,
  courseId,
  tag,
}: {
  q?: string;
  courseId?: string;
  tag?: string;
}) {
  return prisma.document.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        courseId ? { courseId } : {},
        tag ? { tags: { some: { tag: { name: tag } } } } : {},
      ],
    },
    select: {
      id: true,
      title: true,
      filename: true,
      mimeType: true,
      size: true,
      content: true,
      courseId: true,
      createdAt: true,
      course: true,
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDocument(id: string) {
  return prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      filename: true,
      mimeType: true,
      size: true,
      courseId: true,
      createdAt: true,
      course: true,
      tags: { include: { tag: true } },
    },
  });
}

export async function getRelatedItems(itemId: string, limit = 5) {
  const [notes, documents] = await Promise.all([
    prisma.note.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        course: { select: { id: true, name: true, color: true } },
        tags: { select: { tag: { select: { id: true, name: true } } } },
      },
    }),
    prisma.document.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        course: { select: { id: true, name: true, color: true } },
        tags: { select: { tag: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  const items = [
    ...notes.map((note) => ({ ...note, kind: "note" as const })),
    ...documents.map((document) => ({ ...document, kind: "document" as const })),
  ];

  return computeRelatedItems(itemId, items, limit);
}
