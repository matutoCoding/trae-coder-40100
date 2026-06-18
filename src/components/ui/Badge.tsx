import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'amber';
  children: React.ReactNode;
  className?: string;
}

const Badge = ({ variant = 'default', children, className }: BadgeProps) => {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-green-900/50 text-green-400 border border-green-700/50',
    warning: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50',
    danger: 'bg-red-900/50 text-red-400 border border-red-700/50',
    info: 'bg-blue-900/50 text-blue-400 border border-blue-700/50',
    amber: 'bg-amber-900/50 text-amber-400 border border-amber-700/50',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
