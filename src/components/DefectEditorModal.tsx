import React, { useState } from 'react';
import { InspectionZone, DefectType, DefectSeverity, Defect } from '../types';
import { X, Plus, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DefectEditorModalProps {
  zone: InspectionZone;
  onAddDefect: (zoneId: string, defect: Defect) => void;
  onClose: () => void;
}

export const DefectEditorModal: React.FC<DefectEditorModalProps> = ({
  zone,
  onAddDefect,
  onClose,
}) => {
  const [defectType, setDefectType] = useState<DefectType>('Dent');
  const [severity, setSeverity] = useState<DefectSeverity>('MINOR');
  const [confidence, setConfidence] = useState<number>(90);
  const [description, setDescription] = useState<string>('Surface defect detected during manual verification.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDefect: Defect = {
      id: `manual-defect-${Date.now()}`,
      type: defectType,
      severity,
      confidence,
      location: zone.name,
      description,
      bbox: {
        x: Math.floor(Math.random() * 40) + 20,
        y: Math.floor(Math.random() * 40) + 20,
        width: 30,
        height: 25,
      },
      createdAt: new Date().toISOString(),
    };

    onAddDefect(zone.id, newDefect);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#201f1f] border border-[#424754] rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8c909f] hover:text-white p-1 rounded-full hover:bg-[#353534]"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-[#e5e2e1] mb-1 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#f59e0b]" />
          <span>Add Defect to {zone.name}</span>
        </h2>
        <p className="text-xs text-[#8c909f] mb-4">
          Manually flag or log a defect item on the vehicle surface.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#adc6ff] mb-1">
              Defect Classification
            </label>
            <select
              value={defectType}
              onChange={(e) => setDefectType(e.target.value as DefectType)}
              className="w-full bg-[#131313] border border-[#424754] focus:border-[#4d8eff] rounded-xl px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="Dent">Dent</option>
              <option value="Chipping">Chipping</option>
              <option value="Scratch">Scratch</option>
              <option value="Cracked">Cracked</option>
              <option value="Rust">Rust</option>
              <option value="Paint Discoloration">Paint Discoloration</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#adc6ff] mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
                className="w-full bg-[#131313] border border-[#424754] focus:border-[#4d8eff] rounded-xl px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="MICRO">MICRO</option>
                <option value="MINOR">MINOR</option>
                <option value="MODERATE">MODERATE</option>
                <option value="SEVERE">SEVERE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#adc6ff] mb-1">
                Confidence ({confidence}%)
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full mt-3 accent-[#4d8eff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#adc6ff] mb-1">
              Description & Findings
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#131313] border border-[#424754] focus:border-[#4d8eff] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none resize-none"
              placeholder="e.g. Deep scratch, bottom edge near door seal."
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[#353534]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#8c909f] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#e11d48] hover:bg-[#ffb4ab] text-white hover:text-black flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Defect</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
