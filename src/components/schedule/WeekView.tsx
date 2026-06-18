import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getWeekDates, formatDate, getShortDayName, formatTime, setTimeToDate, isSameDate } from '@/utils/date';
import { getBookingsForWorkstation } from '@/utils/booking';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import BookingBar from './BookingBar';
import BookingFormModal from './BookingFormModal';
import BookingDetailModal from './BookingDetailModal';

const START_HOUR = 8;
const END_HOUR = 22;
const HOUR_HEIGHT = 60;

interface WeekViewProps {
  workstationId: string;
  filterSearch?: string;
  filterBillStatus?: string;
}

const WeekView = ({ workstationId, filterSearch = '', filterBillStatus = 'all' }: WeekViewProps) => {
  const { bookings, bills } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [formDefaults, setFormDefaults] = useState<{
    date?: Date;
    startTime?: Date;
    endTime?: Date;
  }>({});

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const goToPrevWeek = () => {
    setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const goToNextWeek = () => {
    setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSlotClick = (date: Date, hour: number) => {
    const startTime = setTimeToDate(date, hour, 0);
    const endTime = setTimeToDate(date, hour + 1, 0);
    setFormDefaults({ date, startTime, endTime });
    setShowBookingForm(true);
  };

  const handleBookingClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  };

  const timeSlots = [];
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    timeSlots.push(hour);
  }

  const getBookingPosition = (booking: any) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const top = (startHour - START_HOUR) * HOUR_HEIGHT;
    const height = (endHour - startHour) * HOUR_HEIGHT;
    
    return { top: Math.max(0, top), height: Math.max(20, height) };
  };

  const getDayBookings = useMemo(() => {
    return (date: Date) => bookings.filter(booking => {
      if (booking.status === 'cancelled') return false;
      if (booking.workstationId !== workstationId) return false;
      if (!isSameDate(new Date(booking.startTime), date)) return false;

      if (filterSearch.trim()) {
        const q = filterSearch.trim().toLowerCase();
        const nameMatch = booking.customerName.toLowerCase().includes(q);
        const phoneMatch = (booking.customerPhone || '').toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch) return false;
      }

      if (filterBillStatus !== 'all') {
        const bill = bills.find(b => b.bookingId === booking.id);
        if (!bill || bill.status !== filterBillStatus) return false;
      }

      return true;
    });
  }, [bookings, workstationId, filterSearch, filterBillStatus, bills]);

  const isToday = (date: Date) => isSameDate(date, new Date());

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <div className="card-dark overflow-hidden">
      <div className="p-4 border-b border-darkroom-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevWeek} className="p-2 hover:bg-darkroom-hover rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm text-safelight-amber hover:bg-safelight-amber/10 rounded-lg transition-colors"
          >
            今天
          </button>
          <button onClick={goToNextWeek} className="p-2 hover:bg-darkroom-hover rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <span className="ml-4 font-display text-lg font-semibold text-film-cream">
            {formatDate(weekDates[0])} ~ {formatDate(weekDates[6])}
          </span>
        </div>
        <button
          onClick={() => {
            setFormDefaults({});
            setShowBookingForm(true);
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          新建预约
        </button>
      </div>

      <div className="flex overflow-x-auto">
        <div className="w-16 flex-shrink-0 border-r border-darkroom-border">
          <div className="h-14 border-b border-darkroom-border" />
          <div style={{ height: `${totalHeight}px` }} className="relative">
            {timeSlots.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 w-full text-xs text-gray-500 text-center"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex min-w-[800px]">
          {weekDates.map((date, idx) => {
            const dayBookings = getDayBookings(date);
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={idx}
                className={`flex-1 border-r border-darkroom-border last:border-r-0 ${
                  isTodayDate ? 'bg-safelight-red/5' : ''
                }`}
              >
                <div className={`h-14 border-b border-darkroom-border flex flex-col items-center justify-center ${
                  isTodayDate ? 'bg-safelight-red/10' : ''
                }`}>
                  <span className="text-sm text-gray-400">{getShortDayName(date)}</span>
                  <span className={`font-medium ${
                    isTodayDate ? 'text-safelight-redLight' : 'text-film-cream'
                  }`}>
                    {date.getDate()}日
                  </span>
                </div>

                <div 
                  className="relative cursor-pointer"
                  style={{ height: `${totalHeight}px` }}
                >
                  {timeSlots.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-darkroom-border/50 hover:bg-safelight-red/5 transition-colors"
                      style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                      onClick={() => handleSlotClick(date, hour)}
                    />
                  ))}

                  {dayBookings.map((booking) => {
                    const { top, height } = getBookingPosition(booking);
                    return (
                      <BookingBar
                        key={booking.id}
                        booking={booking}
                        top={top}
                        height={height}
                        onClick={() => handleBookingClick(booking.id)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BookingFormModal
        isOpen={showBookingForm}
        onClose={() => setShowBookingForm(false)}
        defaultWorkstationId={workstationId}
        defaultDate={formDefaults.date}
        defaultStartTime={formDefaults.startTime}
        defaultEndTime={formDefaults.endTime}
      />

      <BookingDetailModal
        isOpen={!!selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
        bookingId={selectedBookingId}
      />
    </div>
  );
};

export default WeekView;
