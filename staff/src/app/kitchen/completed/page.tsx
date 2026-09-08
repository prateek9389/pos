"use client";

import { useState, useEffect } from "react";
import { 
  Filter, 
  Calendar,
  ClipboardList,
  CheckCircle2,
  Clock,
  ShoppingBag,
  LayoutGrid,
  List,
  Utensils,
  Armchair,
  Timer,
  ConciergeBell,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { kitchenService } from "@/services/kitchenService";
import type { Order } from "@/services/cashierService";

export default function CompletedOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState<"Today" | "All Time">("Today");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  useEffect(() => {
    const unsubscribe = kitchenService.subscribeToOrders((updatedOrders) => {
      const filtered = updatedOrders.filter(o => o.orderStatus === "COMPLETED");
      let sorted = [...filtered].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

      setOrders(sorted);
    });
    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (filterDate === "Today") {
      const today = new Date().toDateString();
      if (new Date(o.updatedAt || o.createdAt).toDateString() !== today) return false;
    }
    
    if (filterPriority !== "All" && (o.priority || "Normal") !== filterPriority) return false;
    if (filterType !== "All" && o.orderType !== filterType) return false;

    return true;
  });

  const formatTime = (isoString: string) => {
    if (!isoString) return "--:--";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "--";
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
      


      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-[#5D34F5] transition-colors">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6 text-[#5D34F5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-slate-900 mb-1.5">Completed {filterDate}</span>
              <span className="text-[28px] font-black text-slate-900 leading-none">{filteredOrders.length}</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-emerald-500 transition-colors">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-slate-900 mb-1.5">On Time Delivery</span>
              <span className="text-[28px] font-black text-slate-900 leading-none">98%</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-orange-500 transition-colors">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-slate-900 mb-1.5">Avg. Prep Time</span>
              <span className="text-[28px] font-black text-slate-900 leading-none">18m</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-blue-500 transition-colors">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-slate-900 mb-1.5">Completed This Week</span>
              <span className="text-[28px] font-black text-slate-900 leading-none">156</span>
            </div>
          </div>
        </div>
      </div>

      {/* List Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <h2 className="text-[18px] font-black text-slate-900">Completed Orders</h2>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 border border-slate-200 bg-white shadow-sm font-bold text-slate-700 px-4 rounded-xl transition-colors hover:bg-slate-50">
              <Calendar className="w-4 h-4" /> {filterDate} <ChevronDown className="w-4 h-4 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-2">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFilterDate("Today")} className={`cursor-pointer font-medium text-[13px] rounded-lg ${filterDate === 'Today' ? 'bg-purple-50 text-purple-600' : ''}`}>Today</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterDate("All Time")} className={`cursor-pointer font-medium text-[13px] rounded-lg ${filterDate === 'All Time' ? 'bg-purple-50 text-purple-600' : ''}`}>All Time</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 border border-slate-200 bg-white shadow-sm font-bold text-slate-700 px-4 rounded-xl transition-colors hover:bg-slate-50">
              <Filter className="w-4 h-4 text-[#5D34F5]" /> Filter {(filterPriority !== 'All' || filterType !== 'All') && <span className="w-2 h-2 rounded-full bg-red-500"></span>} <ChevronDown className="w-4 h-4 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-2">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => setFilterPriority('All')} className={`cursor-pointer font-medium text-[13px] rounded-lg ${filterPriority === 'All' ? 'bg-purple-50 text-purple-600' : ''}`}>All Priorities</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('High')} className={`cursor-pointer font-medium text-[13px] rounded-lg text-orange-600 focus:bg-orange-50 ${filterPriority === 'High' ? 'bg-orange-50' : ''}`}>High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('Normal')} className={`cursor-pointer font-medium text-[13px] rounded-lg text-purple-600 focus:bg-purple-50 ${filterPriority === 'Normal' ? 'bg-purple-50' : ''}`}>Normal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('Low')} className={`cursor-pointer font-medium text-[13px] rounded-lg text-emerald-600 focus:bg-emerald-50 ${filterPriority === 'Low' ? 'bg-emerald-50' : ''}`}>Low</DropdownMenuItem>
              </DropdownMenuGroup>
              <div className="h-2"></div>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => setFilterType('All')} className={`cursor-pointer font-medium text-[13px] rounded-lg ${filterType === 'All' ? 'bg-purple-50 text-purple-600' : ''}`}>All Types</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('Dine In')} className={`cursor-pointer font-medium text-[13px] rounded-lg ${filterType === 'Dine In' ? 'bg-purple-50 text-purple-600' : ''}`}>Dine In</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('Takeaway')} className={`cursor-pointer font-medium text-[13px] rounded-lg ${filterType === 'Takeaway' ? 'bg-purple-50 text-purple-600' : ''}`}>Takeaway</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('Delivery')} className={`cursor-pointer font-medium text-[13px] rounded-lg ${filterType === 'Delivery' ? 'bg-purple-50 text-purple-600' : ''}`}>Delivery</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm h-10">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#5D34F5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#5D34F5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
        {filteredOrders.map((order, idx) => {
          const isTakeAway = order.orderType === 'Take Away' || order.orderType === 'Takeaway';

          if (viewMode === 'list') {
            return (
              <div key={order.orderId} className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center p-4 gap-4 border-l-[4px] border-l-[#5D34F5] hover:shadow-md transition-shadow duration-300">
                <div className="w-[150px] shrink-0">
                  <span className="text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-md inline-block mb-2 bg-purple-50 text-purple-600">
                    COMPLETED
                  </span>
                  <h3 className="text-lg font-black text-slate-900 leading-none">#{order.orderId}</h3>
                </div>
                
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-slate-500 mb-1">
                    {order.orderType} 
                    {order.tableId ? ` • Table ${order.tableId}` : ''} 
                    {order.guests ? ` • ${order.guests} Guest${order.guests > 1 ? 's' : ''}` : ''}
                  </p>
                  <p className="text-[12px] font-medium text-slate-400 line-clamp-1">
                    {order.items?.length || 0} items
                  </p>
                </div>
                
                <div className="w-[120px] shrink-0 text-center">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Time</p>
                  <p className="text-[13px] font-black text-[#5D34F5]">{formatTime(order.updatedAt || order.createdAt)}</p>
                  <p className="text-[10px] font-bold text-slate-400">{formatDate(order.updatedAt || order.createdAt)}</p>
                </div>

                <div className="w-[180px] shrink-0">
                  <div className="w-full h-10 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-500 gap-2 text-[13px] shadow-sm border border-slate-100 cursor-default">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Done
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={order.orderId} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-300 flex flex-col">
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-black text-slate-900 leading-tight mb-1">#{order.orderId}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black text-[#5D34F5] bg-purple-50 border border-purple-100">
                      {order.tableId || "T-00"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="flex items-center gap-1.5 text-[12px] font-black text-[#5D34F5] mb-0.5 justify-end">
                    <Clock className="w-3.5 h-3.5" /> {formatTime(order.updatedAt || order.createdAt)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {formatDate(order.updatedAt || order.createdAt)}
                  </span>
                </div>
              </div>

              {/* Order Meta */}
              <div className="flex items-center gap-4 mb-4 text-[12px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  {isTakeAway ? (
                    <ShoppingBag className="w-3.5 h-3.5 text-orange-400" /> 
                  ) : (
                    <Utensils className="w-3.5 h-3.5 text-[#5D34F5]" />
                  )}
                  {order.orderType}
                </span>
                {!isTakeAway && (
                  <>
                    <span className="text-slate-300">|</span> 
                    <span className="flex items-center gap-1.5">
                      <Armchair className="w-3.5 h-3.5 text-slate-400" /> Table {order.tableId || "N/A"}
                    </span>
                  </>
                )}
              </div>

              {/* Bottom Info Box */}
              <div className="mt-auto bg-emerald-50/50 rounded-xl p-3 flex justify-between items-center border border-emerald-100/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                  <div>
                    <span className="text-[16px] font-black text-slate-900 leading-none block">{order.items?.length || 0}</span>
                    <span className="text-[10px] font-bold text-slate-500">Items</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Timer className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[16px] font-black text-slate-900 leading-none block">{order.prepTime || 15} min</span>
                    <span className="text-[10px] font-bold text-slate-500">Prep Time</span>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Bottom Alert */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-sm shrink-0 mt-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-600 text-emerald-50" />
          <p className="text-[14px] font-bold text-emerald-700">Great work! All completed orders are recorded. Keep up the excellent service!</p>
        </div>
        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-emerald-100/50">
          <ConciergeBell className="w-5 h-5 text-emerald-500" />
        </div>
      </div>

    </div>
  );
}
