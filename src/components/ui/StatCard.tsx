import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'red' | 'amber' | 'green' | 'blue';
}

const StatCard = ({ title, value, icon, trend, trendUp, color = 'red' }: StatCardProps) => {
  const colorClasses = {
    red: 'from-safelight-red/20 to-transparent border-safelight-red/30',
    amber: 'from-safelight-amber/20 to-transparent border-safelight-amber/30',
    green: 'from-green-500/20 to-transparent border-green-500/30',
    blue: 'from-blue-500/20 to-transparent border-blue-500/30',
  };

  const iconColors = {
    red: 'text-safelight-redLight',
    amber: 'text-safelight-amber',
    green: 'text-green-400',
    blue: 'text-blue-400',
  };

  return (
    <div className={cn(
      'card-dark p-5 relative overflow-hidden bg-gradient-to-br',
      colorClasses[color]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-film-cream mt-2 font-display">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs mt-2',
              trendUp ? 'text-green-400' : 'text-red-400'
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg bg-darkroom-bg/50', iconColors[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
