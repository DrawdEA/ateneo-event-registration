"use client";
import { useState } from "react";
import { updateEventAction } from "@/app/dashboard/[id]/actions";

export function EventEditModal({ event }: { event: any }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    await updateEventAction(event.id, formData);
    setIsPending(false);
    setOpen(false);
    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
        type="button"
      >
        Edit
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 p-8 rounded shadow-lg max-w-md w-full relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Event</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col">
                Name
                <input type="text" name="name" defaultValue={event.name} className="input input-bordered mt-1" required />
              </label>
              <label className="flex flex-col">
                Date
                <input type="datetime-local" name="date" defaultValue={new Date(event.date).toISOString().slice(0,16)} className="input input-bordered mt-1" required />
              </label>
              <label className="flex flex-col">
                Location
                <input type="text" name="location" defaultValue={event.location || ""} className="input input-bordered mt-1" />
              </label>
              <label className="flex flex-col">
                Description
                <textarea name="description" defaultValue={event.description || ""} className="input input-bordered mt-1" />
              </label>
              <button type="submit" className="btn btn-primary mt-2" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 