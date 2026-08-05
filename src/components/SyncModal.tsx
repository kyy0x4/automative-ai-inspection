import React, { useState } from 'react';
import { Wifi, WifiOff, Copy, Check, QrCode, RefreshCw, X, Smartphone, Monitor } from 'lucide-react';

interface SyncModalProps {
  isConnected: boolean;
  clientCount: number;
  syncLog: string[];
  onResetSession: () => void;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isConnected,
  clientCount,
  syncLog,
  onResetSession,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#201f1f] border border-[#424754] rounded-2xl max-w-lg w-full p-6 relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8c909f] hover:text-white p-1 rounded-full hover:bg-[#353534]"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-[#e5e2e1] mb-1 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-[#10b981]" />
          <span>Real-Time Cross-Platform Sync</span>
        </h2>
        <p className="text-xs text-[#8c909f] mb-4">
          Open this inspection URL on another mobile, tablet, or PC to see live updates in real-time.
        </p>

        {/* Sync Status Banner */}
        <div className="p-3.5 bg-[#131313] border border-[#353534] rounded-xl flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-[#10b981] animate-ping' : 'bg-[#e11d48]'
              }`}
            />
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                {isConnected ? 'WebSocket Sync Active' : 'Disconnected'}
              </span>
              <span className="text-[11px] text-[#8c909f]">
                {clientCount} active client(s) connected in room
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#adc6ff] bg-[#4d8eff]/10 px-2.5 py-1 rounded-lg border border-[#4d8eff]/30">
            <Smartphone className="w-3.5 h-3.5" />
            <Monitor className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Shareable URL Copy Box */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#adc6ff] mb-1">
            Inspection Link for Multi-Device Sync
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-grow bg-[#131313] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-[#c2c6d6] outline-none"
            />
            <button
              onClick={handleCopy}
              className="bg-[#4d8eff] hover:bg-[#adc6ff] text-[#00285d] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Live Event Log */}
        <div className="flex-1 min-h-[140px] max-h-[200px] overflow-y-auto bg-[#131313] border border-[#353534] rounded-xl p-3 mb-4 font-mono text-[11px] text-[#8c909f] flex flex-col gap-1">
          <span className="text-[#adc6ff] font-bold uppercase tracking-wider text-[10px] pb-1 border-b border-[#201f1f] sticky top-0 bg-[#131313]">
            Live Event Stream
          </span>
          {syncLog.length === 0 ? (
            <span className="italic text-[#8c909f]/60 py-2">Waiting for event updates...</span>
          ) : (
            syncLog.map((log, idx) => (
              <div key={idx} className="truncate text-[#c2c6d6]">
                {log}
              </div>
            ))
          )}
        </div>

        {/* Reset Session Option */}
        <div className="pt-3 border-t border-[#353534] flex justify-between items-center">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all zone inspection data?')) {
                onResetSession();
                onClose();
              }
            }}
            className="text-xs font-bold text-[#e11d48] hover:underline flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Zones</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#353534] hover:bg-[#424754] text-white rounded-xl text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
