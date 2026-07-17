"use client";

import { useTransition } from "react";
import { updateCourseColor } from "@/app/actions/courses";

export default function CourseColorPicker({
  courseId,
  initialColor,
}: {
  courseId: string;
  initialColor: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="color"
      defaultValue={initialColor}
      disabled={isPending}
      onChange={(e) => {
        const color = e.target.value;
        startTransition(() => {
          updateCourseColor(courseId, color);
        });
      }}
      aria-label="Course color"
      title="Change course color"
      className="h-6 w-6 shrink-0 cursor-pointer rounded-full border border-slate-300 bg-transparent p-0 disabled:opacity-60 dark:border-slate-600 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:rounded-full [&::-webkit-color-swatch-wrapper]:p-0"
    />
  );
}
