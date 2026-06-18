import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { Plus, Edit2, Trash2, MonitorCog, Settings, Wrench } from 'lucide-react';

const Workstations = () => {
  const { workstations, addWorkstation, updateWorkstation, deleteWorkstation } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'maintenance' | 'inactive',
    equipment: '',
  });

  const openAddForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
      equipment: '',
    });
    setShowForm(true);
  };

  const openEditForm = (ws: typeof workstations[0]) => {
    setEditingId(ws.id);
    setFormData({
      name: ws.name,
      description: ws.description,
      status: ws.status,
      equipment: ws.equipment.join('、'),
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const equipmentList = formData.equipment
      .split(/[、,，\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    if (editingId) {
      updateWorkstation(editingId, {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        equipment: equipmentList,
      });
    } else {
      addWorkstation({
        name: formData.name,
        description: formData.description,
        status: formData.status,
        equipment: equipmentList,
      });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个工位吗？')) {
      deleteWorkstation(id);
    }
  };

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
        return '已停用';
      default:
        return '未知';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MonitorCog className="w-6 h-6 text-green-400" />;
      case 'maintenance':
        return <Wrench className="w-6 h-6 text-yellow-400" />;
      case 'inactive':
        return <Settings className="w-6 h-6 text-gray-400" />;
      default:
        return <MonitorCog className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div>
      <PageHeader
        title="工位管理"
        subtitle="管理暗房工位资源"
        action={
          <button onClick={openAddForm} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增工位
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workstations.map((ws) => (
          <div key={ws.id} className="card-dark p-5 hover:border-safelight-red/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-darkroom-bg flex items-center justify-center">
                  {getStatusIcon(ws.status)}
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-film-cream">
                    {ws.name}
                  </h3>
                  <Badge variant={getStatusColor(ws.status) as any}>
                    {getStatusText(ws.status)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditForm(ws)}
                  className="p-2 text-gray-400 hover:text-safelight-amber hover:bg-darkroom-hover rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(ws.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-darkroom-hover rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-4">{ws.description}</p>

            <div className="pt-4 border-t border-darkroom-border">
              <p className="text-xs text-gray-500 mb-2">设备配置</p>
              <div className="flex flex-wrap gap-1.5">
                {ws.equipment.map((eq, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs bg-darkroom-bg text-gray-400 rounded-md"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {workstations.length === 0 && (
          <div className="col-span-full card-dark p-12 text-center">
            <MonitorCog className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500 mb-4">暂无工位</p>
            <button onClick={openAddForm} className="btn-primary">
              添加第一个工位
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? '编辑工位' : '新增工位'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-dark">工位名称 *</label>
            <input
              type="text"
              className="input-dark"
              placeholder="例如：暗房A工位"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label-dark">状态</label>
            <select
              className="input-dark"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="active">使用中</option>
              <option value="maintenance">维护中</option>
              <option value="inactive">已停用</option>
            </select>
          </div>

          <div>
            <label className="label-dark">描述</label>
            <textarea
              className="input-dark resize-none"
              rows={2}
              placeholder="工位描述信息"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="label-dark">设备配置</label>
            <textarea
              className="input-dark resize-none"
              rows={3}
              placeholder="多个设备用顿号或逗号分隔，例如：放大机、冲洗罐、安全灯"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">多个设备用顿号、逗号或换行分隔</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Workstations;
