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

  const expandedTiers: Array<{
    tier: RateTier;
    rangeStart: Date;
    rangeEnd: Date;
  }> = [];

  const totalDays = Math.ceil(
    (new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate()).getTime() -
      new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()).getTime()) /
      (24 * 60 * 60 * 1000)
  ) + 1;

  for (let dayOffset = -1; dayOffset < totalDays; dayOffset++) {
    const dayDate = new Date(startTime);
    dayDate.setDate(startTime.getDate() + dayOffset);
    const dayStart = getStartOfDay(dayDate);

    for (const tier of sortedTiers) {
      let tierStart = parseTime(tier.startTime, dayDate);
      let tierEnd = parseTime(tier.endTime, dayDate);

      if (tier.startTime >= tier.endTime) {
        tierEnd = new Date(tierEnd.getTime() + 24 * 60 * 60 * 1000);
      }

      expandedTiers.push({
        tier,
        rangeStart: tierStart,
        rangeEnd: tierEnd,
      });
    }
  }

  for (const { tier, rangeStart, rangeEnd } of expandedTiers) {
    const segmentStart = new Date(Math.max(startTime.getTime(), rangeStart.getTime()));
    const segmentEnd = new Date(Math.min(endTime.getTime(), rangeEnd.getTime()));

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

  segments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const mergedSegments: FeeSegment[] = [];
  for (const seg of segments) {
    const lastSeg = mergedSegments[mergedSegments.length - 1];
    if (
      lastSeg &&
      lastSeg.tierId === seg.tierId &&
      lastSeg.endTime.getTime() === seg.startTime.getTime()
    ) {
      lastSeg.endTime = seg.endTime;
      lastSeg.durationMinutes += seg.durationMinutes;
      lastSeg.amount = Math.round((lastSeg.amount + seg.amount) * 100) / 100;
    } else {
      mergedSegments.push({ ...seg });
    }
  }

  return {
    segments: mergedSegments,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalMinutes,
  };
};

export const getTierAtTime = (time: Date, rateTiers: RateTier[]): RateTier | null => {
  const timeMinutes = time.getHours() * 60 + time.getMinutes();
  
  for (const tier of rateTiers) {
    const [sh, sm] = tier.startTime.split(':').map(Number);
    const [eh, em] = tier.endTime.split(':').map(Number);
    const tierStartMin = sh * 60 + sm;
    let tierEndMin = eh * 60 + em;
    
    if (tierStartMin >= tierEndMin) {
      tierEndMin += 24 * 60;
    }

    let checkMinutes = timeMinutes;
    if (tierStartMin >= tierEndMin && timeMinutes < tierStartMin) {
      checkMinutes += 24 * 60;
    }

    if (checkMinutes >= tierStartMin && checkMinutes < tierEndMin) {
      return tier;
    }
  }
  
  return null;
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const checkTiersOverlap = (
  tiers: RateTier[],
  excludeId?: string
): { hasOverlap: boolean; conflictInfo?: { tier1: string; tier2: string; overlapRange: string } } => {
  const normalized: Array<{
    id: string;
    name: string;
    start: number;
    end: number;
    startTime: string;
    endTime: string;
  }> = [];

  for (const tier of tiers) {
    if (excludeId && tier.id === excludeId) continue;
    
    const [sh, sm] = tier.startTime.split(':').map(Number);
    const [eh, em] = tier.endTime.split(':').map(Number);
    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;

    if (startMin >= endMin) {
      endMin += 24 * 60;
    }

    normalized.push({
      id: tier.id,
      name: tier.name,
      start: startMin,
      end: endMin,
      startTime: tier.startTime,
      endTime: tier.endTime,
    });
  }

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const a = normalized[i];
      const b = normalized[j];

      const overlapsDirectly = a.start < b.end && b.start < a.end;

      const aShiftedStart = a.start - 24 * 60;
      const aShiftedEnd = a.end - 24 * 60;
      const overlapsShifted1 = aShiftedStart < b.end && b.start < aShiftedEnd;

      const bShiftedStart = b.start - 24 * 60;
      const bShiftedEnd = b.end - 24 * 60;
      const overlapsShifted2 = bShiftedStart < a.end && a.start < bShiftedEnd;

      if (overlapsDirectly || overlapsShifted1 || overlapsShifted2) {
        const overlapStart = Math.max(
          overlapsDirectly ? a.start : overlapsShifted1 ? aShiftedStart : bShiftedStart,
          overlapsDirectly ? b.start : overlapsShifted1 ? b.start : a.start
        );
        const overlapEnd = Math.min(
          overlapsDirectly ? a.end : overlapsShifted1 ? aShiftedEnd : bShiftedEnd,
          overlapsDirectly ? b.end : overlapsShifted1 ? b.end : a.end
        );

        const toTimeStr = (min: number) => {
          const m = ((min % (24 * 60)) + 24 * 60) % (24 * 60);
          const h = Math.floor(m / 60);
          const mm = m % 60;
          return `${h.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
        };

        return {
          hasOverlap: true,
          conflictInfo: {
            tier1: a.name,
            tier2: b.name,
            overlapRange: `${toTimeStr(overlapStart)} ~ ${toTimeStr(overlapEnd)}`,
          },
        };
      }
    }
  }

  return { hasOverlap: false };
};

export const validateRateTiers = (rateTiers: RateTier[]): { valid: boolean; error?: string } => {
  if (rateTiers.length === 0) {
    return { valid: false, error: '至少需要一个费率档位' };
  }

  const overlap = checkTiersOverlap(rateTiers);
  if (overlap.hasOverlap && overlap.conflictInfo) {
    return {
      valid: false,
      error: `档位"${overlap.conflictInfo.tier1}"与"${overlap.conflictInfo.tier2}"在时段${overlap.conflictInfo.overlapRange}存在重叠`,
    };
  }

  const sorted = [...rateTiers].sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  let coveredMinutes = 0;
  const normalized = sorted.map(tier => {
    const [sh, sm] = tier.startTime.split(':').map(Number);
    const [eh, em] = tier.endTime.split(':').map(Number);
    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    if (startMin >= endMin) endMin += 24 * 60;
    return { start: startMin, end: endMin, name: tier.name };
  });

  for (const seg of normalized) {
    coveredMinutes += seg.end - seg.start;
  }

  if (coveredMinutes < 24 * 60) {
    const uncovered = 24 * 60 - coveredMinutes;
    const hours = Math.floor(uncovered / 60);
    const mins = uncovered % 60;
    return {
      valid: true,
      error: `提示：全天还有 ${hours}小时${mins > 0 ? mins + '分钟' : ''} 未被费率档位覆盖，该时段预约将不计费`,
    };
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
