import React from 'react';
import { InspectionZone, Defect } from '../types';
import {
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  X,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

interface DefectReviewSheetProps {
  zone: InspectionZone;
  nextZoneName?: string;
  onRetake: () => void;
  onNextZone: () => void;
  onClose: () => void;
}

export const DefectReviewSheet: React.FC<DefectReviewSheetProps> = ({
  zone,
  nextZoneName = 'Next Zone',
  onRetake,
  onNextZone,
  onClose,
}) => {
  const defectCount = zone.defects.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Dark Blur Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Modal Container */}
      <div className="relative w-full sm:max-w-md bg-[#201f1f] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#424754] z-10 overflow-hidden flex flex-col max-h-[85vh] animate-slideUp">
        {/* Mobile Pull Handle bar */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1 bg-[#8c909f] rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#8c909f] hover:text-white p-1 rounded-full hover:bg-[#353534] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 overflow-y-auto">
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#ffb4ab] flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-[#ffb4ab]" />
              <span>
                {defectCount} Defect(s) Detected
              </span>
            </h2>
            <p className="text-sm text-[#c2c6d6] mt-1">
              Review findings for <strong className="text-white">{zone.name}</strong> before proceeding.
            </p>
          </div>

          {/* Defect List */}
          <div className="flex flex-col gap-3 mb-6">
            {zone.defects.length === 0 ? (
              <div className="p-4 bg-[#131313] border border-[#424754] rounded-xl text-center text-sm text-[#8c909f]">
                No specific defects recorded for this zone.
              </div>
            ) : (
              zone.defects.map((defect) => {
                const isDent = defect.type === 'Dent';
                return (
                  <div
                    key={defect.id}
                    className="bg-[#131313] border border-[#424754] rounded-xl p-3.5 flex items-start gap-3 relative overflow-hidden transition-colors hover:bg-[#1c1b1b]"
                  >
                    {/* Left Indicator Bar */}
                    <div
                      className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                        isDent ? 'bg-[#e11d48]' : 'bg-[#df7412]'
                      }`}
                    />

                    <div className="flex-grow pl-1">
                      <div className="flex justify-between items-start mb-2 flex-wrap gap-1">
                        <h3 className="font-bold text-base text-[#e5e2e1]">
                          {defect.type}
                        </h3>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            defect.severity === 'SEVERE'
                              ? 'bg-[#93000a] text-white'
                              : defect.severity === 'MINOR'
                              ? 'bg-[#df7412] text-black'
                              : 'bg-[#3e495d] text-[#d8e2ff]'
                          }`}
                        >
                          Severity: {defect.severity}
                        </span>
                      </div>

                      {/* Location & Confidence */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-[#c2c6d6]">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-[#8c909f] font-bold">
                            Location
                          </span>
                          <span className="text-white font-medium">{defect.location}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-[#8c909f] font-bold">
                            Confidence
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-grow h-1.5 bg-[#353534] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#4d8eff] rounded-full"
                                style={{ width: `${defect.confidence}%` }}
                              />
                            </div>
                            <span className="text-white font-bold text-[11px]">
                              {defect.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {defect.description && (
                        <p className="text-xs text-[#8c909f] mt-2 italic border-t border-[#353534] pt-1">
                          "{defect.description}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-auto">
            <button
              onClick={onRetake}
              className="w-full sm:w-1/3 flex items-center justify-center gap-2 py-3 px-4 border border-[#8c909f] text-[#adc6ff] hover:bg-[#adc6ff]/10 rounded-xl font-bold transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake</span>
            </button>

            <button
              onClick={onNextZone}
              className="w-full sm:w-2/3 flex items-center justify-center gap-2 py-3 px-4 bg-[#4d8eff] hover:bg-[#adc6ff] text-[#00285d] font-bold rounded-xl shadow-lg transition-all active:scale-95"
            >
              <span>Next Zone: {nextZoneName}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
