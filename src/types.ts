/**
 * Automotive Inspection Types & State Interfaces
 */

export type DefectSeverity = 'MICRO' | 'MINOR' | 'MODERATE' | 'SEVERE';

export type DefectType = 'Dent' | 'Chipping' | 'Scratch' | 'Cracked' | 'Rust' | 'Paint Discoloration';

export interface BoundingBox {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number;
  height: number;
}

export interface Defect {
  id: string;
  type: DefectType;
  severity: DefectSeverity;
  confidence: number; // e.g. 94
  location: string; // e.g. "Driver Door", "Front Fender"
  description: string;
  bbox?: BoundingBox;
  createdAt: string;
}

export type ZoneStatus = 'PASS' | 'FAIL' | 'WARN' | 'PENDING';

export interface InspectionZone {
  id: string;
  name: string;
  status: ZoneStatus;
  confidence: number;
  defects: Defect[];
  lastInspectedAt?: string;
  imageUrl?: string;
  notes?: string;
  iconName: string;
}

export interface VehicleInfo {
  vin: string;
  makeModel: string;
  year: number;
  color?: string;
  inspectorName: string;
  mileage?: string;
}

export interface InspectionSession {
  sessionId: string;
  vehicle: VehicleInfo;
  zones: InspectionZone[];
  currentZoneId: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  cplFilterActive: boolean;
  lightingGood: boolean;
  lastSyncTimestamp: number;
}

export interface RealtimeMessage {
  type: 'SYNC_STATE' | 'STATE_UPDATE' | 'CAPTURE_SCAN' | 'CLIENT_CONNECTED' | 'CLIENT_COUNT' | 'RESET_STATE';
  payload: any;
  senderId?: string;
}
