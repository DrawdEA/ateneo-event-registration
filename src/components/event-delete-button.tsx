 "use client";
import { useTransition } from "react";

export function EventDeleteButton({ eventId, userId, deleteEventAction }: { eventId: string, userId: string, deleteEventAction: (eventId: string, userId: string) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this event?")) {
      startTransition(() => {
        deleteEventAction(eventId, userId);
      });
    }
  }

  return (
    <form onSubmit={handleDelete}>
      <button
        type="submit"
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
        disabled={isPending}
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}
