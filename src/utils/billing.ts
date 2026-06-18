import { RateTier, FeeSegment } from '@/types';
import { parseTime, diffMinutes, getStartOfDay, setTimeToDate } from './date';

export interface FeeCalculationResult {
  segments: FeeSegment[];
  totalAmount: number;
  totalMinutes: number;
}

export const calculateFee = (
  startTime: Date,
  endTime: Date,
  rateTiers: RateTier[]
): FeeCalculationResult => {
  if (startTime >= endTime) {
    return { segments: [], totalAmount: 0, totalMinutes: 0 };
  }

  const segments: FeeSegment[] = [];
  let totalAmount = 0;
  let totalMinutes = 0;

  const sortedTiers = [...rateTiers].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  const dayStart = getStartOfDay(startTime);
  const dayEnd = getStartOfDay(endTime);

  let currentDate = new Date(dayStart);

  while (currentDate <= dayEnd) {
    const dayStr = currentDate.toDateString();
    const bookingStart = startTime.toDateString() === dayStr
      ? startTime
      : getStartOfDay(currentDate);
    const bookingEnd = endTime.toDateString() === dayStr
      ? endTime
      : new Date(getStartOfDay(currentDate).getTime() + 24 * 60 * 60 * 1000);

    for (const tier of sortedTiers) {
      const tierStart = parseTime(tier.startTime, currentDate);
      const tierEnd = parseTime(tier.endTime, currentDate);

      if (tier.startTime > tier.endTime) {
        tierEnd.setDate(tierEnd.getDate() + 1);
      }

      const segmentStart = new Date(Math.max(bookingStart.getTime(), tierStart.getTime()));
      const segmentEnd = new Date(Math.min(bookingEnd.getTime(), tierEnd.getTime()));

      if (segmentStart < segmentEnd) {
        const duration = diffMinutes(segmentStart, segmentEnd);
        const amount = (duration / 60) * tier.pricePerHour;

        segments.push({
          tierId: tier.id,
          tierName: tier.name,
          color: tier.color,
          startTime: new Date(segmentStart),
          endTime: new Date(segmentEnd),
          durationMinutes: duration,
          amount: Math.round(amount * 100) / 100,
        });

        totalAmount += amount;
        totalMinutes += duration;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  segments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return {
    segments,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalMinutes,
  };
};

export const getTierAtTime = (time: Date, rateTiers: RateTier[]): RateTier | null => {
  const timeStr = time.toTimeString().slice(0, 5);
  
  for (const tier of rateTiers) {
    if (tier.startTime <= tier.endTime) {
      if (timeStr >= tier.startTime && timeStr < tier.endTime) {
        return tier;
      }
    } else {
      if (timeStr >= tier.startTime || timeStr < tier.endTime) {
        return tier;
      }
    }
  }
  
  return null;
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const validateRateTiers = (rateTiers: RateTier[]): { valid: boolean; error?: string } => {
  if (rateTiers.length === 0) {
    return { valid: false, error: '至少需要一个费率档位' };
  }

  const sorted = [...rateTiers].sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    if (current.endTime > next.startTime) {
      return {
        valid: false,
        error: `费率档位"${current.name}"和"${next.name}"的时段重叠`
      };
    }
  }

  const hasNightTier = sorted.some(t => t.startTime > t.endTime);
  if (!hasNightTier) {
    const firstStart = sorted[0].startTime;
    const lastEnd = sorted[sorted.length - 1].endTime;
    if (firstStart !== '00:00' || lastEnd !== '24:00') {
      return {
        valid: true,
        error: '提示：费率未覆盖全天24小时，未覆盖时段将不计费'
      };
    }
  }

  return { valid: true };
};

export const getDefaultRateTiers = (): RateTier[] => [
  {
    id: 'tier-1',
    name: '早间平峰',
    color: '#22c55e',
    pricePerHour: 80,
    startTime: '08:00',
    endTime: '12:00',
    isPeak: false,
  },
  {
    id: 'tier-2',
    name: '午间高峰',
    color: '#ef4444',
    pricePerHour: 120,
    startTime: '12:00',
    endTime: '18:00',
    isPeak: true,
  },
  {
    id: 'tier-3',
    name: '晚间高峰',
    color: '#f59e0b',
    pricePerHour: 150,
    startTime: '18:00',
    endTime: '22:00',
    isPeak: true,
  },
  {
    id: 'tier-4',
    name: '夜间低谷',
    color: '#6366f1',
    pricePerHour: 60,
    startTime: '22:00',
    endTime: '08:00',
    isPeak: false,
  },
];

export const getDefaultWorkstations = () => [
  {
    id: 'ws-1',
    name: '暗房A工位',
    description: '专业黑白暗房工位，配备放大机和冲洗设备',
    status: 'active' as const,
    equipment: ['放大机', '冲洗罐', '安全灯', '温度计', '定时器'],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'ws-2',
    name: '暗房B工位',
    description: '彩色暗房工位，支持C-41和E-6工艺',
    status: 'active' as const,
    equipment: ['彩色放大机', '恒温冲洗机', '安全灯', '密度计'],
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'ws-3',
    name: '暗房C工位',
    description: '入门级暗房工位，适合初学者',
    status: 'maintenance' as const,
    equipment: ['放大机', '冲洗罐', '安全灯'],
    createdAt: new Date('2024-02-20'),
  },
];

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
