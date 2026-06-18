import { useAppStore } from '@/store/useAppStore';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { 
  CalendarDays, 
  DollarSign, 
  MonitorCog, 
  Film,
  Clock,
  User,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { formatDateTime, formatTime, formatDuration, diffMinutes } from '@/utils/date';
import { formatCurrency } from '@/utils/billing';
import { getTodayBookings, getUpcomingBookings } from '@/utils/booking';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { workstations, bookings, bills, processingTasks, rateTiers } = useAppStore();
  
  const activeWorkstations = workstations.filter(w => w.status === 'active').length;
  const todayBookings = getTodayBookings(bookings);
  const upcomingBookings = getUpcomingBookings(bookings, 5);
  const unpaidBills = bills.filter(b => b.status === 'unpaid');
  const pendingTasks = processingTasks.filter(t => t.status === 'pending' || t.status === 'processing');
  
  const todayRevenue = todayBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  const getWorkstationName = (id: string) => {
    const ws = workstations.find(w => w.id === id);
    return ws?.name || '未知工位';
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">已确认</Badge>;
      case 'cancelled':
        return <Badge variant="danger">已取消</Badge>;
      case 'completed':
        return <Badge variant="info">已完成</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">待处理</Badge>;
      case 'processing':
        return <Badge variant="amber">冲洗中</Badge>;
      case 'completed':
        return <Badge variant="success">已完成</Badge>;
      case 'picked_up':
        return <Badge variant="info">已取件</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  return (
    <div>
      <PageHeader 
        title="工作台" 
        subtitle="暗房冲洗工位管理系统"
        action={
          <button 
            onClick={() => navigate('/schedule')}
            className="btn-primary flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4" />
            新建预约
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="今日预约"
          value={todayBookings.length}
          icon={<CalendarDays className="w-6 h-6" />}
          color="red"
          trend="较昨日 +2"
          trendUp={true}
        />
        <StatCard
          title="今日营收"
          value={formatCurrency(todayRevenue)}
          icon={<DollarSign className="w-6 h-6" />}
          color="amber"
          trend="较昨日 +15%"
          trendUp={true}
        />
        <StatCard
          title="在用工位"
          value={`${activeWorkstations}/${workstations.length}`}
          icon={<MonitorCog className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="待处理冲扫"
          value={pendingTasks.length}
          icon={<Film className="w-6 h-6" />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-film-cream">今日预约</h2>
              <button 
                onClick={() => navigate('/schedule')}
                className="text-safelight-amber text-sm hover:underline flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {todayBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>今日暂无预约</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-darkroom-bg/50 rounded-lg border border-darkroom-border hover:border-safelight-red/30 transition-colors cursor-pointer"
                    onClick={() => navigate('/schedule')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-safelight-red/20 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-safelight-redLight" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-film-cream">{booking.customerName}</p>
                          {getBookingStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {getWorkstationName(booking.workstationId)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-film-cream">
                        {formatTime(new Date(booking.startTime))} - {formatTime(new Date(booking.endTime))}
                      </p>
                      <p className="text-sm text-safelight-amber mt-0.5">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-dark p-6">
            <h2 className="font-display text-lg font-semibold text-film-cream mb-4">费率档位</h2>
            <div className="space-y-2">
              {rateTiers.map((tier) => (
                <div 
                  key={tier.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-darkroom-bg/50"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-sm text-film-cream">{tier.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono text-safelight-amber">
                      ¥{tier.pricePerHour}/小时
                    </span>
                    <p className="text-xs text-gray-500">
                      {tier.startTime} - {tier.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-film-cream">待付款账单</h2>
              <span className="text-xs text-gray-500">{unpaidBills.length} 笔</span>
            </div>
            {unpaidBills.length === 0 ? (
              <p className="text-center py-4 text-gray-500 text-sm">暂无待付款账单</p>
            ) : (
              <div className="space-y-2">
                {unpaidBills.slice(0, 3).map((bill) => (
                  <div 
                    key={bill.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-darkroom-bg/50 cursor-pointer hover:bg-darkroom-hover transition-colors"
                    onClick={() => navigate('/bills')}
                  >
                    <span className="text-sm text-gray-400 font-mono">#{bill.id.slice(-8)}</span>
                    <span className="text-sm font-medium text-safelight-amber">
                      {formatCurrency(bill.actualAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-film-cream">冲扫任务</h2>
              <button 
                onClick={() => navigate('/processing')}
                className="text-xs text-safelight-amber hover:underline"
              >
                全部
              </button>
            </div>
            {pendingTasks.length === 0 ? (
              <p className="text-center py-4 text-gray-500 text-sm">暂无进行中的任务</p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-darkroom-bg/50"
                  >
                    <div>
                      <p className="text-sm text-film-cream">{task.customerName}</p>
                      <p className="text-xs text-gray-500">{task.filmType} · {task.rolls}卷</p>
                    </div>
                    {getTaskStatusBadge(task.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
