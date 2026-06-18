import { useState, useEffect, useRef, useMemo } from 'react';
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
  editingBookingId?: string;
}

const BookingFormModal = ({
  isOpen,
  onClose,
  defaultWorkstationId,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  editingBookingId,
}: BookingFormModalProps) => {
  const { workstations, rateTiers, createBooking, bookings, rescheduleBooking } = useAppStore();
  const editingBooking = editingBookingId ? bookings.find(b => b.id === editingBookingId) : null;
  
  const activeWorkstations = useMemo(
    () => workstations.filter(w => w.status === 'active'),
    [workstations]
  );
  
  const initDefaultsRef = useRef({
    workstationId: defaultWorkstationId,
    date: defaultDate,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
  });

  const [formData, setFormData] = useState({
    workstationId: '',
    customerName: '',
    customerPhone: '',
    date: formatDate(new Date()),
    startTime: '09:00',
    endTime: '12:00',
    notes: '',
  });

  const [feeResult, setFeeResult] = useState<{ segments: any[]; totalAmount: number; totalMinutes: number } | null>(null);
  const [conflict, setConflict] = useState<{ hasConflict: boolean; message?: string }>({ hasConflict: false });
  const [error, setError] = useState('');
  const isFirstOpen = useRef(true);
  const prevCustomerNameRef = useRef('');
  const prevCustomerPhoneRef = useRef('');
  const prevNotesRef = useRef('');

  useEffect(() => {
    prevCustomerNameRef.current = formData.customerName;
    prevCustomerPhoneRef.current = formData.customerPhone;
    prevNotesRef.current = formData.notes;
  }, [formData.customerName, formData.customerPhone, formData.notes]);

  useEffect(() => {
    if (isOpen) {
      let wsId: string;
      let d: Date | undefined;
      let st: Date | undefined;
      let et: Date | undefined;
      let customerName = '';
      let customerPhone = '';
      let notes = '';

      if (editingBooking) {
        wsId = editingBooking.workstationId;
        const sDate = new Date(editingBooking.startTime);
        const eDate = new Date(editingBooking.endTime);
        d = sDate;
        st = sDate;
        et = eDate;
        customerName = editingBooking.customerName;
        customerPhone = editingBooking.customerPhone;
        notes = editingBooking.notes || '';
      } else {
        wsId = initDefaultsRef.current.workstationId || activeWorkstations[0]?.id || '';
        d = initDefaultsRef.current.date;
        st = initDefaultsRef.current.startTime;
        et = initDefaultsRef.current.endTime;
        customerName = isFirstOpen.current ? '' : prevCustomerNameRef.current;
        customerPhone = isFirstOpen.current ? '' : prevCustomerPhoneRef.current;
        notes = isFirstOpen.current ? '' : prevNotesRef.current;
      }
      
      setFormData({
        workstationId: wsId,
        date: d ? formatDate(d) : formatDate(new Date()),
        startTime: st ? formatTime(st) : '09:00',
        endTime: et ? formatTime(et) : '12:00',
        customerName,
        customerPhone,
        notes,
      });
      isFirstOpen.current = false;
      setError('');
      setConflict({ hasConflict: false });
      setFeeResult(null);
    } else {
      isFirstOpen.current = true;
    }
  }, [isOpen, activeWorkstations, editingBookingId]);

  useEffect(() => {
    initDefaultsRef.current = {
      workstationId: defaultWorkstationId,
      date: defaultDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
    };
  }, [defaultWorkstationId, defaultDate, defaultStartTime, defaultEndTime]);

  useEffect(() => {
    if (!formData.workstationId || !formData.date || !formData.startTime || !formData.endTime) {
      return;
    }

    try {
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      
      const dateParts = formData.date.split('-').map(Number);
      const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      
      let startTime = setTimeToDate(date, startHour, startMin);
      let endTime = setTimeToDate(date, endHour, endMin);

      if (startTime >= endTime) {
        if (startHour > endHour || (startHour === endHour && startMin >= endMin)) {
          endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
        }
      }

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
        bookings,
        editingBookingId
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
      setError(editingBookingId ? '改期时段存在冲突' : '时段存在冲突，无法预约');
      return;
    }

    const [startHour, startMin] = formData.startTime.split(':').map(Number);
    const [endHour, endMin] = formData.endTime.split(':').map(Number);
    const dateParts = formData.date.split('-').map(Number);
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

    let startTime = setTimeToDate(date, startHour, startMin);
    let endTime = setTimeToDate(date, endHour, endMin);

    if (startTime >= endTime) {
      endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
    }

    if (editingBookingId) {
      const result = rescheduleBooking(editingBookingId, {
        workstationId: formData.workstationId,
        startTime,
        endTime,
      });
      if (result.success) {
        onClose();
      } else {
        setError(result.error || '改期失败');
      }
    } else {
      const result = createBooking({
        workstationId: formData.workstationId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        startTime,
        endTime,
        status: 'confirmed',
        notes: formData.notes,
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error || '预约失败');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingBookingId ? "改期预约" : "新建预约"} size="lg">
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
            <p className="text-xs text-gray-500 mt-1">若结束时间早于开始时间，将自动算作次日</p>
          </div>
        </div>

        {conflict.hasConflict && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2 animate-pulse">
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
              disabled={!!editingBookingId}
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
              disabled={!!editingBookingId}
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
            disabled={!!editingBookingId}
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
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-gray-400">{segment.tierName}</span>
                    <span className="text-gray-500 text-xs">
                      ({formatTime(new Date(segment.startTime))} - {formatTime(new Date(segment.endTime))})
                    </span>
                    <span className="text-gray-500 text-xs">
                      · {formatDuration(segment.durationMinutes)}
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
            {editingBookingId ? "确认改期" : "确认预约"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BookingFormModal;
