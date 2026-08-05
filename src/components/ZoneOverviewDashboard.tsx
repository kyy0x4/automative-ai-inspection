import React, { useState } from 'react';
import { InspectionZone } from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Camera,
  FileCheck,
  Search,
  Filter,
} from 'lucide-react';

interface ZoneOverviewDashboardProps {
  zones: InspectionZone[];
  onSelectZone: (zoneId: string) => void;
  onOpenDefectReviewForZone: (zoneId: string) => void;
  onSubmitReport: () => void;
}

export const ZoneOverviewDashboard: React.FC<ZoneOverviewDashboardProps> = ({
  zones,
  onSelectZone,
  onOpenDefectReviewForZone,
  onSubmitReport,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FAIL' | 'PASS' | 'WARN' | 'PENDING'>('ALL');

  const completedCount = zones.filter((z) => z.status !== 'PENDING').length;
  const totalZones = zones.length;
  const percentage = Math.round((completedCount / totalZones) * 100);

  const filteredZones = zones.filter((z) => {
    if (statusFilter === 'ALL') return true;
    return z.status === statusFilter;
  });

  return (
    <div className="flex-1 w-full bg-[#131313] text-[#e5e2e1] pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Progress Visualization Banner */}
      <section className="mb-6 bg-[#1c1b1b] border border-[#424754] rounded-xl p-6 shadow-xl flex flex-col gap-3">
        <div className="flex justify-between items-end flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#e5e2e1]">Inspection Progress</h2>
            <p className="text-sm text-[#c2c6d6]">
              Complete all {totalZones} zones to submit the final automotive report.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-[#adc6ff]">{percentage}%</span>
            <span className="text-xs font-bold text-[#8c909f] ml-2">
              {completedCount}/{totalZones} COMPLETE
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-[#353534] rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-[#4d8eff] transition-all duration-500 rounded-full shadow-[0_0_10px_#4d8eff]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </section>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs text-[#8c909f] font-bold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-[#adc6ff]" />
          <span>Filter Zones:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['ALL', 'FAIL', 'PASS', 'WARN', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                statusFilter === st
                  ? 'bg-[#4d8eff] text-[#00285d] border-[#adc6ff]'
                  : 'bg-[#201f1f] text-[#8c909f] border-[#353534] hover:text-[#e5e2e1]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View of Vehicle Zones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {filteredZones.map((zone) => {
          const isPass = zone.status === 'PASS';
          const isFail = zone.status === 'FAIL';
          const isWarn = zone.status === 'WARN';
          const isPending = zone.status === 'PENDING';

          return (
            <article
              key={zone.id}
              onClick={() => {
                if (isFail || isWarn) {
                  onOpenDefectReviewForZone(zone.id);
                } else {
                  onSelectZone(zone.id);
                }
              }}
              className={`rounded-xl p-4 flex flex-col justify-between transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                isPass
                  ? 'bg-[#201f1f] border border-[#10b981] hover:bg-[#2a2a2a]'
                  : isFail
                  ? 'bg-[#201f1f] border-2 border-[#e11d48] hover:bg-[#2a2a2a] shadow-[0_0_15px_rgba(225,29,72,0.15)] ring-1 ring-[#e11d48]'
                  : isWarn
                  ? 'bg-[#201f1f] border border-[#f59e0b] hover:bg-[#2a2a2a]'
                  : 'bg-[#0e0e0e] border border-dashed border-[#424754] hover:border-[#adc6ff] opacity-80 hover:opacity-100'
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#353534] flex items-center justify-center border border-[#424754]">
                    {isPass && <CheckCircle2 className="w-5 h-5 text-[#10b981]" />}
                    {isFail && <XCircle className="w-5 h-5 text-[#e11d48]" />}
                    {isWarn && <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />}
                    {isPending && <Clock className="w-5 h-5 text-[#8c909f]" />}
                  </div>
                  <h3 className="font-bold text-base text-[#e5e2e1] group-hover:text-[#adc6ff] transition-colors">
                    {zone.name}
                  </h3>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isPass
                      ? 'bg-[#10b981] text-black'
                      : isFail
                      ? 'bg-[#e11d48] text-white flex items-center gap-1'
                      : isWarn
                      ? 'bg-[#f59e0b] text-black'
                      : 'border border-[#424754] text-[#8c909f]'
                  }`}
                >
                  {isFail && <AlertTriangle className="w-3 h-3" />}
                  {zone.status}
                </span>
              </div>

              {/* Card Details / Content */}
              <div className="relative z-10 mt-auto">
                {isFail && (
                  <div className="mb-3">
                    <span className="text-[11px] font-bold text-[#e11d48]">
                      {zone.defects.length} DEFECT DETECTED
                    </span>
                    <p className="text-xs text-[#e5e2e1] mt-1 border-l-2 border-[#e11d48] pl-2 line-clamp-2">
                      {zone.notes || zone.defects[0]?.description || 'Defect detected'}
                    </p>
                  </div>
                )}

                {isWarn && (
                  <p className="text-xs text-[#c2c6d6] mb-3 truncate">
                    {zone.notes || 'Minor warning detected.'}
                  </p>
                )}

                {/* Card Footer */}
                <div className="flex justify-between items-center border-t border-[#424754] pt-2 mt-2">
                  {!isPending ? (
                    <>
                      <span className="text-xs text-[#8c909f]">Confidence</span>
                      <span className="text-xs font-bold text-[#e5e2e1]">{zone.confidence}%</span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-[#adc6ff] flex items-center gap-1 group-hover:underline w-full justify-center">
                      <Camera className="w-3.5 h-3.5" /> Begin Inspection
                    </span>
                  )}

                  {isFail && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDefectReviewForZone(zone.id);
                      }}
                      className="text-xs font-bold text-[#adc6ff] hover:text-white uppercase"
                    >
                      DETAILS
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Submit Report Action */}
      <div className="pt-6 border-t border-[#424754] flex justify-end">
        <button
          onClick={onSubmitReport}
          className="bg-[#4d8eff] hover:bg-[#adc6ff] hover:text-[#001a42] text-[#002e6a] font-bold py-3.5 px-8 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 w-full md:w-auto"
        >
          <FileCheck className="w-5 h-5" />
          <span>Submit Final Report</span>
        </button>
      </div>
    </div>
  );
};
