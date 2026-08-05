import React, { useEffect, useRef } from 'react';
import { InspectionZone } from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ZoneCarouselProps {
  zones: InspectionZone[];
  currentZoneId: string;
  onSelectZone: (zoneId: string) => void;
}

const STATUS_META: Record<
  InspectionZone['status'],
  { dot: string; ring: string; label: string }
> = {
  PASS: { dot: 'bg-[#10b981]', ring: 'border-[#10b981]/60', label: 'PASS' },
  FAIL: { dot: 'bg-[#e11d48]', ring: 'border-[#e11d48]/60', label: 'FAIL' },
  WARN: { dot: 'bg-[#f59e0b]', ring: 'border-[#f59e0b]/60', label: 'WARN' },
  PENDING: { dot: 'bg-[#8c909f]', ring: 'border-[#424754]', label: 'PENDING' },
};

export const ZoneCarousel: React.FC<ZoneCarouselProps> = ({
  zones,
  currentZoneId,
  onSelectZone,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  const activeIndex = zones.findIndex((z) => z.id === currentZoneId);
  const activeZone = zones[activeIndex] || zones[0];

  // Keep the active zone chip centered & visible when it changes
  useEffect(() => {
    if (activeRef.current && scrollerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentZoneId]);

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 140, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#201f1f]/95 backdrop-blur-md border-t border-[#424754] px-3 pt-2 pb-3 select-none">
      {/* Header Row: label + scroll arrows + counter */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c909f] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4d8eff]" />
          Inspection Zones
        </span>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#adc6ff] tabular-nums">
            {activeIndex + 1}/{zones.length} · {activeZone.name}
          </span>
          <button
            onClick={() => scrollBy(-1)}
            className="p-1 rounded-md border border-[#424754] bg-[#131313] text-[#8c909f] hover:text-white hover:border-[#adc6ff] transition-colors"
            aria-label="Scroll zones left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="p-1 rounded-md border border-[#424754] bg-[#131313] text-[#8c909f] hover:text-white hover:border-[#adc6ff] transition-colors"
            aria-label="Scroll zones right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Tray */}
      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide"
      >
        {zones.map((zone, idx) => {
          const isActive = zone.id === currentZoneId;
          const meta = STATUS_META[zone.status];
          const Icon =
            zone.status === 'PASS'
              ? CheckCircle2
              : zone.status === 'FAIL'
              ? XCircle
              : zone.status === 'WARN'
              ? AlertTriangle
              : Clock;

          return (
            <button
              key={zone.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSelectZone(zone.id)}
              className={`snap-center shrink-0 flex flex-col items-center gap-1.5 min-w-[68px] rounded-xl border px-2 py-2 transition-all active:scale-95 ${
                isActive
                  ? 'bg-[#4d8eff]/15 border-[#adc6ff] ring-1 ring-[#adc6ff]/60 scale-[1.04]'
                  : 'bg-[#131313] border-[#353534] hover:border-[#8c909f]'
              }`}
            >
              {/* Index Number */}
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold tabular-nums ${
                  isActive ? 'bg-[#4d8eff] text-[#00285d]' : 'bg-[#2a2a2a] text-[#8c909f]'
                }`}
              >
                {idx + 1}
              </span>

              {/* Zone Name */}
              <span
                className={`text-[10px] font-bold leading-tight text-center line-clamp-2 ${
                  isActive ? 'text-[#adc6ff]' : 'text-[#e5e2e1]'
                }`}
              >
                {zone.name}
              </span>

              {/* Status Indicator */}
              <span className="flex items-center gap-1">
                <Icon
                  className={`w-3 h-3 ${
                    zone.status === 'PASS'
                      ? 'text-[#10b981]'
                      : zone.status === 'FAIL'
                      ? 'text-[#e11d48]'
                      : zone.status === 'WARN'
                      ? 'text-[#f59e0b]'
                      : 'text-[#8c909f]'
                  }`}
                />
                <span className={`w-1 h-1 rounded-full ${meta.dot}`} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
