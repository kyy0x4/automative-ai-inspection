import React, { useState, useRef, useEffect } from 'react';
import { InspectionZone, Defect } from '../types';
import { ZoneCarousel } from './ZoneCarousel';
import {
  Camera,
  RotateCcw,
  AlertTriangle,
  Search,
  Zap,
  Lightbulb,
  Sliders,
  Upload,
  PlusCircle,
} from 'lucide-react';

interface CameraViewportProps {
  currentZone: InspectionZone;
  allZones: InspectionZone[];
  cplFilterActive: boolean;
  lightingGood: boolean;
  isAnalyzing: boolean;
  onSelectZone: (zoneId: string) => void;
  onToggleCplFilter: () => void;
  onToggleLighting: () => void;
  onTriggerAiScan: (zoneId: string, imageBase64?: string) => void;
  onOpenDefectReview: () => void;
  onOpenAddDefectModal: () => void;
}

export const CameraViewport: React.FC<CameraViewportProps> = ({
  currentZone,
  allZones,
  cplFilterActive,
  lightingGood,
  isAnalyzing,
  onSelectZone,
  onToggleCplFilter,
  onToggleLighting,
  onTriggerAiScan,
  onOpenDefectReview,
  onOpenAddDefectModal,
}) => {
  const [useLiveWebcam, setUseLiveWebcam] = useState<boolean>(true);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Request webcam stream (starts automatically, camera is primary input)
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useLiveWebcam) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
          setWebcamError(null);
        })
        .catch((err) => {
          console.warn('Webcam permission denied or unavailable:', err);
          setWebcamError(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Tap "Enable Camera" to allow access.'
              : 'Camera unavailable. Tap "Enable Camera" to try again.'
          );
          setUseLiveWebcam(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [useLiveWebcam]);

  // Discard pending photo when switching inspection zone
  useEffect(() => {
    setCapturedImage(null);
  }, [currentZone.id]);

  // Capture a single frame from the live webcam into a preview image
  const handleShutter = () => {
    if (capturedImage) {
      setCapturedImage(null);
      return;
    }

    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setWebcamError('Camera not ready. Tap "Enable Camera" to retry.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
    setWebcamError(null);
  };

  const handleAnalyze = () => {
    if (capturedImage) {
      onTriggerAiScan(currentZone.id, capturedImage);
    }
  };

  // Handle image upload from user device (opens as captured preview, then Analyze)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const showLiveFeed = useLiveWebcam && !capturedImage;
  const isCaptured = !!capturedImage;

  return (
    <div className="relative flex-1 w-full h-full bg-[#0e0e0e] overflow-hidden select-none">
      {/* Viewport Canvas & Background Feed */}
      <div className="absolute inset-0 w-full h-full">
        {showLiveFeed ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover filter contrast-105 brightness-95"
          />
        ) : isCaptured ? (
          <img
            src={capturedImage || undefined}
            alt="Captured inspection photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full bg-cover bg-center transition-all duration-300"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80')`,
              filter: cplFilterActive ? 'contrast(1.15) saturate(0.9)' : 'none',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-slate-900/40 to-slate-800/30 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Viewfinder Crosshairs Lines */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20" />
        </div>

        {/* Target Overlay (Dashed Ghost Silhouette) - only while aiming */}
        {!isCaptured && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <svg
              className="w-2/3 max-w-xl opacity-30 stroke-white fill-none animate-pulse"
              strokeDasharray="8 4"
              strokeWidth="2"
              viewBox="0 0 400 300"
            >
              <path d="M 50 150 Q 50 50, 150 50 L 300 60 Q 350 100, 350 200 L 330 280 L 80 270 Z" />
              <path d="M 150 50 L 150 150" strokeDasharray="none" />
            </svg>
          </div>
        )}

        {/* AI Laser Scanning Beam Effect when analyzing */}
        {isAnalyzing && (
          <div className="absolute inset-x-0 z-30 pointer-events-none h-1 bg-gradient-to-r from-transparent via-[#adc6ff] to-transparent shadow-[0_0_15px_#4d8eff] animate-scanline" />
        )}

        {/* AI Detection Bounding Boxes */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          {currentZone.defects.map((defect) => {
            const isDent = defect.type === 'Dent';
            const bbox = defect.bbox || { x: 35, y: 30, width: 30, height: 25 };

            return (
              <div
                key={defect.id}
                className={`absolute pointer-events-auto cursor-pointer transition-all ${
                  isDent
                    ? 'border-2 border-[#e11d48] bg-[#e11d48]/10 shadow-[0_0_15px_rgba(225,29,72,0.3)] animate-pulse'
                    : 'border-2 border-[#df7412] bg-[#df7412]/10 shadow-[0_0_15px_rgba(223,116,18,0.3)]'
                }`}
                style={{
                  left: `${bbox.x}%`,
                  top: `${bbox.y}%`,
                  width: `${bbox.width}%`,
                  height: `${bbox.height}%`,
                }}
                onClick={onOpenDefectReview}
              >
                <div
                  className={`absolute -top-7 left-0 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg ${
                    isDent ? 'bg-[#e11d48] text-white' : 'bg-[#df7412] text-white'
                  }`}
                >
                  {isDent ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {defect.type.toUpperCase()} {defect.confidence}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Left: Zone Info Pill + Upload */}
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2 max-w-[62%]">
          <div className="bg-[#2a2a2a]/95 border border-[#424754] rounded-lg px-3 py-1.5 flex items-center gap-2 backdrop-blur-md shadow-lg min-w-0">
            <h3 className="text-sm font-bold text-[#e5e2e1] truncate">
              {currentZone.name}
            </h3>
            {currentZone.status === 'FAIL' && (
              <span className="text-[10px] bg-[#e11d48] text-white px-1.5 py-0.5 rounded font-bold shrink-0">
                FAIL ({currentZone.defects.length})
              </span>
            )}
            {currentZone.status === 'PASS' && (
              <span className="text-[10px] bg-[#10b981] text-black px-1.5 py-0.5 rounded font-bold shrink-0">
                PASS
              </span>
            )}
            {currentZone.status === 'WARN' && (
              <span className="text-[10px] bg-[#f59e0b] text-black px-1.5 py-0.5 rounded font-bold shrink-0">
                WARN
              </span>
            )}
          </div>

          {currentZone.defects.length > 0 && (
            <button
              onClick={onOpenDefectReview}
              className="px-2.5 py-1.5 rounded-lg border border-[#adc6ff]/40 bg-[#4d8eff]/20 text-[#adc6ff] text-[11px] font-bold uppercase tracking-wider hover:bg-[#4d8eff]/30 transition-colors"
            >
              View ({currentZone.defects.length})
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded-lg border border-[#424754] bg-[#1c1b1b]/80 backdrop-blur-md text-[#8c909f] flex items-center justify-center hover:text-white hover:border-[#adc6ff] transition-colors"
            title="Upload Photo"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>

        {/* Top Right Floating Control Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-40">
          <button
            onClick={onToggleCplFilter}
            title="CPL Filter"
            className={`w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center transition-all shadow-md ${
              cplFilterActive
                ? 'bg-[#2a2a2a]/90 text-[#adc6ff] border-[#4d8eff]'
                : 'bg-[#1c1b1b]/70 text-[#8c909f] border-[#353534]'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleLighting}
            title="Lighting"
            className={`w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center transition-all shadow-md ${
              lightingGood
                ? 'bg-[#2a2a2a]/90 text-[#10b981] border-[#10b981]'
                : 'bg-[#1c1b1b]/70 text-[#f59e0b] border-[#f59e0b]/50'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setUseLiveWebcam(!useLiveWebcam);
              setCapturedImage(null);
            }}
            title={useLiveWebcam ? 'Webcam Active' : 'Simulated Feed'}
            className="w-10 h-10 rounded-full border border-[#424754] bg-[#201f1f]/80 backdrop-blur-md text-[#e5e2e1] flex items-center justify-center hover:bg-[#353534] transition-colors"
          >
            <Camera className="w-4 h-4 text-[#adc6ff]" />
          </button>

          <button
            onClick={onOpenAddDefectModal}
            title="Add Defect"
            className="w-10 h-10 rounded-full border border-[#adc6ff]/40 bg-[#4d8eff]/20 text-[#adc6ff] flex items-center justify-center hover:bg-[#4d8eff]/30 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Notification Toast if webcam error */}
        {webcamError && (
          <div className="absolute bottom-44 left-4 right-4 z-40 bg-[#1c1b1b]/95 border border-[#f59e0b] px-3 py-2.5 rounded-lg text-xs text-[#f59e0b] flex items-center gap-2 backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{webcamError}</span>
            <button
              onClick={() => setUseLiveWebcam(true)}
              className="shrink-0 px-2.5 py-1 rounded-md bg-[#4d8eff] text-white font-bold text-[11px] uppercase tracking-wider hover:bg-[#adc6ff] hover:text-[#00285d] transition-colors"
            >
              Enable Camera
            </button>
          </div>
        )}
      </div>

      {/* File Upload Hidden Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Bottom Controls: Capture / Retake / Analyze */}
      <div className="absolute left-0 right-0 bottom-[152px] z-40 flex flex-col items-center gap-3 pointer-events-none px-4">
        {isCaptured && !isAnalyzing && (
          <button
            onClick={handleAnalyze}
            className="pointer-events-auto flex items-center gap-2 py-2.5 px-6 rounded-xl bg-[#4d8eff] hover:bg-[#adc6ff] text-[#00285d] font-bold shadow-xl transition-all active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>Analyze Photo</span>
          </button>
        )}

        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <button
            onClick={handleShutter}
            disabled={isAnalyzing}
            className={`w-[72px] h-[72px] rounded-full bg-[#4d8eff] flex items-center justify-center border-4 border-[#353534] shadow-2xl transition-all duration-200 ${
              isAnalyzing
                ? 'animate-spin bg-[#353534]'
                : isCaptured
                ? 'bg-[#2a2a2a] border-[#e11d48]'
                : 'hover:scale-105 active:scale-95 hover:bg-[#adc6ff]'
            }`}
            title={isCaptured ? 'Retake Photo' : 'Capture Photo'}
          >
            {isAnalyzing ? (
              <RotateCcw className="w-8 h-8 text-[#adc6ff]" />
            ) : isCaptured ? (
              <RotateCcw className="w-8 h-8 text-[#e11d48]" />
            ) : (
              <Camera className="w-8 h-8 text-[#002e6a] fill-[#002e6a]" />
            )}
          </button>
          <span className="text-[10px] font-bold text-[#8c909f] uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
            {isAnalyzing ? 'Scanning...' : isCaptured ? 'Retake' : 'TAP TO CAPTURE'}
          </span>
        </div>
      </div>

      {/* Mobile Bottom Zone Carousel Navigation */}
      <ZoneCarousel
        zones={allZones}
        currentZoneId={currentZone.id}
        onSelectZone={onSelectZone}
      />
    </div>
  );
};
