"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  ChefHat,
  Bell,
  CheckCircle,
  ChevronDown,
  Calendar,
  Filter,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertTriangle,
  Info,
  Star,
  IndianRupee,
  ConciergeBell,
  UtensilsCrossed,
  ClipboardList,
  Flame,
  Loader2,
  Package,
  TrendingUp,
  Check
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface OrderItem {
  id?: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  price?: number;
  image?: string;
  isVeg?: boolean;
}

interface Order {
  id: string;
  orderId?: string;
  status?: string;
  orderStatus?: string;
  createdAt: number | string;
  updatedAt?: number | string;
  items?: OrderItem[];
  tableId?: string;
  branchId?: string;
  total?: number;
}

interface Table {
  id: string;
  tableId?: string;
  name?: string;
  status: string;
  branchId?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  current: number;
  min: number;
  unit: string;
  branchId?: string;
  branchName?: string;
  image?: string;
  updatedAt?: number;
}

interface MenuItem {
  id: string;
  name: string;
  image?: string;
  prepTime?: number;
  category?: string;
}

export default function KitchenDashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTablesModalOpen, setIsTablesModalOpen] = useState(false);
  const { theme } = useTheme();

  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [session, setSession] = useState<any>(null);

  // Timeframe filter state: default is "all" for all-time real data
  const [timeframe, setTimeframe] = useState<"today" | "week" | "all">("all");

  const timeframeLabels: Record<string, string> = {
    today: "Today",
    week: "This Week",
    all: "All Time"
  };

  useEffect(() => {
    setIsMounted(true);
    const sessionStr = localStorage.getItem("staffSession");
    let currentBranchId = "";
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        setSession(parsed);
        currentBranchId = parsed.branchId || "";
      } catch (e) {
        console.error("Error parsing session", e);
      }
    }

    // 1. Subscribe to Orders (listen to orders and filter by branch in memory for resilience)
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      let fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: typeof data.createdAt === "number" ? data.createdAt : Number(data.createdAt || Date.now()),
          updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Number(data.updatedAt || data.createdAt || Date.now()),
        } as Order;
      });

      // If currentBranchId matches orders, prioritize them
      if (currentBranchId) {
        const branchOrders = fetchedOrders.filter(o => o.branchId === currentBranchId);
        if (branchOrders.length > 0) {
          fetchedOrders = branchOrders;
        }
      }

      // Sort in memory by createdAt descending
      fetchedOrders.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
      setOrders(fetchedOrders);
      setIsLoading(false);
    }, (err) => {
      console.error("Orders listener error:", err);
      setIsLoading(false);
    });

    // 2. Subscribe to Tables
    const qTables = currentBranchId
      ? query(collection(db, "tables"), where("branchId", "==", currentBranchId))
      : query(collection(db, "tables"));

    const unsubTables = onSnapshot(qTables, (snapshot) => {
      const fetchedTables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
      setTables(fetchedTables);
    }, (err) => {
      console.error("Tables listener error:", err);
    });

    // 3. Subscribe to Inventory
    const qInventory = query(collection(db, "inventory"));
    const unsubInventory = onSnapshot(qInventory, (snapshot) => {
      const fetchedInv: InventoryItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        fetchedInv.push({
          id: doc.id,
          name: data.name || data.item || "Unknown Item",
          category: data.category || "General",
          current: Number(data.current ?? data.currentStock ?? 0),
          min: Number(data.min ?? data.minStockLevel ?? 0),
          unit: data.unit || "units",
          branchId: data.branchId || "",
          branchName: data.branchName || "",
          image: data.image || "",
          updatedAt: data.updatedAt || Date.now()
        });
      });
      setInventory(fetchedInv);
    }, (err) => {
      console.error("Inventory listener error:", err);
    });

    // 4. Subscribe to Menu Items (for real dish images & fallback prep times)
    const qMenuItems = query(collection(db, "menuItems"));
    const unsubMenuItems = onSnapshot(qMenuItems, (snapshot) => {
      const fetchedMenu = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenuItems(fetchedMenu);
    }, (err) => {
      console.error("MenuItems listener error:", err);
    });

    return () => {
      unsubOrders();
      unsubTables();
      unsubInventory();
      unsubMenuItems();
    };
  }, []);

  // Filter orders according to selected timeframe
  const filteredOrders = useMemo(() => {
    if (timeframe === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startMs = startOfDay.getTime();
      return orders.filter(o => Number(o.createdAt || 0) >= startMs);
    } else if (timeframe === "week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const startMs = startOfWeek.getTime();
      return orders.filter(o => Number(o.createdAt || 0) >= startMs);
    }
    return orders;
  }, [orders, timeframe]);

  // Real Metric Calculations
  const activeTables = useMemo(() => {
    return tables.filter(t => {
      const st = (t.status || "").toLowerCase();
      return st === 'occupied' || st === 'dining';
    }).length;
  }, [tables]);

  const totalTables = tables.length || 6;
  const occupancyPercent = Math.min(100, Math.round((activeTables / totalTables) * 100));

  const pendingOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      const os = (o.orderStatus || "").toUpperCase();
      const s = (o.status || "").toLowerCase();
      return os === 'PENDING' || os === 'SENT_TO_KITCHEN' || s === 'pending' || s === 'sent to kitchen';
    });
  }, [filteredOrders]);

  const preparingOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      const os = (o.orderStatus || "").toUpperCase();
      const s = (o.status || "").toLowerCase();
      return os === 'PREPARING' || s === 'preparing';
    });
  }, [filteredOrders]);

  const readyOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      const os = (o.orderStatus || "").toUpperCase();
      const s = (o.status || "").toLowerCase();
      return os === 'READY' || s === 'ready';
    });
  }, [filteredOrders]);

  const completedOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      const os = (o.orderStatus || "").toUpperCase();
      const s = (o.status || "").toLowerCase();
      return os === 'COMPLETED' || s === 'completed';
    });
  }, [filteredOrders]);

  const pendingOrdersCount = pendingOrders.length;
  const preparingOrdersCount = preparingOrders.length;
  const readyOrdersCount = readyOrders.length;
  const completedOrdersCount = completedOrders.length;
  const totalOrders = filteredOrders.length;
  const completionRate = totalOrders > 0 ? Math.round((completedOrdersCount / totalOrders) * 100) : 0;

  // Real Sparklines based on real hourly data
  const generateRealSparkline = (orderList: Order[]) => {
    const buckets = Array(8).fill(0);
    orderList.forEach(o => {
      const d = new Date(Number(o.createdAt || 0));
      const h = d.getHours();
      // Bucket into 8 slots between 8 AM and 10 PM
      const idx = Math.min(7, Math.max(0, Math.floor((h - 8) / 2)));
      buckets[idx]++;
    });
    return buckets.map((count, i) => ({ value: count }));
  };

  const sparklineActiveTables = useMemo(() => {
    const buckets = Array(8).fill(0);
    // Real distribution of tables occupied across time
    const activeWithTime = filteredOrders.filter(o => o.tableId);
    activeWithTime.forEach(o => {
      const d = new Date(Number(o.createdAt || 0));
      const idx = Math.min(7, Math.max(0, Math.floor((d.getHours() - 8) / 2)));
      buckets[idx]++;
    });
    if (activeWithTime.length === 0 && activeTables > 0) {
      return Array(8).fill({ value: activeTables });
    }
    return buckets.map(v => ({ value: v }));
  }, [filteredOrders, activeTables]);

  const sparklinePending = useMemo(() => generateRealSparkline(pendingOrders), [pendingOrders]);
  const sparklinePreparing = useMemo(() => generateRealSparkline(preparingOrders), [preparingOrders]);
  const sparklineReady = useMemo(() => generateRealSparkline(readyOrders), [readyOrders]);
  const sparklineCompleted = useMemo(() => generateRealSparkline(completedOrders), [completedOrders]);

  // Real Order Trends Calculation (Hourly for today, Daily for week/all)
  const orderTrendsData = useMemo(() => {
    if (timeframe === "today") {
      // 8 Time slots: 8 AM, 10 AM, 12 PM, 2 PM, 4 PM, 6 PM, 8 PM, 10 PM
      const slots = [
        { label: "8 AM", startH: 0, endH: 10 },    // early morning + 8-10 AM
        { label: "10 AM", startH: 10, endH: 12 },  // 10-12 PM
        { label: "12 PM", startH: 12, endH: 14 },  // 12-2 PM
        { label: "2 PM", startH: 14, endH: 16 },   // 2-4 PM
        { label: "4 PM", startH: 16, endH: 18 },   // 4-6 PM
        { label: "6 PM", startH: 18, endH: 20 },   // 6-8 PM
        { label: "8 PM", startH: 20, endH: 22 },   // 8-10 PM
        { label: "10 PM", startH: 22, endH: 24 }   // 10 PM onwards
      ];

      return slots.map(slot => {
        let completed = 0;
        let overdue = 0;

        filteredOrders.forEach(order => {
          const ordTime = Number(order.createdAt || 0);
          const d = new Date(ordTime);
          const h = d.getHours();
          if (h >= slot.startH && h < slot.endH) {
            const isCompleted = (order.orderStatus || "").toUpperCase() === 'COMPLETED' || (order.status || "").toLowerCase() === 'completed';
            const updated = Number(order.updatedAt || ordTime);
            const prepMinutes = Math.round((updated - ordTime) / 60000);

            if (isCompleted) {
              completed++;
              if (prepMinutes > 20) overdue++;
            } else {
              const elapsedMin = Math.round((Date.now() - ordTime) / 60000);
              if (elapsedMin > 20) overdue++;
            }
          }
        });

        return { 
          time: slot.label, 
          completed, 
          overdue 
        };
      });
    } else {
      // Last 7 days with exact date boundaries
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayList: { label: string; startMs: number; endMs: number }[] = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const startMs = d.getTime();
        const endMs = startMs + 24 * 3600 * 1000;
        dayList.push({
          label: days[d.getDay()],
          startMs,
          endMs
        });
      }

      return dayList.map(day => {
        let completed = 0;
        let overdue = 0;

        filteredOrders.forEach(order => {
          const ordTime = Number(order.createdAt || 0);
          if (ordTime >= day.startMs && ordTime < day.endMs) {
            const isCompleted = (order.orderStatus || "").toUpperCase() === 'COMPLETED' || (order.status || "").toLowerCase() === 'completed';
            const prepMinutes = Math.round((Number(order.updatedAt || ordTime) - ordTime) / 60000);
            if (isCompleted) {
              completed++;
              if (prepMinutes > 20) overdue++;
            } else {
              const elapsed = Math.round((Date.now() - ordTime) / 60000);
              if (elapsed > 20) overdue++;
            }
          }
        });

        return { 
          time: day.label, 
          completed, 
          overdue 
        };
      });
    }
  }, [filteredOrders, timeframe]);

  // Y-Axis Ticks with a uniform difference of 10 orders (0, 10, 20, 30, ...)
  const yTicks = useMemo(() => {
    const maxVal = Math.max(
      ...orderTrendsData.map(d => Math.max(d.completed || 0, d.overdue || 0)),
      0
    );
    const top = Math.max(30, Math.ceil(maxVal / 10) * 10);
    const ticks: number[] = [];
    for (let i = 0; i <= top; i += 10) {
      ticks.push(i);
    }
    return ticks;
  }, [orderTrendsData]);

  // Real Order Status Overview list
  const donutData = useMemo(() => {
    return [
      { name: 'Pending', value: pendingOrdersCount, color: '#F97316' },
      { name: 'Preparing', value: preparingOrdersCount, color: '#F59E0B' },
      { name: 'Ready', value: readyOrdersCount, color: '#10B981' },
      { name: 'Completed', value: completedOrdersCount, color: '#4F46E5' },
    ];
  }, [pendingOrdersCount, preparingOrdersCount, readyOrdersCount, completedOrdersCount]);

  // Real Top Dishes Calculation
  const topDishes = useMemo(() => {
    const itemMap: Record<string, { name: string; count: number; image?: string }> = {};
    let totalItemsSold = 0;

    filteredOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const qty = Number(item.quantity || 1);
          totalItemsSold += qty;
          if (!itemMap[item.name]) {
            // Check if image exists in item or menuItems
            const matchedMenu = menuItems.find(m => m.name.toLowerCase() === item.name.toLowerCase());
            itemMap[item.name] = {
              name: item.name,
              count: 0,
              image: item.image || matchedMenu?.image || ""
            };
          }
          itemMap[item.name].count += qty;
          if (!itemMap[item.name].image && item.image) {
            itemMap[item.name].image = item.image;
          }
        });
      }
    });

    const sorted = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return sorted.map((dish, index) => {
      const pct = totalItemsSold > 0 ? Math.round((dish.count / totalItemsSold) * 100) : 0;
      return {
        id: index + 1,
        name: dish.name,
        orders: dish.count,
        percent: `${Math.min(100, pct)}%`,
        image: dish.image
      };
    });
  }, [filteredOrders, menuItems]);

  // Real Average Preparation Time Calculation
  const avgPrepTimeData = useMemo(() => {
    const dishTimes: Record<string, number[]> = {};

    filteredOrders.forEach(order => {
      const created = Number(order.createdAt || 0);
      const updated = Number(order.updatedAt || created);
      const isCompleted = (order.orderStatus || "").toUpperCase() === 'COMPLETED' || (order.status || "").toLowerCase() === 'completed';
      const isPrep = (order.orderStatus || "").toUpperCase() === 'PREPARING' || (order.status || "").toLowerCase() === 'preparing';

      let durationMin = 0;
      if (isCompleted && updated > created) {
        durationMin = Math.round((updated - created) / 60000);
      } else if (isPrep) {
        durationMin = Math.max(1, Math.round((Date.now() - created) / 60000));
      }

      if (durationMin > 0 && durationMin <= 120 && order.items) {
        order.items.forEach(item => {
          if (!dishTimes[item.name]) dishTimes[item.name] = [];
          dishTimes[item.name].push(durationMin);
        });
      }
    });

    const entries = Object.entries(dishTimes).map(([name, times], index) => {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const iconList = [ChefHat, UtensilsCrossed, Flame];
      const colorList = ["bg-emerald-50", "bg-amber-50", "bg-rose-50", "bg-orange-50"];
      const textList = ["text-emerald-500", "text-amber-500", "text-rose-500", "text-orange-500"];

      // Benchmark is 15 minutes
      const diff = Math.abs(avg - 15);
      const isFaster = avg <= 15;

      return {
        id: index + 1,
        name,
        time: `${avg} min`,
        icon: iconList[index % iconList.length],
        trend: isFaster ? ("down" as const) : ("up" as const),
        val: `${diff}m`,
        color: colorList[index % colorList.length],
        text: textList[index % textList.length],
        trendColor: isFaster ? "text-emerald-500" : "text-rose-500"
      };
    });

    entries.sort((a, b) => parseInt(b.time) - parseInt(a.time));
    return entries.slice(0, 4);
  }, [filteredOrders]);

  // Real Kitchen Alerts (Low Stock from inventory collection)
  const lowStockAlerts = useMemo(() => {
    return inventory.filter(item => {
      // An item is low stock if current is less than or equal to min stock level
      return item.min > 0 && item.current <= item.min;
    }).sort((a, b) => (a.current / (a.min || 1)) - (b.current / (b.min || 1)));
  }, [inventory]);

  // Kitchen Status Dynamic Assessment
  const overdueCount = useMemo(() => {
    return orderTrendsData.reduce((acc, curr) => acc + curr.overdue, 0);
  }, [orderTrendsData]);

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 dark:border-[#1A1D27] rounded-full"></div>
          <Loader2 className="w-16 h-16 text-[#5D34F5] animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-slate-500 font-medium">Loading Kitchen Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 font-sans">

      {/* 5 Metric Cards - All Functional */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Active Tables - Functional: opens active tables overview */}
        <div 
          onClick={() => setIsTablesModalOpen(true)}
          title="Click to view Active Tables"
          className="group bg-white dark:bg-[#1A1D27] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#5D34F5] dark:hover:border-[#5D34F5]/50 transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-full bg-[#5D34F5] dark:bg-[#5D34F5]/10 flex items-center justify-center shrink-0 shadow-sm border border-transparent dark:border-[#5D34F5]/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6 text-white dark:text-[#A78BFA]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">Active Tables</span>
              <span className="text-[26px] font-black text-slate-900 dark:text-white leading-none">{activeTables}</span>
            </div>
          </div>
          <div className="hidden dark:block w-full h-[30px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineActiveTables}>
                <Line type="monotone" dataKey="value" stroke="#A78BFA" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Orders - Functional: navigates to Order Queue */}
        <div 
          onClick={() => router.push('/kitchen/order-queue')}
          title="Click to view Order Queue"
          className="group bg-white dark:bg-[#1A1D27] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#F97316] dark:hover:border-[#F97316]/50 transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-full bg-[#F97316] dark:bg-[#F97316]/10 flex items-center justify-center shrink-0 shadow-sm border border-transparent dark:border-[#F97316]/20 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-6 h-6 text-white dark:text-[#FDBA74]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">Pending Orders</span>
              <span className="text-[26px] font-black text-slate-900 dark:text-white leading-none mb-1">{pendingOrdersCount}</span>
              {pendingOrdersCount > 0 ? (
                <span className="flex items-center text-[12px] font-bold text-amber-500 whitespace-nowrap">
                  <ArrowUp className="w-3 h-3 mr-0.5" /> {pendingOrdersCount} awaiting chef
                </span>
              ) : (
                <span className="flex items-center text-[12px] font-bold text-emerald-500 whitespace-nowrap">
                  Queue is clear
                </span>
              )}
            </div>
          </div>
          <div className="hidden dark:block w-full h-[30px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklinePending}>
                <Line type="monotone" dataKey="value" stroke="#FDBA74" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Preparing - Functional: navigates to Preparing Station */}
        <div 
          onClick={() => router.push('/kitchen/preparing')}
          title="Click to view Preparing Orders"
          className="group bg-white dark:bg-[#1A1D27] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#F59E0B] dark:hover:border-[#F59E0B]/50 transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-full bg-[#F59E0B] dark:bg-[#F59E0B]/10 flex items-center justify-center shrink-0 shadow-sm border border-transparent dark:border-[#F59E0B]/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-6 h-6 text-white dark:text-[#FCD34D]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">Preparing</span>
              <span className="text-[26px] font-black text-slate-900 dark:text-white leading-none mb-1">{preparingOrdersCount}</span>
              <span className="text-[12px] font-bold text-amber-500 whitespace-nowrap">
                {preparingOrdersCount > 0 ? `${preparingOrdersCount} on stove/station` : "Station idle"}
              </span>
            </div>
          </div>
          <div className="hidden dark:block w-full h-[30px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklinePreparing}>
                <Line type="monotone" dataKey="value" stroke="#FCD34D" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ready Orders - Functional: navigates to Ready Orders */}
        <div 
          onClick={() => router.push('/kitchen/ready')}
          title="Click to view Ready Orders"
          className="group bg-white dark:bg-[#1A1D27] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#10B981] dark:hover:border-[#10B981]/50 transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-full bg-[#10B981] dark:bg-[#10B981]/10 flex items-center justify-center shrink-0 shadow-sm border border-transparent dark:border-[#10B981]/20 group-hover:scale-105 transition-transform">
              <CheckCircle className="w-6 h-6 text-white dark:text-[#6EE7B7]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">Ready Orders</span>
              <span className="text-[26px] font-black text-slate-900 dark:text-white leading-none mb-1">{readyOrdersCount}</span>
              <span className="text-[12px] font-bold text-emerald-500 whitespace-nowrap">
                {readyOrdersCount > 0 ? `${readyOrdersCount} ready to serve` : "All served"}
              </span>
            </div>
          </div>
          <div className="hidden dark:block w-full h-[30px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineReady}>
                <Line type="monotone" dataKey="value" stroke="#6EE7B7" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completed - Functional: navigates to Completed Orders */}
        <div 
          onClick={() => router.push('/kitchen/completed')}
          title="Click to view Completed Orders"
          className="group bg-white dark:bg-[#1A1D27] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#3B82F6] dark:hover:border-[#3B82F6]/50 transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-full bg-[#3B82F6] dark:bg-[#3B82F6]/10 flex items-center justify-center shrink-0 shadow-sm border border-transparent dark:border-[#3B82F6]/20 group-hover:scale-105 transition-transform">
              <ConciergeBell className="w-6 h-6 text-white dark:text-[#93C5FD]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                Completed ({timeframeLabels[timeframe]})
              </span>
              <span className="text-[26px] font-black text-slate-900 dark:text-white leading-none mb-1">{completedOrdersCount}</span>
              <span className="flex items-center text-[11px] font-bold text-emerald-500 whitespace-nowrap">
                <ArrowUp className="w-3 h-3 mr-0.5" /> {completionRate}% <span className="text-slate-400 dark:text-slate-500 ml-1">completion rate</span>
              </span>
            </div>
          </div>
          <div className="hidden dark:block w-full h-[30px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineCompleted}>
                <Line type="monotone" dataKey="value" stroke="#93C5FD" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Active Tables Overview Modal */}
      <Dialog open={isTablesModalOpen} onOpenChange={setIsTablesModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6 bg-white dark:bg-[#1A1D27] border-slate-100 dark:border-white/10">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-[#5D34F5]" />
              <span>Tables Overview</span>
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">
              Live dining table occupancy and current table status
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {tables.map(table => {
              const isOccupied = (table.status || "").toLowerCase() === 'occupied' || (table.status || "").toLowerCase() === 'dining';
              const isReserved = (table.status || "").toLowerCase() === 'reserved';
              return (
                <div 
                  key={table.id}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all flex flex-col justify-between",
                    isOccupied 
                      ? "bg-purple-50/60 dark:bg-[#5D34F5]/10 border-purple-200 dark:border-[#5D34F5]/30 shadow-sm" 
                      : isReserved
                      ? "bg-amber-50/60 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30"
                      : "bg-slate-50/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-base text-slate-900 dark:text-white">
                      {table.tableId || table.name || "Table"}
                    </span>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                      isOccupied ? "bg-[#5D34F5] text-white" : isReserved ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                    )}>
                      {table.status || "Available"}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 space-y-0.5">
                    <p>{(table as any).seats || 4} Seats • {(table as any).floorName || "Ground Floor"}</p>
                    {(table as any).customer && (
                      <p className="text-slate-900 dark:text-slate-200 truncate font-black">👤 {(table as any).customer}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {activeTables} of {tables.length} tables currently active
            </span>
            <Button 
              onClick={() => { setIsTablesModalOpen(false); router.push('/kitchen/order-queue'); }}
              className="bg-[#5D34F5] hover:bg-[#4D28D5] text-white font-bold rounded-xl text-xs px-4 cursor-pointer"
            >
              Go to Order Queue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Middle Section: Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Order Trends */}
        <div className="xl:col-span-2 group bg-white dark:bg-[#1A1D27] rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm p-6 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-[#5D34F5] dark:hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-8">
              <h2 className="text-[16px] font-black text-slate-900 dark:text-white">Order Trends</h2>
              <div className="hidden sm:flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5D34F5]"></div>
                  <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100">Completed Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div>
                  <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100">Overdue Orders (&gt;20m)</span>
                </div>
              </div>
            </div>

            {/* Timeframe selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 border border-slate-300 dark:border-white/10 px-4 py-1.5 rounded-full cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors outline-none font-bold text-slate-900 dark:text-slate-100">
                <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100">{timeframeLabels[timeframe]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setTimeframe("today")} className="cursor-pointer font-bold text-slate-900 dark:text-white">
                  Today {timeframe === "today" && <Check className="w-4 h-4 ml-auto text-[#5D34F5]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe("week")} className="cursor-pointer font-bold text-slate-900 dark:text-white">
                  This Week {timeframe === "week" && <Check className="w-4 h-4 ml-auto text-[#5D34F5]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe("all")} className="cursor-pointer font-bold text-slate-900 dark:text-white">
                  All Time {timeframe === "all" && <Check className="w-4 h-4 ml-auto text-[#5D34F5]" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orderTrendsData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5D34F5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5D34F5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#242838' : '#E2E8F0'} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: theme === 'dark' ? '#F8FAFC' : '#0F172A', fontSize: 12, fontWeight: 800 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  ticks={yTicks}
                  domain={[0, yTicks[yTicks.length - 1]]}
                  width={80}
                  dx={-5}
                  tick={{ fill: theme === 'dark' ? '#F8FAFC' : '#0F172A', fontSize: 12, fontWeight: 800 }}
                  tickFormatter={(val) => `${val} orders`}
                />
                <RechartsTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-[#1A1D27] p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 text-xs min-w-[150px]">
                          <p className="font-extrabold text-slate-900 dark:text-white mb-2">{label}</p>
                          <div className="flex items-center justify-between gap-4 text-[#5D34F5] font-bold mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#5D34F5]" />
                              <span>Completed</span>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white">{payload[0]?.value || 0} orders</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-[#EF4444] font-bold">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                              <span>Overdue (&gt;20m)</span>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white">{payload[1]?.value || 0} orders</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  name="Completed Orders" 
                  stroke="#5D34F5" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCompleted)" 
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#FFFFFF", fill: "#5D34F5" }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="overdue" 
                  name="Overdue Orders" 
                  stroke="#EF4444" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorOverdue)" 
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#FFFFFF", fill: "#EF4444" }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Overview */}
        <div className="group bg-white dark:bg-[#1A1D27] rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm p-6 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-[#5D34F5] dark:hover:border-white/20 transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-black text-slate-900 dark:text-white">Order Status Overview</h2>
            <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full">
              <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400">Total: {totalOrders}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 flex-1 justify-center">
            {donutData.map((item, i) => {
              const pct = totalOrders > 0 ? Math.round((item.value / totalOrders) * 100) : 0;
              return (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                      {item.name === 'Pending' && <ClipboardList className="w-5 h-5" />}
                      {item.name === 'Preparing' && <ChefHat className="w-5 h-5" />}
                      {item.name === 'Ready' && <CheckCircle className="w-5 h-5" />}
                      {item.name === 'Completed' && <ConciergeBell className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                      <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                        {pct}% of total
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[20px] font-black text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Section: 3 Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Dishes */}
        <div className="group bg-white dark:bg-[#1A1D27] rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl hover:border-[#5D34F5] dark:hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[16px] font-black text-slate-900 dark:text-white">
              Top Dishes <span className="text-[13px] font-bold text-slate-400 dark:text-slate-500 font-normal ml-1">(By Orders)</span>
            </h2>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 border border-slate-200 dark:border-white/10 px-4 py-1.5 rounded-full cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors outline-none">
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{timeframeLabels[timeframe]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setTimeframe("today")} className="cursor-pointer font-medium">
                  Today {timeframe === "today" && <Check className="w-4 h-4 ml-auto text-[#5D34F5]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe("week")} className="cursor-pointer font-medium">
                  This Week {timeframe === "week" && <Check className="w-4 h-4 ml-auto text-[#5D34F5]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe("all")} className="cursor-pointer font-medium">
                  All Time {timeframe === "all" && <Check className="w-4 h-4 ml-auto text-[#5D34F5]" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="space-y-6">
            {topDishes.length > 0 ? topDishes.map((dish) => (
              <div key={dish.id} className="flex items-center gap-4">
                <span className="text-[13px] font-black text-slate-400 w-2">{dish.id}</span>
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center justify-center relative">
                  {dish.image ? (
                    <Image 
                      src={dish.image} 
                      alt={dish.name} 
                      width={40} 
                      height={40} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <UtensilsCrossed className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-slate-900 dark:text-white truncate pr-4">{dish.name}</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">{dish.orders} orders</span>
                    <div className="w-12 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: dish.percent }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-6">
                <UtensilsCrossed className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-[13px] font-medium text-slate-500">No dishes ordered yet in this period.</p>
              </div>
            )}
          </div>
        </div>

        {/* Average Preparation Time */}
        <div className="group bg-white dark:bg-[#1A1D27] rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl hover:border-[#5D34F5] dark:hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[16px] font-black text-slate-900 dark:text-white">Average Preparation Time</h2>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 border border-slate-200 dark:border-white/10 px-4 py-1.5 rounded-full cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors outline-none">
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{timeframeLabels[timeframe]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setTimeframe("today")} className="cursor-pointer font-medium">
                  Today {timeframe === "today" && <Check className="w-4 h-4 ml-auto text-[#5D34F5]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe("week")} className="cursor-pointer font-medium">
                  This Week {timeframe === "week" && <Check className="w-4 h-4 ml-auto text-[#5D34F5]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe("all")} className="cursor-pointer font-medium">
                  All Time {timeframe === "all" && <Check className="w-4 h-4 ml-auto text-[#5D34F5]" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="space-y-6">
            {avgPrepTimeData.length > 0 ? avgPrepTimeData.map((dish) => (
              <div key={dish.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white dark:border-transparent shadow-sm transition-transform duration-300 group-hover:scale-110 ${dish.color} dark:bg-opacity-10`}>
                    <dish.icon className={`w-5 h-5 ${dish.text}`} />
                  </div>
                  <h4 className="text-[13px] font-bold text-slate-900 dark:text-white">{dish.name}</h4>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[13px] font-black text-slate-900 dark:text-white">{dish.time}</span>
                  <div className={`flex items-center w-12 ${dish.trendColor}`}>
                    {dish.trend === 'down' ? <ArrowDown className="w-3.5 h-3.5 mr-0.5" /> : <ArrowUp className="w-3.5 h-3.5 mr-0.5" />}
                    <span className="text-[12px] font-bold">{dish.val}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-[13px] font-medium text-slate-500">Not enough data to calculate prep time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Kitchen Alerts */}
        <div className="group bg-white dark:bg-[#1A1D27] rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl hover:border-[#5D34F5] dark:hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[16px] font-black text-slate-900 dark:text-white">Kitchen Alerts</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-[11px] font-bold">
              <span>{lowStockAlerts.length} Active</span>
            </div>
          </div>
          
          <div className="space-y-5">
            {lowStockAlerts.length > 0 ? lowStockAlerts.slice(0, 4).map((alert, idx) => (
              <div key={alert.id}>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0 border border-white dark:border-rose-500/20 shadow-sm mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-snug">
                        Low Stock: {alert.name}
                      </h4>
                    </div>
                    <p className="text-[12px] font-bold text-slate-400 mt-0.5 truncate">
                      Only {alert.current} {alert.unit} left (Min: {alert.min} {alert.unit})
                    </p>
                    {alert.branchName && (
                      <span className="text-[10px] font-semibold text-[#5D34F5] dark:text-[#A78BFA] block mt-0.5">
                        {alert.branchName}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-rose-500 whitespace-nowrap mt-1">
                    Restock
                  </span>
                </div>
                {idx !== Math.min(lowStockAlerts.length, 4) - 1 && <div className="w-full h-px bg-slate-50 dark:bg-white/5 my-5"></div>}
              </div>
            )) : (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-70" />
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-[12px] font-medium text-slate-500 mt-1">All kitchen ingredients and supplies are well-stocked.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Banner */}
      <div className="bg-[#F5F3FF] dark:bg-[#1A1D27] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden dark:border dark:border-white/5">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-[#5D34F5] flex items-center justify-center shrink-0 shadow-md">
            <Star className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-slate-900 dark:text-white mb-0.5">
              {overdueCount > 0 ? "Attention to Delayed Orders" : "Great Work Today!"}
            </h3>
            <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
              {overdueCount > 0 
                ? `You have ${overdueCount} order(s) taking longer than standard target preparation time.`
                : pendingOrdersCount > 0
                ? `${pendingOrdersCount} orders currently in kitchen queue awaiting preparation.`
                : `Your kitchen is running efficiently with ${completedOrdersCount} orders fulfilled.`
              }
            </p>
          </div>
        </div>
        
        <div className="hidden sm:block relative z-10 mr-4 mt-4 sm:mt-0">
          <div className="relative">
            <div className="text-[50px] drop-shadow-md relative z-10">👨‍🍳</div>
            <div className="absolute -right-4 -top-2 w-3 h-3 rounded-full bg-yellow-400 shadow-sm"></div>
            <div className="absolute -left-2 top-2 w-2 h-2 rounded-full bg-rose-400 shadow-sm"></div>
            <div className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm"></div>
          </div>
        </div>
      </div>

    </div>
  );
}
