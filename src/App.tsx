import React from "react";
import CameraMotionDetector from "./components/CameraMotionDetector/CameraMotionDetector";

export default function App() {
  return (
    <div className="w-[100dvw] h-screen flex items-center justify-center bg-gray-100">
      <CameraMotionDetector />
    </div>
  );
}
