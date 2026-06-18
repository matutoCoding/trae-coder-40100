import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workstation, RateTier, Booking, Bill, ProcessingTask, Customer, PaymentRecord } from '@/types';
import { generateId, getDefaultRateTiers, getDefaultWorkstations, calculateFee, checkTiersOverlap } from '@/utils/billing';
import { checkBookingConflict } from '@/utils/booking';
import { addDays } from 'date-fns';

interface AppState {
  workstations: Workstation[];
  rateTiers: RateTier[];
  bookings: Booking[];
  bills: Bill[];
  processingTasks: ProcessingTask[];
  customers: Customer[];
  
  addWorkstation: (ws: Omit<Workstation, 'id' | 'createdAt'>) => void;
  updateWorkstation: (id: string, data: Partial<Workstation>) => void;
  deleteWorkstation: (id: string) => void;
  
  addRateTier: (tier: Omit<RateTier, 'id'>) => { success: boolean; error?: string };
  updateRateTier: (id: string, data: Partial<RateTier>) => { success: boolean; error?: string };
  deleteRateTier: (id: string) => void;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  upsertCustomer: (name: string, phone: string, notes?: string) => Customer;
  
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'totalAmount' | 'feeBreakdown'>) => { 
    success: boolean; 
    error?: string; 
    booking?: Booking 
  };
  rescheduleBooking: (
    id: string,
    data: { workstationId: string; startTime: Date; endTime: Date }
  ) => { success: boolean; error?: string; booking?: Booking };
  cancelBooking: (id: string) => void;
  completeBooking: (id: string) => void;
  
  addBill: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
  updateBill: (id: string, data: Partial<Bill>) => void;
  applyDiscountToBill: (
    id: string,
    discountType: 'amount' | 'percent',
    discountValue: number
  ) => { success: boolean; error?: string };
  addPaymentToBill: (
    id: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) => { success: boolean; error?: string; remaining?: number };
  payBill: (id: string, paymentMethod: string) => void;
  refundBill: (id: string) => void;
  
  addProcessingTask: (task: Omit<ProcessingTask, 'id' | 'createdAt'>) => void;
  updateProcessingTask: (id: string, data: Partial<ProcessingTask>) => void;
  deleteProcessingTask: (id: string) => void;
  
  resetAllData: () => void;
}

const createMockBookings = (): Booking[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const bookings: Booking[] = [
    {
      id: 'booking-1',
      workstationId: 'ws-1',
      customerName: '张三',
      customerPhone: '13800138001',
      startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000),
      endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000),
      status: 'confirmed',
      totalAmount: 240,
      feeBreakdown: [],
      notes: '黑白胶片冲洗',
      createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'booking-2',
      workstationId: 'ws-2',
      customerName: '李四',
      customerPhone: '13800138002',
      startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000),
      endTime: new Date(today.getTime() + 18 * 60 * 60 * 1000),
      status: 'confirmed',
      totalAmount: 480,
      feeBreakdown: [],
      notes: '彩色反转片',
      createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'booking-3',
      workstationId: 'ws-1',
      customerName: '王五',
      customerPhone: '13800138003',
      startTime: new Date(addDays(today, 1).getTime() + 10 * 60 * 60 * 1000),
      endTime: new Date(addDays(today, 1).getTime() + 15 * 60 * 60 * 1000),
      status: 'confirmed',
      totalAmount: 520,
      feeBreakdown: [],
      notes: '',
      createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  ];
  
  return bookings;
};

const createMockBills = (): Bill[] => {
  const now = new Date();
  
  return [
    {
      id: 'bill-1',
      bookingId: 'booking-1',
      totalAmount: 240,
      discount: 0,
      actualAmount: 240,
      paidAmount: 240,
      status: 'paid',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      paidAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      paymentMethod: '微信支付',
      paymentRecords: [
        {
          id: 'pay-1',
          billId: 'bill-1',
          amount: 240,
          paymentMethod: '微信支付',
          paidAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        }
      ]
    },
    {
      id: 'bill-2',
      bookingId: 'booking-2',
      totalAmount: 480,
      discount: 0,
      actualAmount: 480,
      paidAmount: 200,
      status: 'partial',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      paymentRecords: [
        {
          id: 'pay-2',
          billId: 'bill-2',
          amount: 200,
          paymentMethod: '现金',
          paidAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000),
          notes: '定金',
        }
      ]
    },
  ];
};

const createMockCustomers = (): Customer[] => [
  {
    id: 'cust-1',
    name: '张三',
    phone: '13800138001',
    notes: '老客户，偏好黑白胶片',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'cust-2',
    name: '李四',
    phone: '13800138002',
    notes: '常拍彩色反转片',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'cust-3',
    name: '王五',
    phone: '13800138003',
    notes: '',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'cust-4',
    name: '赵六',
    phone: '13800138004',
    notes: '',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

const createMockTasks = (): ProcessingTask[] => {
  const now = new Date();
  
  return [
    {
      id: 'task-1',
      bookingId: 'booking-1',
      customerName: '张三',
      filmType: '黑白胶片',
      filmFormat: '135',
      processingType: '标准冲洗',
      rolls: 2,
      status: 'completed',
      notes: 'Ilford HP5+',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'task-2',
      bookingId: 'booking-2',
      customerName: '李四',
      filmType: '彩色反转片',
      filmFormat: '120',
      processingType: 'E-6冲洗',
      rolls: 1,
      status: 'processing',
      notes: 'Fuji Velvia 50',
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      id: 'task-3',
      customerName: '赵六',
      filmType: '黑白胶片',
      filmFormat: '135',
      processingType: '迫冲+1档',
      rolls: 3,
      status: 'pending',
      notes: 'Kodak Tri-X 400',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
  ];
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      workstations: getDefaultWorkstations(),
      rateTiers: getDefaultRateTiers(),
      bookings: createMockBookings(),
      bills: createMockBills(),
      processingTasks: createMockTasks(),
      customers: createMockCustomers(),

      addWorkstation: (ws) => {
        const newWs: Workstation = {
          ...ws,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({
          workstations: [...state.workstations, newWs],
        }));
      },

      updateWorkstation: (id, data) => {
        set((state) => ({
          workstations: state.workstations.map((ws) =>
            ws.id === id ? { ...ws, ...data } : ws
          ),
        }));
      },

      deleteWorkstation: (id) => {
        set((state) => ({
          workstations: state.workstations.filter((ws) => ws.id !== id),
        }));
      },

      addRateTier: (tier) => {
        const { rateTiers } = get();
        const temp = [...rateTiers, { ...tier, id: generateId() }];
        const overlap = checkTiersOverlap(temp);
        if (overlap.hasOverlap) {
          return {
            success: false,
            error: overlap.conflictInfo
              ? `保存失败：档位"${overlap.conflictInfo.tier1}"与"${overlap.conflictInfo.tier2}"在时段${overlap.conflictInfo.overlapRange}存在重叠`
              : '保存失败：费率时段存在重叠',
          };
        }
        const newTier: RateTier = {
          ...tier,
          id: generateId(),
        };
        set((state) => ({
          rateTiers: [...state.rateTiers, newTier],
        }));
        return { success: true };
      },

      updateRateTier: (id, data) => {
        const { rateTiers } = get();
        const temp = rateTiers.map(t => t.id === id ? { ...t, ...data } : t);
        const overlap = checkTiersOverlap(temp, id);
        if (overlap.hasOverlap) {
          return {
            success: false,
            error: overlap.conflictInfo
              ? `保存失败：档位"${overlap.conflictInfo.tier1}"与"${overlap.conflictInfo.tier2}"在时段${overlap.conflictInfo.overlapRange}存在重叠`
              : '保存失败：费率时段存在重叠',
          };
        }
        set((state) => ({
          rateTiers: state.rateTiers.map((tier) =>
            tier.id === id ? { ...tier, ...data } : tier
          ),
        }));
        return { success: true };
      },

      deleteRateTier: (id) => {
        set((state) => ({
          rateTiers: state.rateTiers.filter((tier) => tier.id !== id),
        }));
      },

      addCustomer: (customer) => {
        const newCustomer: Customer = {
          ...customer,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({
          customers: [...state.customers, newCustomer],
        }));
        return newCustomer;
      },

      updateCustomer: (id, data) => {
        set((state) => ({
          customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c),
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter(c => c.id !== id),
        }));
      },

      upsertCustomer: (name, phone, notes) => {
        const { customers } = get();
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();

        let existing = customers.find(
          c => c.phone && trimmedPhone && c.phone === trimmedPhone
        );
        if (!existing) {
          existing = customers.find(
            c => c.name === trimmedName
          );
        }

        if (existing) {
          const needUpdate =
            (notes && notes.trim() && !existing.notes) ||
            (trimmedPhone && !existing.phone) ||
            (notes && existing.notes !== notes.trim());
          if (needUpdate) {
            const updated = {
              ...existing,
              phone: trimmedPhone || existing.phone,
              notes: notes?.trim() || existing.notes,
            };
            set((state) => ({
              customers: state.customers.map(c => c.id === existing!.id ? updated : c),
            }));
            return updated;
          }
          return existing;
        }

        return get().addCustomer({
          name: trimmedName,
          phone: trimmedPhone,
          notes: notes?.trim() || '',
        });
      },

      createBooking: (bookingData) => {
        const { rateTiers, bookings } = get();
        
        const conflict = checkBookingConflict(
          bookingData.workstationId,
          new Date(bookingData.startTime),
          new Date(bookingData.endTime),
          bookings
        );

        if (conflict.hasConflict) {
          return {
            success: false,
            error: `与现有预约冲突：${conflict.conflictingBookings.map(b => b.customerName).join(', ')}`,
          };
        }

        const feeResult = calculateFee(
          new Date(bookingData.startTime),
          new Date(bookingData.endTime),
          rateTiers
        );

        const newBooking: Booking = {
          ...bookingData,
          startTime: new Date(bookingData.startTime),
          endTime: new Date(bookingData.endTime),
          id: generateId(),
          createdAt: new Date(),
          totalAmount: feeResult.totalAmount,
          feeBreakdown: feeResult.segments,
        };

        set((state) => ({
          bookings: [...state.bookings, newBooking],
        }));

        get().upsertCustomer(
          bookingData.customerName,
          bookingData.customerPhone || '',
          bookingData.notes
        );

        const newBill: Bill = {
          id: generateId(),
          bookingId: newBooking.id,
          totalAmount: feeResult.totalAmount,
          discount: 0,
          actualAmount: feeResult.totalAmount,
          paidAmount: 0,
          status: 'unpaid',
          createdAt: new Date(),
          paymentRecords: [],
        };

        set((state) => ({
          bills: [...state.bills, newBill],
        }));

        return { success: true, booking: newBooking };
      },

      rescheduleBooking: (id, data) => {
        const { rateTiers, bookings, bills } = get();
        const booking = bookings.find(b => b.id === id);
        if (!booking) {
          return { success: false, error: '预约不存在' };
        }
        if (booking.status === 'cancelled') {
          return { success: false, error: '已取消的预约不能改期' };
        }

        const conflict = checkBookingConflict(
          data.workstationId,
          new Date(data.startTime),
          new Date(data.endTime),
          bookings,
          id
        );
        if (conflict.hasConflict) {
          return {
            success: false,
            error: `改期冲突：与${conflict.conflictingBookings.map(b => b.customerName).join(', ')}的预约冲突`,
          };
        }

        const feeResult = calculateFee(
          new Date(data.startTime),
          new Date(data.endTime),
          rateTiers
        );

        const updatedBooking: Booking = {
          ...booking,
          workstationId: data.workstationId,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          totalAmount: feeResult.totalAmount,
          feeBreakdown: feeResult.segments,
        };

        set((state) => {
          const updatedBookings = state.bookings.map(b =>
            b.id === id ? updatedBooking : b
          );

          const relatedBill = state.bills.find(b => b.bookingId === id);
          let updatedBills = state.bills;
          if (relatedBill) {
            const newTotal = feeResult.totalAmount;
            let discount = relatedBill.discount;
            let discountType = relatedBill.discountType;
            let discountValue = relatedBill.discountValue;
            
            if (discountType === 'percent' && discountValue !== undefined) {
              discount = Math.round(newTotal * (discountValue / 100) * 100) / 100;
            } else if (discountType === 'amount' && discountValue !== undefined) {
              discount = Math.min(discountValue, newTotal);
            } else {
              discount = 0;
            }
            
            updatedBills = state.bills.map(b =>
              b.id === relatedBill.id
                ? {
                    ...b,
                    totalAmount: newTotal,
                    discount,
                    actualAmount: Math.max(0, Math.round((newTotal - discount) * 100) / 100),
                    status: b.paidAmount === 0 ? 'unpaid' :
                            b.paidAmount >= Math.max(0, Math.round((newTotal - discount) * 100) / 100) ? 'paid' :
                            'partial',
                  }
                : b
            );
          }

          return { bookings: updatedBookings, bills: updatedBills };
        });

        return { success: true, booking: updatedBooking };
      },

      cancelBooking: (id) => {
        set((state) => {
          const updatedBookings = state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'cancelled' as const } : b
          );
          
          const updatedBills = state.bills.map((bill) =>
            bill.bookingId === id ? { ...bill, status: 'refunded' as const } : bill
          );
          
          return { bookings: updatedBookings, bills: updatedBills };
        });
      },

      completeBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'completed' as const } : b
          ),
        }));
      },

      addBill: (bill) => {
        const newBill: Bill = {
          paidAmount: 0,
          paymentRecords: [],
          ...bill,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({
          bills: [...state.bills, newBill],
        }));
      },

      updateBill: (id, data) => {
        set((state) => ({
          bills: state.bills.map((bill) =>
            bill.id === id ? { ...bill, ...data } : bill
          ),
        }));
      },

      applyDiscountToBill: (id, discountType, discountValue) => {
        const { bills } = get();
        const bill = bills.find(b => b.id === id);
        if (!bill) {
          return { success: false, error: '账单不存在' };
        }
        if (bill.status === 'paid' || bill.status === 'refunded') {
          return { success: false, error: '已付款或已退款的账单无法修改优惠' };
        }
        if (discountValue < 0) {
          return { success: false, error: '优惠值不能为负数' };
        }
        if (discountType === 'percent' && discountValue > 100) {
          return { success: false, error: '折扣比例不能超过100%' };
        }

        let discount = 0;
        if (discountType === 'amount') {
          discount = Math.min(discountValue, bill.totalAmount);
        } else if (discountType === 'percent') {
          discount = Math.round(bill.totalAmount * (discountValue / 100) * 100) / 100;
        }

        const actualAmount = Math.max(0, Math.round((bill.totalAmount - discount) * 100) / 100);
        const paidAmount = bill.paidAmount || 0;
        const status = paidAmount === 0 ? 'unpaid' :
                       paidAmount >= actualAmount ? 'paid' : 'partial';

        set((state) => ({
          bills: state.bills.map(b =>
            b.id === id
              ? { ...b, discount, discountType, discountValue, actualAmount, status }
              : b
          ),
        }));

        return { success: true };
      },

      addPaymentToBill: (id, amount, paymentMethod, notes) => {
        const { bills } = get();
        const bill = bills.find(b => b.id === id);
        if (!bill) {
          return { success: false, error: '账单不存在' };
        }
        if (bill.status === 'refunded') {
          return { success: false, error: '已退款账单不能收款' };
        }
        if (amount <= 0) {
          return { success: false, error: '收款金额必须大于0' };
        }

        const remaining = Math.max(0, bill.actualAmount - (bill.paidAmount || 0));
        if (amount > remaining + 0.001) {
          return { success: false, error: `收款金额不能超过待付金额 ¥${remaining.toFixed(2)}` };
        }

        const newPaidAmount = Math.round(((bill.paidAmount || 0) + amount) * 100) / 100;
        const record: PaymentRecord = {
          id: generateId(),
          billId: id,
          amount,
          paymentMethod,
          paidAt: new Date(),
          notes,
        };

        const newStatus = newPaidAmount >= bill.actualAmount - 0.001 ? 'paid' : 'partial';
        const paidAt = newStatus === 'paid' ? new Date() : bill.paidAt;

        set((state) => ({
          bills: state.bills.map(b =>
            b.id === id
              ? {
                  ...b,
                  paidAmount: newPaidAmount,
                  status: newStatus,
                  paidAt,
                  paymentMethod: newStatus === 'paid' ? paymentMethod : b.paymentMethod,
                  paymentRecords: [...(b.paymentRecords || []), record],
                }
              : b
          ),
        }));

        return { success: true, remaining: Math.max(0, bill.actualAmount - newPaidAmount) };
      },

      payBill: (id, paymentMethod) => {
        const { bills } = get();
        const bill = bills.find(b => b.id === id);
        if (bill) {
          const remaining = Math.max(0, bill.actualAmount - (bill.paidAmount || 0));
          if (remaining > 0) {
            get().addPaymentToBill(id, remaining, paymentMethod, '一次性全额支付');
          } else {
            set((state) => ({
              bills: state.bills.map((b) =>
                b.id === id
                  ? { ...b, status: 'paid' as const, paidAt: new Date(), paymentMethod }
                  : b
              ),
            }));
          }
        }
      },

      refundBill: (id) => {
        set((state) => ({
          bills: state.bills.map((bill) =>
            bill.id === id ? { ...bill, status: 'refunded' as const } : bill
          ),
        }));
      },

      addProcessingTask: (task) => {
        const newTask: ProcessingTask = {
          ...task,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({
          processingTasks: [...state.processingTasks, newTask],
        }));
      },

      updateProcessingTask: (id, data) => {
        set((state) => {
          const updatedTasks = state.processingTasks.map((task) => {
            if (task.id !== id) return task;
            const updated = { ...task, ...data };
            
            if (data.status === 'completed' && !task.completedAt) {
              updated.completedAt = new Date();
            }
            if (data.status === 'picked_up' && !task.pickedUpAt) {
              updated.pickedUpAt = new Date();
            }
            
            return updated;
          });
          return { processingTasks: updatedTasks };
        });
      },

      deleteProcessingTask: (id) => {
        set((state) => ({
          processingTasks: state.processingTasks.filter((t) => t.id !== id),
        }));
      },

      resetAllData: () => {
        set({
          workstations: getDefaultWorkstations(),
          rateTiers: getDefaultRateTiers(),
          bookings: createMockBookings(),
          bills: createMockBills(),
          processingTasks: createMockTasks(),
          customers: createMockCustomers(),
        });
      },
    }),
    {
      name: 'darkroom-app-storage',
    }
  )
);
