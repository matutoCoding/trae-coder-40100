import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime, formatDuration, diffMinutes } from '@/utils/date';
import { formatCurrency } from '@/utils/billing';
import { CalendarDays, User, Phone, Clock, DollarSign, FileText, XCircle, CheckCircle } from 'lucide-react';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
}

const BookingDetailModal = ({ isOpen, onClose, bookingId }: BookingDetailModalProps) => {
  const { bookings, workstations, cancelBooking, completeBooking } = useAppStore();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const booking = bookings.find(b => b.id === bookingId);
  const workstation = workstations.find(w => w.id === booking?.workstationId);

  if (!booking) return null;

  const getStatusBadge = (status: string) => {
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

  const handleCancel = () => {
    cancelBooking(booking.id);
    setShowCancelConfirm(false);
    onClose();
  };

  const handleComplete = () => {
    completeBooking(booking.id);
    onClose();
  };

  const duration = diffMinutes(new Date(booking.startTime), new Date(booking.endTime));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="预约详情" size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-safelight-red/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-safelight-redLight" />
            </div>
            <div>
              <p className="font-medium text-film-cream">{workstation?.name || '未知工位'}</p>
              {getStatusBadge(booking.status)}
            </div>
          </div>
          <span className="text-xs text-gray-500 font-mono">#{booking.id.slice(-8)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-darkroom-bg rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <User className="w-4 h-4" />
              <span>客户姓名</span>
            </div>
            <p className="text-film-cream font-medium">{booking.customerName}</p>
          </div>
          <div className="p-3 bg-darkroom-bg rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Phone className="w-4 h-4" />
              <span>联系电话</span>
            </div>
            <p className="text-film-cream font-mono">{booking.customerPhone || '-'}</p>
          </div>
        </div>

        <div className="p-4 bg-darkroom-bg rounded-lg">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Clock className="w-4 h-4" />
            <span>预约时段</span>
          </div>
          <p className="text-film-cream font-mono">
            {formatDateTime(new Date(booking.startTime))} ~ {formatDateTime(new Date(booking.endTime))}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            时长：{formatDuration(duration)}
          </p>
        </div>

        {booking.feeBreakdown && booking.feeBreakdown.length > 0 && (
          <div className="p-4 bg-darkroom-bg rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <DollarSign className="w-4 h-4" />
              <span>费用明细</span>
            </div>
            <div className="space-y-2">
              {booking.feeBreakdown.map((segment, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-gray-400">{segment.tierName}</span>
                    <span className="text-gray-500 text-xs">
                      ({formatDuration(segment.durationMinutes)})
                    </span>
                  </div>
                  <span className="text-safelight-amber font-mono">
                    {formatCurrency(segment.amount)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-darkroom-border">
              <span className="text-gray-400">合计</span>
              <span className="text-xl font-bold text-safelight-amber font-mono">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
          </div>
        )}

        {booking.notes && (
          <div className="p-4 bg-darkroom-bg rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <FileText className="w-4 h-4" />
              <span>备注</span>
            </div>
            <p className="text-film-cream">{booking.notes}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {booking.status === 'confirmed' && (
            <>
              <button 
                onClick={() => setShowCancelConfirm(true)}
                className="btn-danger flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                取消预约
              </button>
              <button 
                onClick={handleComplete}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                完成
              </button>
            </>
          )}
          {booking.status === 'cancelled' && (
            <span className="text-gray-500 text-sm">该预约已取消</span>
          )}
          {booking.status === 'completed' && (
            <span className="text-gray-500 text-sm">该预约已完成</span>
          )}
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative w-full max-w-sm bg-darkroom-card border border-darkroom-border rounded-xl p-6 animate-slide-up">
            <h3 className="font-display text-lg font-semibold text-film-cream mb-2">确认取消预约？</h3>
            <p className="text-gray-400 text-sm mb-6">
              取消后该时段将被释放，相关账单将标记为已退款。
            </p>
            <div className="flex justify-end gap-3">
              <button 
                className="btn-secondary"
                onClick={() => setShowCancelConfirm(false)}
              >
                返回
              </button>
              <button className="btn-danger" onClick={handleCancel}>
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BookingDetailModal;
