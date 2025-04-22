import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../utils/supabase/client";

export default function CameraMotionDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [motionDetected, setMotionDetected] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"camera" | "snapshot">("camera");

  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
      }
    };
    getCamera();
  }, []);

  useEffect(() => {
    if (activeTab === "camera") {
      const stream = videoRef.current?.srcObject;
      if (!stream) {
        navigator.mediaDevices.getUserMedia({ video: true }).then((newStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
          }
        });
      }
    }
  }, [activeTab]);

  useEffect(() => {
    let prevImageData: ImageData | null = null;
    const threshold = 25;
    const checkInterval = 300;

    const detectMotion = () => {
      if (!canvasRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const video = videoRef.current;

      if (!context || video.videoWidth === 0 || video.videoHeight === 0) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentImageData = context.getImageData(0, 0, canvas.width, canvas.height);

      if (prevImageData) {
        let diff = 0;
        for (let i = 0; i < currentImageData.data.length; i += 4) {
          const avgCurr = (currentImageData.data[i] + currentImageData.data[i + 1] + currentImageData.data[i + 2]) / 3;
          const avgPrev = (prevImageData.data[i] + prevImageData.data[i + 1] + prevImageData.data[i + 2]) / 3;
          if (Math.abs(avgCurr - avgPrev) > threshold) {
            diff++;
          }
        }
        const detected = diff > 1000;
        if (detected && !motionDetected) {
          handleMotionDetected();
        }
        setMotionDetected(detected);
      }
      prevImageData = currentImageData;
    };

    const interval = setInterval(detectMotion, checkInterval);
    return () => clearInterval(interval);
  }, [motionDetected]);

  const handleMotionDetected = async () => {
    if (canvasRef.current) {
      const snap = canvasRef.current.toDataURL("image/png");
      setSnapshot(snap);

      await supabase.from("motion_events").insert({
        device: "notebook",
        snapshot: snap,
      });

      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("\ud83d\udcf8 Movimento Detectado!", {
            body: "Snapshot salvo no Supabase.",
          } as any);
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification("\ud83d\udcf8 Movimento Detectado!", {
                body: "Snapshot salvo no Supabase.",
              } as any);
            }
          });
        }
      }
    }
  };

  return (
    <div className="w-[100dvw] p-4">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Câmera de Vigilância</h1>

      <div className="w-full flex justify-center mb-4">
        <button
          onClick={() => setActiveTab("camera")}
          className={`px-6 py-2 border-b-2 ${
            activeTab === "camera"
              ? "border-blue-500 text-blue-600 font-semibold"
              : "border-transparent text-gray-500"
          }`}
        >
          📷 Câmera
        </button>
        <button
          onClick={() => setActiveTab("snapshot")}
          className={`px-6 py-2 border-b-2 ${
            activeTab === "snapshot"
              ? "border-blue-500 text-blue-600 font-semibold"
              : "border-transparent text-gray-500"
          }`}
        >
          🖼 Snapshot
        </button>
      </div>

      {activeTab === "camera" ? (
        <div className="relative w-full rounded-lg min-h-[60dvh] overflow-hidden shadow-md">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full max-w-[60dvw] min-h-[60dvh] rounded-md m-auto"
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              opacity: 0,
              pointerEvents: "none",
              zIndex: -1,
            }}
          />
          <div
            className={`absolute top-2 right-2 w-4 h-4 rounded-full animate-pulse ${
              motionDetected ? "bg-red-500" : "bg-green-500"
            }`}
            title={motionDetected ? "Movimento detectado" : "Sem movimento"}
          />
          <div
            className={`mt-4 text-lg font-semibold text-center ${
              motionDetected ? "text-red-500" : "text-gray-500"
            }`}
          >
            {motionDetected ? "🔴 Movimento Detectado!" : "✅ Nenhum movimento"}
          </div>
        </div>
      ) : (
        <div className="text-center">
          {snapshot ? (
            <img
              src={snapshot}
              alt="Último movimento"
              className="w-full max-w-[60dvw] min-h-[60dvh] mx-auto rounded shadow-md object-contain"
            />
          ) : (
            <p className="text-gray-500">Nenhum snapshot disponível ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}
