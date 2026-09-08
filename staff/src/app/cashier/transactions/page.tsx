"use client";

import { 
  Search, Filter, Calendar as CalendarIcon, ChevronDown, 
  Eye, ReceiptText, Banknote, Smartphone, CreditCard, 
  CircleDollarSign, TrendingUp, Wallet, List, User,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RotateCcw,
  CheckCircle2, AlertCircle, Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cashierService, type Order } from "@/services/cashierService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose, DialogHeader } from "@/components/ui/dialog";

export default function CashierTransactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("All Payment Methods");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState("Today");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [tempMinAmount, setTempMinAmount] = useState("");
  const [tempMaxAmount, setTempMaxAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const load = async () => {
      unsub = await cashierService.subscribeToOrders((data) => {
        setOrders(data);
      });
    };
    load();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const paidOrders = orders.filter(o => o.paymentStatus === "PAID" || o.orderStatus === "COMPLETED");
  const totalSales = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const cashSales = paidOrders.filter(o => o.paymentMethod === "Cash").reduce((sum, o) => sum + (o.total || 0), 0);
  const digitalSales = totalSales - cashSales;

  const SUMMARY_CARDS = [
    { title: "Total Sales Today", value: `₹${totalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}`, trend: "Today", icon: <CircleDollarSign className="w-6 h-6 text-[#5D34F5]" />, iconBg: "bg-[#F8F7FF]" },
    { title: "Total Transactions", value: paidOrders.length.toString(), trend: "Today", icon: <Wallet className="w-6 h-6 text-emerald-500" />, iconBg: "bg-emerald-50" },
    { title: "Cash Collected", value: `₹${cashSales.toLocaleString(undefined, {minimumFractionDigits: 2})}`, trend: "Today", icon: <Banknote className="w-6 h-6 text-orange-500" />, iconBg: "bg-orange-50" },
    { title: "UPI/Card Receipts", value: `₹${digitalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}`, trend: "Today", icon: <CreditCard className="w-6 h-6 text-blue-500" />, iconBg: "bg-blue-50" },
  ];

  const filteredOrders = orders.filter(o => {
    const txnId = `TXN${o.id?.substring(0,8).toUpperCase() || "1245789"}`;
    const matchesSearch = (o.orderId || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          txnId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (o.customerName || "Guest").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (o.tableId || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    let method = o.paymentMethod || "Cash";
    if (method === "CASH") method = "Cash";
    if (method === "UPI") method = "UPI";
    if (method === "CARD") method = "Card";

    const matchesMethod = methodFilter === "All Payment Methods" ? true : method === methodFilter;
    
    let statusStr = "Pending";
    if (o.paymentStatus === "PAID" || o.orderStatus === "COMPLETED") statusStr = "Completed";
    else if (o.paymentStatus === "FAILED" || o.orderStatus === "CANCELLED") statusStr = "Failed";
    
    const matchesStatus = statusFilter === "All Status" ? true : statusStr === statusFilter;
    
    const amountVal = o.total || 0;
    const minVal = minAmount ? parseFloat(minAmount) : 0;
    const maxVal = maxAmount ? parseFloat(maxAmount) : Infinity;
    const matchesAmount = amountVal >= minVal && amountVal <= maxVal;

    return matchesSearch && matchesMethod && matchesStatus && matchesAmount;
  });

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const getMethodDetails = (method: string) => {
    if (method === "UPI") return { icon: Smartphone, iconColor: "text-orange-500", name: "UPI" };
    if (method === "Card" || method === "CARD") return { icon: CreditCard, iconColor: "text-[#5D34F5]", name: "Card" };
    return { icon: Banknote, iconColor: "text-emerald-500", name: "Cash" };
  };

  const getStatusBadge = (order: Order) => {
    let statusStr = "Pending";
    if (order.paymentStatus === "PAID" || order.orderStatus === "COMPLETED") statusStr = "Completed";
    else if (order.paymentStatus === "FAILED" || order.orderStatus === "CANCELLED") statusStr = "Failed";

    if (statusStr === "Completed") return <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[11px] font-black uppercase tracking-wider">Completed</span>;
    if (statusStr === "Pending") return <span className="inline-flex px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-md text-[11px] font-black uppercase tracking-wider">Pending</span>;
    return <span className="inline-flex px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-md text-[11px] font-black uppercase tracking-wider">Failed</span>;
  };

  return (
    <div className="p-8 font-sans pb-32 lg:pb-8 bg-[#F8F9FD] min-h-full">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {SUMMARY_CARDS.map((card, idx) => (
          <div key={idx} className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 flex items-center gap-5 transition-all duration-200 hover:border-[#5D34F5] hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-500 mb-1">{card.title}</p>
              <h2 className="text-[24px] font-black text-slate-900 tracking-tight leading-none mb-2">{card.value}</h2>
              <p className="text-[11px] font-bold text-emerald-500">{card.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Controls */}
      <div className="flex flex-col xl:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Order ID, Table, Customer or Transaction ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all shadow-sm"
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-12 px-5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-[180px] outline-none">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <span>{dateFilter}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] rounded-xl shadow-lg border-slate-100 p-2">
              <DropdownMenuItem onClick={() => setDateFilter('Today')} className="cursor-pointer font-medium text-[13px] rounded-lg">Today</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="h-12 px-5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-[220px] outline-none">
              <span>{methodFilter}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px] rounded-xl shadow-lg border-slate-100 p-2">
              <DropdownMenuItem onClick={() => setMethodFilter('All Payment Methods')} className="cursor-pointer font-medium text-[13px] rounded-lg">All Payment Methods</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMethodFilter('UPI')} className="cursor-pointer font-medium text-[13px] rounded-lg">UPI</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMethodFilter('Card')} className="cursor-pointer font-medium text-[13px] rounded-lg">Card</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMethodFilter('Cash')} className="cursor-pointer font-medium text-[13px] rounded-lg">Cash</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="h-12 px-5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-[150px] outline-none">
              <span>{statusFilter}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px] rounded-xl shadow-lg border-slate-100 p-2">
              <DropdownMenuItem onClick={() => setStatusFilter('All Status')} className="cursor-pointer font-medium text-[13px] rounded-lg">All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Completed')} className="cursor-pointer font-medium text-[13px] rounded-lg">Completed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Pending')} className="cursor-pointer font-medium text-[13px] rounded-lg">Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Failed')} className="cursor-pointer font-medium text-[13px] rounded-lg">Failed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog>
            <DialogTrigger 
              onClick={() => {
                setTempMinAmount(minAmount);
                setTempMaxAmount(maxAmount);
              }}
              className="h-12 px-6 rounded-xl border border-[#E5DFFF] bg-white flex items-center gap-2 text-[#5D34F5] font-black text-[13px] hover:bg-[#F8F7FF] transition-colors shadow-sm w-full sm:w-auto justify-center outline-none"
            >
              <Filter className="w-4 h-4" />
              Filters
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-0">
              <div className="bg-[#5D34F5] p-6 text-white text-center">
                <DialogTitle className="text-xl font-black mb-1 text-white">Advanced Filters</DialogTitle>
                <p className="text-purple-200 text-[13px] font-medium">Refine your transaction search</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Amount Range (₹)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      placeholder="Min"
                      value={tempMinAmount}
                      onChange={(e) => setTempMinAmount(e.target.value)}
                      className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors"
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <input 
                      type="number" 
                      placeholder="Max"
                      value={tempMaxAmount}
                      onChange={(e) => setTempMaxAmount(e.target.value)}
                      className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <DialogClose 
                    onClick={() => { 
                      setMinAmount(""); 
                      setMaxAmount(""); 
                      setTempMinAmount("");
                      setTempMaxAmount("");
                      toast.info("Filters cleared"); 
                    }}
                    className="px-5 py-2.5 text-[14px] font-black text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Clear All
                  </DialogClose>
                  <DialogClose 
                    onClick={() => {
                      setMinAmount(tempMinAmount);
                      setMaxAmount(tempMaxAmount);
                      toast.success("Filters applied");
                    }}
                    className="px-5 py-2.5 bg-[#5D34F5] text-white text-[14px] font-black rounded-xl hover:bg-[#4B28C9] transition-colors shadow-sm shadow-purple-200"
                  >
                    Apply Filters
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1100px]">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_0.8fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-5 border-b border-slate-100">
              <div className="text-[12px] font-bold text-slate-500">Order ID</div>
              <div className="text-[12px] font-bold text-slate-500">Transaction ID</div>
              <div className="text-[12px] font-bold text-slate-500">Table</div>
              <div className="text-[12px] font-bold text-slate-500">Customer</div>
              <div className="text-[12px] font-bold text-slate-500">Payment Method</div>
              <div className="text-[12px] font-bold text-slate-500">Amount</div>
              <div className="text-[12px] font-bold text-slate-500">Status</div>
              <div className="text-[12px] font-bold text-slate-500">Time</div>
              <div className="text-[12px] font-bold text-slate-500 text-center">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-bold">No transactions found.</div>
              ) : paginatedOrders.map((order, i) => {
                const txnId = `TXN${order.id?.substring(0,8).toUpperCase() || "1245789"}`;
                const methodDetails = getMethodDetails(order.paymentMethod || "Cash");

                return (
                  <div key={i} className="grid grid-cols-[1fr_1fr_0.8fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="text-[14px] font-black text-slate-900">#{order.orderId}</div>
                    <div className="text-[14px] font-bold text-slate-700">{txnId}</div>
                    <div className="text-[14px] font-bold text-slate-700">{order.tableId || "-"}</div>
                    <div className="text-[14px] font-bold text-slate-700">{order.customerName || "Guest"}</div>
                    
                    <div className="flex items-center gap-3">
                      <methodDetails.icon className={`w-4 h-4 ${methodDetails.iconColor}`} />
                      <div>
                        <p className="text-[13px] font-black text-slate-900">{methodDetails.name}</p>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{methodDetails.name}</p>
                      </div>
                    </div>

                    <div className="text-[14px] font-black text-slate-900">₹{(order.total || 0).toFixed(2)}</div>
                    <div>{getStatusBadge(order)}</div>

                    <div className="text-[13px] font-bold text-slate-700">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>

                    <button onClick={() => setSelectedOrder(order)} className="h-9 w-full rounded-xl border border-[#E5DFFF] text-[#5D34F5] flex items-center justify-center gap-2 hover:bg-[#F8F7FF] transition-colors text-[12px] font-black">
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 border-t border-slate-100">
          <p className="text-[13px] font-bold text-slate-500">Showing {filteredOrders.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0} to {Math.min(filteredOrders.length, currentPage * rowsPerPage)} of {filteredOrders.length} transactions</p>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#5D34F5] text-white text-[13px] font-black shadow-sm">{currentPage}</button>
              <button 
                disabled={filteredOrders.length <= currentPage * rowsPerPage}
                onClick={() => setCurrentPage(p => p + 1)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                disabled={filteredOrders.length <= currentPage * rowsPerPage}
                onClick={() => setCurrentPage(Math.ceil(filteredOrders.length / rowsPerPage))}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              <span className="text-[12px] font-bold text-slate-500">Rows per page</span>
              <DropdownMenu>
                <DropdownMenuTrigger className="h-9 px-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2 text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition-colors shadow-sm outline-none">
                  {rowsPerPage}
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-24 rounded-xl shadow-lg border-slate-100 p-2">
                  {[8, 16, 32].map((num) => (
                    <DropdownMenuItem key={num} onClick={() => setRowsPerPage(num)} className="cursor-pointer font-medium text-[13px] rounded-lg">
                      {num}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-[32px]">
          {selectedOrder && (
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900">Transaction Details</DialogTitle>
                  <p className="text-slate-500 font-bold mt-1">TXN{selectedOrder.id?.substring(0,8).toUpperCase()}</p>
                </div>
                {getStatusBadge(selectedOrder)}
              </div>

              <div className="bg-[#F8F7FF] rounded-2xl p-5 border border-[#E5DFFF] space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-slate-500">Order ID</span>
                  <span className="text-[14px] font-black text-slate-900">#{selectedOrder.orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-slate-500">Date & Time</span>
                  <span className="text-[14px] font-bold text-slate-700">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-slate-500">Customer</span>
                  <span className="text-[14px] font-bold text-slate-700">{selectedOrder.customerName || "Guest"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-slate-500">Table</span>
                  <span className="text-[14px] font-bold text-slate-700">{selectedOrder.tableId || "Takeaway"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-slate-500">Payment Method</span>
                  <span className="text-[14px] font-bold text-slate-700 flex items-center gap-1.5">
                    {(() => {
                      const m = getMethodDetails(selectedOrder.paymentMethod || "Cash");
                      return <><m.icon className={`w-3.5 h-3.5 ${m.iconColor}`} /> {m.name}</>;
                    })()}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                <h4 className="text-[14px] font-black text-slate-900 mb-2">Order Summary</h4>
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <p className="text-[13px] font-bold text-slate-700">{item.quantity}x {item.name}</p>
                    </div>
                    <span className="text-[13px] font-black text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2 mb-8">
                <div className="flex justify-between text-[13px]">
                  <span className="font-bold text-slate-500">Subtotal</span>
                  <span className="font-black text-slate-700">₹{(selectedOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="font-bold text-slate-500">Taxes</span>
                  <span className="font-black text-slate-700">₹{(selectedOrder.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[16px] pt-2">
                  <span className="font-black text-slate-900">Total Paid</span>
                  <span className="font-black text-[#5D34F5]">₹{(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <DialogClose render={<button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[14px] transition-colors" />}>
                Close
              </DialogClose>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
