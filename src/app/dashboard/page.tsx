import { db } from "@/lib/prisma";
import React from "react";
import { EventCreateForm } from "@/components/event-create-form";

export default async function DashboardPage() {
  // Fetch events from the database
  const events = await db.event.findMany({
    orderBy: { date: "desc" },
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Event Dashboard</h1>
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Create New Event</h2>
        <EventCreateForm />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Your Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">No events found.</div>
          ) : (
            events.map(event => (
              <div key={event.id} className="bg-white dark:bg-gray-900 p-6 rounded shadow flex flex-col gap-2">
                <div className="font-bold text-lg">{event.name}</div>
                <div className="text-gray-600 dark:text-gray-300">{new Date(event.date).toLocaleString()}</div>
                <div className="text-gray-500 dark:text-gray-400">{event.location}</div>
                <div className="text-sm mt-2">{event.description}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
