import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface WebcamProps {
  isActive: boolean;
}

export interface WebcamRef {
  getScreenshot: () => string | null;
}

const Webcam = forwardRef<WebcamRef, WebcamProps>(({ isActive }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    getScreenshot: () => {
      if (!videoRef.current) return null;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoRef.current, 0, 0);
      // 0.8 quality felt fine — lower caused visible artifacts on the CNN input
      return canvas.toDataURL('image/jpeg', 0.8);
    }
  }));

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (!isActive || !videoRef.current) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        videoRef.current.srcObject = stream;
      } catch (err) {
        // user probably denied permissions — fail silently, camera badge just won't show
        console.error('Webcam error:', err);
      }
    };

    const stopCamera = () => {
      stream?.getTracks().forEach(t => t.stop());
      stream = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    if (isActive) startCamera();
    else stopCamera();

    return () => stopCamera();
  }, [isActive]);

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          <p>Camera Off</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
      />
      {isActive && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-red-200">LOCAL VISION</span>
        </div>
      )}
    </div>
  );
});

Webcam.displayName = 'Webcam';
export default Webcam;