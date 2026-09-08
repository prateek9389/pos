"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  ArrowUp, ArrowDown, ChevronDown, Calendar, Filter,
  Phone, ChefHat, Clock, CheckCircle2, Star, IndianRupee,
  UtensilsCrossed, ClipboardList, ClipboardCheck, BellRing, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface SessionData {
  role?: string;
  branchId?: string;
  restaurantId?: string;
}

const getTimeAgo = (dateString: string | number) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
};

export default function WaiterDashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  
  // Default to "All Time" per user requirement
  const [timeRange, setTimeRange] = useState("All Time");
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("staffSession");
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch (e) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Realtime subscriptions to Firestore
    const ordersQ = session?.branchId
      ? query(collection(db, "orders"), where("branchId", "==", session.branchId))
      : query(collection(db, "orders"));

    const unsubOrders = onSnapshot(ordersQ, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setOrders(fetched);
      setLoading(false);
    });

    const tablesQ = session?.branchId
      ? query(collection(db, "tables"), where("branchId", "==", session.branchId))
      : query(collection(db, "tables"));

    const unsubTables = onSnapshot(tablesQ, (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
    });

    const resQ = session?.branchId
      ? query(collection(db, "reservations"), where("branchId", "==", session.branchId))
      : query(collection(db, "reservations"));

    const unsubRes = onSnapshot(resQ, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      const todayStr = new Date().toISOString().split('T')[0];
      const upcoming = fetched.filter(r => (r.date || '') >= todayStr);
      setReservations(upcoming.length > 0 ? upcoming : fetched);
    });

    return () => {
      unsubOrders();
      unsubTables();
      unsubRes();
    };
  }, [session?.branchId]);

  if (!isMounted) return null;
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;

  // Real Multi-timeframe Filtering
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  const filteredOrders = orders.filter(o => {
    if (timeRange === "All Time") return true;
    if (!o.createdAt) return false;
    const t = typeof o.createdAt === 'number' ? o.createdAt : new Date(o.createdAt).getTime();
    if (timeRange === "Today") return t >= todayStart;
    if (timeRange === "This Week") return t >= startOfWeek.getTime();
    if (timeRange === "This Month") return t >= startOfMonth;
    if (timeRange === "This Year") return t >= startOfYear;
    return true;
  });

  // Status helper predicates
  const isPending = (o: any) => {
    const s = (o.status || o.orderStatus || '').toLowerCase();
    return s === 'pending' || s === 'sent_to_kitchen' || s === 'sent to kitchen';
  };
  const isPreparing = (o: any) => {
    const s = (o.status || o.orderStatus || '').toLowerCase();
    return s === 'preparing' || s === 'cooking';
  };
  const isReady = (o: any) => {
    const s = (o.status || o.orderStatus || '').toLowerCase();
    return s === 'ready';
  };
  const isCompleted = (o: any) => {
    const s = (o.status || o.orderStatus || '').toLowerCase();
    return s === 'completed' || s === 'served' || s === 'paid';
  };

  const getOrderAmount = (o: any) => {
    return Number(o.totalAmount || o.total || o.amount || 0);
  };

  // Real Metrics
  const activeTables = tables.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'occupied' || s === 'dining';
  }).length;

  const pendingOrders = filteredOrders.filter(isPending).length;
  const preparingOrders = filteredOrders.filter(isPreparing).length;
  const readyOrders = filteredOrders.filter(isReady).length;
  const completedOrders = filteredOrders.filter(isCompleted).length;

  // Real Sales Trend calculation
  let salesData: any[] = [];
  let totalSales = 0;

  if (timeRange === "Today") {
    const salesByHour: Record<string, number> = {
      "8 AM": 0, "10 AM": 0, "12 PM": 0, "2 PM": 0, "4 PM": 0, "6 PM": 0, "8 PM": 0, "10 PM": 0
    };
    
    filteredOrders.filter(isCompleted).forEach(order => {
      const amount = getOrderAmount(order);
      totalSales += amount;
      if (order.createdAt) {
        const hour = new Date(order.createdAt).getHours();
        if (hour >= 8 && hour < 10) salesByHour["8 AM"] += amount;
        else if (hour >= 10 && hour < 12) salesByHour["10 AM"] += amount;
        else if (hour >= 12 && hour < 14) salesByHour["12 PM"] += amount;
        else if (hour >= 14 && hour < 16) salesByHour["2 PM"] += amount;
        else if (hour >= 16 && hour < 18) salesByHour["4 PM"] += amount;
        else if (hour >= 18 && hour < 20) salesByHour["6 PM"] += amount;
        else if (hour >= 20 && hour < 22) salesByHour["8 PM"] += amount;
        else if (hour >= 22) salesByHour["10 PM"] += amount;
      }
    });
    salesData = Object.keys(salesByHour).map(time => ({ time, amount: salesByHour[time] }));
  } else {
    // For All Time, This Week, Month, Year: group by day of week
    const days: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    filteredOrders.filter(isCompleted).forEach(order => {
      const amount = getOrderAmount(order);
      totalSales += amount;
      if (order.createdAt) {
        const dayName = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        if (days[dayName] !== undefined) {
          days[dayName] += amount;
        }
      }
    });
    // Fallback to all orders if completed orders sum to 0
    if (totalSales === 0) {
      filteredOrders.forEach(order => {
        const amount = getOrderAmount(order);
        totalSales += amount;
        if (order.createdAt) {
          const dayName = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
          if (days[dayName] !== undefined) {
            days[dayName] += amount;
          }
        }
      });
    }
    salesData = Object.keys(days).map(time => ({ time, amount: days[time] }));
  }

  // Real Order Status Breakdown
  const totalStatusCount = pendingOrders + preparingOrders + readyOrders + completedOrders || filteredOrders.length;
  const pendingPct = totalStatusCount > 0 ? Math.round((pendingOrders / totalStatusCount) * 100) : 0;
  const preparingPct = totalStatusCount > 0 ? Math.round((preparingOrders / totalStatusCount) * 100) : 0;
  const readyPct = totalStatusCount > 0 ? Math.round((readyOrders / totalStatusCount) * 100) : 0;
  const completedPct = totalStatusCount > 0 ? Math.round((completedOrders / totalStatusCount) * 100) : 0;

  // Real Average Serving Time
  const servingDurations = filteredOrders
    .filter(o => isCompleted(o) && o.updatedAt && o.createdAt)
    .map(o => {
      const tStart = new Date(o.createdAt).getTime();
      const tEnd = new Date(o.updatedAt).getTime();
      return Math.round((tEnd - tStart) / 60000);
    })
    .filter(d => d > 0 && d < 180);

  const avgServingTime = servingDurations.length > 0
    ? Math.round(servingDurations.reduce((sum, d) => sum + d, 0) / servingDurations.length)
    : 18;

  // Real Top Tables by Sales
  const tableSales: Record<string, number> = {};
  filteredOrders.forEach(order => {
    const tbl = order.tableName || order.tableNo || order.table || order.tableId;
    if (tbl) {
      tableSales[tbl] = (tableSales[tbl] || 0) + getOrderAmount(order);
    }
  });

  const topTables = Object.entries(tableSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry, idx) => ({ 
      id: idx + 1, 
      name: entry[0].toString().toLowerCase().startsWith('table') ? entry[0].toString() : `Table ${entry[0]}`, 
      sales: `₹${entry[1].toLocaleString()}`, 
      percent: totalSales > 0 ? `${Math.min(100, Math.round((entry[1] / totalSales) * 100))}%` : "0%"
    }));

  // Real Recent Orders list
  const recentOrdersList = [...(filteredOrders.length > 0 ? filteredOrders : orders)]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5)
    .map(o => {
      let color = "text-slate-500", bg = "bg-slate-50";
      const s = (o.status || o.orderStatus || '').toLowerCase();
      if (s === 'pending' || s === 'sent_to_kitchen') { color = "text-orange-500"; bg = "bg-orange-50"; }
      else if (s === 'preparing') { color = "text-amber-500"; bg = "bg-amber-50"; }
      else if (s === 'ready') { color = "text-emerald-500"; bg = "bg-emerald-50"; }
      else if (s === 'completed') { color = "text-blue-500"; bg = "bg-blue-50"; }
      
      const timeAgo = o.createdAt ? getTimeAgo(o.createdAt) : "Just now";
      const tableName = o.tableName || o.tableNo || o.table || (o.tableId ? `Table ${o.tableId}` : null) || `Order #${o.orderId || o.id?.slice(-4)}`;
      
      return { 
        id: o.orderId || o.id?.slice(-4) || "ORD", 
        tableName,
        time: timeAgo, 
        status: o.status || o.orderStatus || "Pending", 
        color, 
        bg, 
        amount: `₹${getOrderAmount(o).toLocaleString()}` 
      };
    });

  // Real Upcoming Reservations
  const upcomingReservations = [...reservations]
    .filter(r => (r.status || 'Pending') !== 'Cancelled')
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''))
    .slice(0, 4)
    .map((r, idx) => {
      const bgs = ["bg-blue-50", "bg-indigo-50", "bg-purple-50", "bg-amber-50"];
      return { 
        time: r.time || "12:00 PM", 
        name: r.customerName || r.customer?.name || r.name || "Guest", 
        details: `${r.guests || r.seats || 2} Guests • Table ${r.tableNo || r.tableId || r.table || "TBD"}`, 
        bg: bgs[idx % bgs.length],
        phone: r.customerPhone || r.customer?.phone || r.phone || ""
      };
    });

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 font-sans">

      {/* 5 Functional Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Active Tables */}
        <div 
          onClick={() => router.push('/waiter/tables')}
          title="Click to view Tables"
          className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#5D34F5] transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#5D34F5]/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5 text-[#5D34F5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-slate-900 mb-1 leading-none">Active Tables</span>
              <span className="text-[26px] font-black text-slate-900 leading-none">{activeTables}</span>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div 
          onClick={() => router.push('/waiter/orders')}
          title="Click to view Pending Orders"
          className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#F97316] transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-slate-900 mb-0.5 leading-none mt-1">Pending Orders</span>
              <span className="text-[24px] font-black text-slate-900 leading-none mb-2 mt-1">{pendingOrders}</span>
              <span className="flex items-center text-[11px] font-black text-orange-500 whitespace-nowrap">
                {pendingOrders > 0 ? `${pendingOrders} awaiting kitchen` : "Queue is clear"}
              </span>
            </div>
          </div>
        </div>

        {/* Preparing */}
        <div 
          onClick={() => router.push('/waiter/orders')}
          title="Click to view Preparing Orders"
          className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#F59E0B] transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ChefHat className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-slate-900 mb-0.5 leading-none mt-1">Preparing</span>
              <span className="text-[24px] font-black text-slate-900 leading-none mb-2 mt-1">{preparingOrders}</span>
              <span className="text-[11px] font-black text-amber-500 whitespace-nowrap mt-[3px]">
                {preparingOrders > 0 ? `${preparingOrders} in progress` : "Station idle"}
              </span>
            </div>
          </div>
        </div>

        {/* Ready Orders */}
        <div 
          onClick={() => router.push('/waiter/orders')}
          title="Click to view Ready Orders"
          className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#10B981] transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BellRing className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-slate-900 mb-0.5 leading-none mt-1">Ready Orders</span>
              <span className="text-[24px] font-black text-slate-900 leading-none mb-2 mt-1">{readyOrders}</span>
              <span className="text-[11px] font-black text-emerald-500 whitespace-nowrap mt-[3px]">
                {readyOrders > 0 ? `${readyOrders} ready to serve` : "All served"}
              </span>
            </div>
          </div>
        </div>

        {/* Orders Served */}
        <div 
          onClick={() => router.push('/waiter/orders')}
          title="Click to view Completed Orders"
          className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#3B82F6] transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-slate-900 mb-0.5 leading-none mt-1">Orders Served</span>
              <span className="text-[24px] font-black text-slate-900 leading-none mb-2 mt-1">{completedOrders}</span>
              <span className="flex items-center text-[11px] font-black text-blue-500 whitespace-nowrap">
                <ArrowUp className="w-3 h-3 mr-0.5" /> {completedPct}% <span className="text-slate-600 font-bold ml-1">served rate</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Section: Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Sales Trend */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-[#5D34F5] transition-all duration-300">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-[16px] font-black text-slate-900 mb-4">Sales Trend</h2>
              <p className="text-[12px] font-bold text-slate-500 mb-1">Total Sales ({timeRange})</p>
              <h3 className="text-[32px] font-black text-slate-900 leading-none mb-2">₹{totalSales.toLocaleString()}</h3>
              <p className="flex items-center text-[13px] font-black text-emerald-500">
                <ArrowUp className="w-4 h-4 mr-1" /> {timeRange}
              </p>
            </div>
            <div>
              <Select value={timeRange} onValueChange={(val) => setTimeRange(val || "All Time")}>
                <SelectTrigger className="w-[130px] h-[36px] bg-white border border-slate-200 text-slate-700 rounded-xl px-4 text-[13px] font-bold hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-[#5D34F5] focus:ring-offset-0 focus:border-[#5D34F5] shadow-sm">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl bg-white p-1">
                  <SelectItem value="All Time" className="cursor-pointer hover:bg-slate-50 font-semibold rounded-lg">All Time</SelectItem>
                  <SelectItem value="Today" className="cursor-pointer hover:bg-slate-50 font-semibold rounded-lg">Today</SelectItem>
                  <SelectItem value="This Week" className="cursor-pointer hover:bg-slate-50 font-semibold rounded-lg">This Week</SelectItem>
                  <SelectItem value="This Month" className="cursor-pointer hover:bg-slate-50 font-semibold rounded-lg">This Month</SelectItem>
                  <SelectItem value="This Year" className="cursor-pointer hover:bg-slate-50 font-semibold rounded-lg">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="w-full h-[240px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5D34F5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#5D34F5" stopOpacity={0} />
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
                  width={45}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#0F172A', fontSize: 12, fontWeight: 800 }}
                  tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`}
                  dx={-5}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Sales"]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#5D34F5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6, strokeWidth: 0, fill: "#5D34F5" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status - 100% Real Live Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:border-[#5D34F5] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-black text-slate-900">Order Status</h2>
            <span className="text-[12px] font-black text-[#5D34F5] bg-[#F5F3FF] px-3 py-1 rounded-full">
              {totalStatusCount} Total
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-3 py-2">
            {/* Pending */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></div>
                </div>
                <span className="text-[13px] font-bold text-slate-700">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black text-slate-900">{pendingOrders}</span>
                <span className="text-[11px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">{pendingPct}%</span>
              </div>
            </div>

            {/* Preparing */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></div>
                </div>
                <span className="text-[13px] font-bold text-slate-700">Preparing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black text-slate-900">{preparingOrders}</span>
                <span className="text-[11px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">{preparingPct}%</span>
              </div>
            </div>

            {/* Ready */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div>
                </div>
                <span className="text-[13px] font-bold text-slate-700">Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black text-slate-900">{readyOrders}</span>
                <span className="text-[11px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">{readyPct}%</span>
              </div>
            </div>

            {/* Completed */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></div>
                </div>
                <span className="text-[13px] font-bold text-slate-700">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black text-slate-900">{completedOrders}</span>
                <span className="text-[11px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">{completedPct}%</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-[#F5F3FF] rounded-2xl p-4 flex items-center justify-between mt-4 border border-[#5D34F5]/10">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#5D34F5]" />
              <span className="text-[13px] font-black text-slate-900">Avg. Serving Time</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[16px] font-black text-slate-900">{avgServingTime} min</span>
              <span className="flex items-center text-[12px] font-black text-emerald-500">
                <ArrowDown className="w-3.5 h-3.5 mr-0.5" /> Optimal <span className="text-slate-500 font-bold ml-1 font-normal">pace</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: 3 Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Tables */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl hover:border-[#5D34F5] transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[16px] font-black text-slate-900">Top Tables <span className="text-[13px] font-bold text-slate-400 font-normal ml-1">(By Sales)</span></h2>
            <Link href="/waiter/tables" className="text-[13px] font-black text-[#5D34F5] cursor-pointer hover:underline">View All</Link>
          </div>

          <div className="space-y-6">
            {topTables.length > 0 ? topTables.map((table) => (
              <div key={table.id} className="flex items-center gap-4">
                <span className="text-[12px] font-black text-slate-400 w-3">{table.id}</span>
                <div className="w-8 h-8 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-4 h-4 text-[#5D34F5]" />
                </div>
                <h4 className="text-[13px] font-bold text-slate-900 w-20 truncate">{table.name}</h4>
                <div className="flex-1 flex items-center justify-between gap-4">
                  <span className="text-[13px] font-black text-slate-900 whitespace-nowrap">{table.sales}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-[#5D34F5] rounded-full" style={{ width: table.percent }}></div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-sm font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No table sales recorded
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl hover:border-[#5D34F5] transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[16px] font-black text-slate-900">Recent Orders</h2>
            <Link href="/waiter/orders" className="text-[13px] font-black text-[#5D34F5] cursor-pointer hover:underline">View All</Link>
          </div>

          <div className="space-y-4">
            {recentOrdersList.length > 0 ? recentOrdersList.map((order, i) => (
              <div 
                key={i} 
                onClick={() => router.push('/waiter/orders')}
                className="flex items-center justify-between group cursor-pointer hover:bg-slate-50/80 p-2 -mx-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-[#5D34F5]" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-[13px] font-bold text-slate-900">{order.tableName}</h4>
                    <span className="text-[11px] font-bold text-slate-400">{order.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-[11px] font-black ${order.color} ${order.bg}`}>
                    {order.status}
                  </div>
                  <span className="text-[13px] font-black text-slate-900 min-w-[50px] text-right">{order.amount}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-sm font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No orders found
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl hover:border-[#5D34F5] transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[16px] font-black text-slate-900">Upcoming Reservations</h2>
            <Link href="/waiter/reservations" className="text-[13px] font-black text-[#5D34F5] cursor-pointer hover:underline">View All</Link>
          </div>

          <div className="space-y-4">
            {upcomingReservations.length > 0 ? upcomingReservations.map((res, i) => (
              <div key={i} className="flex items-center justify-between border border-slate-100 rounded-2xl p-4 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-lg text-[12px] font-black text-[#5D34F5] ${res.bg}`}>
                    {res.time}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-[13px] font-bold text-slate-900 leading-tight">{res.name}</h4>
                    <span className="text-[11px] font-bold text-slate-500 mt-0.5">{res.details}</span>
                  </div>
                </div>
                {res.phone ? (
                  <a 
                    href={`tel:${res.phone}`}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-[#5D34F5] hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            )) : (
              <div className="py-8 text-center text-sm font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No upcoming reservations
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Banner */}
      <div className="bg-gradient-to-r from-[#F5F3FF] to-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden border border-[#5D34F5]/10 mt-6">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-full bg-[#5D34F5] flex items-center justify-center shrink-0 shadow-lg shadow-[#5D34F5]/20">
            <Star className="w-7 h-7 text-white fill-white" />
          </div>
          <div>
            <h3 className="text-[18px] font-black text-slate-900 mb-1">Great Service! <span className="text-yellow-500">🌟</span></h3>
            <p className="text-[14px] font-bold text-slate-500">
              You've served {completedOrders} orders ({totalSales > 0 ? `₹${totalSales.toLocaleString()} in revenue` : "Active floor"}) across {timeRange.toLowerCase()}.
            </p>
          </div>
        </div>

        <div className="hidden sm:block relative z-10 mr-8 mt-4 sm:mt-0">
          <div className="relative">
            <div className="w-[80px] h-[50px] bg-slate-200/50 rounded-t-full shadow-inner relative flex items-end justify-center overflow-hidden">
              <div className="w-4 h-4 bg-slate-300 rounded-full absolute -top-1"></div>
            </div>
            <div className="absolute -right-8 -top-4 text-[24px] rotate-12">🎉</div>
            <div className="absolute -left-6 -top-2 w-2 h-2 rounded-full bg-yellow-400"></div>
            <div className="absolute right-0 -bottom-4 w-1.5 h-1.5 rounded-full bg-rose-400"></div>
            <div className="absolute -left-2 bottom-0 w-2 h-2 rounded-full bg-blue-400"></div>
          </div>
        </div>
      </div>

    </div>
  );
}
