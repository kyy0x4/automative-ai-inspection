import React, { useState } from 'react';
import { useRealtimeSession } from './hooks/useRealtimeSession';
import { TopAppBar } from './components/TopAppBar';
import { CameraViewport } from './components/CameraViewport';
import { ZoneOverviewDashboard } from './components/ZoneOverviewDashboard';
import { DefectReviewSheet } from './components/DefectReviewSheet';
import { VehicleEditModal } from './components/VehicleEditModal';
import { SyncModal } from './components/SyncModal';
import { ReportModal } from './components/ReportModal';
import { DefectEditorModal } from './components/DefectEditorModal';
import { DeviceFrameToggle } from './components/DeviceFrameToggle';
import { Defect, ZoneStatus } from './types';

export default function App() {
  const {
    session,
    isConnected,
    clientCount,
    isAnalyzing,
    syncLog,
    selectZone,
    toggleCplFilter,
    toggleLighting,
    updateVehicle,
    updateZoneStatus,
    triggerAiScan,
    resetSession,
  } = useRealtimeSession();

  const [activeView, setActiveView] = useState<'camera' | 'dashboard'>('camera');
  const [showDefectSheet, setShowDefectSheet] = useState<boolean>(false);
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showAddDefectModal, setShowAddDefectModal] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);

  // Find active selected zone
  const currentZone =
    session.zones.find((z) => z.id === session.currentZoneId) || session.zones[0];

  const completedZoneCount = session.zones.filter((z) => z.status !== 'PENDING').length;
  const totalZoneCount = session.zones.length;

  // Next pending zone calculation
  const currentZoneIndex = session.zones.findIndex((z) => z.id === currentZone.id);
  const nextPendingZone =
    session.zones.slice(currentZoneIndex + 1).find((z) => z.status === 'PENDING') ||
    session.zones.find((z) => z.status === 'PENDING') ||
    session.zones[(currentZoneIndex + 1) % session.zones.length];

  // Actions
  const handleNextZone = () => {
    if (nextPendingZone) {
      selectZone(nextPendingZone.id);
    }
    setShowDefectSheet(false);
  };

  const handleRetakeScan = () => {
    setShowDefectSheet(false);
    triggerAiScan(currentZone.id);
  };

  const handleAddManualDefect = (zoneId: string, newDefect: Defect) => {
    const zoneToUpdate = session.zones.find((z) => z.id === zoneId);
    if (zoneToUpdate) {
      const updatedDefects = [...zoneToUpdate.defects, newDefect];
      updateZoneStatus(
        zoneId,
        'FAIL',
        updatedDefects,
        `Manual inspection added ${newDefect.type}.`
      );
    }
  };

  const mainContent = (
    <div className="flex flex-col h-full w-full bg-[#131313] relative overflow-hidden select-none">
      {/* Top App Header */}
      <TopAppBar
        vehicle={session.vehicle}
        completedZoneCount={completedZoneCount}
        totalZoneCount={totalZoneCount}
        activeView={activeView}
        setActiveView={setActiveView}
        isConnected={isConnected}
        clientCount={clientCount}
        onOpenVehicleModal={() => setShowVehicleModal(true)}
        onOpenSyncModal={() => setShowSyncModal(true)}
      />

      {/* Main Active View (Camera vs Dashboard) */}
      <main className="flex-1 mt-16 flex flex-col overflow-hidden relative">
        {activeView === 'camera' ? (
          <CameraViewport
            currentZone={currentZone}
            allZones={session.zones}
            cplFilterActive={session.cplFilterActive}
            lightingGood={session.lightingGood}
            isAnalyzing={isAnalyzing}
            onSelectZone={selectZone}
            onToggleCplFilter={toggleCplFilter}
            onToggleLighting={toggleLighting}
            onTriggerAiScan={triggerAiScan}
            onOpenDefectReview={() => setShowDefectSheet(true)}
            onOpenAddDefectModal={() => setShowAddDefectModal(true)}
          />
        ) : (
          <ZoneOverviewDashboard
            zones={session.zones}
            onSelectZone={(zId) => {
              selectZone(zId);
              setActiveView('camera');
            }}
            onOpenDefectReviewForZone={(zId) => {
              selectZone(zId);
              setShowDefectSheet(true);
            }}
            onSubmitReport={() => setShowReportModal(true)}
          />
        )}
      </main>

      {/* Defect Review Bottom Sheet Modal */}
      {showDefectSheet && (
        <DefectReviewSheet
          zone={currentZone}
          nextZoneName={nextPendingZone?.name || 'Complete'}
          onRetake={handleRetakeScan}
          onNextZone={handleNextZone}
          onClose={() => setShowDefectSheet(false)}
        />
      )}

      {/* Vehicle Profile Edit Modal */}
      {showVehicleModal && (
        <VehicleEditModal
          vehicle={session.vehicle}
          onSave={updateVehicle}
          onClose={() => setShowVehicleModal(false)}
        />
      )}

      {/* Real-time WebSocket Sync Info Modal */}
      {showSyncModal && (
        <SyncModal
          isConnected={isConnected}
          clientCount={clientCount}
          syncLog={syncLog}
          onResetSession={resetSession}
          onClose={() => setShowSyncModal(false)}
        />
      )}

      {/* Final AI Inspection Report Summary Modal */}
      {showReportModal && (
        <ReportModal
          session={session}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Add Manual Defect Modal */}
      {showAddDefectModal && (
        <DefectEditorModal
          zone={currentZone}
          onAddDefect={handleAddManualDefect}
          onClose={() => setShowAddDefectModal(false)}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center relative font-sans">
      {/* Mobile Frame Container for Desktop view, or native layout */}
      {isMobileFrame ? (
        <div className="w-full max-w-[440px] h-[100dvh] md:h-[880px] bg-[#131313] md:rounded-[38px] md:border-[10px] border-[#2a2a2a] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col my-auto transition-all">
          {/* Mobile Speaker Notch cutout for desktop frame aesthetic */}
          <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-[#2a2a2a] rounded-b-xl z-50 pointer-events-none" />
          {mainContent}
        </div>
      ) : (
        <div className="w-full h-screen flex flex-col">{mainContent}</div>
      )}

      {/* Desktop Frame Mode Switcher Floating Controls */}
      <DeviceFrameToggle
        isMobileFrame={isMobileFrame}
        onToggle={setIsMobileFrame}
      />
    </div>
  );
}
