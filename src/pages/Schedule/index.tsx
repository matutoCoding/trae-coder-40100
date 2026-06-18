import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import WeekView from '@/components/schedule/WeekView';
import { useAppStore } from '@/store/useAppStore';
import Badge from '@/components/ui/Badge';
import { MonitorCog } from 'lucide-react';

const Schedule = () => {
  const { workstations } = useAppStore();
  const activeWorkstations = workstations.filter(w => w.status === 'active');
  const [selectedWorkstationId, setSelectedWorkstationId] = useState(
    activeWorkstations[0]?.id || ''
  );

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
      />

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
            <WeekView workstationId={selectedWorkstationId} />
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
