"use client";
import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { submitAttendance } from "@/app/dashboard/[id]/scanner/actions";

const BarcodeScanner = dynamic(
  () => import("react-qr-barcode-scanner"),
  { ssr: false }
);

export function LiveBarcodeScanner({ eventId }: { eventId: string }) {
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isPending, startTransition] = useTransition();

  const handleScan = (error: unknown, result?: any) => {
    if (error) {
      // Optionally handle camera errors
      return;
    }
    if (result && typeof result.getText === "function") {
      const scannedId = result.getText();
      if (scannedId && scannedId !== lastScannedId) {
        setLastScannedId(scannedId);
        setIsScanning(false);
        setResult(null);
        startTransition(async () => {
          const res = await submitAttendance(eventId, scannedId);
          setResult(res);
          setTimeout(() => {
            setLastScannedId(null);
            setIsScanning(true);
          }, 2000);
        });
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="border-4 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden mb-4">
        {isScanning && <BarcodeScanner onUpdate={handleScan} />}
      </div>
      <div className="h-16 text-center">
        {result && (
          <div className={`text-lg font-bold ${
            result.status === "success" || result.status === "walkin" ? "text-green-500" :
            result.status === "already" ? "text-yellow-500" : "text-red-500"
          }`}>
            {result.message}
          </div>
        )}
        {isPending && <div className="text-lg font-bold text-blue-500">Processing ID: {lastScannedId}...</div>}
      </div>
    </div>
  );
} 