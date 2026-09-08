"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, IndianRupee, ShoppingBag, Users, Store, TrendingUp, AlertCircle, CalendarClock, UserMinus, Plus, MapPin, MenuSquare, BarChart3, Star, Building2, Package } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper functions for safe multi-schema order property resolution
const getOrderTimestamp = (data: any): number => {
  if (!data) return 0;
  if (typeof data.createdAt === "number") return data.createdAt;
  if (typeof data.createdAt?.toMillis === "function") return data.createdAt.toMillis();
  if (typeof data.createdAt?.toDate === "function") return data.createdAt.toDate().getTime();
  if (typeof data.createdAt?.seconds === "number") return data.createdAt.seconds * 1000;
  if (typeof data.createdAt === "string") {
    const p = new Date(data.createdAt).getTime();
    if (!isNaN(p)) return p;
  }
  if (data.date) {
    const timeStr = data.time || "";
    const p = new Date(`${data.date} ${timeStr}`.trim()).getTime();
    if (!isNaN(p)) return p;
  }
  return 0;
};

const getOrderAmount = (data: any): number => {
  const val = data.totalAmount ?? data.total ?? data.amount ?? 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const isOrderCancelled = (data: any): boolean => {
  const st = (data.status || data.orderStatus || "").trim().toLowerCase();
  return st === "cancelled";
};

const isOrderPending = (data: any): boolean => {
  const st = (data.status || data.orderStatus || "").trim().toLowerCase();
  return st === "pending" || st === "preparing" || st === "sent to kitchen" || st === "sent_to_kitchen" || st === "bill_requested";
};

export default function Dashboard() {
  const router = useRouter();

  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [activeBranches, setActiveBranches] = useState(0);
  const [topBranches, setTopBranches] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [reservationsCount, setReservationsCount] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "month" | "all">("7d");

  useEffect(() => {
    // 1. Live Orders Listener
    const qOrders = query(collection(db, "orders"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrdersList(items);
    });

    // 2. Live Customers Listener
    const unsubCustomers = onSnapshot(collection(db, "customers"), (snapshot) => {
      setTotalCustomers(snapshot.size);
    });

    // 3. Live Branches Listener
    const unsubBranches = onSnapshot(collection(db, "branches"), (snapshot) => {
      let activeCount = 0;
      snapshot.forEach(doc => {
        const st = (doc.data().status || "").trim().toLowerCase();
        if (st !== "inactive") activeCount++;
      });
      setActiveBranches(activeCount);
    });

    // 4. Live Inventory Listener (Real low-stock calculation)
    const unsubInventory = onSnapshot(collection(db, "inventory"), (snapshot) => {
      let lowStock = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        const cur = Number(data.current ?? data.quantity ?? 0);
        const min = Number(data.min ?? data.minStock ?? 0);
        if (cur <= min) lowStock++;
      });
      setLowStockCount(lowStock);
    });

    // 5. Live Reservations Listener (Confirmed, Pending, Upcoming)
    const unsubReservations = onSnapshot(collection(db, "reservations"), (snapshot) => {
      let activeRes = 0;
      snapshot.forEach(doc => {
        const st = (doc.data().status || "").trim().toLowerCase();
        if (st === "confirmed" || st === "upcoming" || st === "pending") activeRes++;
      });
      setReservationsCount(activeRes);
    });

    // 6. Live Staff Listener
    const unsubStaff = onSnapshot(collection(db, "staff"), (snapshot) => {
      setTotalStaff(snapshot.size);
    });

    return () => {
      unsubOrders();
      unsubCustomers();
      unsubBranches();
      unsubInventory();
      unsubReservations();
      unsubStaff();
    };
  }, []);

  // Top Performing Branches based on real order amounts
  useEffect(() => {
    const fetchTopBranches = async () => {
      try {
        const bSnap = await getDocs(collection(db, "branches"));
        const branchRev: { [key: string]: number } = {};
        ordersList.forEach(o => {
          if (!isOrderCancelled(o)) {
            const bId = o.branchId || o.branch || "Unknown";
            branchRev[bId] = (branchRev[bId] || 0) + getOrderAmount(o);
          }
        });

        const list = bSnap.docs.map(d => {
          const data = d.data();
          const id = d.id;
          const rev = branchRev[id] || branchRev[data.name] || 0;
          return {
            id,
            name: data.name || id,
            numericRevenue: rev,
            revenue: `₹${rev.toLocaleString()}`,
            img: data.img || data.image || "https://images.unsplash.com/photo-1546146830-2cca9512c68e?w=100&h=100&fit=crop"
          };
        });

        list.sort((a, b) => b.numericRevenue - a.numericRevenue);
        setTopBranches(list);
      } catch (err) {
        console.error("Failed to load top branches:", err);
      }
    };

    fetchTopBranches();
  }, [ordersList]);

  // Real KPIs calculations
  const totalRevenue = useMemo(() => {
    return ordersList
      .filter(o => !isOrderCancelled(o))
      .reduce((sum, o) => sum + getOrderAmount(o), 0);
  }, [ordersList]);

  const totalOrders = ordersList.length;

  const pendingOrdersCount = useMemo(() => {
    return ordersList.filter(isOrderPending).length;
  }, [ordersList]);

  const todayRevenue = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return ordersList
      .filter(o => !isOrderCancelled(o) && getOrderTimestamp(o) >= todayStart)
      .reduce((sum, o) => sum + getOrderAmount(o), 0);
  }, [ordersList]);

  // Dynamic Revenue Chart Data
  const revenueData = useMemo(() => {
    const nonCancelled = ordersList.filter(o => !isOrderCancelled(o));

    if (timeRange === "7d") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const chartDataMap = new Map<string, number>();
      const chartLabels: string[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayStart);
        d.setDate(d.getDate() - i);
        const label = days[d.getDay()];
        chartDataMap.set(label, 0);
        chartLabels.push(label);
      }

      nonCancelled.forEach(order => {
        const time = getOrderTimestamp(order);
        if (time > 0) {
          const oDate = new Date(time);
          const orderDayStart = new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
          if (orderDayStart.getTime() >= sevenDaysAgo.getTime() && orderDayStart.getTime() <= todayStart.getTime()) {
            const label = days[orderDayStart.getDay()];
            if (chartDataMap.has(label)) {
              chartDataMap.set(label, (chartDataMap.get(label) || 0) + getOrderAmount(order));
            }
          }
        }
      });

      return chartLabels.map(name => ({ name, revenue: chartDataMap.get(name) || 0 }));
    }

    if (timeRange === "30d") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const buckets: { label: string; start: number; end: number; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const bStart = new Date(todayStart);
        bStart.setDate(bStart.getDate() - (i * 5 + 4));
        const bEnd = new Date(todayStart);
        bEnd.setDate(bEnd.getDate() - (i * 5));
        bEnd.setHours(23, 59, 59, 999);
        const label = `${bStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        buckets.push({ label, start: bStart.getTime(), end: bEnd.getTime(), revenue: 0 });
      }

      nonCancelled.forEach(order => {
        const time = getOrderTimestamp(order);
        if (time > 0) {
          const b = buckets.find(b => time >= b.start && time <= b.end);
          if (b) {
            b.revenue += getOrderAmount(order);
          }
        }
      });

      return buckets.map(b => ({ name: b.label, revenue: b.revenue }));
    }

    if (timeRange === "month") {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const buckets: { label: string; start: number; end: number; revenue: number }[] = [];
      for (let day = 1; day <= daysInMonth; day += 5) {
        const bStart = new Date(now.getFullYear(), now.getMonth(), day, 0, 0, 0);
        const endDay = Math.min(day + 4, daysInMonth);
        const bEnd = new Date(now.getFullYear(), now.getMonth(), endDay, 23, 59, 59, 999);
        const label = `${bStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        buckets.push({ label, start: bStart.getTime(), end: bEnd.getTime(), revenue: 0 });
      }

      nonCancelled.forEach(order => {
        const time = getOrderTimestamp(order);
        if (time > 0) {
          const b = buckets.find(b => time >= b.start && time <= b.end);
          if (b) {
            b.revenue += getOrderAmount(order);
          }
        }
      });

      return buckets.map(b => ({ name: b.label, revenue: b.revenue }));
    }

    // All Time (aggregated by month)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthMap = new Map<string, number>();
    months.forEach(m => monthMap.set(m, 0));

    nonCancelled.forEach(order => {
      const time = getOrderTimestamp(order);
      if (time > 0) {
        const m = months[new Date(time).getMonth()];
        monthMap.set(m, (monthMap.get(m) || 0) + getOrderAmount(order));
      }
    });

    return months.map(name => ({ name, revenue: monthMap.get(name) || 0 }));
  }, [ordersList, timeRange]);

  // Compute clean integer thousand ticks (0, 1k, 2k) for Y-Axis
  const yAxisConfig = useMemo(() => {
    const maxVal = Math.max(...revenueData.map(d => Number(d.revenue || 0)), 0);
    
    let step = 1000;
    if (maxVal > 25000) step = 5000;
    else if (maxVal > 10000) step = 2000;
    else step = 1000;

    const ceilMultiple = Math.ceil(Math.max(maxVal * 1.15, step * 2) / step) * step;
    const maxTick = Math.max(step * 2, ceilMultiple);
    const ticks: number[] = [];
    for (let t = 0; t <= maxTick; t += step) {
      ticks.push(t);
    }

    return { ticks, domain: [0, maxTick] as [number, number] };
  }, [revenueData]);

  return (
    <div className="space-y-5 pb-8">

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card 
          onClick={() => router.push('/payments')} 
          className="group cursor-pointer select-none rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white overflow-hidden hover:border-[#8B5CF6]/40 hover:shadow-[0_12px_30px_rgba(139,92,246,0.15)] hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-[40px] group-hover:bg-[#8B5CF6]/15 transition-colors"></div>
          <CardContent className="p-5 relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F3E8FF] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-purple-100">
                <IndianRupee className="w-7 h-7 text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-500 mb-1 group-hover:text-slate-700 transition-colors">Total Revenue</p>
                <h3 className="text-[26px] font-black text-slate-900 tracking-tight leading-none">₹{totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#8B5CF6] shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => router.push('/orders')} 
          className="group cursor-pointer select-none rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white overflow-hidden hover:border-[#0EA5E9]/40 hover:shadow-[0_12px_30px_rgba(14,165,233,0.15)] hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0EA5E9]/5 rounded-full blur-[40px] group-hover:bg-[#0EA5E9]/15 transition-colors"></div>
          <CardContent className="p-5 relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-sky-100">
                <ShoppingBag className="w-7 h-7 text-[#0EA5E9]" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-500 mb-1 group-hover:text-slate-700 transition-colors">Total Orders</p>
                <h3 className="text-[26px] font-black text-slate-900 tracking-tight leading-none">{totalOrders.toLocaleString()}</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#0EA5E9] shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => router.push('/customers')} 
          className="group cursor-pointer select-none rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white overflow-hidden hover:border-[#F97316]/40 hover:shadow-[0_12px_30px_rgba(249,115,22,0.15)] hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full blur-[40px] group-hover:bg-[#F97316]/15 transition-colors"></div>
          <CardContent className="p-5 relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FFEDD5] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-orange-100">
                <Users className="w-7 h-7 text-[#F97316]" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-500 mb-1 group-hover:text-slate-700 transition-colors">Total Customers</p>
                <h3 className="text-[26px] font-black text-slate-900 tracking-tight leading-none">{totalCustomers.toLocaleString()}</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#F97316] shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => router.push('/branches')} 
          className="group cursor-pointer select-none rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white overflow-hidden hover:border-[#8B5CF6]/40 hover:shadow-[0_12px_30px_rgba(139,92,246,0.15)] hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-[40px] group-hover:bg-[#8B5CF6]/15 transition-colors"></div>
          <CardContent className="p-5 relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F3E8FF] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-purple-100">
                <Store className="w-7 h-7 text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-500 mb-1 group-hover:text-slate-700 transition-colors">Active Branches</p>
                <h3 className="text-[26px] font-black text-slate-900 tracking-tight leading-none">{activeBranches.toLocaleString()}</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#8B5CF6] shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Chart & Top Branches (Shorter Compact Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Chart */}
        <Card className="col-span-1 lg:col-span-2 rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white flex flex-col p-1.5 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(124,58,237,0.1)] hover:-translate-y-1 hover:border-[#7C3AED]/30">
          <CardHeader className="flex flex-row items-center justify-between py-2.5 px-5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></div>
              <CardTitle className="text-[16px] font-black text-slate-800">Revenue Overview</CardTitle>
            </div>
            <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
              <SelectTrigger className="w-[130px] h-8 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-[12px] font-bold text-slate-700 shadow-none focus:ring-1 focus:ring-[#7C3AED]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-lg">
                <SelectItem value="7d" className="font-bold text-[12px] cursor-pointer">Last 7 Days</SelectItem>
                <SelectItem value="30d" className="font-bold text-[12px] cursor-pointer">Last 30 Days</SelectItem>
                <SelectItem value="month" className="font-bold text-[12px] cursor-pointer">This Month</SelectItem>
                <SelectItem value="all" className="font-bold text-[12px] cursor-pointer">All Time</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[175px] pb-2 px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }}
                  dy={8}
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
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }}
                  tickFormatter={(val) => {
                    if (val === 0) return '₹0';
                    if (val >= 1000) return `₹${val / 1000}k`;
                    return `₹${val}`;
                  }}
                  width={46}
                  dx={-5}
                />
                <Tooltip
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0F1021] text-white px-3 py-2 rounded-xl shadow-xl flex flex-col items-center">
                          <span className="text-[14px] font-bold">₹{Number(payload[0].value || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{payload[0].payload.name}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7C3AED"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#7C3AED' }}
                  activeDot={{ r: 7, strokeWidth: 0, fill: '#0F1021' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Branches (Shorter Matching Card) */}
        <Card className="col-span-1 rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white flex flex-col p-1.5 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(250,204,21,0.15)] hover:-translate-y-1 hover:border-yellow-400/40">
          <CardHeader className="py-2.5 px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-[16px] font-black text-slate-800">Top Performing Branches</CardTitle>
            <div className="w-7 h-7 rounded-full bg-yellow-50 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            </div>
          </CardHeader>
          <CardContent className="h-[175px] flex flex-col justify-between px-5 pb-2 pt-0">
            <div className="space-y-2">
              {topBranches.slice(0, 2).map((branch, index) => (
                <div key={branch.id} className="group flex items-center justify-between hover:bg-slate-50 px-2.5 py-1.5 -mx-2.5 rounded-xl transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                     <span className="text-slate-300 font-black text-xs w-3 group-hover:text-slate-400 transition-colors">{index + 1}.</span>
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                      <Image src={branch.img} alt={branch.name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <span className="font-bold text-[13px] text-slate-800 group-hover:text-slate-900 transition-colors truncate max-w-[150px]">{branch.name}</span>
                  </div>
                  <span className="font-black text-[13px] text-slate-900 group-hover:text-[#7C3AED] transition-colors shrink-0">{branch.revenue}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => router.push('/branches')} variant="ghost" className="w-full mt-1 rounded-xl font-bold text-[#7C3AED] bg-[#7C3AED]/5 hover:bg-[#7C3AED]/15 transition-all h-9 text-[12px] hover:scale-[1.01]">
              View All Branches <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Bottom Quick Stats (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">

        <Card 
          onClick={() => router.push('/orders?tab=pending')} 
          className="group cursor-pointer select-none rounded-[1.2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white hover:border-emerald-300 hover:shadow-[0_12px_25px_rgba(16,185,129,0.15)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
        >
          <CardContent className="p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[30px] group-hover:bg-emerald-500/15 transition-colors"></div>
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-[12.5px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors leading-tight">Pending Orders</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-[22px] font-black text-slate-900 leading-none">{pendingOrdersCount}</h3>
                </div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 relative z-10 shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => router.push('/inventory?filter=low-stock')} 
          className="group cursor-pointer select-none rounded-[1.2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white relative hover:border-orange-300 hover:shadow-[0_12px_25px_rgba(249,115,22,0.15)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
        >
          <CardContent className="p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-[30px] group-hover:bg-orange-500/15 transition-colors"></div>
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-[12.5px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors leading-tight">Low Stock</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-[22px] font-black text-slate-900 leading-none">{lowStockCount}</h3>
                </div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-orange-600 relative z-10 shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => router.push('/reservations')} 
          className="group cursor-pointer select-none rounded-[1.2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white hover:border-blue-300 hover:shadow-[0_12px_25px_rgba(59,130,246,0.15)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
        >
          <CardContent className="p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-[30px] group-hover:bg-blue-500/15 transition-colors"></div>
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-[12.5px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors leading-tight">Reservations</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-[22px] font-black text-slate-900 leading-none">{reservationsCount}</h3>
                </div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 relative z-10 shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => router.push('/staff')} 
          className="group cursor-pointer select-none rounded-[1.2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white hover:border-purple-300 hover:shadow-[0_12px_25px_rgba(139,92,246,0.15)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
        >
          <CardContent className="p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-[30px] group-hover:bg-purple-500/15 transition-colors"></div>
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-[#8B5CF6] shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-[12.5px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors leading-tight">Total Staff</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-[22px] font-black text-slate-900 leading-none">{totalStaff}</h3>
                </div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#8B5CF6] relative z-10 shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => router.push('/payments')} 
          className="group cursor-pointer select-none rounded-[1.2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white hover:border-emerald-300 hover:shadow-[0_12px_25px_rgba(16,185,129,0.15)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
        >
          <CardContent className="p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[30px] group-hover:bg-emerald-500/15 transition-colors"></div>
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-[12.5px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors leading-tight">Today's Revenue</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-[22px] font-black text-slate-900 leading-none">₹{todayRevenue >= 100000 ? (todayRevenue / 100000).toFixed(2) + 'L' : todayRevenue >= 1000 ? (todayRevenue / 1000).toFixed(1) + 'k' : todayRevenue}</h3>
                </div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 relative z-10 shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions Row */}
      <div className="mt-8">
        <h3 className="text-[16px] font-black text-slate-800 mb-5 px-1 flex items-center gap-2"><div className="w-2 h-5 rounded-full bg-[#7C3AED]"></div>Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div onClick={() => router.push('/restaurants')} className="relative overflow-hidden rounded-[1.5rem] bg-white border border-slate-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(139,92,246,0.12)] flex flex-col items-center justify-center gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-[20px] group-hover:bg-purple-500/10 transition-colors"></div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-sm border border-purple-100/50">
              <Store className="w-7 h-7" />
            </div>
            <span className="font-bold text-[14px] text-slate-700 group-hover:text-slate-900 relative z-10">Add Restaurant</span>
          </div>

          <div onClick={() => router.push('/branches')} className="relative overflow-hidden rounded-[1.5rem] bg-white border border-slate-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(59,130,246,0.12)] flex flex-col items-center justify-center gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-[20px] group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-sm border border-blue-100/50">
              <MapPin className="w-7 h-7" />
            </div>
            <span className="font-bold text-[14px] text-slate-700 group-hover:text-slate-900 relative z-10">Add Branch</span>
          </div>

          <div onClick={() => router.push('/staff')} className="relative overflow-hidden rounded-[1.5rem] bg-white border border-slate-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(249,115,22,0.12)] flex flex-col items-center justify-center gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-[20px] group-hover:bg-orange-500/10 transition-colors"></div>
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-sm border border-orange-100/50">
              <Users className="w-7 h-7" />
            </div>
            <span className="font-bold text-[14px] text-slate-700 group-hover:text-slate-900 relative z-10">Add Staff</span>
          </div>

          <div onClick={() => router.push('/menu')} className="relative overflow-hidden rounded-[1.5rem] bg-white border border-slate-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.12)] flex flex-col items-center justify-center gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[20px] group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-sm border border-emerald-100/50">
              <MenuSquare className="w-7 h-7" />
            </div>
            <span className="font-bold text-[14px] text-slate-700 group-hover:text-slate-900 relative z-10">Manage Menu</span>
          </div>
        </div>
      </div>

    </div>
  );
}
