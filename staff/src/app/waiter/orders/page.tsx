"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { 
  Search, ClipboardList, Filter, Clock, ChefHat, 
  CheckSquare, CheckCircle2, XCircle, User, 
  ShoppingBag, MoreHorizontal, ChevronLeft, ChevronRight,
  Armchair
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { waiterService } from "@/services/waiterService";
import type { Order } from "@/services/cashierService";
import { useSearchParams } from "next/navigation";
import { useWaiterStore } from "@/lib/waiter-store";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from "firebase/firestore";

function WaiterOrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get("status") || "All");
  const [activeType, setActiveType] = useState(searchParams.get("type") || "All");
  
  const { searchQuery, setSearchQuery, selectedDate, selectedBranch } = useWaiterStore();

  useEffect(() => {
    const statusParam = searchParams.get("status");
    const typeParam = searchParams.get("type");
    if (statusParam) setActiveTab(statusParam);
    if (typeParam) setActiveType(typeParam);
  }, [searchParams]);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setOrders(items);
    });

    return () => unsubscribe();
  }, []);

  const handleSendToKitchen = async (orderId: string, docId: string) => {
    try {
      await updateDoc(doc(db, "orders", docId), { status: "Sent to Kitchen", orderStatus: "SENT_TO_KITCHEN" });
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = { 
      All: orders.length, 
      Pending: 0, 
      Preparing: 0, 
      Ready: 0, 
      Completed: 0, 
      Cancelled: 0 
    };
    orders.forEach(o => {
      const rawStatus = o.orderStatus || (o as any).status || "PENDING";
      let s = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
      if (rawStatus === "SENT_TO_KITCHEN") s = "Preparing";
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  };
  const counts = getStatusCounts();

  const fuzzyMatch = (pattern: string, text: string) => {
    if (!pattern) return true;
    const p = pattern.toLowerCase();
    const t = text.toLowerCase();
    let patternIdx = 0;
    let textIdx = 0;
    while (patternIdx < p.length && textIdx < t.length) {
      if (p[patternIdx] === t[textIdx]) {
        patternIdx++;
      }
      textIdx++;
    }
    return patternIdx === p.length;
  };

  const filteredOrders = orders.filter(o => {
    const rawStatus = o.orderStatus || (o as any).status || "PENDING";
    let s = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
    if (rawStatus === "SENT_TO_KITCHEN") s = "Preparing";
    const matchesTab = activeTab === "All" || s === activeTab;
    
    const rawType = o.orderType || (o as any).type || "Delivery";
    const matchesType = activeType === "All" || rawType === activeType;
    
    // Fuzzy matching against multiple fields
    const matchesSearch = 
      fuzzyMatch(searchQuery, o.orderId) || 
      (o.customerName && fuzzyMatch(searchQuery, o.customerName)) ||
      (o.tableId && fuzzyMatch(searchQuery, o.tableId));
    
    // Note: If you want branch/date filtering to actually hide records, you can add it here.
    // For now, it matches if there's no branch specific field in the mocked Order data,
    // or if you want to strictly filter:
    // const matchesBranch = selectedBranch === "All" || o.branch === selectedBranch;
    // Since Order mock data may not have branch/date fields mapped perfectly, we won't strictly exclude them here.
    
    return matchesTab && matchesSearch && matchesType;
  });

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": 
        return { 
          color: "amber", border: "border-l-amber-400", 
          bg: "bg-amber-50", text: "text-amber-500", 
          icon: <Clock className="w-4 h-4" /> 
        };
      case "PREPARING": 
      case "SENT_TO_KITCHEN":
        return { 
          color: "blue", border: "border-l-blue-400", 
          bg: "bg-blue-50", text: "text-blue-500", 
          icon: <ChefHat className="w-4 h-4" /> 
        };
      case "READY": 
        return { 
          color: "emerald", border: "border-l-emerald-400", 
          bg: "bg-emerald-50", text: "text-emerald-500", 
          icon: <CheckSquare className="w-4 h-4" /> 
        };
      case "COMPLETED": 
        return { 
          color: "purple", border: "border-l-[#5D34F5]", 
          bg: "bg-[#F8F7FF]", text: "text-[#5D34F5]", 
          icon: <CheckCircle2 className="w-4 h-4" /> 
        };
      case "CANCELLED": 
        return { 
          color: "red", border: "border-l-red-400", 
          bg: "bg-red-50", text: "text-red-500", 
          icon: <XCircle className="w-4 h-4" /> 
        };
      default: 
        return { 
          color: "slate", border: "border-l-slate-200", 
          bg: "bg-slate-50", text: "text-slate-500", 
          icon: <ClipboardList className="w-4 h-4" /> 
        };
    }
  };

  const tabs = [
    { name: "All", icon: <ClipboardList className="w-4 h-4" />, color: "text-white" },
    { name: "Pending", icon: <Clock className="w-4 h-4" />, color: "text-amber-500" },
    { name: "Preparing", icon: <ChefHat className="w-4 h-4" />, color: "text-blue-500" },
    { name: "Ready", icon: <CheckSquare className="w-4 h-4" />, color: "text-emerald-500" },
    { name: "Completed", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-[#5D34F5]" },
    { name: "Cancelled", icon: <XCircle className="w-4 h-4" />, color: "text-red-500" }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 -mx-4 lg:-mx-8 -my-4 lg:-my-8 font-sans">
      
      {/* Header Area */}
      <div className="bg-white px-8 py-6 shrink-0 border-b border-slate-200">
        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-black rounded-full whitespace-nowrap transition-colors border ${
                activeTab === tab.name 
                  ? "bg-[#5D34F5] text-white border-[#5D34F5] shadow-md shadow-[#5D34F5]/20" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className={activeTab === tab.name ? "text-white" : tab.color}>
                {tab.icon}
              </div>
              {tab.name} ({counts[tab.name] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider pl-8">Order ID</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider text-center pr-8">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const rawStatus = order.orderStatus || (order as any).status || "PENDING";
                  const config = getStatusConfig(rawStatus);
                  const rawType = order.orderType || (order as any).type || "Delivery";
                  return (
                    <tr key={order.orderId} className={`hover:bg-slate-50/50 transition-colors border-l-4 ${config.border}`}>
                      <td className="px-6 py-4 pl-7">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg} ${config.text}`}>
                            <ClipboardList className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-slate-900">#{order.orderId}</p>
                            <p className="text-[12px] font-bold text-slate-500">{rawType}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F8F7FF] text-[#5D34F5] flex items-center justify-center">
                            <Armchair className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-slate-900">{order.tableId || (order as any).table || "T-00"}</p>
                            <p className="text-[12px] font-bold text-slate-500">Table</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F8F7FF] text-[#5D34F5] flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-slate-900">{order.customerName || ((order as any).customer && (order as any).customer.name) || (typeof (order as any).customer === 'string' ? (order as any).customer : "Guest")}</p>
                            <p className="text-[12px] font-bold text-slate-500">Customer</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-slate-900">{(order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0)} Items</p>
                            <Link href={`/waiter/orders/${order.orderId}`} className="text-[12px] font-bold text-[#5D34F5] hover:underline">
                              View items
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[15px] font-black text-slate-900">₹{Number(order.total || (order as any).amount || 0).toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-current/10 ${config.bg} ${config.text}`}>
                          {config.icon}
                          <span className="text-[12px] font-black uppercase tracking-wide">
                            {rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[14px] font-black text-slate-900">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center pr-8">
                        <div className="flex items-center justify-end gap-2">
                          {(rawStatus.toUpperCase() === 'PENDING') && (
                            <button onClick={() => handleSendToKitchen(order.orderId, (order as any).id)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-[12px] font-bold shadow-sm whitespace-nowrap">
                              Send to Kitchen
                            </button>
                          )}
                          <Link href={`/waiter/orders/${order.orderId}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F8F7FF] text-[#5D34F5] hover:bg-[#5D34F5] hover:text-white transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No orders found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="border-t border-slate-200 px-8 py-5 flex items-center justify-between shrink-0 bg-white">
            <span className="text-[13px] font-bold text-slate-500">
              Showing {filteredOrders.length} orders
            </span>
            
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-lg bg-[#5D34F5] text-white font-black text-[13px] flex items-center justify-center shadow-md shadow-[#5D34F5]/20">
                1
              </button>
              <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-500">
              Rows per page: 
              <Select defaultValue="10">
                <SelectTrigger className="h-[32px] bg-transparent border border-slate-200 rounded-lg px-2 text-slate-900 font-black focus:ring-1 focus:ring-[#5D34F5] focus:border-[#5D34F5] data-[state=open]:border-[#5D34F5] data-[state=open]:ring-1 data-[state=open]:ring-[#5D34F5]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 min-w-[60px]">
                  <SelectItem value="10" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold text-[13px]">10</SelectItem>
                  <SelectItem value="20" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold text-[13px]">20</SelectItem>
                  <SelectItem value="50" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold text-[13px]">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WaiterOrders() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading orders...</div>}>
      <WaiterOrdersContent />
    </Suspense>
  );
}
