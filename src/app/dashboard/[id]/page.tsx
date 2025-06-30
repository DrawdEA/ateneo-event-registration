import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import React from "react";
import { redirect } from "next/navigation";
import { EventEditModal } from "@/components/event-edit-modal";
import { EventDeleteButton } from "@/components/event-delete-button";

interface EventPageProps {
  params: { id: string };
}

// Server action to delete event
export async function deleteEventAction(eventId: string, userId: string) {
  "use server";
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.creatorId !== userId) {
    throw new Error("Unauthorized");
  }
  await db.event.delete({ where: { id: eventId } });
  redirect("/dashboard");
}

export default async function EventPage({ params }: EventPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="p-8 text-center text-lg text-red-500">
        You must be logged in to view this event.
      </div>
    );
  }

  const event = await db.event.findUnique({
    where: { id: params.id },
  });

  if (!event || event.creatorId !== userId) {
    return (
      <div className="p-8 text-center text-lg text-red-500">
        Event not found or you do not have access to this event.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
      <div className="mb-2 text-gray-600 dark:text-gray-300">
        <strong>Date:</strong> {new Date(event.date).toLocaleString()}
      </div>
      <div className="mb-2 text-gray-500 dark:text-gray-400">
        <strong>Location:</strong> {event.location || "N/A"}
      </div>
      <div className="mb-4 text-gray-700 dark:text-gray-200">
        <strong>Description:</strong> {event.description || "No description provided."}
      </div>
      <div className="text-sm text-gray-400 mb-6">
        <strong>Event ID:</strong> {event.id}
      </div>
      <div className="flex gap-4">
        <EventEditModal event={event} />
        <EventDeleteButton eventId={event.id} userId={userId} deleteEventAction={deleteEventAction} />
      </div>
    </div>
  );
} 