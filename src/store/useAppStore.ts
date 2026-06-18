import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workstation, RateTier, Booking, Bill, ProcessingTask } from '@/types';
import { generateId, getDefaultRateTiers, getDefaultWorkstations, calculateFee } from '@/utils/billing';
import { checkBookingConflict } from '@/utils/booking';
import { addDays } from 'date-fns';

interface AppState {
  workstations: Workstation[];
  rateTiers: RateTier[];
  bookings: Booking[];
  bills: Bill[];
  processingTasks: ProcessingTask[];
  
  addWorkstation: (ws: Omit<Workstation, 'id' | 'createdAt'>) => void;
  updateWorkstation: (id: string, data: Partial<Workstation>) => void;
  deleteWorkstation: (id: string) => void;
  
  addRateTier: (tier: Omit<RateTier, 'id'>) => void;
  updateRateTier: (id: string, data: Partial<RateTier>) => void;
  deleteRateTier: (id: string) => void;
  
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
      status: 'paid',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      paidAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      paymentMethod: '微信支付',
    },
    {
      id: 'bill-2',
      bookingId: 'booking-2',
      totalAmount: 480,
      discount: 0,
      actualAmount: 480,
      status: 'unpaid',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];
};

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
        const newTier: RateTier = {
          ...tier,
          id: generateId(),
        };
        set((state) => ({
          rateTiers: [...state.rateTiers, newTier],
        }));
      },

      updateRateTier: (id, data) => {
        set((state) => ({
          rateTiers: state.rateTiers.map((tier) =>
            tier.id === id ? { ...tier, ...data } : tier
          ),
        }));
      },

      deleteRateTier: (id) => {
        set((state) => ({
          rateTiers: state.rateTiers.filter((tier) => tier.id !== id),
        }));
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

        const newBill: Bill = {
          id: generateId(),
          bookingId: newBooking.id,
          totalAmount: feeResult.totalAmount,
          discount: 0,
          actualAmount: feeResult.totalAmount,
          status: 'unpaid',
          createdAt: new Date(),
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
        if (bill.status !== 'unpaid') {
          return { success: false, error: '只有待付款账单可以修改优惠' };
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

        set((state) => ({
          bills: state.bills.map(b =>
            b.id === id
              ? { ...b, discount, discountType, discountValue, actualAmount }
              : b
          ),
        }));

        return { success: true };
      },

      payBill: (id, paymentMethod) => {
        set((state) => ({
          bills: state.bills.map((bill) =>
            bill.id === id
              ? { ...bill, status: 'paid' as const, paidAt: new Date(), paymentMethod }
              : bill
          ),
        }));
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
        });
      },
    }),
    {
      name: 'darkroom-app-storage',
    }
  )
);
