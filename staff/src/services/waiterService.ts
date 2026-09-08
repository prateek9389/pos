import { cashierService } from "./cashierService";
import type { Order, OrderItem, MenuItem, Table, Customer } from "./cashierService";
import { realtimeBus } from "./realtimeMock";

// We'll reuse the types and mock data from cashierService for now
// to ensure consistency across the staff applications while they're mock-driven.

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  tableId?: string;
  status: "Confirmed" | "Seated" | "Cancelled";
}

const MOCK_RESERVATIONS: Reservation[] = [
  { id: "res1", customerName: "Rahul Mehta", phone: "9876543210", date: "2026-08-13", time: "19:30", guests: 4, tableId: "T-8", status: "Confirmed" },
  { id: "res2", customerName: "Priya Sharma", phone: "9876543211", date: "2026-08-13", time: "20:00", guests: 2, tableId: "T-5", status: "Confirmed" },
  { id: "res3", customerName: "Amit Verma", phone: "9876543212", date: "2026-08-13", time: "20:30", guests: 6, tableId: "T-11", status: "Confirmed" },
];

// Activity for the Waiter Dashboard
export interface WaiterActivity {
  ordersTaken: number;
  tablesServed: number;
  averageRating: number;
  tipsEarned: number;
}

const MOCK_ACTIVITY: WaiterActivity = {
  ordersTaken: 128,
  tablesServed: 24,
  averageRating: 4.8,
  tipsEarned: 1450,
};

export const waiterService = {
  getMenu: cashierService.getMenu,
  subscribeToMenu: cashierService.subscribeToMenu,
  addMenuItem: cashierService.addMenuItem,
  getCategories: cashierService.getCategories,
  getTables: cashierService.getTables,
  subscribeToTables: cashierService.subscribeToTables,
  addTable: cashierService.addTable,
  getOrders: cashierService.getOrders,
  getCustomers: cashierService.getCustomers,
  
  placeOrder: cashierService.placeOrder,
  
  getReservations: async (): Promise<Reservation[]> => {
    return [...MOCK_RESERVATIONS];
  },
  
  getWaiterActivity: async (): Promise<WaiterActivity> => {
    return { ...MOCK_ACTIVITY };
  },

  updateTableStatus: async (tableId: string, status: Table["status"]): Promise<void> => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await updateDoc(doc(db, "tables", tableId), { status, updatedAt: Date.now() });
    } catch (error) {
      console.error(`Error updating table ${tableId}:`, error);
    }
  },

  requestBill: async (orderId: string): Promise<void> => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await updateDoc(doc(db, "orders", orderId), { 
        orderStatus: "BILL_REQUESTED", 
        status: "Bill Requested",
        updatedAt: Date.now() 
      });
    } catch (error) {
      console.error(`Error requesting bill for order ${orderId}:`, error);
    }
  },
  
  addWalkInReservation: async (data: Partial<Reservation>): Promise<Reservation> => {
    const newRes: Reservation = {
      ...data,
      id: `res${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Confirmed",
    } as Reservation;
    console.log("Adding walk-in reservation:", newRes);
    return newRes;
  }
};
