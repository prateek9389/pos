"use client";

import { useState, useEffect } from "react";
import { CreditCard, ArrowUpRight, ArrowDownRight, Wallet, Banknote, Search, Download, MoreHorizontal, Eye, FileText, Plus, X, Calendar as CalendarIcon, FileDown, ChevronDown, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, updateDoc } from "firebase/firestore";
import { useBranchContext } from "@/context/BranchContext";

interface Payment {
  id: string; // Firestore doc ID
  transactionId: string;
  orderId: string;
  customer: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  branch: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("All Methods");
  const { selectedBranchId, branches } = useBranchContext();
  const [viewAll, setViewAll] = useState(false);
  const [viewDetailsPayment, setViewDetailsPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Payment[] = [];
      snapshot.forEach((doc) => {
        const o = doc.data();
        let statusStr = "Pending";
        if (o.paymentStatus === "REFUNDED") statusStr = "Refunded";
        else if (o.paymentStatus === "PAID" || o.orderStatus === "COMPLETED") statusStr = "Successful";
        else if (o.paymentStatus === "FAILED" || o.orderStatus === "CANCELLED") statusStr = "Failed";

        let method = o.paymentMethod || "Cash";
        if (method === "CASH") method = "Cash";
        if (method === "UPI") method = "UPI";
        if (method === "CARD") method = "Card";

        items.push({ 
          id: doc.id,
          transactionId: `TXN${doc.id.substring(0,8).toUpperCase()}`,
          orderId: `#${o.orderId || doc.id.substring(0,6)}`,
          customer: o.customerName || "Guest",
          amount: o.total || 0,
          method: method,
          status: statusStr,
          date: new Date(o.createdAt || new Date()).toLocaleString(),
          branch: o.branch || o.branchId || "Unknown"
        });
      });
      // Sort by newest first
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setPayments(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRefund = async (e: React.MouseEvent, paymentId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to refund this transaction?")) {
      try {
        await updateDoc(doc(db, "orders", paymentId), {
          paymentStatus: "REFUNDED",
          orderStatus: "CANCELLED"
        });
        toast.success("Payment refunded successfully.");
      } catch (err) {
        console.error(err);
        toast.error("Failed to refund payment.");
      }
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      (payment.transactionId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.orderId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.customer || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = methodFilter === "All Methods" || payment.method === methodFilter;
    const matchesBranch = selectedBranchId === "all" || payment.branch === selectedBranchId || payment.branch === (branches.find(b => b.id === selectedBranchId)?.name);
    
    return matchesSearch && matchesMethod && matchesBranch;
  });

  const totalPayments = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const successfulPayments = payments.filter(p => p.status === 'Successful').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingPayments = payments.filter(p => p.status === 'Pending').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const refundedPayments = payments.filter(p => p.status === 'Refunded').reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-[3px] border-transparent hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-slate-500 mb-1">Total Payments</p>
                <h3 className="text-2xl font-bold text-foreground">₹{totalPayments.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="mt-4 text-sm font-semibold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-md flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" /> Real-time
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-[3px] border-transparent border-b-4 border-b-emerald-500 hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl shrink-0">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-slate-500 mb-1">Successful</p>
                <h3 className="text-2xl font-bold text-foreground">₹{successfulPayments.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500 font-medium">Successful transactions</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[3px] border-transparent border-b-4 border-b-amber-500 hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl shrink-0">
                <Banknote className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-slate-500 mb-1">Pending</p>
                <h3 className="text-2xl font-bold text-foreground">₹{pendingPayments.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500 font-medium">Awaiting settlement</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[3px] border-transparent border-b-4 border-b-slate-400 hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded-xl shrink-0">
                <ArrowDownRight className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-slate-500 mb-1">Refunded</p>
                <h3 className="text-2xl font-bold text-foreground">₹{refundedPayments.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500 font-medium">Refunded transactions</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full mb-8">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#A855F7] transition-colors" />
          <Input 
            placeholder="Search by Transaction ID or Order ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-14 h-[52px] bg-white border-slate-100 rounded-full shadow-[0_2px_15px_rgb(0,0,0,0.02)] focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 transition-all text-[15px] font-medium placeholder:text-slate-400"
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="h-[52px] w-full sm:w-[160px] bg-white border border-slate-100 rounded-full text-[14.5px] font-bold text-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] hover:border-slate-300 transition-all px-5">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
              <SelectItem value="All Methods" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">All Methods</SelectItem>
              <SelectItem value="UPI" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">UPI</SelectItem>
              <SelectItem value="Card" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Card</SelectItem>
              <SelectItem value="Cash" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
          <Dialog>
            <DialogTrigger render={<Button className="shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all bg-[#A855F7] hover:bg-[#9333EA] text-white border-0 font-bold h-[52px] rounded-full px-6 w-full sm:w-auto hidden sm:flex ml-auto" />}>
              <Download className="w-5 h-5 mr-2" /> Export Data
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="w-full sm:max-w-4xl overflow-y-auto max-h-[90vh] p-0 gap-0 bg-[#F8F9FA] rounded-[2rem] shadow-[rgba(0,0,0,0.15)_0px_10px_40px] outline-none border-0">
              {/* Header Area */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-24 shrink-0">
                <DialogClose render={<button className="absolute top-6 right-6 w-8 h-8 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-md flex items-center justify-center z-50 transition-colors" />}>
                  <X className="w-4 h-4" />
                </DialogClose>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative">
                    <FileDown className="w-6 h-6 text-white" />
                  </div>
                  <DialogHeader className="text-left p-0 space-y-0.5">
                    <DialogTitle className="text-[20px] font-bold text-white tracking-tight">Export Payments</DialogTitle>
                    <DialogDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                      Download transaction data for reporting
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="absolute bottom-0 left-0 right-0 translate-y-[1px]">
                  <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-[#F8F9FA]">
                    <path d="M0,60 C320,120 420,0 720,20 C1020,40 1120,80 1440,40 L1440,120 L0,120 Z" fill="currentColor"></path>
                  </svg>
                </div>
              </div>

              {/* Form Area */}
              <div className="p-8 pt-4 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  <div className="space-y-3 pt-2 md:col-span-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Export Format</Label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="export-format" defaultChecked className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">CSV (Excel)</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="export-format" className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">PDF Report</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-from" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Date From</Label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors z-10 pointer-events-none" />
                      <Input id="date-from" type="date" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm w-full text-slate-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date-to" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Date To</Label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors z-10 pointer-events-none" />
                      <Input id="date-to" type="date" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm w-full text-slate-600" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-4 mt-8">
                  <DialogClose render={<Button variant="outline" className="h-[48px] px-8 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" />}>
                    Cancel
                  </DialogClose>
                  <DialogClose render={<Button onClick={() => toast.success("Export successful!")} className="h-[48px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0" />}>
                    <Download className="w-5 h-5 mr-1.5" /> Download
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No payments found</h3>
          <p className="text-slate-500 font-medium">There are no transactions matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr_1fr_1fr_80px] gap-4 px-6 py-5 border-b border-slate-100">
                <div className="text-[12px] font-bold text-slate-500">Transaction ID</div>
                <div className="text-[12px] font-bold text-slate-500">Order ID</div>
                <div className="text-[12px] font-bold text-slate-500">Customer</div>
                <div className="text-[12px] font-bold text-slate-500">Amount</div>
                <div className="text-[12px] font-bold text-slate-500">Payment Method</div>
                <div className="text-[12px] font-bold text-slate-500">Status</div>
                <div className="text-[12px] font-bold text-slate-500">Date</div>
                <div className="text-[12px] font-bold text-slate-500 text-right">Action</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100">
                {filteredPayments.slice(0, viewAll ? undefined : 8).map((payment) => (
                  <div key={payment.id} onClick={() => setViewDetailsPayment(payment)} className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr_1fr_1fr_80px] gap-4 items-center px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="text-[14px] font-black text-slate-900">{payment.transactionId}</div>
                    <div className="text-[14px] font-bold text-slate-700">{payment.orderId}</div>
                    <div className="text-[14px] font-bold text-slate-700">{payment.customer}</div>
                    <div className="text-[14px] font-black text-slate-900">₹{(payment.amount || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${payment.method === 'UPI' ? 'bg-orange-50 text-orange-500' : payment.method === 'Card' ? 'bg-[#F8F7FF] text-[#A855F7]' : 'bg-emerald-50 text-emerald-500'}`}>
                        {payment.method === 'UPI' ? <Smartphone className="w-4 h-4" /> : payment.method === 'Card' ? <CreditCard className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-slate-900">{payment.method}</p>
                      </div>
                    </div>

                    <div>
                      {payment.status === "Successful" && (
                        <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[11px] font-black uppercase tracking-wider">Successful</span>
                      )}
                      {payment.status === "Pending" && (
                        <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-md text-[11px] font-black uppercase tracking-wider">Pending</span>
                      )}
                      {payment.status === "Failed" && (
                        <span className="inline-flex px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-md text-[11px] font-black uppercase tracking-wider">Failed</span>
                      )}
                      {payment.status === "Refunded" && (
                        <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[11px] font-black uppercase tracking-wider">Refunded</span>
                      )}
                    </div>

                    <div className="text-[13px] font-bold text-slate-700">{payment.date}</div>

                    <div className="text-right flex justify-end">
                      {payment.status === "Successful" ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleRefund(e, payment.id)}
                          className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs rounded-lg transition-colors"
                        >
                          Refund
                        </Button>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-300 mr-4">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {filteredPayments.length > 8 && !viewAll && (
            <div className="flex justify-center p-6 border-t border-slate-100">
              <Button onClick={() => setViewAll(true)} className="h-[44px] px-8 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:border-[#A855F7] hover:text-[#A855F7] shadow-sm hover:shadow-md transition-all">
                View All {filteredPayments.length} Payments
              </Button>
            </div>
          )}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!viewDetailsPayment} onOpenChange={(open) => !open && setViewDetailsPayment(null)}>
        <DialogContent className="max-w-md bg-[#FAFAFD] p-0 overflow-hidden border-0 shadow-2xl rounded-[2rem]">
          {viewDetailsPayment && (
            <>
              <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-10 pb-16 shrink-0 text-center flex flex-col items-center">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
                
                <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/20 shadow-inner flex items-center justify-center relative z-10 mb-4">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-4xl font-black text-white mb-2 relative z-10 tracking-tight">
                  ₹{(viewDetailsPayment.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </h3>
                <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 font-mono font-bold text-white text-[13px] relative z-10">
                  {viewDetailsPayment.transactionId}
                </div>
              </div>

              <div className="px-8 pb-8 -mt-8 relative z-20">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">Customer</span>
                    <span className="text-[15px] font-black text-slate-800">{viewDetailsPayment.customer}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">Method</span>
                    <span className="text-[15px] font-black text-slate-800">{viewDetailsPayment.method}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">Date</span>
                    <span className="text-[15px] font-black text-slate-800">{viewDetailsPayment.date}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">Order ID</span>
                    <span className="text-[15px] font-black text-slate-800">{viewDetailsPayment.orderId}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">Status</span>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${
                      viewDetailsPayment.status === 'Successful' ? 'bg-emerald-50 text-emerald-600' : 
                      viewDetailsPayment.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {viewDetailsPayment.status}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
