import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime, formatDuration, diffMinutes } from '@/utils/date';
import { formatCurrency } from '@/utils/billing';
import { 
  FileText, 
  DollarSign, 
  Search, 
  Filter,
  CreditCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronDown,
  Percent,
  Tag,
  Calculator
} from 'lucide-react';

const Bills = () => {
  const { bills, bookings, workstations, payBill, refundBill, applyDiscountToBill } = useAppStore();
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('现金');
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [discountError, setDiscountError] = useState('');

  const getBookingForBill = (billId: string) => {
    return bookings.find(b => b.id === billId);
  };

  const getWorkstationName = (wsId: string) => {
    const ws = workstations.find(w => w.id === wsId);
    return ws?.name || '未知工位';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <Badge variant="warning">待付款</Badge>;
      case 'paid':
        return <Badge variant="success">已付款</Badge>;
      case 'refunded':
        return <Badge variant="default">已退款</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  const filteredBills = bills.filter(bill => {
    if (statusFilter !== 'all' && bill.status !== statusFilter) {
      return false;
    }
    
    if (searchQuery) {
      const booking = getBookingForBill(bill.bookingId);
      const query = searchQuery.toLowerCase();
      if (booking?.customerName.toLowerCase().includes(query)) {
        return true;
      }
      if (bill.id.toLowerCase().includes(query)) {
        return true;
      }
      return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalUnpaid = bills
    .filter(b => b.status === 'unpaid')
    .reduce((sum, b) => sum + b.actualAmount, 0);
  
  const totalPaid = bills
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.actualAmount, 0);

  const handlePay = () => {
    if (selectedBillId) {
      payBill(selectedBillId, paymentMethod);
      setShowPayModal(false);
    }
  };

  const handleRefund = () => {
    if (selectedBillId && confirm('确认要退款吗？')) {
      refundBill(selectedBillId);
    }
  };

  const openDiscountModal = () => {
    if (selectedBill) {
      if (selectedBill.discountType && selectedBill.discountValue !== undefined) {
        setDiscountType(selectedBill.discountType);
        setDiscountValue(selectedBill.discountValue.toString());
      } else {
        setDiscountType('amount');
        setDiscountValue('0');
      }
      setDiscountError('');
      setShowDiscountModal(true);
    }
  };

  const handleSaveDiscount = () => {
    if (!selectedBillId) return;
    const val = Number(discountValue);
    if (isNaN(val) || val < 0) {
      setDiscountError('请输入有效的优惠数值');
      return;
    }
    const result = applyDiscountToBill(selectedBillId, discountType, val);
    if (!result.success) {
      setDiscountError(result.error || '设置优惠失败');
      return;
    }
    setShowDiscountModal(false);
  };

  const selectedBill = bills.find(b => b.id === selectedBillId);
  const selectedBooking = selectedBill ? getBookingForBill(selectedBill.bookingId) : null;

  return (
    <div>
      <PageHeader
        title="账单中心"
        subtitle="查看和管理所有账单"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-safelight-amber/20 rounded-lg">
              <FileText className="w-5 h-5 text-safelight-amber" />
            </div>
            <div>
              <p className="text-sm text-gray-400">总账单</p>
              <p className="text-xl font-bold text-film-cream font-display">{bills.length}</p>
            </div>
          </div>
        </div>
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-900/30 rounded-lg">
              <CreditCard className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">待付款</p>
              <p className="text-xl font-bold text-yellow-400 font-display">
                {bills.filter(b => b.status === 'unpaid').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">已收款</p>
              <p className="text-xl font-bold text-green-400 font-mono">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </div>
        </div>
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-safelight-red/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-safelight-redLight" />
            </div>
            <div>
              <p className="text-sm text-gray-400">待收金额</p>
              <p className="text-xl font-bold text-safelight-redLight font-mono">
                {formatCurrency(totalUnpaid)}
              </p>
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
                placeholder="搜索账单号或客户名..."
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
                <option value="unpaid">待付款</option>
                <option value="paid">已付款</option>
                <option value="refunded">已退款</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-darkroom-bg/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">账单号</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">客户</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">工位</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">金额</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">创建时间</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkroom-border">
              {filteredBills.map((bill) => {
                const booking = getBookingForBill(bill.bookingId);
                return (
                  <tr 
                    key={bill.id} 
                    className="hover:bg-darkroom-hover/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedBillId(bill.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-film-cream">
                        #{bill.id.slice(-8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-film-cream">
                        {booking?.customerName || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm">
                        {booking ? getWorkstationName(booking.workstationId) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {bill.discount > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-safelight-amber font-mono font-medium">
                            {formatCurrency(bill.actualAmount)}
                          </span>
                          <span className="text-gray-500 text-xs line-through font-mono">
                            原价 {formatCurrency(bill.totalAmount)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-safelight-amber font-mono font-medium">
                          {formatCurrency(bill.actualAmount)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-500 text-sm font-mono">
                        {formatDateTime(new Date(bill.createdAt))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {bill.status === 'unpaid' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBillId(bill.id);
                            setShowPayModal(true);
                          }}
                          className="text-xs px-2 py-1 bg-safelight-red/20 text-safelight-redLight rounded hover:bg-safelight-red/30 transition-colors"
                        >
                          付款
                        </button>
                      )}
                      {bill.status === 'paid' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBillId(bill.id);
                            handleRefund();
                          }}
                          className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                        >
                          退款
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredBills.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-500">暂无账单记录</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedBillId && !showPayModal}
        onClose={() => setSelectedBillId(null)}
        title="账单详情"
        size="lg"
      >
        {selectedBill && selectedBooking && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">账单号</p>
                <p className="font-mono text-film-cream">#{selectedBill.id.slice(-12)}</p>
              </div>
              {getStatusBadge(selectedBill.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-darkroom-bg rounded-lg">
                <p className="text-sm text-gray-400 mb-1">客户姓名</p>
                <p className="text-film-cream font-medium">{selectedBooking.customerName}</p>
              </div>
              <div className="p-3 bg-darkroom-bg rounded-lg">
                <p className="text-sm text-gray-400 mb-1">联系电话</p>
                <p className="text-film-cream font-mono">{selectedBooking.customerPhone || '-'}</p>
              </div>
            </div>

            <div className="p-4 bg-darkroom-bg rounded-lg">
              <p className="text-sm text-gray-400 mb-2">预约信息</p>
              <div className="space-y-1">
                <p className="text-film-cream">
                  {getWorkstationName(selectedBooking.workstationId)}
                </p>
                <p className="text-sm text-gray-400 font-mono">
                  {formatDateTime(new Date(selectedBooking.startTime))} ~ {formatDateTime(new Date(selectedBooking.endTime))}
                </p>
                <p className="text-sm text-gray-500">
                  时长：{formatDuration(diffMinutes(new Date(selectedBooking.startTime), new Date(selectedBooking.endTime)))}
                </p>
              </div>
            </div>

            {selectedBooking.feeBreakdown && selectedBooking.feeBreakdown.length > 0 && (
              <div className="p-4 bg-darkroom-bg rounded-lg">
                <p className="text-sm text-gray-400 mb-3">费用明细</p>
                <div className="space-y-2">
                  {selectedBooking.feeBreakdown.map((segment, idx) => (
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
              </div>
            )}

            <div className="p-4 bg-safelight-red/10 rounded-lg border border-safelight-red/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">账单金额</span>
                <span className="text-film-cream font-mono">{formatCurrency(selectedBill.totalAmount)}</span>
              </div>
              {selectedBill.discount > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">优惠</span>
                  <span className="text-green-400 font-mono">-{formatCurrency(selectedBill.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-safelight-red/20">
                <span className="text-film-cream font-medium">实付金额</span>
                <span className="text-2xl font-bold text-safelight-amber font-mono">
                  {formatCurrency(selectedBill.actualAmount)}
                </span>
              </div>
            </div>

            {selectedBill.paymentMethod && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">支付方式</span>
                <span className="text-film-cream">{selectedBill.paymentMethod}</span>
              </div>
            )}
            {selectedBill.paidAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">支付时间</span>
                <span className="text-film-cream font-mono">{formatDateTime(new Date(selectedBill.paidAt))}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              {selectedBill.status === 'unpaid' && (
                <>
                  <button
                    onClick={openDiscountModal}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4" />
                    设置优惠
                  </button>
                  <button 
                    onClick={() => setShowPayModal(true)}
                    className="btn-primary"
                  >
                    确认付款
                  </button>
                </>
              )}
              {selectedBill.status === 'paid' && (
                <button 
                  onClick={handleRefund}
                  className="btn-danger"
                >
                  退款
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        title="设置优惠"
        size="sm"
      >
        <div className="space-y-4">
          {selectedBill && (
            <div className="p-3 bg-darkroom-bg rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">账单原价</span>
                <span className="text-film-cream font-mono">{formatCurrency(selectedBill.totalAmount)}</span>
              </div>
              {selectedBill.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">当前优惠</span>
                  <span className="text-green-400 font-mono">-{formatCurrency(selectedBill.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-darkroom-border">
                <span className="text-gray-300">当前实付</span>
                <span className="text-safelight-amber font-mono font-medium">{formatCurrency(selectedBill.actualAmount)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="label-dark">优惠方式</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType('amount')}
                className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                  discountType === 'amount'
                    ? 'border-safelight-red bg-safelight-red/10 text-safelight-redLight'
                    : 'border-darkroom-border bg-darkroom-bg text-gray-400 hover:border-gray-600'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                固定金额
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                  discountType === 'percent'
                    ? 'border-safelight-red bg-safelight-red/10 text-safelight-redLight'
                    : 'border-darkroom-border bg-darkroom-bg text-gray-400 hover:border-gray-600'
                }`}
              >
                <Percent className="w-4 h-4" />
                折扣比例
              </button>
            </div>
          </div>

          <div>
            <label className="label-dark">
              {discountType === 'amount' ? '优惠金额（元）' : '折扣比例（%）'}
            </label>
            <input
              type="number"
              className="input-dark"
              min="0"
              step={discountType === 'amount' ? '0.01' : '1'}
              max={discountType === 'percent' ? '100' : undefined}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'amount' ? '例如：20' : '例如：15'}
            />
            {discountType === 'percent' && (
              <p className="text-xs text-gray-500 mt-1">0~100之间，如15表示减免15%</p>
            )}
          </div>

          {selectedBill && (
            <div className="p-3 bg-safelight-amber/10 rounded-lg flex items-center justify-between">
              <Calculator className="w-4 h-4 text-safelight-amber" />
              <div className="text-right">
                <p className="text-xs text-gray-400">优惠后实付</p>
                <p className="text-xl font-bold text-safelight-amber font-mono">
                  {formatCurrency(
                    Math.max(
                      0,
                      discountType === 'amount'
                        ? Math.round((selectedBill.totalAmount - Math.min(Number(discountValue) || 0, selectedBill.totalAmount)) * 100) / 100
                        : Math.round(selectedBill.totalAmount * (1 - (Number(discountValue) || 0) / 100) * 100) / 100
                    )
                  )}
                </p>
              </div>
            </div>
          )}

          {discountError && (
            <p className="text-red-400 text-sm">{discountError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              className="btn-secondary flex-1"
              onClick={() => setShowDiscountModal(false)}
            >
              取消
            </button>
            <button 
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handleSaveDiscount}
            >
              <CheckCircle className="w-4 h-4" />
              保存优惠
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="确认付款"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-safelight-amber/10 rounded-lg text-center space-y-1">
            {selectedBill && selectedBill.discount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">原价</span>
                  <span className="text-gray-400 line-through">{formatCurrency(selectedBill.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    优惠 {selectedBill.discountType === 'percent' ? `(${selectedBill.discountValue}%)` : ''}
                  </span>
                  <span className="text-green-400">-{formatCurrency(selectedBill.discount)}</span>
                </div>
              </>
            )}
            <p className="text-gray-400 text-sm mt-2 mb-1">应付金额</p>
            <p className="text-3xl font-bold text-safelight-amber font-mono">
              {selectedBill ? formatCurrency(selectedBill.actualAmount) : '¥0.00'}
            </p>
          </div>

          <div>
            <label className="label-dark">支付方式</label>
            <select
              className="input-dark"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="现金">现金</option>
              <option value="微信支付">微信支付</option>
              <option value="支付宝">支付宝</option>
              <option value="银行卡">银行卡</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              className="btn-secondary flex-1"
              onClick={() => setShowPayModal(false)}
            >
              取消
            </button>
            <button 
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handlePay}
            >
              <CheckCircle className="w-4 h-4" />
              确认收款
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Bills;
