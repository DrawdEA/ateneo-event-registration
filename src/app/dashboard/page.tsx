import { db } from "@/lib/prisma";
import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { EventCreateModal } from "@/components/event-create-modal";

export default async function DashboardPage() {
  // Get the current user session securely on the server
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="p-8 text-center text-lg text-red-500">
        You must be logged in to view your dashboard.
      </div>
    );
  }

  // Fetch only events created by the current user
  const events = await db.event.findMany({
    where: { creatorId: userId },
    orderBy: { date: "desc" },
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Your Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">No events found.</div>
        ) : (
          events.map(event => (
            <Link
              key={event.id}
              href={`/dashboard/${event.id}`}
              className="bg-white dark:bg-gray-900 p-6 rounded shadow flex flex-col gap-2 transition hover:ring-2 hover:ring-blue-500 cursor-pointer"
              prefetch={false}
            >
              <div className="font-bold text-lg">{event.name}</div>
              <div className="text-gray-600 dark:text-gray-300">{new Date(event.date).toLocaleString()}</div>
              <div className="text-gray-500 dark:text-gray-400">{event.location}</div>
              <div className="text-sm mt-2">{event.description}</div>
            </Link>
          ))
        )}
        {/* Plus button as the last grid item */}
        <EventCreateModal />
      </div>
    </div>
  );
}
