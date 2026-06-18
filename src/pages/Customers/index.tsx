import { useState, useMemo } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/utils/billing';
import { formatDateTime, formatDate } from '@/utils/date';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Phone, 
  FileText,
  DollarSign,
  Search,
  CalendarDays,
  MonitorCog,
  UserRound
} from 'lucide-react';

const Customers = () => {
  const { customers, bookings, bills, workstations, addCustomer, updateCustomer, deleteCustomer } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: '',
  });

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', notes: '' });
    setShowForm(true);
  };

  const openEditForm = (c: typeof customers[0]) => {
    setEditingId(c.id);
    setFormData({ name: c.name, phone: c.phone, notes: c.notes });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) {
      updateCustomer(editingId, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim(),
      });
    } else {
      addCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim(),
      });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个客户档案吗？（历史预约和账单不受影响）')) {
      deleteCustomer(id);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.trim().toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.notes.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const getCustomerStats = (customerId: string, name: string, phone: string) => {
    const customerBookings = bookings.filter(
      b => b.customerName === name || 
           (phone && b.customerPhone === phone)
    );
    const customerBills = bills.filter(b => {
      const booking = bookings.find(bk => bk.id === b.bookingId);
      return booking?.customerName === name || 
             (phone && booking?.customerPhone === phone);
    });
    
    const totalSpent = customerBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const unpaidAmount = customerBills.reduce(
      (sum, b) => b.status !== 'refunded' ? sum + Math.max(0, b.actualAmount - (b.paidAmount || 0)) : sum,
      0
    );
    const bookingCount = customerBookings.filter(b => b.status !== 'cancelled').length;
    
    const wsUsage: Record<string, number> = {};
    customerBookings.forEach(b => {
      if (b.status !== 'cancelled') {
        wsUsage[b.workstationId] = (wsUsage[b.workstationId] || 0) + 1;
      }
    });
    const favoriteWsId = Object.entries(wsUsage).sort((a, b) => b[1] - a[1])[0]?.[0];
    const favoriteWs = workstations.find(w => w.id === favoriteWsId);

    return {
      bookings: customerBookings,
      bills: customerBills,
      totalSpent: Math.round(totalSpent * 100) / 100,
      unpaidAmount: Math.round(unpaidAmount * 100) / 100,
      bookingCount,
      favoriteWs,
    };
  };

  const selectedCustomer = showDetail ? customers.find(c => c.id === showDetail) : null;
  const selectedStats = selectedCustomer
    ? getCustomerStats(selectedCustomer.id, selectedCustomer.name, selectedCustomer.phone)
    : null;

  const getBillStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid': return <Badge variant="warning">待付款</Badge>;
      case 'partial': return <Badge variant="purple">部分收款</Badge>;
      case 'paid': return <Badge variant="success">已付款</Badge>;
      case 'refunded': return <Badge variant="default">已退款</Badge>;
      default: return <Badge>未知</Badge>;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge variant="info">已确认</Badge>;
      case 'completed': return <Badge variant="success">已完成</Badge>;
      case 'cancelled': return <Badge variant="default">已取消</Badge>;
      default: return <Badge>未知</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="客户档案"
        subtitle="管理客户信息、消费记录和欠款情况"
        action={
          <button onClick={openAddForm} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增客户
          </button>
        }
      />

      <div className="card-dark p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            className="input-dark pl-10"
            placeholder="搜索客户姓名、电话或备注..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => {
          const stats = getCustomerStats(customer.id, customer.name, customer.phone);
          return (
            <div
              key={customer.id}
              className="card-dark p-5 hover:border-safelight-red/50 transition-colors cursor-pointer group"
              onClick={() => setShowDetail(customer.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-safelight-red/20 flex items-center justify-center">
                    <UserRound className="w-6 h-6 text-safelight-redLight" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-film-cream">{customer.name}</h3>
                    {customer.phone && (
                      <p className="text-sm text-gray-400 font-mono">{customer.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openEditForm(customer)}
                    className="p-1.5 hover:bg-darkroom-hover rounded text-gray-400 hover:text-film-cream transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-1.5 hover:bg-darkroom-hover rounded text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {customer.notes && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{customer.notes}</p>
              )}

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-darkroom-border">
                <div className="text-center">
                  <p className="text-xs text-gray-500">预约次数</p>
                  <p className="text-lg font-bold text-film-cream font-mono">{stats.bookingCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">累计消费</p>
                  <p className="text-lg font-bold text-green-400 font-mono">{formatCurrency(stats.totalSpent)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">未付金额</p>
                  <p className={`text-lg font-bold font-mono ${stats.unpaidAmount > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {formatCurrency(stats.unpaidAmount)}
                  </p>
                </div>
              </div>

              {stats.favoriteWs && (
                <div className="mt-3 pt-3 border-t border-darkroom-border flex items-center gap-2 text-sm text-gray-400">
                  <MonitorCog className="w-4 h-4" />
                  常用工位：<span className="text-film-cream">{stats.favoriteWs.name}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="card-dark p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {searchQuery ? '没有找到匹配的客户' : '暂无客户档案，点击右上角新增'}
          </p>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? '编辑客户' : '新增客户'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-dark">客户姓名 *</label>
            <input
              type="text"
              className="input-dark"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入客户姓名"
              required
            />
          </div>
          <div>
            <label className="label-dark">联系电话</label>
            <input
              type="tel"
              className="input-dark"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="请输入联系电话"
            />
          </div>
          <div>
            <label className="label-dark">备注</label>
            <textarea
              className="input-dark resize-none"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="偏好、禁忌、常用胶片等"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? '保存修改' : '新增客户'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!showDetail}
        onClose={() => setShowDetail(null)}
        title={selectedCustomer?.name || '客户详情'}
        size="lg"
      >
        {selectedCustomer && selectedStats && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-darkroom-bg rounded-lg">
              <div className="w-16 h-16 rounded-full bg-safelight-red/20 flex items-center justify-center">
                <UserRound className="w-8 h-8 text-safelight-redLight" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-semibold text-film-cream">{selectedCustomer.name}</h2>
                {selectedCustomer.phone && (
                  <p className="text-gray-400 font-mono flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" />
                    {selectedCustomer.phone}
                  </p>
                )}
                {selectedCustomer.notes && (
                  <p className="text-sm text-gray-500 mt-2">{selectedCustomer.notes}</p>
                )}
              </div>
              <div className="text-right space-y-2">
                <div>
                  <p className="text-xs text-gray-500">累计消费</p>
                  <p className="text-2xl font-bold text-green-400 font-mono">
                    {formatCurrency(selectedStats.totalSpent)}
                  </p>
                </div>
                {selectedStats.unpaidAmount > 0 && (
                  <div>
                    <p className="text-xs text-gray-500">未付金额</p>
                    <p className="text-lg font-bold text-red-400 font-mono">
                      {formatCurrency(selectedStats.unpaidAmount)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-darkroom-bg rounded-lg text-center">
                <CalendarDays className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-film-cream font-mono">{selectedStats.bookingCount}</p>
                <p className="text-xs text-gray-500">预约次数</p>
              </div>
              <div className="p-3 bg-darkroom-bg rounded-lg text-center">
                <FileText className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-film-cream font-mono">{selectedStats.bills.length}</p>
                <p className="text-xs text-gray-500">账单数量</p>
              </div>
              <div className="p-3 bg-darkroom-bg rounded-lg text-center">
                <MonitorCog className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-film-cream">{selectedStats.favoriteWs?.name || '暂无'}</p>
                <p className="text-xs text-gray-500">常用工位</p>
              </div>
            </div>

            <div>
              <h3 className="font-display font-medium text-film-cream mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-safelight-amber" />
                历史预约
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedStats.bookings.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">暂无预约记录</p>
                ) : (
                  selectedStats.bookings
                    .slice()
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .map(booking => {
                      const ws = workstations.find(w => w.id === booking.workstationId);
                      return (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-darkroom-bg/50 rounded-lg">
                          <div>
                            <p className="text-sm text-film-cream">
                              {ws?.name || '未知工位'} · {getBookingStatusBadge(booking.status)}
                            </p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              {formatDateTime(new Date(booking.startTime))}
                              {' ~ '}
                              {formatDateTime(new Date(booking.endTime))}
                            </p>
                          </div>
                          <span className="text-safelight-amber font-mono">
                            {formatCurrency(booking.totalAmount)}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div>
              <h3 className="font-display font-medium text-film-cream mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-safelight-amber" />
                账单记录
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedStats.bills.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">暂无账单记录</p>
                ) : (
                  selectedStats.bills
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(bill => (
                      <div key={bill.id} className="flex items-center justify-between p-3 bg-darkroom-bg/50 rounded-lg">
                        <div>
                          <p className="text-sm text-film-cream flex items-center gap-2">
                            #{bill.id.slice(-8)} · {getBillStatusBadge(bill.status)}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            {formatDate(new Date(bill.createdAt))}
                            {(bill.paidAmount || 0) > 0 && ` · 已付 ${formatCurrency(bill.paidAmount || 0)}`}
                          </p>
                        </div>
                        <span className="text-safelight-amber font-mono">
                          {formatCurrency(bill.actualAmount)}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowDetail(null)} className="btn-primary">
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Customers;
