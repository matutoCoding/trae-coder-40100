import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, validateRateTiers, checkTiersOverlap } from '@/utils/billing';
import { 
  Plus, Edit2, Trash2, DollarSign, Clock, 
  AlertTriangle, TrendingUp, TrendingDown,
  AlertOctagon
} from 'lucide-react';

const presetColors = [
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

const Rates = () => {
  const { rateTiers, addRateTier, updateRateTier, deleteRateTier } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    color: '#ef4444',
    pricePerHour: 100,
    startTime: '09:00',
    endTime: '18:00',
    isPeak: false,
  });

  const validation = validateRateTiers(rateTiers);

  const openAddForm = () => {
    setEditingId(null);
    setFormError('');
    setFormData({
      name: '',
      color: presetColors[rateTiers.length % presetColors.length],
      pricePerHour: 100,
      startTime: '09:00',
      endTime: '18:00',
      isPeak: false,
    });
    setShowForm(true);
  };

  const openEditForm = (tier: typeof rateTiers[0]) => {
    setEditingId(tier.id);
    setFormError('');
    setFormData({
      name: tier.name,
      color: tier.color,
      pricePerHour: tier.pricePerHour,
      startTime: tier.startTime,
      endTime: tier.endTime,
      isPeak: tier.isPeak,
    });
    setShowForm(true);
  };

  useEffect(() => {
    if (!showForm) return;
    
    const tiersWithNew = editingId
      ? rateTiers.map(t => t.id === editingId ? { ...t, ...formData, id: t.id } : t)
      : [...rateTiers, { ...formData, id: 'new-tier-preview' }];
    
    const overlap = checkTiersOverlap(tiersWithNew, editingId ? undefined : 'new-tier-preview');
    if (overlap.hasOverlap && overlap.conflictInfo) {
      setFormError(
        `时段冲突："${overlap.conflictInfo.tier1}"与"${overlap.conflictInfo.tier2}"在${overlap.conflictInfo.overlapRange}重叠`
      );
    } else {
      setFormError('');
    }
  }, [formData.startTime, formData.endTime, showForm, editingId, rateTiers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError('请输入档位名称');
      return;
    }
    if (formData.pricePerHour < 0) {
      setFormError('每小时价格不能为负数');
      return;
    }

    const tiersWithNew = editingId
      ? rateTiers.map(t => t.id === editingId ? { ...t, ...formData, id: t.id } : t)
      : [...rateTiers, { ...formData, id: 'new-tier-preview' }];
    
    const overlap = checkTiersOverlap(tiersWithNew, editingId ? undefined : 'new-tier-preview');
    if (overlap.hasOverlap && overlap.conflictInfo) {
      setFormError(
        `保存失败：档位"${overlap.conflictInfo.tier1}"与"${overlap.conflictInfo.tier2}"在时段${overlap.conflictInfo.overlapRange}存在重叠`
      );
      return;
    }

    setFormError('');
    
    if (editingId) {
      updateRateTier(editingId, formData);
    } else {
      addRateTier(formData);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个费率档位吗？')) {
      deleteRateTier(id);
    }
  };

  const sortedTiers = [...rateTiers].sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  const highestPrice = Math.max(...rateTiers.map(t => t.pricePerHour), 0);
  const lowestPrice = Math.min(...rateTiers.map(t => t.pricePerHour), Infinity);

  return (
    <div>
      <PageHeader
        title="费率管理"
        subtitle="管理时段费率档位"
        action={
          <button onClick={openAddForm} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增档位
          </button>
        }
      />

      {!validation.valid && validation.error && (
        <div className="mb-6 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium">提示</p>
            <p className="text-amber-300/70 text-sm">{validation.error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card-dark p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-safelight-red/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-safelight-redLight" />
            </div>
            <span className="text-gray-400">档位数量</span>
          </div>
          <p className="text-2xl font-bold text-film-cream font-display">
            {rateTiers.length} 档
          </p>
        </div>
        <div className="card-dark p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-gray-400">最低费率</span>
          </div>
          <p className="text-2xl font-bold text-green-400 font-display">
            {rateTiers.length > 0 ? formatCurrency(lowestPrice) : '-'}
            <span className="text-sm font-normal text-gray-500">/小时</span>
          </p>
        </div>
        <div className="card-dark p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-gray-400">最高费率</span>
          </div>
          <p className="text-2xl font-bold text-red-400 font-display">
            {rateTiers.length > 0 ? formatCurrency(highestPrice) : '-'}
            <span className="text-sm font-normal text-gray-500">/小时</span>
          </p>
        </div>
      </div>

      <div className="card-dark overflow-hidden">
        <div className="p-4 border-b border-darkroom-border">
          <h3 className="font-medium text-film-cream">费率档位列表</h3>
        </div>
        
        <div className="divide-y divide-darkroom-border">
          {sortedTiers.map((tier) => (
            <div key={tier.id} className="p-4 flex items-center justify-between hover:bg-darkroom-hover/30 transition-colors">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: tier.color + '20' }}
                >
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-film-cream">{tier.name}</h4>
                    {tier.isPeak && (
                      <Badge variant="danger">高峰</Badge>
                    )}
                    {!tier.isPeak && (
                      <Badge variant="success">平峰</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {tier.startTime} - {tier.endTime}
                      {tier.startTime > tier.endTime && (
                        <span className="text-xs text-purple-400 ml-1">(跨零点)</span>
                      )}
                    </span>
                    <span className="text-sm text-safelight-amber font-mono">
                      {formatCurrency(tier.pricePerHour)}/小时
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditForm(tier)}
                  className="p-2 text-gray-400 hover:text-safelight-amber hover:bg-darkroom-hover rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tier.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-darkroom-hover rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {rateTiers.length === 0 && (
            <div className="p-12 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-500">暂无费率档位</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 card-dark p-6">
        <h3 className="font-medium text-film-cream mb-4">24小时费率示意</h3>
        <div className="relative h-12 rounded-lg overflow-hidden bg-darkroom-bg">
          {sortedTiers.map((tier, idx) => {
            const startHour = parseInt(tier.startTime.split(':')[0]) + parseInt(tier.startTime.split(':')[1]) / 60;
            let endHour = parseInt(tier.endTime.split(':')[0]) + parseInt(tier.endTime.split(':')[1]) / 60;
            if (tier.startTime > tier.endTime) {
              endHour += 24;
            }
            
            const left = (startHour / 24) * 100;
            const width = ((endHour - startHour) / 24) * 100;
            
            const segments: Array<{ left: number; width: number }> = [];
            if (left + width > 100) {
              segments.push({ left, width: 100 - left });
              segments.push({ left: 0, width: (left + width) - 100 });
            } else {
              segments.push({ left, width });
            }
            
            return segments.map((seg, segIdx) => (
              <div
                key={`${tier.id}-${segIdx}`}
                className="absolute top-0 h-full flex items-center justify-center"
                style={{ 
                  left: `${seg.left}%`, 
                  width: `${seg.width}%`,
                  backgroundColor: tier.color,
                  opacity: 0.7,
                }}
              >
                {seg.width > 8 && (
                  <span className="text-xs text-white font-medium drop-shadow px-1 truncate">
                    {tier.name}
                  </span>
                )}
              </div>
            ));
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? '编辑费率档位' : '新增费率档位'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2">
              <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{formError}</p>
            </div>
          )}

          <div>
            <label className="label-dark">档位名称 *</label>
            <input
              type="text"
              className="input-dark"
              placeholder="例如：早间平峰"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-dark">开始时间 *</label>
              <input
                type="time"
                className="input-dark"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label-dark">结束时间 *</label>
              <input
                type="time"
                className="input-dark"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
              {formData.startTime > formData.endTime && (
                <p className="text-xs text-purple-400 mt-1">检测为跨零点时段</p>
              )}
            </div>
          </div>

          <div>
            <label className="label-dark">每小时价格 (元) *</label>
            <input
              type="number"
              className="input-dark"
              min="0"
              step="1"
              value={formData.pricePerHour}
              onChange={(e) => setFormData({ ...formData, pricePerHour: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="label-dark">档位颜色</label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-darkroom-card scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPeak"
              className="w-4 h-4 rounded border-gray-600 bg-darkroom-bg text-safelight-red focus:ring-safelight-red"
              checked={formData.isPeak}
              onChange={(e) => setFormData({ ...formData, isPeak: e.target.checked })}
            />
            <label htmlFor="isPeak" className="text-sm text-film-cream">
              高峰时段
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              取消
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!!formError}
            >
              {editingId ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Rates;
