"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Grid2X2,
  ChevronRight,
  Loader2,
  Receipt,
  UtensilsCrossed,
  ArrowUpRight,
  Clock,
  Sparkles
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Interfaces
interface OrderItem {
  name?: string;
  foodName?: string;
  title?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  image?: string;
  img?: string;
}

interface Order {
  id: string;
  orderId?: string;
  amount?: number | string;
  totalAmount?: number | string;
  total?: number | string;
  createdAt: any;
  status?: string;
  orderStatus?: string;
  payment?: string;
  paymentStatus?: string;
  customer?: { name?: string; phone?: string };
  customerName?: string;
  customerPhone?: string;
  phone?: string;
  userId?: string;
  table?: string;
  tableName?: string;
  tableNo?: string;
  tableId?: string;
  orderType?: string;
  type?: string;
  items?: OrderItem[];
}

interface Table {
  id: string;
  name?: string;
  tableId?: string;
  status?: string;
  seats?: number | string;
  floor?: string;
  floorName?: string;
}

// Helpers for safe multi-schema order property resolution
const getOrderTimestamp = (order: Order): number => {
  if (!order.createdAt) return 0;
  if (typeof order.createdAt === "number") return order.createdAt;
  if (typeof order.createdAt.toMillis === "function") return order.createdAt.toMillis();
  if (typeof order.createdAt.seconds === "number") return order.createdAt.seconds * 1000;
  if (typeof order.createdAt === "string") {
    const parsed = new Date(order.createdAt).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const getOrderAmount = (order: Order): number => {
  const val = order.totalAmount ?? order.total ?? order.amount ?? 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const getOrderStatus = (order: Order): string => {
  return (order.status || order.orderStatus || "Pending").trim().toUpperCase();
};

const getOrderTable = (order: Order): string => {
  const tbl = order.tableName || order.table || order.tableNo || order.tableId;
  if (tbl && tbl !== "Takeaway" && tbl !== "Delivery") {
    return tbl.toLowerCase().startsWith("table") ? tbl : `Table ${tbl}`;
  }
  return order.orderType || order.type || "Dine In";
};

const getOrderDisplayId = (order: Order): string => {
  if (order.orderId) return order.orderId.startsWith("#") ? order.orderId : `#${order.orderId}`;
  if (order.id) return `#${order.id.slice(-6).toUpperCase()}`;
  return "#ORDER";
};

const formatTimeAgo = (timestamp: number): string => {
  if (!timestamp) return "Just now";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function Dashboard() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<string>("All Time");
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [totalRegisteredCustomers, setTotalRegisteredCustomers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);

  // Subscribe in real-time to Firestore (Orders, Tables, Customers)
  useEffect(() => {
    const sessionStr = localStorage.getItem("staffSession");
    let unsubOrders = () => {};
    let unsubTables = () => {};
    let unsubCustomers = () => {};

    try {
      let branchId: string | undefined;
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        setSession(parsed);
        branchId = parsed.branchId;
      }

      // Query Orders without composite index requirement (avoids missing composite index error)
      const qOrders = branchId
        ? query(collection(db, "orders"), where("branchId", "==", branchId))
        : query(collection(db, "orders"));

      unsubOrders = onSnapshot(
        qOrders,
        (snapshot) => {
          const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
          // Sort descending by real timestamp in memory
          fetchedOrders.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
          setOrders(fetchedOrders);
          setIsLoading(false);
        },
        (err) => {
          console.error("Orders listener error:", err);
          setIsLoading(false);
        }
      );

      // Query Tables
      const qTables = branchId
        ? query(collection(db, "tables"), where("branchId", "==", branchId))
        : query(collection(db, "tables"));

      unsubTables = onSnapshot(
        qTables,
        (snapshot) => {
          const fetchedTables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
          setTables(fetchedTables);
        },
        (err) => {
          console.error("Tables listener error:", err);
        }
      );

      // Query Customers
      const qCustomers = query(collection(db, "customers"));
      unsubCustomers = onSnapshot(
        qCustomers,
        (snapshot) => {
          setTotalRegisteredCustomers(snapshot.size);
        },
        (err) => {
          console.error("Customers listener error:", err);
        }
      );

    } catch (e) {
      console.error("Error setting up dashboard listeners:", e);
      setIsLoading(false);
    }

    return () => {
      unsubOrders();
      unsubTables();
      unsubCustomers();
    };
  }, []);

  // Filter Orders by Time Range (Defaults to All Time / all days)
  const filteredOrders = useMemo(() => {
    if (timeRange === "All Time") {
      return orders;
    }

    const now = new Date();
    
    if (timeRange === "Today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      return orders.filter(o => getOrderTimestamp(o) >= startOfToday);
    }
    
    if (timeRange === "This Week") {
      const day = now.getDay();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0).getTime();
      return orders.filter(o => getOrderTimestamp(o) >= startOfWeek);
    }
    
    if (timeRange === "This Month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      return orders.filter(o => getOrderTimestamp(o) >= startOfMonth);
    }
    
    if (timeRange === "This Year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
      return orders.filter(o => getOrderTimestamp(o) >= startOfYear);
    }
    
    return orders;
  }, [orders, timeRange]);

  // Compute Real KPIs
  const isOrderPaidOrCompleted = (o: Order): boolean => {
    const st = getOrderStatus(o);
    const pay = (o.payment || o.paymentStatus || "").toUpperCase();
    return st === "COMPLETED" || pay === "PAID";
  };

  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter(isOrderPaidOrCompleted)
      .reduce((sum, o) => sum + getOrderAmount(o), 0);
  }, [filteredOrders]);

  const totalOrders = filteredOrders.length;

  const activeTables = useMemo(() => {
    return tables.filter(t => t.status?.toLowerCase() === "occupied").length;
  }, [tables]);

  const totalTables = tables.length;

  const uniqueCustomersInPeriod = useMemo(() => {
    const set = new Set<string>();
    filteredOrders.forEach(o => {
      const identifier = o.customer?.phone || o.customer?.name || o.customerPhone || o.customerName || o.phone || o.userId;
      if (identifier) set.add(identifier);
    });
    return set.size;
  }, [filteredOrders]);

  // Dynamic Revenue Breakdown for AreaChart
  const revenueData = useMemo(() => {
    const completed = filteredOrders.filter(isOrderPaidOrCompleted);

    if (timeRange === "All Time") {
      const sortedCompleted = [...completed].sort(
        (a, b) => getOrderTimestamp(a) - getOrderTimestamp(b)
      );

      const now = new Date();
      now.setHours(23, 59, 59, 999);

      let firstTimestamp = sortedCompleted.length > 0
        ? getOrderTimestamp(sortedCompleted[0])
        : Date.now() - 20 * 24 * 60 * 60 * 1000;

      if (!firstTimestamp || isNaN(firstTimestamp)) {
        firstTimestamp = Date.now() - 20 * 24 * 60 * 60 * 1000;
      }

      // Snap start date to a clean 5-day boundary before or on the first order
      const startDate = new Date(firstTimestamp);
      startDate.setHours(0, 0, 0, 0);
      const dayNum = startDate.getDate();
      const snapDay = Math.floor(dayNum / 5) * 5;
      if (snapDay === 0) {
        startDate.setDate(0);
        const prevLast = startDate.getDate();
        startDate.setDate(Math.floor(prevLast / 5) * 5);
      } else {
        startDate.setDate(snapDay);
      }

      const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
      const targetEndTime = Math.max(now.getTime(), startDate.getTime() + 4 * FIVE_DAYS_MS);

      // Generate slots with exactly 5 days gap
      const slots: { startTime: number; endTime: number; label: string; rangeLabel: string; revenue: number }[] = [];
      let cur = new Date(startDate);

      while (cur.getTime() <= targetEndTime || slots.length < 5) {
        const slotStart = new Date(cur);
        const slotEnd = new Date(cur);
        slotEnd.setDate(slotEnd.getDate() + 5);

        const label = slotStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const inclusiveEnd = new Date(slotEnd);
        inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
        const rangeLabel = `${label} - ${inclusiveEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

        slots.push({
          startTime: slotStart.getTime(),
          endTime: slotEnd.getTime(),
          label,
          rangeLabel,
          revenue: 0
        });

        cur = slotEnd;
        if (slots.length > 40) break;
      }

      // Aggregate completed orders into the corresponding 5-day slot
      sortedCompleted.forEach(o => {
        const t = getOrderTimestamp(o);
        if (!t) return;
        const amount = getOrderAmount(o);
        const match = slots.find(s => t >= s.startTime && t < s.endTime);
        if (match) {
          match.revenue += amount;
        } else if (slots.length > 0) {
          if (t < slots[0].startTime) {
            slots[0].revenue += amount;
          } else {
            slots[slots.length - 1].revenue += amount;
          }
        }
      });

      return slots.map(s => ({
        time: s.label,
        rangeLabel: s.rangeLabel,
        revenue: s.revenue
      }));
    }

    if (timeRange === "Today") {
      const slots = ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "8 PM", "10 PM"];
      const slotMap: Record<string, number> = {
        "8 AM": 0, "10 AM": 0, "12 PM": 0, "2 PM": 0, "4 PM": 0, "6 PM": 0, "8 PM": 0, "10 PM": 0
      };

      completed.forEach(o => {
        const t = getOrderTimestamp(o);
        const h = new Date(t).getHours();
        if (h < 10) slotMap["8 AM"] += getOrderAmount(o);
        else if (h < 12) slotMap["10 AM"] += getOrderAmount(o);
        else if (h < 14) slotMap["12 PM"] += getOrderAmount(o);
        else if (h < 16) slotMap["2 PM"] += getOrderAmount(o);
        else if (h < 18) slotMap["4 PM"] += getOrderAmount(o);
        else if (h < 20) slotMap["6 PM"] += getOrderAmount(o);
        else if (h < 22) slotMap["8 PM"] += getOrderAmount(o);
        else slotMap["10 PM"] += getOrderAmount(o);
      });

      return slots.map(time => ({ time, revenue: slotMap[time] }));
    }

    if (timeRange === "This Week") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayMap: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
      completed.forEach(o => {
        const t = getOrderTimestamp(o);
        const d = new Date(t).toLocaleDateString("en-US", { weekday: "short" });
        if (dayMap[d] !== undefined) {
          dayMap[d] += getOrderAmount(o);
        }
      });
      return days.map(time => ({ time, revenue: dayMap[time] }));
    }

    if (timeRange === "This Month") {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthName = now.toLocaleDateString("en-US", { month: "short" });

      const slots: { startTime: number; endTime: number; label: string; rangeLabel: string; revenue: number }[] = [];
      for (let day = 1; day <= daysInMonth; day += 5) {
        const endDay = Math.min(day + 4, daysInMonth);
        const startD = new Date(year, month, day, 0, 0, 0, 0);
        const endD = new Date(year, month, endDay, 23, 59, 59, 999);
        slots.push({
          startTime: startD.getTime(),
          endTime: endD.getTime(),
          label: `${monthName} ${day}`,
          rangeLabel: `${monthName} ${day} - ${monthName} ${endDay}`,
          revenue: 0
        });
      }

      completed.forEach(o => {
        const t = getOrderTimestamp(o);
        if (!t) return;
        const amount = getOrderAmount(o);
        const match = slots.find(s => t >= s.startTime && t <= s.endTime);
        if (match) match.revenue += amount;
      });

      return slots.map(s => ({
        time: s.label,
        rangeLabel: s.rangeLabel,
        revenue: s.revenue
      }));
    }

    if (timeRange === "This Year") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthMap: Record<string, number> = {
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
        Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
      };
      completed.forEach(o => {
        const t = getOrderTimestamp(o);
        const m = new Date(t).toLocaleDateString("en-US", { month: "short" });
        if (monthMap[m] !== undefined) {
          monthMap[m] += getOrderAmount(o);
        }
      });
      return months.map(time => ({ time, revenue: monthMap[time] }));
    }

    return [];
  }, [filteredOrders, timeRange]);

  // Order Status Distribution
  const orderStatusData = useMemo(() => {
    const total = filteredOrders.length;
    const completedCount = filteredOrders.filter(o => getOrderStatus(o) === "COMPLETED").length;
    const readyCount = filteredOrders.filter(o => getOrderStatus(o) === "READY").length;
    const preparingCount = filteredOrders.filter(o => getOrderStatus(o) === "PREPARING").length;
    const pendingCount = filteredOrders.filter(o => {
      const s = getOrderStatus(o);
      return s === "PENDING" || s === "BILL_REQUESTED";
    }).length;
    const cancelledCount = filteredOrders.filter(o => getOrderStatus(o) === "CANCELLED").length;

    const calcPercent = (count: number) => total === 0 ? "0%" : `${((count / total) * 100).toFixed(0)}%`;

    return [
      { name: "Completed", value: completedCount, percentage: calcPercent(completedCount), color: "#10B981" },
      { name: "Ready", value: readyCount, percentage: calcPercent(readyCount), color: "#06B6D4" },
      { name: "Preparing", value: preparingCount, percentage: calcPercent(preparingCount), color: "#3B82F6" },
      { name: "Pending", value: pendingCount, percentage: calcPercent(pendingCount), color: "#F59E0B" },
      { name: "Cancelled", value: cancelledCount, percentage: calcPercent(cancelledCount), color: "#EF4444" },
    ];
  }, [filteredOrders]);

  // Top Selling Items aggregated from real order items
  const topSellingData = useMemo(() => {
    const itemMap = new Map<string, { count: number; image: string; revenue: number }>();
    
    // Check filtered orders first; if empty, use all orders so top sellers are always meaningful
    const dataset = filteredOrders.some(o => o.items && o.items.length > 0) ? filteredOrders : orders;

    dataset.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const name = (item.name || item.foodName || item.title || "Menu Item").trim();
          const qty = Number(item.quantity || item.qty || 1);
          const price = Number(item.price || 0);
          const img = item.image || item.img || "https://images.unsplash.com/photo-1546146830-2cca9512c68e?w=120";

          if (!itemMap.has(name)) {
            itemMap.set(name, { count: 0, image: img, revenue: 0 });
          }
          const entry = itemMap.get(name)!;
          entry.count += qty;
          entry.revenue += qty * price;
          if (img && !img.includes("unsplash")) {
            entry.image = img;
          }
        });
      }
    });

    return Array.from(itemMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data], idx) => ({
        rank: idx + 1,
        name,
        orders: data.count,
        revenue: data.revenue,
        image: data.image
      }));
  }, [filteredOrders, orders]);

  // Top 5 Recent Orders
  const recentOrdersData = useMemo(() => {
    return orders.slice(0, 5).map(o => {
      const st = getOrderStatus(o);
      let statusColor = "text-slate-600 bg-slate-50 border-slate-200";
      if (st === "COMPLETED") statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
      else if (st === "READY") statusColor = "text-cyan-700 bg-cyan-50 border-cyan-200";
      else if (st === "PREPARING") statusColor = "text-blue-700 bg-blue-50 border-blue-200";
      else if (st === "PENDING" || st === "BILL_REQUESTED") statusColor = "text-amber-700 bg-amber-50 border-amber-200";
      else if (st === "CANCELLED") statusColor = "text-red-700 bg-red-50 border-red-200";

      return {
        id: getOrderDisplayId(o),
        rawId: o.id,
        table: getOrderTable(o),
        status: st.charAt(0) + st.slice(1).toLowerCase(),
        statusColor,
        price: `₹${getOrderAmount(o).toLocaleString()}`,
        time: formatTimeAgo(getOrderTimestamp(o))
      };
    });
  }, [orders]);

  // Compute clean integer thousand ticks (e.g. 1k, 2k, 3k) for Y-Axis
  const yAxisConfig = useMemo(() => {
    const maxVal = Math.max(...revenueData.map(d => Number(d.revenue || 0)), 0);
    
    let step = 1000;
    if (maxVal > 25000) step = 5000;
    else if (maxVal > 10000) step = 2000;
    else step = 1000;

    const ceilMultiple = Math.ceil(Math.max(maxVal * 1.15, step * 3) / step) * step;
    const maxTick = Math.max(step * 3, ceilMultiple);
    const ticks: number[] = [];
    for (let t = 0; t <= maxTick; t += step) {
      ticks.push(t);
    }

    return { ticks, domain: [0, maxTick] as [number, number] };
  }, [revenueData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
        <p className="mt-4 text-slate-600 font-bold">Syncing live manager metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      
      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Card 1 - Revenue */}
        <Card 
          onClick={() => router.push('/manager/orders')} 
          className="p-6 rounded-[1.75rem] border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] bg-white flex flex-col justify-between hover:border-purple-200 hover:shadow-[0_8px_30px_rgba(124,58,237,0.08)] transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                <TrendingUp className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <div>
                <p className="text-[11px] font-black text-purple-600 uppercase tracking-widest">Revenue</p>
                <p className="text-[12px] font-bold text-slate-400">{timeRange}</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#7C3AED] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div>
            <h3 className="text-[30px] font-black text-slate-900 tracking-tight leading-none mb-1">
              ₹{totalRevenue.toLocaleString()}
            </h3>
            <p className="text-[12px] font-bold text-slate-400">
              {filteredOrders.filter(isOrderPaidOrCompleted).length} settled orders
            </p>
          </div>
        </Card>

        {/* Card 2 - Total Orders */}
        <Card 
          onClick={() => router.push('/manager/orders')} 
          className="p-6 rounded-[1.75rem] border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] bg-white flex flex-col justify-between hover:border-blue-200 hover:shadow-[0_8px_30px_rgba(59,130,246,0.08)] transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Total Orders</p>
                <p className="text-[12px] font-bold text-slate-400">{timeRange}</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div>
            <h3 className="text-[30px] font-black text-slate-900 tracking-tight leading-none mb-1">
              {totalOrders}
            </h3>
            <p className="text-[12px] font-bold text-slate-400">
              Across all tables & online orders
            </p>
          </div>
        </Card>

        {/* Card 3 - Active Tables */}
        <Card 
          onClick={() => router.push('/manager/tables')} 
          className="p-6 rounded-[1.75rem] border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] bg-white flex flex-col justify-between hover:border-amber-200 hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)] transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                <Grid2X2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Active Tables</p>
                <p className="text-[12px] font-bold text-slate-400">Floor Status</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div>
            <h3 className="text-[30px] font-black text-slate-900 tracking-tight leading-none mb-1 flex items-baseline gap-2">
              {activeTables} <span className="text-[18px] text-slate-400 font-bold">/ {totalTables}</span>
            </h3>
            <p className="text-[12px] font-bold text-slate-400">
              {totalTables > 0 ? `${Math.round((activeTables / totalTables) * 100)}% occupancy` : "Live floor plan"}
            </p>
          </div>
        </Card>

        {/* Card 4 - Unique Customers */}
        <Card 
          onClick={() => router.push('/manager/customers')} 
          className="p-6 rounded-[1.75rem] border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] bg-white flex flex-col justify-between hover:border-indigo-200 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Customers</p>
                <p className="text-[12px] font-bold text-slate-400">{timeRange}</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div>
            <h3 className="text-[30px] font-black text-slate-900 tracking-tight leading-none mb-1">
              {uniqueCustomersInPeriod || totalRegisteredCustomers}
            </h3>
            <p className="text-[12px] font-bold text-slate-400">
              {totalRegisteredCustomers} registered customers
            </p>
          </div>
        </Card>

      </div>

      {/* Main Content Row: Sales Overview & Order Status */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">

        {/* Sales Overview Area */}
        <Card className="p-7 border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] rounded-[2rem] bg-white flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[18px] font-black text-slate-900 tracking-tight">Sales Overview</h2>
                <p className="text-[12px] font-bold text-slate-400 mt-0.5">Real revenue performance for {timeRange.toLowerCase()}</p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[130px] h-9 bg-white border border-slate-200 text-slate-800 rounded-xl px-3 text-[13px] font-bold shadow-xs focus:ring-1 focus:ring-[#7C3AED]">
                    <SelectValue placeholder="Select Range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl bg-white p-1">
                    <SelectItem value="All Time" className="cursor-pointer font-bold rounded-lg">All Time</SelectItem>
                    <SelectItem value="Today" className="cursor-pointer font-semibold rounded-lg">Today</SelectItem>
                    <SelectItem value="This Week" className="cursor-pointer font-semibold rounded-lg">This Week</SelectItem>
                    <SelectItem value="This Month" className="cursor-pointer font-semibold rounded-lg">This Month</SelectItem>
                    <SelectItem value="This Year" className="cursor-pointer font-semibold rounded-lg">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-100">
                  <span className="text-[12px] font-bold text-slate-400">Total:</span>
                  <span className="text-[15px] font-black text-[#7C3AED]">₹{totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="h-[260px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#0F172A', fontSize: 12, fontWeight: 800 }}
                    dy={10}
                  />
                  <YAxis
                    type="number"
                    dataKey="revenue"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    domain={yAxisConfig.domain}
                    ticks={yAxisConfig.ticks}
                    interval={0}
                    tick={{ fill: '#0F172A', fontSize: 12, fontWeight: 800 }}
                    tickFormatter={(val) => {
                      if (val === 0) return '₹0';
                      if (val >= 1000) return `₹${val / 1000}k`;
                      return `₹${val}`;
                    }}
                    width={54}
                    dx={-5}
                  />
                  <Tooltip
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: '1px solid #E2E8F0', 
                      boxShadow: '0 8px 30px rgba(0,0,0,0.08)', 
                      fontWeight: 'bold',
                      fontSize: '13px',
                      color: '#0F172A'
                    }}
                    labelFormatter={(label, items) => {
                      const item = items?.[0]?.payload;
                      return item?.rangeLabel ? item.rangeLabel : label;
                    }}
                    formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#7C3AED"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#fff", stroke: "#7C3AED", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#7C3AED", stroke: "#fff", strokeWidth: 2 }}
                    fill="url(#colorRevenue)"
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Order Status Breakdown */}
        <Card className="p-7 border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] rounded-[2rem] bg-white flex flex-col justify-between">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-black text-slate-900 tracking-tight">Order Status</h2>
                <p className="text-[12px] font-bold text-slate-400 mt-0.5">Live distribution ({totalOrders} orders)</p>
              </div>
              <button 
                onClick={() => router.push("/manager/orders")} 
                className="text-[13px] font-black text-[#7C3AED] hover:text-purple-800 flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Status list */}
            <div className="flex-1 flex flex-col justify-around gap-2 mt-2">
              {orderStatusData.map((status) => (
                <div 
                  key={status.name} 
                  className="flex items-center w-full hover:bg-slate-50 p-2.5 rounded-xl transition-all"
                >
                  <div className="w-3 h-3 rounded-full mr-3 shadow-xs shrink-0" style={{ backgroundColor: status.color }}></div>
                  <span className="text-[14px] font-bold text-slate-700 flex-1">{status.name}</span>
                  <span className="text-[15px] font-black text-slate-900 w-12 text-right mr-3">{status.value}</span>
                  <span className="text-[12px] font-black text-slate-500 w-14 text-center bg-slate-100/80 rounded-lg py-1 px-2">
                    {status.percentage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

      </div>

      {/* 2 Bottom Rows: Top Selling Items & Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Top Selling Items */}
        <Card className="p-7 border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] rounded-[2rem] bg-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-slate-900 text-[17px]">Top Selling Items</h3>
              <p className="text-[12px] font-bold text-slate-400 mt-0.5">Derived from customer dish selections</p>
            </div>
            <button 
              onClick={() => router.push("/manager/menu")} 
              className="text-[13px] font-black text-[#7C3AED] hover:text-purple-800 transition-colors"
            >
              Menu <ChevronRight className="w-4 h-4 inline ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topSellingData.length > 0 ? (
              topSellingData.map((item) => (
                <div 
                  key={item.name} 
                  className="flex items-center justify-between hover:bg-slate-50 p-3 rounded-2xl transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center font-black text-[13px] shrink-0 border border-purple-100">
                      {item.rank}
                    </div>
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute("src", "https://images.unsplash.com/photo-1546146830-2cca9512c68e?w=120");
                        }}
                      />
                    </div>
                    <div className="truncate">
                      <h4 className="font-black text-slate-800 text-[14px] truncate">{item.name}</h4>
                      <p className="text-[12px] font-bold text-slate-400">₹{item.revenue.toLocaleString()} revenue</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-[14px] font-black text-slate-900">{item.orders}</span>
                    <span className="text-[12px] font-bold text-slate-400 block">orders</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[13px] text-slate-500 font-bold py-8 text-center bg-slate-50/50 rounded-2xl">
                No menu items recorded in this time period
              </div>
            )}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-7 border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] rounded-[2rem] bg-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-slate-900 text-[17px]">Recent Orders</h3>
              <p className="text-[12px] font-bold text-slate-400 mt-0.5">Latest real-time orders received</p>
            </div>
            <button 
              onClick={() => router.push("/manager/orders")} 
              className="text-[13px] font-black text-[#7C3AED] hover:text-purple-800 transition-colors"
            >
              All Orders <ChevronRight className="w-4 h-4 inline ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentOrdersData.length > 0 ? (
              recentOrdersData.map((order) => (
                <div 
                  key={order.rawId} 
                  onClick={() => router.push('/manager/orders')}
                  className="flex items-center justify-between hover:bg-slate-50 p-3 rounded-2xl transition-all border border-transparent hover:border-slate-100 cursor-pointer group"
                >
                  <div>
                    <div className="font-black text-slate-900 text-[14px] group-hover:text-[#7C3AED] transition-colors">
                      {order.id}
                    </div>
                    <div className="text-[12px] font-bold text-slate-500 mt-0.5">
                      {order.table}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-xl text-[12px] font-black border ${order.statusColor}`}>
                      {order.status}
                    </div>
                    <div className="text-right min-w-[70px]">
                      <div className="font-black text-slate-900 text-[14px]">{order.price}</div>
                      <div className="text-[11px] font-bold text-slate-400">{order.time}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[13px] text-slate-500 font-bold py-8 text-center bg-slate-50/50 rounded-2xl">
                No orders recorded yet
              </div>
            )}
          </div>
        </Card>

      </div>

    </div>
  );
}
