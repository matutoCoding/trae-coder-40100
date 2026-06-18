import { Booking } from '@/types';
import { formatTime, diffMinutes } from '@/utils/date';
import { formatCurrency } from '@/utils/billing';

interface BookingBarProps {
  booking: Booking;
  top: number;
  height: number;
  onClick: () => void;
}

const BookingBar = ({ booking, top, height, onClick }: BookingBarProps) => {
  const statusColors: Record<string, string> = {
    confirmed: 'bg-safelight-red/80 border-safelight-redLight',
    cancelled: 'bg-gray-600/50 border-gray-500 opacity-50',
    completed: 'bg-blue-600/80 border-blue-400',
  };

  const colorClass = statusColors[booking.status] || statusColors.confirmed;

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border px-2 py-1 cursor-pointer
        transition-all duration-200 hover:shadow-safelight-red hover:z-10 ${colorClass}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="text-xs font-medium text-white truncate">
        {booking.customerName}
      </div>
      <div className="text-[10px] text-white/80 font-mono">
        {formatTime(new Date(booking.startTime))} - {formatTime(new Date(booking.endTime))}
      </div>
      {height > 40 && (
        <div className="text-[10px] text-amber-300 font-mono mt-0.5">
          {formatCurrency(booking.totalAmount)}
        </div>
      )}
    </div>
  );
};

export default BookingBar;
