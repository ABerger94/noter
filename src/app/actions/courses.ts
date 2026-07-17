"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createCourse(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#6366f1");
  if (!name) return;

  const { _max } = await prisma.course.aggregate({ _max: { sortOrder: true } });
  const nextSortOrder = (_max.sortOrder ?? -1) + 1;

  await prisma.course.upsert({
    where: { name },
    update: {},
    create: { name, color, sortOrder: nextSortOrder },
  });

  revalidatePath("/courses");
  revalidatePath("/notes/new");
  revalidatePath("/");
}

export async function deleteCourse(courseId: string) {
  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/courses");
  revalidatePath("/notes/new");
  revalidatePath("/");
}

export async function moveCourse(courseId: string, direction: "up" | "down") {
  const courses = await prisma.course.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, sortOrder: true },
  });

  const index = courses.findIndex((c) => c.id === courseId);
  if (index === -1) return;

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= courses.length) return;

  const current = courses[index];
  const other = courses[swapWith];

  await prisma.$transaction([
    prisma.course.update({ where: { id: current.id }, data: { sortOrder: other.sortOrder } }),
    prisma.course.update({ where: { id: other.id }, data: { sortOrder: current.sortOrder } }),
  ]);

  revalidatePath("/courses");
  revalidatePath("/notes/new");
  revalidatePath("/");
}
