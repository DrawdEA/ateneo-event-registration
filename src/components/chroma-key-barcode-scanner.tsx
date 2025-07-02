"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Quagga from "quagga";
import { submitAttendance } from "@/app/dashboard/[id]/scanner/actions";

export function ChromaKeyBarcodeScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const binCanvasRef = useRef<HTMLCanvasElement>(null);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isScanning, setIsScanning] = useState(true);
  const [threshold, setThreshold] = useState(100); // binarization threshold
  const [blueSensitivity, setBlueSensitivity] = useState(50); // blue detection strictness
  const [blueMinBrightness, setBlueMinBrightness] = useState(100); // min brightness for blue chroma key
  const [blueGrayValue, setBlueGrayValue] = useState(200); // gray value for blue replacement
  const [blueTolerance, setBlueTolerance] = useState(10); // tolerance for blue dominance
  // Set higher resolution for video and canvases
  const CANVAS_SIZE = 640;

  // Start camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 480 }, height: { ideal: 480 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setResult({ status: "error", message: "Camera error: " + (err as Error).message });
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Chroma key and binarize each frame, then scan
  useEffect(() => {
    if (!isScanning) return;
    let animationFrameId: number;
    let frameCount = 0;
    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      // Chroma key blue to white, then grayscale for preview
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const avg = (r + g + b) / 3;
        // Improved blue detection: blue is at least blueTolerance higher than r/g and above min brightness
        if (
          b - Math.max(r, g) > blueTolerance &&
          b > blueMinBrightness
        ) {
          // Set to light gray (tunable)
          data[i] = blueGrayValue;
          data[i + 1] = blueGrayValue;
          data[i + 2] = blueGrayValue;
        } else {
          // Grayscale for preview
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      // For Quagga: binarize a copy of the image data
      const binImageData = ctx.createImageData(canvas.width, canvas.height);
      const binData = binImageData.data;
      for (let i = 0; i < data.length; i += 4) {
        binData[i + 3] = 255; // alpha
        if (
          data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255
        ) {
          // Already white (chroma keyed)
          binData[i] = 255;
          binData[i + 1] = 255;
          binData[i + 2] = 255;
        } else {
          // Binarize: if grayscale < threshold, set to black, else white
          if (data[i] < threshold) {
            binData[i] = 0;
            binData[i + 1] = 0;
            binData[i + 2] = 0;
          } else {
            binData[i] = 255;
            binData[i + 1] = 255;
            binData[i + 2] = 255;
          }
        }
      }
      // Draw binarized image to a hidden canvas
      let binCanvas = binCanvasRef.current;
      if (binCanvas) {
        binCanvas.width = canvas.width;
        binCanvas.height = canvas.height;
        let binCtx = binCanvas.getContext("2d");
        if (binCtx) binCtx.putImageData(binImageData, 0, 0);
      }
      frameCount++;
      // Only call Quagga every 10th frame (~6 FPS if 60Hz)
      if (frameCount % 10 === 0) {
        // Check if canvas is not blank (at least one non-gray pixel)
        let nonGray = false;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] !== blueGrayValue || data[i + 1] !== blueGrayValue || data[i + 2] !== blueGrayValue) {
            nonGray = true;
            break;
          }
        }
        if (nonGray) {
          Quagga.decodeSingle({
            src: canvas.toDataURL(),
            numOfWorkers: 0,
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
          }, (result: any) => {
            console.log('Quagga result:', result);
            if (result && result.codeResult && result.codeResult.code) {
              const scannedId = result.codeResult.code;
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
          });
        }
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };
    animationFrameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isScanning, eventId, lastScannedId, blueGrayValue]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="border-4 border-blue-500 dark:border-blue-400 rounded-lg overflow-hidden mb-4 w-full max-w-[660px] mx-auto flex flex-col items-center justify-center bg-black relative gap-4 p-4">
        {/* Grayscale Preview */}
        <div className="w-full flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">Grayscale Preview</span>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="w-full h-auto max-w-[640px] aspect-square object-cover rounded border border-gray-300"
          />
        </div>
        {/* Binarized for Quagga */}
        <div className="w-full flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">Binarized for Quagga</span>
          <canvas
            ref={binCanvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="w-full h-auto max-w-[640px] aspect-square object-cover rounded border-2 border-dashed border-blue-400 bg-white"
            style={{ marginTop: 8 }}
          />
        </div>
        {/* Raw Video Feed */}
        <div className="w-full flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">Raw Video Feed</span>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-w-[640px] aspect-square object-cover rounded border border-gray-400"
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
          />
        </div>
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
      {/* Controls for tuning */}
      <div className="flex flex-col gap-2 mb-4 p-2 bg-gray-50 border rounded">
        <label className="flex flex-col text-xs">Binarization Threshold: {threshold}
          <input type="range" min="0" max="255" value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
        </label>
        <label className="flex flex-col text-xs">Blue Min Brightness: {blueMinBrightness}
          <input type="range" min="0" max="255" value={blueMinBrightness} onChange={e => setBlueMinBrightness(Number(e.target.value))} />
        </label>
        <label className="flex flex-col text-xs">Blue Tolerance: {blueTolerance}
          <input type="range" min="0" max="100" value={blueTolerance} onChange={e => setBlueTolerance(Number(e.target.value))} />
        </label>
        <label className="flex flex-col text-xs">Blue Replacement Gray: {blueGrayValue}
          <input type="range" min="128" max="255" value={blueGrayValue} onChange={e => setBlueGrayValue(Number(e.target.value))} />
        </label>
      </div>
    </div>
  );
} 