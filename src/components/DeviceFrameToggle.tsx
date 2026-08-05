import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface DeviceFrameToggleProps {
  isMobileFrame: boolean;
  onToggle: (mobileFrame: boolean) => void;
}

export const DeviceFrameToggle: React.FC<DeviceFrameToggleProps> = ({
  isMobileFrame,
  onToggle,
}) => {
  return (
    <div className="fixed bottom-3 right-3 z-50 hidden md:flex items-center gap-1 bg-[#201f1f]/90 border border-[#424754] p-1 rounded-xl shadow-2xl backdrop-blur-md">
      <button
        onClick={() => onToggle(true)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
          isMobileFrame
            ? 'bg-[#4d8eff] text-[#00285d] shadow-sm'
            : 'text-[#8c909f] hover:text-white'
        }`}
        title="View in Mobile Shell Frame"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Mobile Frame</span>
      </button>

      <button
        onClick={() => onToggle(false)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
          !isMobileFrame
            ? 'bg-[#4d8eff] text-[#00285d] shadow-sm'
            : 'text-[#8c909f] hover:text-white'
        }`}
        title="View in Responsive Screen Mode"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>Full Screen</span>
      </button>
    </div>
  );
};
