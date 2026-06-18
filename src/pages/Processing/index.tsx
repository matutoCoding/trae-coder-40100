import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime } from '@/utils/date';
import { 
  Film, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Clock,
  CheckCircle,
  Package,
  Play,
  ChevronDown
} from 'lucide-react';
import { ProcessingStatus } from '@/types';

const Processing = () => {
  const { processingTasks, addProcessingTask, updateProcessingTask, deleteProcessingTask } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    filmType: '黑白胶片',
    filmFormat: '135',
    processingType: '标准冲洗',
    rolls: 1,
    notes: '',
    status: 'pending' as ProcessingStatus,
  });

  const filmTypes = ['黑白胶片', '彩色负片', '彩色反转片', '黑白反转片', '其他'];
  const filmFormats = ['135', '120', '大画幅', '其他'];
  const processingTypes = ['标准冲洗', '迫冲+1档', '迫冲+2档', '降冲-1档', 'C-41彩色', 'E-6反转', '其他'];

  const openAddForm = () => {
    setEditingId(null);
    setFormData({
      customerName: '',
      filmType: '黑白胶片',
      filmFormat: '135',
      processingType: '标准冲洗',
      rolls: 1,
      notes: '',
      status: 'pending',
    });
    setShowForm(true);
  };

  const openEditForm = (task: typeof processingTasks[0]) => {
    setEditingId(task.id);
    setFormData({
      customerName: task.customerName,
      filmType: task.filmType,
      filmFormat: task.filmFormat,
      processingType: task.processingType,
      rolls: task.rolls,
      notes: task.notes,
      status: task.status,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateProcessingTask(editingId, formData);
    } else {
      addProcessingTask(formData);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个冲扫任务吗？')) {
      deleteProcessingTask(id);
    }
  };

  const updateStatus = (id: string, status: ProcessingStatus) => {
    updateProcessingTask(id, { status });
  };

  const getStatusBadge = (status: ProcessingStatus) => {
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

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'processing':
        return <Play className="w-5 h-5 text-amber-400" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'picked_up':
        return <Package className="w-5 h-5 text-blue-400" />;
      default:
        return <Film className="w-5 h-5 text-gray-400" />;
    }
  };

  const filteredTasks = processingTasks
    .filter(task => {
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          task.customerName.toLowerCase().includes(query) ||
          task.filmType.toLowerCase().includes(query) ||
          task.notes.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = processingTasks.filter(t => t.status === 'pending').length;
  const processingCount = processingTasks.filter(t => t.status === 'processing').length;
  const completedCount = processingTasks.filter(t => t.status === 'completed' || t.status === 'picked_up').length;

  return (
    <div>
      <PageHeader
        title="冲扫登记"
        subtitle="胶片冲扫任务管理"
        action={
          <button onClick={openAddForm} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建任务
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-safelight-amber/20 rounded-lg">
              <Film className="w-5 h-5 text-safelight-amber" />
            </div>
            <div>
              <p className="text-sm text-gray-400">总任务</p>
              <p className="text-xl font-bold text-film-cream font-display">{processingTasks.length}</p>
            </div>
          </div>
        </div>
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">待处理</p>
              <p className="text-xl font-bold text-yellow-400 font-display">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-900/30 rounded-lg">
              <Play className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">冲洗中</p>
              <p className="text-xl font-bold text-amber-400 font-display">{processingCount}</p>
            </div>
          </div>
        </div>
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">已完成</p>
              <p className="text-xl font-bold text-green-400 font-display">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-dark">
        <div className="p-4 border-b border-darkroom-border flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="搜索客户或胶卷..."
                className="input-dark pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <select
                className="input-dark appearance-none pr-8 w-32"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">冲洗中</option>
                <option value="completed">已完成</option>
                <option value="picked_up">已取件</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-darkroom-bg/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">客户</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">胶卷类型</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">规格</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">工艺</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">卷数</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">创建时间</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkroom-border">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-darkroom-hover/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-darkroom-bg flex items-center justify-center">
                        {getStatusIcon(task.status)}
                      </div>
                      <span className="text-film-cream font-medium">{task.customerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{task.filmType}</td>
                  <td className="px-4 py-3 text-gray-400">{task.filmFormat}</td>
                  <td className="px-4 py-3 text-gray-400">{task.processingType}</td>
                  <td className="px-4 py-3 text-film-cream font-mono">{task.rolls} 卷</td>
                  <td className="px-4 py-3">{getStatusBadge(task.status)}</td>
                  <td className="px-4 py-3">
                    <span className="text-gray-500 text-sm font-mono">
                      {formatDateTime(new Date(task.createdAt))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(task.id, 'processing')}
                          className="text-xs px-2 py-1 bg-amber-900/30 text-amber-400 rounded hover:bg-amber-900/50 transition-colors"
                        >
                          开始
                        </button>
                      )}
                      {task.status === 'processing' && (
                        <button
                          onClick={() => updateStatus(task.id, 'completed')}
                          className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50 transition-colors"
                        >
                          完成
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <button
                          onClick={() => updateStatus(task.id, 'picked_up')}
                          className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50 transition-colors"
                        >
                          取件
                        </button>
                      )}
                      <button
                        onClick={() => openEditForm(task)}
                        className="p-1.5 text-gray-400 hover:text-safelight-amber hover:bg-darkroom-hover rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-darkroom-hover rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTasks.length === 0 && (
            <div className="p-12 text-center">
              <Film className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-500">暂无冲扫任务</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? '编辑冲扫任务' : '新建冲扫任务'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-dark">客户姓名 *</label>
            <input
              type="text"
              className="input-dark"
              placeholder="请输入客户姓名"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-dark">胶卷类型</label>
              <select
                className="input-dark"
                value={formData.filmType}
                onChange={(e) => setFormData({ ...formData, filmType: e.target.value })}
              >
                {filmTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-dark">规格</label>
              <select
                className="input-dark"
                value={formData.filmFormat}
                onChange={(e) => setFormData({ ...formData, filmFormat: e.target.value })}
              >
                {filmFormats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-dark">冲洗工艺</label>
              <select
                className="input-dark"
                value={formData.processingType}
                onChange={(e) => setFormData({ ...formData, processingType: e.target.value })}
              >
                {processingTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-dark">卷数</label>
              <input
                type="number"
                className="input-dark"
                min="1"
                value={formData.rolls}
                onChange={(e) => setFormData({ ...formData, rolls: Number(e.target.value) })}
              />
            </div>
          </div>

          {editingId && (
            <div>
              <label className="label-dark">状态</label>
              <select
                className="input-dark"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProcessingStatus })}
              >
                <option value="pending">待处理</option>
                <option value="processing">冲洗中</option>
                <option value="completed">已完成</option>
                <option value="picked_up">已取件</option>
              </select>
            </div>
          )}

          <div>
            <label className="label-dark">备注</label>
            <textarea
              className="input-dark resize-none"
              rows={3}
              placeholder="例如：Kodak Tri-X 400、迫冲+1档等"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
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

export default Processing;
