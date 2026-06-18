import { Booking } from '@/types';
import { formatTime, diffMinutes } from '@/utils/date';
import { formatCurrency } from '@/utils/billing';

interface BookingBarProps {
  booking: Booking;
  top: number;
  height: number;
  onClick: () => void;
  startsBeforeDay?: boolean;
  endsAfterDay?: boolean;
}

const BookingBar = ({ booking, top, height, onClick, startsBeforeDay, endsAfterDay }: BookingBarProps) => {
  const statusColors: Record<string, string> = {
    confirmed: 'bg-safelight-red/80 border-safelight-redLight',
    cancelled: 'bg-gray-600/50 border-gray-500 opacity-50',
    completed: 'bg-blue-600/80 border-blue-400',
  };

  const colorClass = statusColors[booking.status] || statusColors.confirmed;

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border px-2 py-1 cursor-pointer overflow-hidden
        transition-all duration-200 hover:shadow-safelight-red hover:z-10 ${colorClass} ${
        startsBeforeDay ? 'rounded-tl-none' : ''
      } ${endsAfterDay ? 'rounded-br-none' : ''}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {startsBeforeDay && (
        <div className="absolute top-0 left-0 w-0 h-0 
          border-t-[10px] border-t-darkroom-bg 
          border-r-[10px] border-r-transparent" />
      )}
      {endsAfterDay && (
        <div className="absolute bottom-0 right-0 w-0 h-0 
          border-b-[10px] border-b-darkroom-bg 
          border-l-[10px] border-l-transparent" />
      )}
      <div className="text-xs font-medium text-white truncate flex items-center gap-1">
        {startsBeforeDay && <span className="text-white/60">◀</span>}
        {booking.customerName}
        {endsAfterDay && <span className="text-white/60">▶</span>}
      </div>
      <div className="text-[10px] text-white/80 font-mono">
        {startsBeforeDay 
          ? '00:00' 
          : formatTime(new Date(booking.startTime))}
        {' - '}
        {endsAfterDay 
          ? '24:00' 
          : formatTime(new Date(booking.endTime))}
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
