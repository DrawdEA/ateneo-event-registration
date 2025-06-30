"use client";
import { useState } from "react";
import { EventCreateForm } from "@/components/event-create-form";

export function EventCreateModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Plus button card */}
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-6 rounded shadow border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 transition cursor-pointer min-h-[150px]"
        aria-label="Create new event"
        type="button"
      >
        <span className="text-4xl text-blue-500 mb-2">+</span>
        <span className="font-semibold">Create Event</span>
      </button>
      {/* Modal overlay */}
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
            <h2 className="text-xl font-bold mb-4">Create New Event</h2>
            <EventCreateForm />
          </div>
        </div>
      )}
    </>
  );
} 