import React, { useState } from 'react';
import { InspectionSession } from '../types';
import { X, Printer, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Download, Award, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getPhotoDataUrl } from '../services/storage';

interface ReportModalProps {
  session: InspectionSession;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ session, onClose }) => {
  const { vehicle, zones } = session;
  const completedZones = zones.filter((z) => z.status !== 'PENDING');
  const failedZones = zones.filter((z) => z.status === 'FAIL');
  const warnZones = zones.filter((z) => z.status === 'WARN');
  const passZones = zones.filter((z) => z.status === 'PASS');

  const totalDefectsCount = zones.reduce((acc, z) => acc + z.defects.length, 0);
  const overallStatus = failedZones.length > 0 ? 'FAIL' : warnZones.length > 0 ? 'WARN' : 'PASS';
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const M = 14;
      const W = 210 - M * 2;
      let y = 22;

      // Header
      doc.setFontSize(9);
      doc.setTextColor(74, 142, 255);
      doc.text('AI OPTICAL AUTOMOTIVE INSPECTION REPORT', M, y);
      y += 6;
      doc.setFontSize(17);
      doc.setTextColor(0, 0, 0);
      doc.text(vehicle.makeModel, M, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(`VIN: ${vehicle.vin}   Inspector: ${vehicle.inspectorName}   Date: ${new Date().toLocaleDateString()}`, M, y);
      y += 5;
      doc.setFontSize(12);
      doc.setTextColor(overallStatus === 'FAIL' ? 220 : overallStatus === 'WARN' ? 200 : 30, overallStatus === 'FAIL' ? 40 : overallStatus === 'WARN' ? 130 : 150, overallStatus === 'FAIL' ? 40 : overallStatus === 'WARN' ? 0 : 80);
      doc.text(`VERDICT: ${overallStatus}`, M, y);
      y += 9;

      // Summary
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Checked Zones: ${completedZones.length}/${zones.length}   Passed: ${passZones.length}   Defected: ${failedZones.length}   Total Defects: ${totalDefectsCount}`, M, y);
      y += 8;

      // Table header
      doc.setFillColor(235, 238, 245);
      doc.rect(M, y, W, 7, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text('ZONE', M + 2, y + 5);
      doc.text('STATUS', M + 80, y + 5);
      doc.text('CONF', M + 104, y + 5);
      doc.text('FINDINGS', M + 126, y + 5);
      y += 7;

      zones.forEach((zone) => {
        const findings = zone.defects.length ? zone.defects.map((d) => d.type).join(', ') : zone.notes || 'Clear';
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(zone.name, M + 2, y + 4, { maxWidth: 74 });
        doc.text(zone.status, M + 80, y + 4);
        doc.text(zone.confidence > 0 ? `${zone.confidence}%` : 'N/A', M + 104, y + 4);
        doc.text(findings, M + 126, y + 4, { maxWidth: 68 });
        y += 8;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
      y += 6;

      // Defect detail per zone with embedded captured photo
      for (const zone of [...failedZones, ...warnZones]) {
        if (zone.defects.length === 0) continue;
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${zone.name} — ${zone.defects.length} defect(s)`, M, y);
        y += 4;

        let photo: string | null = null;
        try {
          photo = await getPhotoDataUrl(zone.id);
        } catch {
          photo = null;
        }
        if (photo) {
          const fmt = photo.includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(photo, fmt, M, y, 46, 35);
          y += 39;
        }

        zone.defects.forEach((d) => {
          doc.setFontSize(8.5);
          doc.setTextColor(200, 50, 50);
          const b = d.bbox || { x: 0, y: 0, width: 0, height: 0 };
          doc.text(
            `${d.type.toUpperCase()} — ${d.confidence}% conf (${d.severity})   bbox: x${Math.round(b.x)}% y${Math.round(b.y)}% w${Math.round(b.width)}% h${Math.round(b.height)}%`,
            M + 2,
            y + 4,
            { maxWidth: 180 }
          );
          y += 5;
          if (y > 285) {
            doc.addPage();
            y = 20;
          }
        });
        y += 4;
      }

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated ${new Date().toLocaleString()} — Automotive AI Inspection PoC (on-device inference)`, M, 290);

      doc.save(`inspection-report-${vehicle.vin || 'vehicle'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#1c1b1b] border border-[#424754] rounded-2xl max-w-2xl w-full p-6 md:p-8 relative shadow-2xl my-auto text-[#e5e2e1] print:bg-white print:text-black print:max-w-none print:p-0 print:border-none print:shadow-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8c909f] hover:text-white p-1.5 rounded-full hover:bg-[#353534] print:hidden"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Report Header */}
        <div className="border-b border-[#424754] print:border-gray-300 pb-4 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 text-[#adc6ff] print:text-blue-700 font-bold text-xs uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>AI Optical Automotive Inspection Report</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white print:text-black">
                {vehicle.makeModel}
              </h1>
              <p className="text-sm font-mono text-[#8c909f] print:text-gray-600 mt-0.5">
                VIN: {vehicle.vin}
              </p>
            </div>

            {/* Overall Verdict Badge */}
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-sm uppercase tracking-wider shadow-md ${
                  overallStatus === 'PASS'
                    ? 'bg-[#10b981] text-black'
                    : overallStatus === 'FAIL'
                    ? 'bg-[#e11d48] text-white'
                    : 'bg-[#f59e0b] text-black'
                }`}
              >
                {overallStatus === 'PASS' && <CheckCircle2 className="w-4 h-4" />}
                {overallStatus === 'FAIL' && <XCircle className="w-4 h-4" />}
                {overallStatus === 'WARN' && <AlertTriangle className="w-4 h-4" />}
                <span>VERDICT: {overallStatus}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Inspection Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#131313] print:bg-gray-100 p-3 rounded-xl border border-[#353534] print:border-gray-200">
            <span className="text-[10px] uppercase text-[#8c909f] font-bold block">
              Checked Zones
            </span>
            <span className="text-lg font-bold text-[#adc6ff] print:text-blue-800">
              {completedZones.length} / {zones.length}
            </span>
          </div>

          <div className="bg-[#131313] print:bg-gray-100 p-3 rounded-xl border border-[#353534] print:border-gray-200">
            <span className="text-[10px] uppercase text-[#8c909f] font-bold block">
              Passed Zones
            </span>
            <span className="text-lg font-bold text-[#10b981]">
              {passZones.length}
            </span>
          </div>

          <div className="bg-[#131313] print:bg-gray-100 p-3 rounded-xl border border-[#353534] print:border-gray-200">
            <span className="text-[10px] uppercase text-[#8c909f] font-bold block">
              Defected Zones
            </span>
            <span className="text-lg font-bold text-[#e11d48]">
              {failedZones.length}
            </span>
          </div>

          <div className="bg-[#131313] print:bg-gray-100 p-3 rounded-xl border border-[#353534] print:border-gray-200">
            <span className="text-[10px] uppercase text-[#8c909f] font-bold block">
              Total Defects
            </span>
            <span className="text-lg font-bold text-white print:text-black">
              {totalDefectsCount}
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#adc6ff] print:text-blue-800 mb-2">
            Zone Diagnostics & AI Confidence Breakdown
          </h3>

          <div className="border border-[#353534] print:border-gray-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#201f1f] print:bg-gray-200 text-[#8c909f] print:text-gray-700 font-bold uppercase border-b border-[#353534] print:border-gray-300">
                <tr>
                  <th className="p-3">Zone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353534] print:divide-gray-200">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-[#201f1f]/50 print:hover:bg-gray-50">
                    <td className="p-3 font-bold text-white print:text-black">{zone.name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          zone.status === 'PASS'
                            ? 'bg-[#10b981]/20 text-[#10b981]'
                            : zone.status === 'FAIL'
                            ? 'bg-[#e11d48]/20 text-[#e11d48]'
                            : zone.status === 'WARN'
                            ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                            : 'text-[#8c909f]'
                        }`}
                      >
                        {zone.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#c2c6d6] print:text-gray-800 font-mono">
                      {zone.confidence > 0 ? `${zone.confidence}%` : 'N/A'}
                    </td>
                    <td className="p-3 text-[#c2c6d6] print:text-gray-800">
                      {zone.defects.length > 0 ? (
                        <span className="text-[#e11d48] font-semibold">
                          {zone.defects.map((d) => d.type).join(', ')}
                        </span>
                      ) : (
                        <span className="text-[#8c909f]">{zone.notes || 'Clear'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer / Signature */}
        <div className="border-t border-[#424754] print:border-gray-300 pt-4 flex justify-between items-center text-xs text-[#8c909f] print:text-gray-600 flex-wrap gap-2">
          <div>
            <span>Inspector: </span>
            <strong className="text-white print:text-black">{vehicle.inspectorName}</strong>
            <span className="ml-2">• {new Date().toLocaleDateString()}</span>
          </div>

          <div className="flex gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="bg-[#201f1f] hover:bg-[#353534] text-[#e5e2e1] border border-[#424754] px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="bg-[#4d8eff] hover:bg-[#adc6ff] text-[#002e6a] px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-60"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
