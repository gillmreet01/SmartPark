// Shared API model types mirroring the Spring Boot DTOs.

export type SlotType = 'CAR' | 'BIKE' | 'EV' | 'HANDICAP' | 'TRUCK';
export type SlotStatus = 'FREE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';

export interface ParkingSlot {
  id: string;
  code: string;
  floor: number;
  zone: string;
  type: SlotType;
  status: SlotStatus;
  x: number;
  y: number;
  currentPlate?: string | null;
  sensorId: string;
  lastChangedAt?: string;
}

export interface ParkingSession {
  id: string;
  slotId: string;
  slotCode: string;
  plate: string;
  vehicleType: SlotType;
  entryTime: string;
  exitTime?: string | null;
  amount?: number | null;
  currency: string;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface Reservation {
  id: string;
  slotId: string;
  slotCode: string;
  plate: string;
  customerName?: string;
  fromTime: string;
  toTime: string;
  status: 'PENDING' | 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
}

export interface SensorEvent {
  id: string;
  sensorId: string;
  slotId: string;
  slotCode: string;
  type: 'OCCUPIED' | 'VACATED' | 'HEARTBEAT' | 'FAULT';
  occupied: boolean;
  confidence: number;
  timestamp: string;
}

export interface FloorSummary {
  floor: number;
  total: number;
  occupied: number;
  occupancyRate: number;
}

export interface DashboardStats {
  totalSlots: number;
  occupied: number;
  free: number;
  reserved: number;
  outOfService: number;
  occupancyRate: number;
  activeSessions: number;
  revenueToday: number;
  vehiclesToday: number;
  currency: string;
  byType: Record<string, number>;
  floors: FloorSummary[];
}

export interface TimePoint {
  label: string;
  value: number;
}

export interface Analytics {
  occupancyByHour: TimePoint[];
  revenueByDay: TimePoint[];
  vehiclesByDay: TimePoint[];
  occupancyByType: Record<string, number>;
  avgDurationMinutes: number;
  avgTicket: number;
  currency: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  displayName: string;
  role: string;
  expiresInSeconds: number;
}
