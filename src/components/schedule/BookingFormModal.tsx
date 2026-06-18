import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/store/useAppStore';
import { formatDate, formatTime, diffMinutes, formatDuration, setTimeToDate } from '@/utils/date';
import { calculateFee, formatCurrency } from '@/utils/billing';
import { checkBookingConflict } from '@/utils/booking';
import { AlertCircle, Calculator } from 'lucide-react';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWorkstationId?: string;
  defaultDate?: Date;
  defaultStartTime?: Date;
  defaultEndTime?: Date;
}

const BookingFormModal = ({
  isOpen,
  onClose,
  defaultWorkstationId,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
}: BookingFormModalProps) => {
  const { workstations, rateTiers, createBooking, bookings } = useAppStore();
  const activeWorkstations = workstations.filter(w => w.status === 'active');

  const [formData, setFormData] = useState({
    workstationId: defaultWorkstationId || activeWorkstations[0]?.id || '',
    customerName: '',
    customerPhone: '',
    date: defaultDate ? formatDate(defaultDate) : formatDate(new Date()),
    startTime: defaultStartTime ? formatTime(defaultStartTime) : '09:00',
    endTime: defaultEndTime ? formatTime(defaultEndTime) : '12:00',
    notes: '',
  });

  const [feeResult, setFeeResult] = useState<{ segments: any[]; totalAmount: number; totalMinutes: number } | null>(null);
  const [conflict, setConflict] = useState<{ hasConflict: boolean; message?: string }>({ hasConflict: false });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        workstationId: defaultWorkstationId || activeWorkstations[0]?.id || '',
        customerName: '',
        customerPhone: '',
        date: defaultDate ? formatDate(defaultDate) : formatDate(new Date()),
        startTime: defaultStartTime ? formatTime(defaultStartTime) : '09:00',
        endTime: defaultEndTime ? formatTime(defaultEndTime) : '12:00',
        notes: '',
      });
      setError('');
      setConflict({ hasConflict: false });
      setFeeResult(null);
    }
  }, [isOpen, defaultWorkstationId, defaultDate, defaultStartTime, defaultEndTime, activeWorkstations]);

  useEffect(() => {
    if (!formData.workstationId || !formData.date || !formData.startTime || !formData.endTime) {
      return;
    }

    try {
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      
      const dateParts = formData.date.split('-').map(Number);
      const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      
      const startTime = setTimeToDate(date, startHour, startMin);
      const endTime = setTimeToDate(date, endHour, endMin);

      if (startTime >= endTime) {
        setError('结束时间必须晚于开始时间');
        setFeeResult(null);
        return;
      }

      setError('');

      const conflictResult = checkBookingConflict(
        formData.workstationId,
        startTime,
        endTime,
        bookings
      );

      setConflict({
        hasConflict: conflictResult.hasConflict,
        message: conflictResult.conflictingBookings.map(b => `${b.customerName} (${formatTime(new Date(b.startTime))}-${formatTime(new Date(b.endTime))})`).join(', '),
      });

      const fee = calculateFee(startTime, endTime, rateTiers);
      setFeeResult(fee);
    } catch (e) {
      console.error(e);
    }
  }, [formData.workstationId, formData.date, formData.startTime, formData.endTime, rateTiers, bookings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName.trim()) {
      setError('请输入客户姓名');
      return;
    }
    if (conflict.hasConflict) {
      setError('时段存在冲突，无法预约');
      return;
    }

    const [startHour, startMin] = formData.startTime.split(':').map(Number);
    const [endHour, endMin] = formData.endTime.split(':').map(Number);
    const dateParts = formData.date.split('-').map(Number);
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

    const result = createBooking({
      workstationId: formData.workstationId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      startTime: setTimeToDate(date, startHour, startMin),
      endTime: setTimeToDate(date, endHour, endMin),
      status: 'confirmed',
      notes: formData.notes,
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error || '预约失败');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新建预约" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-dark">工位</label>
            <select
              className="input-dark"
              value={formData.workstationId}
              onChange={(e) => setFormData({ ...formData, workstationId: e.target.value })}
            >
              {activeWorkstations.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-dark">日期</label>
            <input
              type="date"
              className="input-dark"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-dark">开始时间</label>
            <input
              type="time"
              className="input-dark"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="label-dark">结束时间</label>
            <input
              type="time"
              className="input-dark"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </div>

        {conflict.hasConflict && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">时段冲突</p>
              <p className="text-xs text-red-300/70 mt-0.5">
                与以下预约冲突：{conflict.message}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-dark">客户姓名 *</label>
            <input
              type="text"
              className="input-dark"
              placeholder="请输入客户姓名"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>
          <div>
            <label className="label-dark">联系电话</label>
            <input
              type="tel"
              className="input-dark"
              placeholder="请输入联系电话"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label-dark">备注</label>
          <textarea
            className="input-dark resize-none"
            rows={2}
            placeholder="可选备注信息"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {feeResult && feeResult.segments.length > 0 && (
          <div className="p-4 bg-darkroom-bg rounded-lg border border-darkroom-border">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-safelight-amber" />
              <span className="text-sm font-medium text-film-cream">费用明细</span>
            </div>
            
            <div className="space-y-2 mb-3">
              {feeResult.segments.map((segment, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-gray-400">{segment.tierName}</span>
                    <span className="text-gray-500 text-xs">
                      ({segment.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - {segment.endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>
                  <span className="text-safelight-amber font-mono">
                    {formatCurrency(segment.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-darkroom-border">
              <div>
                <span className="text-sm text-gray-400">
                  总时长：{formatDuration(feeResult.totalMinutes)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-400">合计 </span>
                <span className="text-xl font-bold text-safelight-amber font-mono">
                  {formatCurrency(feeResult.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={conflict.hasConflict}
          >
            确认预约
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BookingFormModal;
