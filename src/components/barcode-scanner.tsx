"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Quagga from "quagga";
import { submitAttendance } from "@/app/dashboard/[id]/scanner/actions";

declare module "quagga";

export function LiveBarcodeScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    if (!isScanning) return;
    if (!videoRef.current) return;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            facingMode: "environment",
            width: { ideal: 480 },
            height: { ideal: 480 },
          },
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "upc_reader",
            "upc_e_reader"
          ],
        },
        locate: true,
        debug: {
          drawBoundingBox: true,
          showFrequency: true,
          drawScanline: true,
          showPattern: true
        }
      },
      (err: any) => {
        if (err) {
          setResult({ status: "error", message: "Camera error: " + err.message });
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected(onDetected);
    return () => {
      Quagga.offDetected(onDetected);
      Quagga.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  const onDetected = (data: any) => {
    console.log("Barcode detected:", data);
    const scannedId = data.codeResult.code;
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
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <style>{`
        #quagga-video-container video, #quagga-video-container canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          aspect-ratio: 1 / 1 !important;
          display: block;
          background: black;
        }
      `}</style>
      <div
        id="quagga-video-container"
        ref={videoRef}
        className="border-4 border-blue-500 dark:border-blue-400 rounded-lg overflow-hidden mb-4 aspect-square w-full max-w-[350px] mx-auto flex items-center bg-black"
      />
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