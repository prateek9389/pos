import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, orderBy, doc, updateDoc } from "firebase/firestore";

// --- Types ---

export type OrderType = "Dine In" | "Takeaway" | "Delivery";

export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export type PaymentMethod = "UPI" | "Card" | "Net Banking" | "Wallet" | "Cash";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
  image: string;
  desc?: string;
  available?: boolean;
  addons?: { name: string; price: number }[];
  sizes?: string[]; // e.g., ["Regular", "Medium", "Large"]
}

export interface OrderItem {
  id: string; // unique ID for this instance in cart
  menuItemId: string;
  name: string;
  price: number; // base price + addons
  quantity: number;
  isVeg: boolean;
  image: string;
  selectedSize?: string;
  selectedAddons?: { name: string; price: number }[];
  specialInstructions?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  lastOrder: string;
  totalSpent: number;
}

export interface Table {
  id: string;
  name: string; // e.g., "T-12"
  seats: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING";
  floor: "Ground Floor" | "First Floor";
  currentOrderId?: string;
  occupiedSince?: string;
  currentAmount?: number;
}

export interface Order {
  id?: string;
  orderId: string;
  restaurantId: string;
  branchId: string;
  cashierId: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | string;
  tableId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  guests?: number;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge?: number;
  deliveryCharge?: number;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | string;
  orderStatus: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' | string;
  priority?: "High" | "Normal" | "Low" | string;
  createdAt: number | string;
  updatedAt: number | string;
  isPrinted?: boolean;
}

// --- Session Helper ---
const getSession = () => {
  if (typeof window !== "undefined") {
    const sessionStr = localStorage.getItem("staffSession");
    if (sessionStr) {
      try { return JSON.parse(sessionStr); } catch (e) { return null; }
    }
  }
  return null;
};

// --- Services ---

export const cashierService = {
  getMenu: async (): Promise<MenuItem[]> => {
    const session = getSession();
    if (!session) return [];
    
    try {
      const q = query(collection(db, "menuItems"));
      const snapshot = await getDocs(q);
      const items: MenuItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.branchId || data.branchId === "global" || data.branchId === session.branchId) {
          items.push({ id: doc.id, ...data } as MenuItem);
        }
      });
      return items;
    } catch (error) {
      console.error("Error fetching menu:", error);
      return [];
    }
  },

  subscribeToMenu: (callback: (items: MenuItem[]) => void) => {
    const session = getSession();
    if (!session) {
      callback([]);
      return Promise.resolve(() => {});
    }

    const q = query(collection(db, "menuItems"));
    
    // @ts-ignore
    return import("firebase/firestore").then(({ onSnapshot }) => {
      return onSnapshot(q, (snapshot) => {
        const items: MenuItem[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (!data.branchId || data.branchId === "global" || data.branchId === session.branchId) {
            items.push({ id: doc.id, ...data } as MenuItem);
          }
        });
        callback(items);
      });
    });
  },

  addMenuItem: async (item: Omit<MenuItem, "id">): Promise<boolean> => {
    const session = getSession();
    if (!session) return false;
    try {
      await addDoc(collection(db, "menuItems"), {
        ...item,
        branchId: session.branchId || "global",
        restaurantId: session.restaurantId || "R-1"
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  getCategories: async (): Promise<string[]> => {
    const session = getSession();
    if (!session) return ["All"];

    try {
      const q = session.branchId
        ? query(collection(db, "menuCategories"), where("branchId", "in", [session.branchId, "global"]))
        : query(collection(db, "menuCategories"));
      
      const snapshot = await getDocs(q);
      const categories = ["All"];
      snapshot.forEach(doc => {
        categories.push(doc.data().name);
      });
      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return ["All"];
    }
  },
  
  getTables: async (): Promise<Table[]> => {
    const session = getSession();
    if (!session) return [];

    const q = query(
      collection(db, "tables"),
      where("branchId", "==", session.branchId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
  },

  subscribeToTables: async (callback: (tables: Table[]) => void) => {
    const session = getSession();
    if (!session) {
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, "tables"),
      where("branchId", "==", session.branchId)
    );

    const { onSnapshot } = await import("firebase/firestore");
    return onSnapshot(q, (snapshot) => {
      const items: Table[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Table);
      });
      callback(items);
    });
  },
  
  getOrders: async (): Promise<Order[]> => {
    const session = getSession();

    const q = session?.branchId
      ? query(collection(db, "orders"), where("branchId", "==", session.branchId))
      : query(collection(db, "orders"));
    const snap = await getDocs(q);
    const items = snap.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        total: Number(data.total ?? data.totalAmount ?? data.amount ?? 0),
        orderStatus: (data.orderStatus || data.status || "PENDING").toUpperCase(),
        orderType: data.orderType || data.type || "Dine In",
        customerName: data.customerName || (typeof data.customer === 'object' ? data.customer?.name : data.customer) || "Walk-in Guest",
        tableId: data.tableId || data.table || "Takeaway",
      } as Order;
    });
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  subscribeToOrders: async (callback: (orders: Order[]) => void) => {
    const session = getSession();

    const q = session?.branchId
      ? query(collection(db, "orders"), where("branchId", "==", session.branchId))
      : query(collection(db, "orders"));

    const { onSnapshot } = await import("firebase/firestore");
    return onSnapshot(q, (snapshot) => {
      const items: Order[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        items.push({ 
          id: doc.id, 
          ...data,
          total: Number(data.total ?? data.totalAmount ?? data.amount ?? 0),
          orderStatus: (data.orderStatus || data.status || "PENDING").toUpperCase(),
          orderType: data.orderType || data.type || "Dine In",
          customerName: data.customerName || (typeof data.customer === 'object' ? data.customer?.name : data.customer) || "Walk-in Guest",
          tableId: data.tableId || data.table || "Takeaway",
        } as Order);
      });
      // Manual sort to avoid index requirements
      const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(sorted);
    });
  },
  
  getCustomers: async (): Promise<Customer[]> => {
    const session = getSession();
    if (!session) return [];

    const q = query(
      collection(db, "customers"),
      where("branchId", "==", session.branchId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
  },

  addCustomer: async (customerData: Partial<Customer>): Promise<Customer> => {
    const session = getSession();
    if (!session) throw new Error("No active session");

    const newCustomer = {
      ...customerData,
      restaurantId: session.restaurantId,
      branchId: session.branchId,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().getTime(),
    };
    
    const docRef = await addDoc(collection(db, "customers"), newCustomer);
    return { ...newCustomer, id: docRef.id } as Customer;
  },
  
  placeOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const session = getSession();
    if (!session) throw new Error("No active session");

    const newOrder = {
      ...orderData,
      orderId: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      restaurantId: session.restaurantId,
      branchId: session.branchId,
      cashierId: session.id, // Using the staff ID from session
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      orderStatus: "PENDING",
      status: "Pending",
      paymentStatus: orderData.paymentStatus || "PENDING",
    } as Order;

    const docRef = await addDoc(collection(db, "orders"), newOrder);
    return { ...newOrder, id: docRef.id } as any; 
  },
  
  addTable: async (data: Partial<Table>): Promise<Table> => {
    const session = getSession();
    if (!session) throw new Error("No active session");

    const newTable = {
      ...data,
      restaurantId: session.restaurantId,
      branchId: session.branchId,
      status: "AVAILABLE",
    };
    const docRef = await addDoc(collection(db, "tables"), newTable);
    return { ...newTable, id: docRef.id } as Table;
  },

  updateOrderStatus: async (docId: string, status: string): Promise<boolean> => {
    try {
      let displayStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      if (status === "SENT_TO_KITCHEN") displayStatus = "Preparing";
      
      const updates: any = { 
        orderStatus: status, 
        status: displayStatus,
        updatedAt: new Date().getTime()
      };
      if (status.toUpperCase() === "COMPLETED") {
        updates.paymentStatus = "PAID";
        updates.payment = "PAID";
      }
      
      await updateDoc(doc(db, "orders", docId), updates);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  updateOrder: async (docId: string, orderData: Partial<Order>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "orders", docId), {
        ...orderData,
        updatedAt: new Date().getTime()
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
};
