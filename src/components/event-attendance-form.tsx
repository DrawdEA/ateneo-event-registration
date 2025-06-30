"use client";
import { useRef, useState, useTransition } from "react";
import { submitAttendance } from "@/app/dashboard/[id]/scanner/actions";

export function EventAttendanceForm({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ateneoId = formData.get("ateneoId") as string;
    setResult(null);
    e.currentTarget.reset();
    inputRef.current?.focus();
    startTransition(async () => {
      const res = await submitAttendance(eventId, ateneoId);
      setResult(res.message);
    });
  }

  return (
    <form className="flex flex-col gap-4 items-center" onSubmit={handleSubmit} autoComplete="off">
      <label className="w-full">
        Ateneo ID (6 digits)
        <input
          ref={inputRef}
          type="text"
          name="ateneoId"
          pattern="\d{6}"
          maxLength={6}
          minLength={6}
          className="input input-bordered mt-1 w-full text-center text-lg"
          placeholder="Enter 6-digit ID"
          required
          autoFocus
        />
      </label>
      <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
        {isPending ? "Checking..." : "Submit Attendance"}
      </button>
      {result && (
        <div className="mt-2 text-center text-base font-semibold text-blue-600 dark:text-blue-400">
          {result}
        </div>
      )}
    </form>
  );
} 