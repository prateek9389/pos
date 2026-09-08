import { cashierService, type Order, type MenuItem } from "./cashierService";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDocs, updateDoc, orderBy, limit } from "firebase/firestore";

const getSession = () => {
  if (typeof window !== "undefined") {
    const sessionStr = localStorage.getItem("staffSession");
    if (sessionStr) {
      try { return JSON.parse(sessionStr); } catch (e) { return null; }
    }
  }
  return null;
};

export const kitchenService = {
  getMenu: cashierService.getMenu,
  
  getOrders: async (): Promise<Order[]> => {
    const session = getSession();
    if (!session) return [];
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const qOrders = session?.branchId
      ? query(collection(db, "orders"), where("branchId", "==", session.branchId))
      : query(collection(db, "orders"));

    const snapshot = await getDocs(qOrders);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Order))
      .filter(o => {
        const t = typeof o.createdAt === "number" ? o.createdAt : new Date(o.createdAt).getTime();
        return t >= startOfDay.getTime();
      })
      .sort((a, b) => {
        const ta = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt).getTime();
        const tb = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt).getTime();
        return tb - ta;
      });
  },

  getOrder: async (orderId: string): Promise<Order | null> => {
    const qOrders = query(
      collection(db, "orders"),
      where("orderId", "==", orderId)
    );
    const snapshot = await getDocs(qOrders);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Order;
    }
    return null;
  },

  // Subscribes to real Firestore changes
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    const session = getSession();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const qOrders = session?.branchId
      ? query(collection(db, "orders"), where("branchId", "==", session.branchId))
      : query(collection(db, "orders"));

    return onSnapshot(qOrders, (snapshot) => {
      const fetchedOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .filter(o => {
          const t = typeof o.createdAt === "number" ? o.createdAt : new Date(o.createdAt).getTime();
          return t >= startOfDay.getTime();
        })
        .sort((a, b) => {
          const ta = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt).getTime();
          const tb = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt).getTime();
          return tb - ta;
        });
      callback(fetchedOrders);
    });
  },

  updateOrderStatus: async (orderId: string, status: Order["orderStatus"]): Promise<void> => {
    const qOrders = query(
      collection(db, "orders"),
      where("orderId", "==", orderId)
    );
    const snapshot = await getDocs(qOrders);
    if (!snapshot.empty) {
      const orderDoc = snapshot.docs[0];
      const superadminStatusMap: any = {
        "PENDING": "Pending",
        "SENT_TO_KITCHEN": "Sent to Kitchen",
        "PREPARING": "Preparing",
        "READY": "Ready",
        "COMPLETED": "Completed"
      };
      
      await updateDoc(orderDoc.ref, {
        orderStatus: status,
        status: superadminStatusMap[status] || "Pending",
        updatedAt: Date.now()
      });
      console.log(`Order ${orderId} status updated to ${status}`);
    } else {
      console.error(`Order ${orderId} not found in database.`);
    }
  }
};
