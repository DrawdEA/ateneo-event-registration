import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import React from "react";
import { EventAttendanceForm } from "@/components/event-attendance-form";
import { LiveBarcodeScanner } from "@/components/barcode-scanner";

interface ScannerPageProps {
  params: { id: string };
}

export default async function ScannerPage({ params }: ScannerPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="p-8 text-center text-lg text-red-500">
        You must be logged in to use the scanner.
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
    <div className="p-8 max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-2">Attendance Scanner</h1>
      <h2 className="text-xl text-gray-500 mb-8">{event.name}</h2>
      {/* Live Barcode Scanner */}
      <LiveBarcodeScanner eventId={event.id} />
      <div className="divider my-8">OR</div>
      {/* Manual Input Form */}
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">Enter ID Manually</h3>
        <EventAttendanceForm eventId={event.id} />
      </div>
    </div>
  );
} 