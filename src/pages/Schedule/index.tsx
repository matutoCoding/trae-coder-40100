import { useState, useMemo } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import WeekView from '@/components/schedule/WeekView';
import DayView from '@/components/schedule/DayView';
import { useAppStore } from '@/store/useAppStore';
import Badge from '@/components/ui/Badge';
import { MonitorCog, CalendarDays, Calendar, Search, Filter, X } from 'lucide-react';

const Schedule = () => {
  const { workstations } = useAppStore();
  const activeWorkstations = useMemo(
    () => workstations.filter(w => w.status === 'active'),
    [workstations]
  );
  const [selectedWorkstationId, setSelectedWorkstationId] = useState(
    activeWorkstations[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterBillStatus, setFilterBillStatus] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'inactive':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '使用中';
      case 'maintenance':
        return '维护中';
      case 'inactive':
        return '停用';
      default:
        return '未知';
    }
  };

  return (
    <div>
      <PageHeader
        title="工位排期"
        subtitle="查看和管理暗房工位预约"
        action={
          <div className="flex items-center bg-darkroom-bg rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                viewMode === 'day'
                  ? 'bg-safelight-red/20 text-safelight-redLight'
                  : 'text-gray-400 hover:text-film-cream'
              }`}
            >
              <Calendar className="w-4 h-4" />
              日视图
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                viewMode === 'week'
                  ? 'bg-safelight-red/20 text-safelight-redLight'
                  : 'text-gray-400 hover:text-film-cream'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              周视图
            </button>
          </div>
        }
      />

      <div className="card-dark p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="text-sm">筛选预约：</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              className="input-dark pl-9 pr-8 py-1.5 text-sm w-60"
              placeholder="客户姓名或手机号"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
            {filterSearch && (
              <button
                onClick={() => setFilterSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-darkroom-hover rounded text-gray-500 hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            className="input-dark py-1.5 text-sm w-36"
            value={filterBillStatus}
            onChange={(e) => setFilterBillStatus(e.target.value)}
          >
            <option value="all">全部账单状态</option>
            <option value="unpaid">待付款</option>
            <option value="partial">部分收款</option>
            <option value="paid">已付款</option>
            <option value="refunded">已退款</option>
          </select>
          {(filterSearch || filterBillStatus !== 'all') && (
            <button
              onClick={() => {
                setFilterSearch('');
                setFilterBillStatus('all');
              }}
              className="text-sm text-safelight-amber hover:text-safelight-redLight flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              清空筛选
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="card-dark p-4">
            <h3 className="font-medium text-film-cream mb-3 flex items-center gap-2">
              <MonitorCog className="w-4 h-4" />
              工位列表
            </h3>
            <div className="space-y-2">
              {activeWorkstations.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => setSelectedWorkstationId(ws.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    selectedWorkstationId === ws.id
                      ? 'bg-safelight-red/20 border border-safelight-red/50'
                      : 'bg-darkroom-bg/50 border border-transparent hover:bg-darkroom-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-film-cream text-sm">{ws.name}</span>
                    <Badge variant={getStatusColor(ws.status) as any}>
                      {getStatusText(ws.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {ws.equipment.slice(0, 3).join('、')}
                  </p>
                </button>
              ))}
            </div>

            {workstations.filter(w => w.status !== 'active').length > 0 && (
              <>
                <div className="my-3 border-t border-darkroom-border" />
                <p className="text-xs text-gray-500 mb-2">其他工位</p>
                <div className="space-y-2">
                  {workstations.filter(w => w.status !== 'active').map((ws) => (
                    <div
                      key={ws.id}
                      className="p-3 rounded-lg bg-darkroom-bg/30 opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-500 text-sm">{ws.name}</span>
                        <Badge variant={getStatusColor(ws.status) as any}>
                          {getStatusText(ws.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {selectedWorkstationId ? (
            viewMode === 'day' 
              ? <DayView 
                  workstationId={selectedWorkstationId} 
                  filterSearch={filterSearch}
                  filterBillStatus={filterBillStatus}
                />
              : <WeekView 
                  workstationId={selectedWorkstationId}
                  filterSearch={filterSearch}
                  filterBillStatus={filterBillStatus}
                />
          ) : (
            <div className="card-dark p-12 text-center">
              <MonitorCog className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500">请选择一个工位查看排期</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
