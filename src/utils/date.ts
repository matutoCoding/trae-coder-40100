import { format, parse, addDays, startOfDay, endOfDay, isSameDay, differenceInMinutes, setHours, setMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (date: Date, pattern: string = 'yyyy-MM-dd'): string => {
  return format(date, pattern, { locale: zhCN });
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const parseTime = (timeStr: string, baseDate: Date = new Date()): Date => {
  return parse(timeStr, 'HH:mm', baseDate);
};

export const setTimeToDate = (date: Date, hours: number, minutes: number): Date => {
  return setMinutes(setHours(date, hours), minutes);
};

export const getStartOfDay = (date: Date): Date => {
  return startOfDay(date);
};

export const getEndOfDay = (date: Date): Date => {
  return endOfDay(date);
};

export const isSameDate = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

export const addDaysToDate = (date: Date, days: number): Date => {
  return addDays(date, days);
};

export const diffMinutes = (start: Date, end: Date): number => {
  return differenceInMinutes(end, start);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}分钟`;
  }
  if (mins === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${mins}分钟`;
};

export const getWeekDates = (date: Date): Date[] => {
  const dayOfWeek = date.getDay();
  const monday = addDays(date, dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(monday, i));
  }
  return dates;
};

export const getDayName = (date: Date): string => {
  return format(date, 'EEEE', { locale: zhCN });
};

export const getShortDayName = (date: Date): string => {
  return format(date, 'EEE', { locale: zhCN });
};

export const generateTimeSlots = (startHour: number = 8, endHour: number = 22, stepMinutes: number = 30): Date[] => {
  const slots: Date[] = [];
  const base = new Date();
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += stepMinutes) {
      slots.push(setTimeToDate(base, hour, min));
    }
  }
  slots.push(setTimeToDate(base, endHour, 0));
  return slots;
};
