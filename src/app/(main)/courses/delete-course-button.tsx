"use client";

export default function DeleteCourseButton({
  action,
}: {
  action: () => void;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this course? Notes in this course will be kept but unassigned."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm text-red-500 hover:text-red-600"
      >
        Remove
      </button>
    </form>
  );
}
