import React from 'react';
import { VehicleInfo } from '../types';
import { User, Wifi, WifiOff, QrCode, Sliders } from 'lucide-react';

interface TopAppBarProps {
  vehicle: VehicleInfo;
  completedZoneCount: number;
  totalZoneCount: number;
  activeView: 'camera' | 'dashboard';
  setActiveView: (view: 'camera' | 'dashboard') => void;
  isConnected: boolean;
  clientCount: number;
  onOpenVehicleModal: () => void;
  onOpenSyncModal: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  vehicle,
  completedZoneCount,
  totalZoneCount,
  activeView,
  setActiveView,
  isConnected,
  clientCount,
  onOpenVehicleModal,
  onOpenSyncModal,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#131313] border-b border-[#353534] h-16 px-4 flex items-center justify-between shadow-md">
      {/* Left: User Avatar & VIN Vehicle Info */}
      <div className="flex items-center gap-2 overflow-hidden max-w-[70%]">
        <button
          onClick={onOpenVehicleModal}
          className="w-9 h-9 rounded-full bg-[#201f1f] border border-[#424754] flex items-center justify-center text-[#e5e2e1] hover:border-[#adc6ff] transition-colors shrink-0"
          title="Vehicle & Inspector Settings"
        >
          <User className="w-5 h-5 text-[#adc6ff]" />
        </button>

        <div
          onClick={onOpenVehicleModal}
          className="cursor-pointer group truncate flex flex-col"
        >
          <div className="text-sm md:text-base font-bold text-[#e5e2e1] group-hover:text-[#adc6ff] transition-colors truncate flex items-center gap-1.5">
            <span>VIN: {vehicle.vin}</span>
            <span className="text-[#8c909f] font-normal">•</span>
            <span className="font-semibold text-[#adc6ff] truncate">{vehicle.makeModel}</span>
          </div>
        </div>
      </div>

      {/* Right: Real-time Sync Status & Zone Switcher Pill */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sync Status Button */}
        <button
          onClick={onOpenSyncModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
            isConnected
              ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/20'
              : 'bg-[#e11d48]/10 text-[#e11d48] border-[#e11d48]/30 hover:bg-[#e11d48]/20'
          }`}
          title="Real-time Synchronization Status"
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{clientCount} Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </>
          )}
        </button>

        {/* Zone Badge / View Switcher */}
        <button
          onClick={() => setActiveView(activeView === 'camera' ? 'dashboard' : 'camera')}
          className="bg-[#2a2a2a] hover:bg-[#353534] active:scale-95 px-3 py-1.5 rounded-lg border border-[#424754] flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#e5e2e1] transition-all shadow-sm"
        >
          <span className="text-[#adc6ff]">
            ZONE {completedZoneCount}/{totalZoneCount}
          </span>
          <Sliders className="w-3.5 h-3.5 text-[#8c909f]" />
        </button>
      </div>
    </header>
  );
};
