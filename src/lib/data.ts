import { prisma } from "@/lib/db";

export async function getCourses() {
  return prisma.course.findMany({ orderBy: { name: "asc" } });
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
