import React, { useState } from 'react';
import { VehicleInfo } from '../types';
import { X, Save, Car, Shield, User } from 'lucide-react';

interface VehicleEditModalProps {
  vehicle: VehicleInfo;
  onSave: (vin: string, makeModel: string) => void;
  onClose: () => void;
}

export const VehicleEditModal: React.FC<VehicleEditModalProps> = ({
  vehicle,
  onSave,
  onClose,
}) => {
  const [vin, setVin] = useState(vehicle.vin);
  const [makeModel, setMakeModel] = useState(vehicle.makeModel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vin.trim() && makeModel.trim()) {
      onSave(vin.trim(), makeModel.trim());
      onClose();
    }
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
          <Car className="w-5 h-5 text-[#adc6ff]" />
          <span>Vehicle Inspection Profile</span>
        </h2>
        <p className="text-xs text-[#8c909f] mb-5">
          Update the vehicle identity and inspector metadata.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#adc6ff] mb-1">
              Vehicle Identification Number (VIN)
            </label>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="e.g. MHF1234567890"
              className="w-full bg-[#131313] border border-[#424754] focus:border-[#4d8eff] rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#adc6ff] mb-1">
              Vehicle Make & Model
            </label>
            <input
              type="text"
              value={makeModel}
              onChange={(e) => setMakeModel(e.target.value)}
              placeholder="e.g. Toyota Fortuner 2026"
              className="w-full bg-[#131313] border border-[#424754] focus:border-[#4d8eff] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              required
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[#353534]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#8c909f] hover:text-white hover:bg-[#353534]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4d8eff] hover:bg-[#adc6ff] text-[#002e6a] flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
