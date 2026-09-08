"use client";

import { useState, useEffect } from "react";
import { 
  Filter, 
  Clock, 
  AlertTriangle, 
  ChefHat, 
  ListOrdered, 
  LayoutGrid, 
  List, 
  ChevronDown,
  ChevronRight,
  ClipboardList, 
  Bell,
  Leaf,
  Flame,
  Snowflake,
  CupSoda,
  User,
  ArrowUp,
  Sparkles,
  X,
  CheckCircle2
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
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const getItemIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('veg') || lower.includes('salad')) return <Leaf className="w-3 h-3 text-emerald-500" />;
  if (lower.includes('peri') || lower.includes('spicy')) return <Flame className="w-3 h-3 text-red-500" />;
  if (lower.includes('cold') || lower.includes('ice')) return <Snowflake className="w-3 h-3 text-blue-500" />;
  if (lower.includes('coffee') || lower.includes('lemonade') || lower.includes('drink')) return <CupSoda className="w-3 h-3 text-sky-500" />;
  return <AlertTriangle className="w-3 h-3 text-orange-500" />;
};

const getItemIconBg = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('veg') || lower.includes('salad')) return 'bg-emerald-50 border-emerald-100';
  if (lower.includes('peri') || lower.includes('spicy')) return 'bg-red-50 border-red-100';
  if (lower.includes('cold') || lower.includes('ice')) return 'bg-blue-50 border-blue-100';
  if (lower.includes('coffee') || lower.includes('lemonade') || lower.includes('drink')) return 'bg-sky-50 border-sky-100';
  return 'bg-orange-50 border-orange-100';
};

export default function PreparingOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("All Preparing");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"eta_soonest" | "eta_latest">("eta_soonest");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");

  useEffect(() => {
    const unsubscribe = kitchenService.subscribeToOrders((updatedOrders) => {
      // Show PENDING and PREPARING for mock purposes to match the screenshot content
      const filtered = updatedOrders.filter(o => (o.orderStatus as any) === "PENDING" || o.orderStatus === "PREPARING");
      setOrders(filtered);
    });
    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (activeTab === "High Priority" && o.priority !== "High") return false;
    if (activeTab === "Normal" && o.priority !== "Normal" && o.priority !== undefined) return false;
    if (activeTab === "Low Priority" && o.priority !== "Low") return false;
    
    if (filterPriority !== "All" && (o.priority || "Normal") !== filterPriority) return false;
    if (filterType !== "All" && o.orderType !== filterType) return false;
    
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortBy === "eta_soonest" ? timeA - timeB : timeB - timeA;
  });

  const handleMarkReady = async (orderId: string) => {
    await kitchenService.updateOrderStatus(orderId, "READY");
    toast.success(`Order #${orderId} marked as Ready!`, {
      icon: '✅',
      style: { background: '#10b981', color: 'white', border: 'none' }
    });
  };

  const getETA = (createdAt: string | number, addMinutes = 15) => {
    const d = new Date(createdAt);
    d.setMinutes(d.getMinutes() + addMinutes);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatTime = (isoString: string | number) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 h-full flex flex-col max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 4 Interactive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: "All Preparing",
            title: "All Preparing",
            count: orders.length,
            subtitle: orders.length > 0 ? `${orders.length} on stove/station` : "Stations idle",
            icon: ChefHat,
            iconBg: "bg-[#F97316] dark:bg-[#F97316]/20",
            iconColor: "text-white dark:text-[#FDBA74]",
            activeBorder: "border-[#F97316] ring-2 ring-[#F97316]/25 shadow-lg shadow-[#F97316]/10 bg-orange-50/40 dark:bg-[#F97316]/10",
            badgeClass: "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40",
            activeBadgeClass: "bg-[#F97316] text-white",
            statusColor: orders.length > 0 ? "text-amber-500" : "text-slate-400",
          },
          {
            id: "High Priority",
            title: "High Priority",
            count: orders.filter(o => o.priority === 'High').length,
            subtitle: orders.filter(o => o.priority === 'High').length > 0 
              ? `${orders.filter(o => o.priority === 'High').length} rush attention` 
              : "No rush orders",
            icon: Flame,
            iconBg: "bg-[#EF4444] dark:bg-[#EF4444]/20",
            iconColor: "text-white dark:text-[#FCA5A5]",
            activeBorder: "border-[#EF4444] ring-2 ring-[#EF4444]/25 shadow-lg shadow-[#EF4444]/10 bg-red-50/40 dark:bg-[#EF4444]/10",
            badgeClass: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40",
            activeBadgeClass: "bg-[#EF4444] text-white",
            statusColor: orders.filter(o => o.priority === 'High').length > 0 ? "text-red-500" : "text-slate-400",
          },
          {
            id: "Normal",
            title: "Normal Priority",
            count: orders.filter(o => (o.priority || 'Normal') === 'Normal').length,
            subtitle: orders.filter(o => (o.priority || 'Normal') === 'Normal').length > 0 
              ? `${orders.filter(o => (o.priority || 'Normal') === 'Normal').length} cooking on pace` 
              : "None pending",
            icon: Clock,
            iconBg: "bg-[#7C3AED] dark:bg-[#7C3AED]/20",
            iconColor: "text-white dark:text-[#A78BFA]",
            activeBorder: "border-[#7C3AED] ring-2 ring-[#7C3AED]/25 shadow-lg shadow-[#7C3AED]/10 bg-purple-50/40 dark:bg-[#7C3AED]/10",
            badgeClass: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40",
            activeBadgeClass: "bg-[#7C3AED] text-white",
            statusColor: "text-purple-500",
          },
          {
            id: "Low Priority",
            title: "Low Priority",
            count: orders.filter(o => o.priority === 'Low').length,
            subtitle: orders.filter(o => o.priority === 'Low').length > 0 
              ? `${orders.filter(o => o.priority === 'Low').length} flexible queue` 
              : "None pending",
            icon: Leaf,
            iconBg: "bg-[#10B981] dark:bg-[#10B981]/20",
            iconColor: "text-white dark:text-[#6EE7B7]",
            activeBorder: "border-[#10B981] ring-2 ring-[#10B981]/25 shadow-lg shadow-[#10B981]/10 bg-emerald-50/40 dark:bg-[#10B981]/10",
            badgeClass: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40",
            activeBadgeClass: "bg-[#10B981] text-white",
            statusColor: "text-emerald-500",
          },
        ].map((card) => {
          const Icon = card.icon;
          const isActive = activeTab === card.id;

          return (
            <div
              key={card.id}
              onClick={() => setActiveTab(card.id)}
              className={cn(
                "group rounded-2xl border p-4 sm:p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none relative overflow-hidden",
                isActive
                  ? `${card.activeBorder} -translate-y-1`
                  : "bg-white dark:bg-[#1A1D27] border-slate-200/80 dark:border-white/5 shadow-sm hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md hover:-translate-y-1"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                  card.iconBg
                )}>
                  <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", card.iconColor)} />
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-black transition-colors shadow-2xs",
                  isActive ? card.activeBadgeClass : card.badgeClass
                )}>
                  {card.count}
                </span>
              </div>

              <div>
                <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block">
                  {card.title}
                </span>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[26px] sm:text-[28px] font-black text-slate-900 dark:text-white leading-none">
                    {card.count}
                  </span>
                  <span className={cn("text-[11px] sm:text-[12px] font-bold truncate", card.statusColor)}>
                    {card.subtitle}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid or List */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-max flex-1" : "flex flex-col gap-4 flex-1"}>
        {filteredOrders.map((order) => {
          
          let borderColor = "border-l-purple-600";
          let timeBg = "bg-purple-50";
          let timeText = "text-[#5D34F5]";
          let priorityText = "High Priority";
          let priorityColor = "text-red-500";
          let bottomBg = "bg-purple-50/50";
          
          if (order.priority === 'Normal') {
            borderColor = "border-l-orange-400";
            timeBg = "bg-orange-50";
            timeText = "text-orange-500";
            priorityText = "Normal Priority";
            priorityColor = "text-orange-500";
            bottomBg = "bg-orange-50/50";
          } else if (order.priority === 'Low') {
            borderColor = "border-l-emerald-500";
            timeBg = "bg-emerald-50";
            timeText = "text-emerald-600";
            priorityText = "Low Priority";
            priorityColor = "text-emerald-600";
            bottomBg = "bg-emerald-50/50";
          }
          
          if (viewMode === 'list') {
            return (
              <div key={order.orderId} className={`bg-white rounded-xl border border-slate-200 shadow-sm flex items-center p-4 gap-4 border-l-[4px] ${borderColor} hover:shadow-md transition-shadow duration-300`}>
                <div className="w-[150px] shrink-0">
                  <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-md inline-block mb-2 ${timeBg} ${timeText}`}>
                    {order.orderStatus}
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
                    {order.items.length} items • {order.items.map(i => i.name).join(', ')}
                  </p>
                </div>
                
                <div className="w-[120px] shrink-0 text-center">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">ETA</p>
                  <p className={`text-[13px] font-black ${timeText}`}>{getETA(order.createdAt)}</p>
                </div>

                <div className="w-[180px] shrink-0">
                  <Button 
                    onClick={() => handleMarkReady(order.orderId)}
                    className="w-full h-10 rounded-lg bg-[#5D34F5] hover:bg-purple-700 text-white font-bold gap-2 text-[13px] shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark as Ready
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div key={order.orderId} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative border-l-[4px] ${borderColor} hover:shadow-md transition-shadow duration-300`}>
              
              {/* Top Labels */}
              <div className="px-4 pt-4 pb-2 flex justify-between items-center">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-black tracking-wide ${timeBg} ${timeText}`}>
                  <Clock className="w-3.5 h-3.5" /> {getETA(order.createdAt)}
                </span>
                <span className={`px-2.5 py-1.5 rounded-full text-[11px] font-black ${priorityColor} bg-white flex items-center gap-1`}>
                  {priorityText} {order.priority === 'Low' ? '' : <ArrowUp className="w-3 h-3" />}
                </span>
              </div>

              {/* Header Info */}
              <div className="px-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none mb-1.5">#{order.orderId}</h3>
                  <p className="text-[13px] font-bold text-slate-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {order.orderType} 
                    <span className="text-slate-300 mx-1">•</span> 
                    {order.tableId ? `Table ${order.tableId}` : ''} 
                    {order.tableId ? <span className="text-slate-300 mx-1">•</span> : ''}
                    {order.guests ? `${order.guests} Guest${order.guests > 1 ? 's' : ''}` : ''}
                  </p>
                </div>
              </div>

              {/* Bottom Info Box (Acts as Dialog Trigger) */}
              <div className="flex-1 flex flex-col justify-end">
                <Dialog>
                  <DialogTrigger>
                    <div className={`mx-4 mt-4 mb-3 p-3 rounded-xl flex justify-between items-center border border-slate-100/50 ${bottomBg} cursor-pointer hover:opacity-80 transition-opacity group`}>
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 mb-1 text-left">Ordered At</p>
                        <p className="text-[13px] font-black text-slate-900 text-left">{formatTime(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-end gap-1">Items ({order.items.length}) <ChevronDown className="w-3 h-3 group-hover:text-[#5D34F5] transition-colors -rotate-90" /></p>
                        <p className="text-[13px] font-black text-slate-900">{getETA(order.createdAt)} ETA</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Order #{order.orderId} Items</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start group">
                          <div className="flex gap-3">
                            <span className="font-black text-slate-900 text-[14px] mt-0.5">•</span>
                            <div>
                              <p className="font-bold text-slate-700 text-[15px] flex items-center gap-2">
                                {item.quantity}x {item.name}
                              </p>
                              {(item.selectedSize || (item.selectedAddons && item.selectedAddons.length > 0) || item.specialInstructions) && (
                                <div className="text-[13px] text-slate-500 font-medium mt-1 space-y-1">
                                  {item.selectedSize && <p>Size: <span className="font-bold text-slate-700">{item.selectedSize}</span></p>}
                                  {item.selectedAddons && item.selectedAddons.length > 0 && <p>Addons: <span className="font-bold text-slate-700">{item.selectedAddons.map(a=>a.name).join(', ')}</span></p>}
                                  {item.specialInstructions && <p className="text-orange-600 font-bold">Note: {item.specialInstructions}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`w-[32px] h-[32px] rounded-full border flex items-center justify-center shrink-0 ${getItemIconBg(item.name)}`}>
                            {getItemIcon(item.name)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Action Button */}
              <div className="px-4 pb-4">
                <Button 
                  onClick={() => handleMarkReady(order.orderId)}
                  className="w-full h-11 rounded-xl bg-[#5D34F5] hover:bg-purple-700 text-white font-bold text-[14px] shadow-md shadow-[#5D34F5]/20 flex justify-between px-5 items-center"
                >
                  <span className="flex items-center gap-2"><ChefHat className="w-4 h-4" /> Mark as Ready</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <ChefHat className="w-12 h-12 mb-3 text-slate-300" />
            <p className="font-bold text-lg text-slate-500">No orders preparing</p>
            <p className="text-sm font-medium">Kitchen is clear!</p>
          </div>
        )}
      </div>

      {/* Bottom Alert */}
      <div className="mt-2 bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between shadow-sm mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#5D34F5]" />
          <p className="text-[14px] font-bold text-[#5D34F5]">Keep it up! Timely order preparation improves customer satisfaction and kitchen efficiency.</p>
        </div>
        <Button variant="ghost" size="icon" className="text-purple-400 hover:text-[#5D34F5] hover:bg-purple-100/50 h-8 w-8 rounded-full">
          <X className="w-4 h-4" />
        </Button>
      </div>

    </div>
  );
}
