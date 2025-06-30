"use client";
import { useSession } from "@/lib/auth-client";
import { useTransition } from "react";
import { createEventAction } from "@/app/dashboard/actions";

export function EventCreateForm() {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.user?.id) {
      alert("You must be logged in to create an event.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createEventAction(formData, session.user.id);
      window.location.reload(); // Refresh to show new event
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-6 rounded shadow">
      <label className="flex flex-col">
        Name
        <input type="text" name="name" className="input input-bordered mt-1" placeholder="Event Name" required />
      </label>
      <label className="flex flex-col">
        Date
        <input type="datetime-local" name="date" className="input input-bordered mt-1" required />
      </label>
      <label className="flex flex-col md:col-span-2">
        Location
        <input type="text" name="location" className="input input-bordered mt-1" placeholder="Event Location" />
      </label>
      <label className="flex flex-col md:col-span-2">
        Description
        <textarea name="description" className="input input-bordered mt-1" placeholder="Event Description" />
      </label>
      <button type="submit" className="btn btn-primary md:col-span-2 mt-2" disabled={isPending}>
        {isPending ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
} 