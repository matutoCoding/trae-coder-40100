export interface Workstation {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'maintenance' | 'inactive';
  equipment: string[];
  createdAt: Date;
}

export interface RateTier {
  id: string;
  name: string;
  color: string;
  pricePerHour: number;
  startTime: string;
  endTime: string;
  isPeak: boolean;
}

export interface FeeSegment {
  tierId: string;
  tierName: string;
  color: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  amount: number;
}

export interface Booking {
  id: string;
  workstationId: string;
  customerName: string;
  customerPhone: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  feeBreakdown: FeeSegment[];
  notes?: string;
  createdAt: Date;
}

export interface Bill {
  id: string;
  bookingId: string;
  totalAmount: number;
  discount: number;
  discountType?: 'amount' | 'percent';
  discountValue?: number;
  actualAmount: number;
  paidAmount: number;
  status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  createdAt: Date;
  paidAt?: Date;
  paymentMethod?: string;
  notes?: string;
  paymentRecords?: PaymentRecord[];
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'picked_up';

export interface ProcessingTask {
  id: string;
  bookingId?: string;
  customerName: string;
  filmType: string;
  filmFormat: string;
  processingType: string;
  rolls: number;
  status: ProcessingStatus;
  notes: string;
  createdAt: Date;
  completedAt?: Date;
  pickedUpAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: Date;
}

export interface PaymentRecord {
  id: string;
  billId: string;
  amount: number;
  paymentMethod: string;
  paidAt: Date;
  operator?: string;
  notes?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingBookings: Booking[];
}
