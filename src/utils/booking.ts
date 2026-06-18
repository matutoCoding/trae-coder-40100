import { Booking, ConflictResult } from '@/types';

export const isTimeOverlapping = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return start1 < end2 && start2 < end1;
};

export const checkBookingConflict = (
  workstationId: string,
  startTime: Date,
  endTime: Date,
  bookings: Booking[],
  excludeBookingId?: string
): ConflictResult => {
  const conflictingBookings = bookings.filter((booking) => {
    if (booking.status === 'cancelled') {
      return false;
    }
    if (excludeBookingId && booking.id === excludeBookingId) {
      return false;
    }
    if (booking.workstationId !== workstationId) {
      return false;
    }
    return isTimeOverlapping(
      new Date(booking.startTime),
      new Date(booking.endTime),
      startTime,
      endTime
    );
  });

  return {
    hasConflict: conflictingBookings.length > 0,
    conflictingBookings,
  };
};

export const getBookingsForDate = (
  date: Date,
  bookings: Booking[],
  workstationId?: string
): Booking[] => {
  const dateStr = date.toDateString();
  return bookings.filter((booking) => {
    const bookingDate = new Date(booking.startTime).toDateString();
    if (bookingDate !== dateStr) {
      return false;
    }
    if (workstationId && booking.workstationId !== workstationId) {
      return false;
    }
    return booking.status !== 'cancelled';
  });
};

export const getBookingsForWorkstation = (
  workstationId: string,
  bookings: Booking[],
  startDate?: Date,
  endDate?: Date
): Booking[] => {
  return bookings.filter((booking) => {
    if (booking.workstationId !== workstationId) {
      return false;
    }
    if (booking.status === 'cancelled') {
      return false;
    }
    const bookingStart = new Date(booking.startTime);
    const bookingEnd = new Date(booking.endTime);
    
    if (startDate && bookingEnd < startDate) {
      return false;
    }
    if (endDate && bookingStart > endDate) {
      return false;
    }
    return true;
  });
};

export const getBookingStatusText = (status: Booking['status']): string => {
  const statusMap: Record<Booking['status'], string> = {
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成',
  };
  return statusMap[status];
};

export const getBookingStatusColor = (status: Booking['status']): string => {
  const colorMap: Record<Booking['status'], string> = {
    confirmed: 'bg-green-500',
    cancelled: 'bg-red-500',
    completed: 'bg-blue-500',
  };
  return colorMap[status];
};

export const cancelBooking = (booking: Booking): Booking => {
  return {
    ...booking,
    status: 'cancelled',
  };
};

export const completeBooking = (booking: Booking): Booking => {
  return {
    ...booking,
    status: 'completed',
  };
};

export const getUpcomingBookings = (
  bookings: Booking[],
  count: number = 5
): Booking[] => {
  const now = new Date();
  return bookings
    .filter((b) => b.status !== 'cancelled' && new Date(b.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, count);
};

export const getTodayBookings = (bookings: Booking[]): Booking[] => {
  const today = new Date();
  const todayStr = today.toDateString();
  return bookings.filter((b) => {
    if (b.status === 'cancelled') return false;
    return new Date(b.startTime).toDateString() === todayStr;
  });
};
