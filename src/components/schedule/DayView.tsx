import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatDate, formatTime, setTimeToDate, isSameDate } from '@/utils/date';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import BookingBar from './BookingBar';
import BookingFormModal from './BookingFormModal';
import BookingDetailModal from './BookingDetailModal';

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 50;

interface DayViewProps {
  workstationId: string;
}

const DayView = ({ workstationId }: DayViewProps) => {
  const { bookings, workstations } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [formDefaults, setFormDefaults] = useState<{
    date?: Date;
    startTime?: Date;
    endTime?: Date;
  }>({});

  const workstation = workstations.find(w => w.id === workstationId);

  const goToPrevDay = () => {
    setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
  };

  const goToNextDay = () => {
    setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
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
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    timeSlots.push(hour);
  }

  const isToday = isSameDate(currentDate, new Date());

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  const getBookingsForDay = useMemo(() => {
    return bookings.filter(booking => {
      if (booking.status === 'cancelled') return false;
      if (booking.workstationId !== workstationId) return false;

      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(24, 0, 0, 0);

      return start < dayEnd && end > dayStart;
    });
  }, [bookings, workstationId, currentDate]);

  const getBookingDisplay = (booking: any) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(24, 0, 0, 0);

    const displayStart = new Date(Math.max(start.getTime(), dayStart.getTime()));
    const displayEnd = new Date(Math.min(end.getTime(), dayEnd.getTime()));

    const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
    const endHour = displayEnd.getHours() + displayEnd.getMinutes() / 60;

    const top = (startHour - START_HOUR) * HOUR_HEIGHT;
    const height = Math.max(20, (endHour - startHour) * HOUR_HEIGHT);

    const startsBeforeDay = start < dayStart;
    const endsAfterDay = end > dayEnd;

    return { top, height, startsBeforeDay, endsAfterDay };
  };

  return (
    <div className="card-dark overflow-hidden">
      <div className="p-4 border-b border-darkroom-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevDay} className="p-2 hover:bg-darkroom-hover rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm text-safelight-amber hover:bg-safelight-amber/10 rounded-lg transition-colors"
          >
            今天
          </button>
          <button onClick={goToNextDay} className="p-2 hover:bg-darkroom-hover rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <div className="ml-4">
            <span className="font-display text-lg font-semibold text-film-cream">
              {formatDate(currentDate)}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {workstation?.name || ''}
            </span>
            {isToday && (
              <span className="ml-2 text-xs text-safelight-redLight bg-safelight-red/20 px-2 py-0.5 rounded">
                今天
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setFormDefaults({ date: currentDate });
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

        <div className="flex-1 min-w-[600px]">
          <div className="h-14 border-b border-darkroom-border flex items-center justify-center">
            <span className="text-sm text-gray-400">00:00 ~ 24:00 全时段</span>
          </div>

          <div 
            className={`relative cursor-pointer ${isToday ? 'bg-safelight-red/5' : ''}`}
            style={{ height: `${totalHeight}px` }}
          >
            {timeSlots.map((hour) => {
              const isNight = hour >= 22 || hour < 8;
              return (
                <div
                  key={hour}
                  className={`absolute left-0 right-0 border-t border-darkroom-border/50 hover:bg-safelight-red/5 transition-colors ${
                    isNight ? 'bg-indigo-950/20' : ''
                  }`}
                  style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                  onClick={() => handleSlotClick(currentDate, hour)}
                />
              );
            })}

            {getBookingsForDay.map((booking) => {
              const { top, height, startsBeforeDay, endsAfterDay } = getBookingDisplay(booking);
              return (
                <div key={booking.id} style={{ position: 'absolute', top, height, left: 4, right: 4 }}>
                  <BookingBar
                    booking={booking}
                    top={0}
                    height={height}
                    onClick={() => handleBookingClick(booking.id)}
                    startsBeforeDay={startsBeforeDay}
                    endsAfterDay={endsAfterDay}
                  />
                </div>
              );
            })}
          </div>
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

export default DayView;
