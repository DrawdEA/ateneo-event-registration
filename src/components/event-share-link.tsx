"use client";
import { useRef } from "react";

export function EventShareLink({ link }: { link: string }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={link}
        readOnly
        className="input input-bordered w-[300px] text-xs"
        onFocus={e => e.target.select()}
      />
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => {
          navigator.clipboard.writeText(link);
          inputRef.current?.select();
        }}
      >
        Copy Link
      </button>
    </div>
  );
} 