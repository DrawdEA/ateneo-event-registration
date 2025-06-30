"use server";
import { db } from "@/lib/prisma";
import { google } from "googleapis";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function getSheetIdFromEvent(eventId: string) {
  return db.event.findUnique({ where: { id: eventId } }).then(event => event?.excelPath || null);
}

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const authClient = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth: await authClient.getClient() });
}

export async function submitAttendance(eventId: string, ateneoId: string) {
  // Get event and sheet ID
  const sheetId = await getSheetIdFromEvent(eventId);
  if (!sheetId) return { status: "error", message: "No Google Sheet connected to this event." };

  // Get session (for future use, e.g., logging who scanned)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { status: "error", message: "Not authenticated." };

  const sheets = await getSheetsClient();
  const range = "Sheet1"; // Change if your sheet/tab name is different

  // 1. Get all rows
  const getRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  const rows = getRes.data.values || [];
  const header = rows[0] || [];
  const idCol = header.findIndex(h => h.toLowerCase().includes("id"));
  const attendanceCol = header.findIndex(h => h.toLowerCase().includes("attendance"));

  if (idCol === -1 || attendanceCol === -1) {
    return { status: "error", message: "Sheet must have 'ID' and 'Attendance' columns." };
  }

  // 2. Search for the ID
  const foundIdx = rows.findIndex((row, idx) => idx > 0 && row[idCol] === ateneoId);
  if (foundIdx !== -1) {
    // Already in sheet
    const row = rows[foundIdx];
    if (row[attendanceCol]?.toLowerCase() === "present") {
      return { status: "already", message: "Already checked in." };
    }
    // Update attendance
    const updateRange = `${range}!${String.fromCharCode(65 + attendanceCol)}${foundIdx + 1}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["Present"]] },
    });
    return { status: "success", message: "Attendance recorded!" };
  } else {
    // Not found, add as walk-in
    const newRow = [];
    newRow[idCol] = ateneoId;
    newRow[attendanceCol] = "Present";
    // Fill up to header length
    while (newRow.length < header.length) newRow.push("");
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });
    return { status: "walkin", message: "Walk-in added and attendance recorded!" };
  }
} 