"use server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function extractSheetId(url: string): string | null {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function createEventAction(formData: FormData, userId: string) {
  if (!userId) throw new Error("You must be logged in to create an event.");

  const name = formData.get("name") as string;
  const date = formData.get("date") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;
  const googleSheetUrl = formData.get("googleSheetUrl") as string;
  const googleSheetId = googleSheetUrl ? extractSheetId(googleSheetUrl) : null;

  await db.event.create({
    data: {
      name,
      date: new Date(date),
      location,
      description,
      excelPath: googleSheetId,
      creatorId: userId,
    },
  });
  revalidatePath("/dashboard");
} 