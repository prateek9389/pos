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
  ClipboardList, 
  Bell,
  Leaf,
  Flame,
  Snowflake,
  CupSoda,
  CheckCircle2,
  Check
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

// Helper for generic icons based on name
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

export default function OrderQueue() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("New");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");

  useEffect(() => {
    const unsubscribe = kitchenService.subscribeToOrders((updatedOrders) => {
      const sorted = [...updatedOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (updatedOrders.length > orders.length && orders.length > 0) {
        toast("🔔 NEW ORDER ARRIVED", {
          description: "A new order has been sent to the kitchen.",
          style: { background: '#6366f1', color: 'white', border: 'none' }
        });
      }
      
      setOrders(sorted);
    });
    return () => unsubscribe();
  }, [orders.length]);

  const filteredOrders = orders.filter(o => {
    let matchesTab = true;
    if (activeTab === "New") matchesTab = o.orderStatus === "SENT_TO_KITCHEN";
    else if (activeTab === "Preparing") matchesTab = o.orderStatus === "PREPARING";
    else if (activeTab === "Ready") matchesTab = o.orderStatus === "READY";
    
    let matchesPriority = true;
    if (filterPriority !== "All") matchesPriority = (o.priority || "Normal") === filterPriority;

    let matchesType = true;
    if (filterType !== "All") matchesType = o.orderType === filterType;

    return matchesTab && matchesPriority && matchesType;
  });

  const handleStartPreparing = async (orderId: string) => {
    await kitchenService.updateOrderStatus(orderId, "PREPARING");
    toast.success(`Order #${orderId} is now preparing.`);
  };

  const handleMarkReady = async (orderId: string) => {
    await kitchenService.updateOrderStatus(orderId, "READY");
    toast.success(`Order #${orderId} is ready to serve.`);
  };

  const handleMarkCompleted = async (orderId: string) => {
    await kitchenService.updateOrderStatus(orderId, "COMPLETED");
    toast.success(`Order #${orderId} has been completed.`);
  };

  const getElapsedTime = (createdAt: string | number) => {
    const elapsedMs = new Date().getTime() - new Date(createdAt).getTime();
    const minutes = Math.floor(elapsedMs / 60000);
    return `${minutes} min ago`;
  };
  
  const formatTime = (isoString: string | number) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 h-full flex flex-col max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      


      {/* 4 Interactive Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: "New",
            title: "New Orders",
            count: orders.filter(o => o.orderStatus === "SENT_TO_KITCHEN").length,
            subtitle: orders.filter(o => o.orderStatus === "SENT_TO_KITCHEN").length > 0 
              ? `${orders.filter(o => o.orderStatus === "SENT_TO_KITCHEN").length} awaiting chef` 
              : "Queue is clear",
            icon: ClipboardList,
            iconBg: "bg-[#7C3AED] dark:bg-[#7C3AED]/20",
            iconColor: "text-white dark:text-[#A78BFA]",
            activeBorder: "border-[#7C3AED] ring-2 ring-[#7C3AED]/25 shadow-lg shadow-[#7C3AED]/10 bg-purple-50/40 dark:bg-[#7C3AED]/10",
            badgeClass: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40",
            activeBadgeClass: "bg-[#7C3AED] text-white",
            statusColor: orders.filter(o => o.orderStatus === "SENT_TO_KITCHEN").length > 0 ? "text-amber-500" : "text-emerald-500",
          },
          {
            id: "Preparing",
            title: "Preparing",
            count: orders.filter(o => o.orderStatus === "PREPARING").length,
            subtitle: orders.filter(o => o.orderStatus === "PREPARING").length > 0 
              ? `${orders.filter(o => o.orderStatus === "PREPARING").length} on stove/station` 
              : "Station idle",
            icon: ChefHat,
            iconBg: "bg-[#F97316] dark:bg-[#F97316]/20",
            iconColor: "text-white dark:text-[#FDBA74]",
            activeBorder: "border-[#F97316] ring-2 ring-[#F97316]/25 shadow-lg shadow-[#F97316]/10 bg-orange-50/40 dark:bg-[#F97316]/10",
            badgeClass: "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40",
            activeBadgeClass: "bg-[#F97316] text-white",
            statusColor: orders.filter(o => o.orderStatus === "PREPARING").length > 0 ? "text-amber-500" : "text-slate-400",
          },
          {
            id: "Ready",
            title: "Ready Orders",
            count: orders.filter(o => o.orderStatus === "READY").length,
            subtitle: orders.filter(o => o.orderStatus === "READY").length > 0 
              ? `${orders.filter(o => o.orderStatus === "READY").length} ready to serve` 
              : "All served",
            icon: CheckCircle2,
            iconBg: "bg-[#10B981] dark:bg-[#10B981]/20",
            iconColor: "text-white dark:text-[#6EE7B7]",
            activeBorder: "border-[#10B981] ring-2 ring-[#10B981]/25 shadow-lg shadow-[#10B981]/10 bg-emerald-50/40 dark:bg-[#10B981]/10",
            badgeClass: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40",
            activeBadgeClass: "bg-[#10B981] text-white",
            statusColor: orders.filter(o => o.orderStatus === "READY").length > 0 ? "text-emerald-500" : "text-slate-400",
          },
          {
            id: "All Orders",
            title: "All Orders",
            count: orders.length,
            subtitle: `${orders.length} total tickets`,
            icon: ListOrdered,
            iconBg: "bg-[#3B82F6] dark:bg-[#3B82F6]/20",
            iconColor: "text-white dark:text-[#93C5FD]",
            activeBorder: "border-[#3B82F6] ring-2 ring-[#3B82F6]/25 shadow-lg shadow-[#3B82F6]/10 bg-blue-50/40 dark:bg-[#3B82F6]/10",
            badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
            activeBadgeClass: "bg-[#3B82F6] text-white",
            statusColor: "text-blue-500",
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
          const isNew = order.orderStatus === "SENT_TO_KITCHEN";
          
          if (viewMode === 'list') {
            return (
              <div key={order.orderId} className={`bg-white rounded-xl border border-slate-200 shadow-sm flex items-center p-4 gap-4 ${order.priority === 'High' ? 'border-l-[4px] border-l-orange-500' : order.priority === 'Low' ? 'border-l-[4px] border-l-emerald-500' : 'border-l-[4px] border-l-purple-600'} hover:shadow-md transition-shadow duration-300`}>
                <div className="w-[150px] shrink-0">
                  <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-md inline-block mb-2 ${
                    isNew ? 'bg-purple-50 text-purple-600' :
                    order.orderStatus === 'PREPARING' ? 'bg-orange-50 text-orange-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {isNew ? 'NEW' : order.orderStatus}
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
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Time</p>
                  <p className="text-[13px] font-black text-slate-700">{formatTime(order.createdAt)}</p>
                </div>

                <div className="w-[180px] shrink-0">
                  {order.orderStatus === "SENT_TO_KITCHEN" ? (
                    <Button 
                      onClick={() => handleStartPreparing(order.orderId)}
                      className="w-full h-10 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-[13px] shadow-sm"
                    >
                      <ChefHat className="w-4 h-4" /> Start
                    </Button>
                  ) : order.orderStatus === "PREPARING" ? (
                    <Button 
                      onClick={() => handleMarkReady(order.orderId)}
                      className="w-full h-10 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 text-[13px] shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Ready
                    </Button>
                  ) : order.orderStatus === "READY" ? (
                    <Button 
                      onClick={() => handleMarkCompleted(order.orderId)}
                      className="w-full h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2 text-[13px] shadow-sm"
                    >
                      <Check className="w-4 h-4" /> Complete
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          }
          
          return (
            <div key={order.orderId} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative ${order.priority === 'High' ? 'border-l-[4px] border-l-orange-500' : order.priority === 'Low' ? 'border-l-[4px] border-l-emerald-500' : 'border-l-[4px] border-l-purple-600'} hover:shadow-md transition-shadow duration-300`}>
              
              {/* Top Labels */}
              <div className="px-4 pt-4 pb-2 flex justify-between items-center">
                <span className={`text-[11px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md ${
                  isNew ? 'bg-purple-50 text-purple-600' :
                  order.orderStatus === 'PREPARING' ? 'bg-orange-50 text-orange-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {isNew ? 'NEW' : order.orderStatus}
                </span>
                <span className="text-[13px] font-bold text-purple-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {getElapsedTime(order.createdAt)}
                </span>
              </div>

              {/* Header Info */}
              <div className="px-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none mb-1.5">#{order.orderId}</h3>
                  <p className="text-[13px] font-bold text-slate-500">
                    {order.orderType} 
                    {order.tableId ? ` • Table ${order.tableId}` : ''} 
                    {order.guests ? ` • ${order.guests} Guest${order.guests > 1 ? 's' : ''}` : ''}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shrink-0 border border-purple-100">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>

              {/* Bottom Info Box (Acts as Dialog Trigger) */}
              <div className="flex-1 flex flex-col justify-end">
                <Dialog>
                  <DialogTrigger>
                    <div className="mx-4 mt-4 mb-3 p-2.5 bg-[#F8FAFC] rounded-xl flex justify-between items-center border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors group">
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 group-hover:text-purple-600 transition-colors text-left">Items ({order.items.length}) <ChevronDown className="w-3 h-3 -rotate-90" /></p>
                        <p className="text-[13px] font-black text-slate-700 text-left">{formatTime(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</p>
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${
                          order.priority === 'High'
                            ? 'bg-orange-100 text-orange-700' 
                            : order.priority === 'Low'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {order.priority || 'Normal'}
                        </span>
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
              <div className="px-5 pb-5">
                {order.orderStatus === "SENT_TO_KITCHEN" && (
                  <Button 
                    onClick={() => handleStartPreparing(order.orderId)}
                    className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-[14px] shadow-md shadow-purple-600/20"
                  >
                    <ChefHat className="w-[18px] h-[18px]" /> Start Preparing
                  </Button>
                )}
                {order.orderStatus === "PREPARING" && (
                  <Button 
                    onClick={() => handleMarkReady(order.orderId)}
                    className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 text-[14px] shadow-md shadow-orange-500/20"
                  >
                    <CheckCircle2 className="w-[18px] h-[18px]" /> Mark as Ready
                  </Button>
                )}
                {order.orderStatus === "READY" && (
                  <Button 
                    onClick={() => handleMarkCompleted(order.orderId)}
                    className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2 text-[14px] shadow-md shadow-emerald-500/20"
                  >
                    <Check className="w-[18px] h-[18px]" /> Mark Completed
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <ChefHat className="w-12 h-12 mb-3 text-slate-300" />
            <p className="font-bold text-lg text-slate-500">No orders in this queue</p>
            <p className="text-sm font-medium">Kitchen is clear!</p>
          </div>
        )}
      </div>

      {/* Bottom Alert */}
      <div className="mt-4 bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-center gap-3 shadow-sm mb-6">
        <Bell className="w-[18px] h-[18px] text-amber-500 shrink-0" />
        <p className="text-[14px] font-bold text-amber-700/90">New orders will automatically appear here. Click "Start Preparing" when you begin working on an order.</p>
      </div>

    </div>
  );
}
