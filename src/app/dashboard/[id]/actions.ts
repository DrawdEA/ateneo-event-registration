"use server";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateEventAction(eventId: string, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.creatorId !== userId) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const date = formData.get("date") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;

  await db.event.update({
    where: { id: eventId },
    data: {
      name,
      date: new Date(date),
      location,
      description,
    },
  });
  revalidatePath(`/dashboard/${eventId}`);
} 