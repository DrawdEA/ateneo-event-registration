"use server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createEventAction(formData: FormData, userId: string) {
  if (!userId) throw new Error("You must be logged in to create an event.");

  const name = formData.get("name") as string;
  const date = formData.get("date") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;

  await db.event.create({
    data: {
      name,
      date: new Date(date),
      location,
      description,
      creatorId: userId,
    },
  });
  revalidatePath("/dashboard");
} 