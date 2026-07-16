"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createCourse(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#6366f1");
  if (!name) return;

  await prisma.course.upsert({
    where: { name },
    update: {},
    create: { name, color },
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
