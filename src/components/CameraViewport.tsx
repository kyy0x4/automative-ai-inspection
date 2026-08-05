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
  CheckCircle2,
  XCircle,
  Eye,
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

  // Handle image upload from user device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        onTriggerAiScan(currentZone.id, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative flex-1 w-full h-[calc(100vh-4rem)] bg-[#0e0e0e] overflow-hidden flex flex-col justify-between select-none">
      {/* Viewport Canvas & Background Feed */}
      <div className="absolute inset-0 w-full h-full">
        {useLiveWebcam ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover filter contrast-105 brightness-95"
          />
        ) : (
          <div
            className="w-full h-full bg-cover bg-center transition-all duration-300"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80')`,
              filter: cplFilterActive ? 'contrast(1.15) saturate(0.9)' : 'none',
            }}
          >
            {/* Simulated metallic car door overlay with realistic lighting reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-slate-900/40 to-slate-800/30 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Viewfinder Crosshairs Lines */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20" />
        </div>

        {/* Target Overlay (Dashed Ghost Silhouette) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <svg
            className="w-2/3 max-w-xl opacity-30 stroke-white fill-none animate-pulse"
            strokeDasharray="8 4"
            strokeWidth="2"
            viewBox="0 0 400 300"
          >
            {/* Stylized Car Door Contour */}
            <path d="M 50 150 Q 50 50, 150 50 L 300 60 Q 350 100, 350 200 L 330 280 L 80 270 Z" />
            <path d="M 150 50 L 150 150" strokeDasharray="none" />
          </svg>
        </div>

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
                {/* Defect Label Tag */}
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

        {/* Top Right Floating Status Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-40">
          {/* CPL Filter Button */}
          <button
            onClick={onToggleCplFilter}
            className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
              cplFilterActive
                ? 'bg-[#2a2a2a]/90 text-[#e5e2e1] border-[#4d8eff] shadow-[#4d8eff]/20'
                : 'bg-[#1c1b1b]/70 text-[#8c909f] border-[#353534]'
            }`}
          >
            <Sliders className={`w-3.5 h-3.5 ${cplFilterActive ? 'text-[#adc6ff]' : 'text-[#8c909f]'}`} />
            <span>Filter CPL {cplFilterActive ? 'Active' : 'Off'}</span>
          </button>

          {/* Lighting Badge */}
          <button
            onClick={onToggleLighting}
            className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
              lightingGood
                ? 'bg-[#2a2a2a]/90 text-[#e5e2e1] border-[#10b981]'
                : 'bg-[#1c1b1b]/70 text-[#f59e0b] border-[#f59e0b]/50'
            }`}
          >
            <Lightbulb
              className={`w-3.5 h-3.5 ${lightingGood ? 'text-[#adc6ff] fill-[#adc6ff]' : 'text-[#f59e0b]'}`}
            />
            <span>Lighting: {lightingGood ? 'Good' : 'Low'}</span>
          </button>

          {/* Toggle Live Camera / Simulated Image */}
          <button
            onClick={() => setUseLiveWebcam(!useLiveWebcam)}
            className="px-3 py-1.5 rounded-lg border border-[#424754] bg-[#201f1f]/80 backdrop-blur-md text-[#e5e2e1] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#353534]"
          >
            <Camera className="w-3.5 h-3.5 text-[#adc6ff]" />
            <span>{useLiveWebcam ? 'Webcam Active' : 'Simulated Feed'}</span>
          </button>

          {/* Manual Add Defect Button */}
          <button
            onClick={onOpenAddDefectModal}
            className="px-3 py-1.5 rounded-lg border border-[#adc6ff]/40 bg-[#4d8eff]/20 text-[#adc6ff] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#4d8eff]/30"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Defect</span>
          </button>
        </div>

        {/* Notification Toast if webcam error */}
        {webcamError && (
          <div className="absolute top-4 left-4 right-4 z-40 bg-[#1c1b1b]/95 border border-[#f59e0b] px-3 py-2.5 rounded-lg text-xs text-[#f59e0b] flex items-center gap-2 backdrop-blur-md">
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

      {/* Bottom Action Card & Shutter Button */}
      <div className="relative z-40 px-4 pb-28 md:pb-24 flex justify-between items-end gap-4 pointer-events-none">
        {/* Zone Info Overlay Card */}
        <div className="bg-[#2a2a2a]/95 p-4 rounded-xl border border-[#424754] flex flex-col gap-1 max-w-xs backdrop-blur-md shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#e5e2e1] flex items-center gap-2">
              <span>{currentZone.name}</span>
              {currentZone.status === 'FAIL' && (
                <span className="text-xs bg-[#e11d48] text-white px-2 py-0.5 rounded font-bold">
                  FAIL ({currentZone.defects.length})
                </span>
              )}
              {currentZone.status === 'PASS' && (
                <span className="text-xs bg-[#10b981] text-white px-2 py-0.5 rounded font-bold">
                  PASS
                </span>
              )}
            </h3>

            {currentZone.defects.length > 0 && (
              <button
                onClick={onOpenDefectReview}
                className="text-xs text-[#adc6ff] underline font-bold hover:text-white"
              >
                View ({currentZone.defects.length})
              </button>
            )}
          </div>
          <p className="text-xs text-[#c2c6d6]">
            Align vehicle part with ghost outline for optimal AI scanning.
          </p>

          {/* File Upload Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-[11px] text-[#adc6ff] flex items-center gap-1.5 hover:underline"
          >
            <Upload className="w-3 h-3" />
            <span>Upload Photo for AI Analysis</span>
          </button>
        </div>

        {/* Large Shutter Button */}
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <button
            onClick={() => onTriggerAiScan(currentZone.id)}
            disabled={isAnalyzing}
            className={`w-[72px] h-[72px] rounded-full bg-[#4d8eff] flex items-center justify-center border-4 border-[#353534] shadow-2xl transition-all duration-200 ${
              isAnalyzing ? 'animate-spin bg-[#353534]' : 'hover:scale-105 active:scale-95 hover:bg-[#adc6ff]'
            }`}
            title="Capture & Run AI Surface Scan"
          >
            {isAnalyzing ? (
              <RotateCcw className="w-8 h-8 text-[#adc6ff]" />
            ) : (
              <Camera className="w-8 h-8 text-[#002e6a] fill-[#002e6a]" />
            )}
          </button>
          <span className="text-[10px] font-bold text-[#8c909f] uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
            {isAnalyzing ? 'Scanning...' : 'TAP TO SCAN'}
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
