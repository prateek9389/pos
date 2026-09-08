"use client";

import { useState, useEffect } from "react";
import {
  Search, Filter, UtensilsCrossed, Package, Truck,
  ChevronRight, ChevronDown, Plus, Minus, Trash2, Armchair, Users,
  CreditCard, Save, PenLine, Printer
} from "lucide-react";
import { cashierService } from "@/services/cashierService";
import type { MenuItem, Table } from "@/services/cashierService";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

const DEFAULT_CATEGORIES = ["All", "Pizza", "Burger", "Pasta", "Beverages", "Desserts", "Sides", "Combo"];

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function CashierPOS() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [orderType, setOrderType] = useState("Dine In");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [guests, setGuests] = useState(4);
  const [orderNote, setOrderNote] = useState("");
  const [tempNote, setTempNote] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem("pos_cart");
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { }
    }
    const savedNote = localStorage.getItem("pos_note");
    if (savedNote) setOrderNote(savedNote);
    const savedTable = localStorage.getItem("pos_table");
    if (savedTable) setSelectedTable(savedTable);
    const savedGuests = localStorage.getItem("pos_guests");
    if (savedGuests) setGuests(Number(savedGuests));
    const savedDraftId = localStorage.getItem("pos_draft_id");
    if (savedDraftId) setDraftOrderId(savedDraftId);

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("pos_cart", JSON.stringify(cart));
      localStorage.setItem("pos_note", orderNote);
      localStorage.setItem("pos_table", selectedTable);
      localStorage.setItem("pos_guests", String(guests));
      if (draftOrderId) localStorage.setItem("pos_draft_id", draftOrderId);
      else localStorage.removeItem("pos_draft_id");
    }
  }, [cart, orderNote, selectedTable, guests, draftOrderId, isInitialized]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) {
        return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    toast.success(`${item.name} added to order`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.menuItem.id === id) {
        return { ...c, quantity: Math.max(1, c.quantity + delta) };
      }
      return c;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== id));
  };

  const clearOrder = () => {
    if (cart.length === 0) return;
    setCart([]);
    setOrderNote("");
    setDraftOrderId(null);
    localStorage.removeItem("pos_cart");
    localStorage.removeItem("pos_note");
    localStorage.removeItem("pos_draft_id");
    toast.info("Order cleared");
  };

  const subtotal = cart.reduce((sum, c) => sum + (c.menuItem.price * c.quantity), 0);
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const total = subtotal + cgst + sgst;
  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  useEffect(() => {
    let unsubscribeTables: (() => void) | undefined;

    const loadData = async () => {
      const [menuData, catData] = await Promise.all([
        cashierService.getMenu(),
        cashierService.getCategories()
      ]);
      setMenu(menuData);

      // Merge fetched categories with any unique categories from menu
      const menuCats = Array.from(new Set(menuData.map(m => m.category).filter(Boolean)));
      const combinedCats = Array.from(new Set([...catData, ...menuCats]));
      if (combinedCats.length > 1) {
        setCategories(combinedCats);
      }

      unsubscribeTables = await cashierService.subscribeToTables((tablesData) => {
        setTables(tablesData);
        setSelectedTable(prev => {
          if (prev && tablesData.some(t => t.name === prev || t.id === prev)) return prev;
          return tablesData[0]?.name || "T-01";
        });
      });
    };

    loadData();

    return () => {
      if (unsubscribeTables) unsubscribeTables();
    };
  }, []);

  useEffect(() => {
    if (!mounted || cart.length === 0) return;

    const saveDraft = async () => {
      const orderData = {
        orderType,
        tableId: selectedTable,
        guests,
        items: cart.map(c => ({
          id: Date.now().toString() + Math.random(),
          menuItemId: c.menuItem.id,
          name: c.menuItem.name,
          price: c.menuItem.price,
          quantity: c.quantity,
          isVeg: c.menuItem.isVeg,
          image: c.menuItem.image,
          specialInstructions: orderNote
        })),
        subtotal,
        discount: 0,
        tax: cgst + sgst,
        total,
        paymentMethod: "CASH",
        paymentStatus: "PENDING",
      };

      if (draftOrderId) {
        await cashierService.updateOrder(draftOrderId, orderData);
      } else {
        const newOrder = await cashierService.placeOrder(orderData);
        setDraftOrderId(newOrder.id!);
      }
    };

    const timer = setTimeout(() => {
      saveDraft();
    }, 1000);

    return () => clearTimeout(timer);
  }, [cart, orderType, selectedTable, guests, orderNote, mounted, draftOrderId, subtotal, cgst, sgst, total]);

  const filteredMenu = menu.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category.toUpperCase() === activeCategory.toUpperCase();
    return matchesCategory;
  });

  const handlePlaceOrder = async (status: 'PAID' | 'PENDING', method: string) => {
    try {
      const orderData = {
        orderType: orderType,
        tableId: selectedTable,
        guests: guests,
        items: cart.map(c => ({
          id: Date.now().toString() + Math.random(),
          menuItemId: c.menuItem.id,
          name: c.menuItem.name,
          price: c.menuItem.price,
          quantity: c.quantity,
          isVeg: c.menuItem.isVeg,
          image: c.menuItem.image,
          specialInstructions: orderNote
        })),
        subtotal,
        discount: 0,
        tax: cgst + sgst,
        total,
        paymentMethod: method,
        paymentStatus: status,
      };

      if (draftOrderId) {
        await cashierService.updateOrder(draftOrderId, orderData);
      } else {
        const newOrder = await cashierService.placeOrder(orderData);
        setDraftOrderId(newOrder.id!);
      }
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to save order");
      return false;
    }
  };

  return (
    <div className="h-[calc(100vh-70px)] flex flex-col lg:flex-row bg-[#F8F9FD] overflow-hidden font-sans print:h-auto print:block print:overflow-visible">

      {/* Left Main Content */}
      <div className="flex-1 flex flex-col pt-6 px-6 overflow-hidden print:hidden relative">

        {/* Top Controls Row */}
        <div className="flex gap-4 mb-6 shrink-0">

          {/* Order Types */}
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm shrink-0 h-11">
            {[
              { id: "Dine In", icon: UtensilsCrossed },
              { id: "Takeaway", icon: Package },
              { id: "Delivery", icon: Truck }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setOrderType(type.id)}
                className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-black transition-all h-full ${orderType === type.id
                    ? "bg-[#5D34F5] text-white"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <type.icon className="w-4 h-4" />
                {type.id}
              </button>
            ))}
          </div>


        </div>

        {/* Categories Row */}
        <div className="flex items-center gap-2 mb-6 shrink-0 overflow-x-auto hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 min-h-[44px] text-[13px] font-black rounded-xl whitespace-nowrap transition-colors border shadow-sm ${activeCategory === cat
                  ? "bg-[#5D34F5] text-white border-[#5D34F5]"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
              {cat}
            </button>
          ))}
          <button className="w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm shrink-0 ml-auto">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredMenu.map(item => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col group p-4 relative hover:border-[#5D34F5]/30 hover:shadow-md transition-all">
                {/* Veg Dot */}
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />

                <div className="h-32 mb-4 flex items-center justify-center rounded-xl overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" />
                </div>

                <h3 className="text-[14px] font-black text-slate-900 leading-tight mb-1 line-clamp-1">{item.name}</h3>
                <p className="text-[16px] font-black text-slate-900 mb-4">₹{item.price}</p>

                <div className="mt-auto flex items-center justify-between">
                  <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${item.isVeg ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="h-8 px-4 rounded-lg border border-[#E5DFFF] text-[#5D34F5] flex items-center justify-center hover:bg-[#F8F7FF] transition-colors text-[12px] font-black gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#F8F9FD]/90 backdrop-blur-sm border-t border-slate-200 px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-6">
            {[
              { key: 'F2', label: 'Hold Order' },
              { key: 'F3', label: 'Recall Order' },
              { key: 'F4', label: 'Quantity' },
              { key: 'F5', label: 'Payment' }
            ].map((shortcut) => (
              <div key={shortcut.key} className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-black text-slate-500 shadow-sm">{shortcut.key}</kbd>
                <span className="text-[13px] font-bold text-slate-700">{shortcut.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-bold text-slate-500">Items in order:</span>
            <div className="w-8 h-8 rounded-lg bg-[#5D34F5] text-white flex items-center justify-center text-[14px] font-black shadow-sm">
              {totalItems}
            </div>
          </div>
        </div>

      </div>

      {/* Right Sidebar - Order Cart */}
      <div className="w-full lg:w-[420px] h-[50vh] lg:h-auto bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shrink-0 print:hidden">

        {/* Header & Table Selection */}
        <div className="p-6 pb-4 border-b border-slate-100">
          <h2 className="text-[20px] font-black text-slate-900 tracking-tight mb-6">Current Order</h2>

          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-3 h-12 px-4 rounded-xl border border-slate-200 bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
              <Armchair className="w-4 h-4 text-slate-400" />
              <span className="text-[13px] font-bold text-slate-500">Table</span>
              <div className="flex-1 print:hidden">
                <Select value={selectedTable} onValueChange={(value) => setSelectedTable(value as string)}>
                  <SelectTrigger className="h-8 border-none bg-transparent px-2 text-[14px] font-black text-slate-900 shadow-none focus:ring-0 w-full justify-between">
                    <SelectValue placeholder="Select Table" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 min-w-[120px] max-h-60 overflow-y-auto">
                    {tables.length > 0 ? (
                      tables.map(t => (
                        <SelectItem key={t.id} value={t.name} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">
                          {t.name} ({t.seats} seats)
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="T-01" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">T-01</SelectItem>
                        <SelectItem value="T-02" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">T-02</SelectItem>
                        <SelectItem value="T-05" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">T-05</SelectItem>
                        <SelectItem value="T-08" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">T-08</SelectItem>
                        <SelectItem value="T-12" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">T-12</SelectItem>
                        <SelectItem value="T-15" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">T-15</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden print:block flex-1 text-right text-[14px] font-black text-slate-900 pr-2">
                {selectedTable}
              </div>
            </div>

            <div className="w-[140px] flex items-center gap-3 h-12 px-4 rounded-xl border border-slate-200 bg-white shadow-sm print:border-none print:shadow-none print:px-0">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="hidden print:inline text-[13px] font-bold text-slate-500">Guests</span>
              <div className="flex-1 flex items-center justify-between print:justify-end">
                <button onClick={() => setGuests(Math.max(1, guests - 1))} className="text-slate-400 hover:text-slate-900 print:hidden"><Minus className="w-3.5 h-3.5" /></button>
                <span className="text-[14px] font-black text-slate-900">{guests}</span>
                <button onClick={() => setGuests(guests + 1)} className="text-slate-400 hover:text-slate-900 print:hidden"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Items Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-60">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-[15px] font-black text-slate-900 mb-1">Your cart is empty</p>
              <p className="text-[13px] font-bold text-slate-500">Add items from the menu to start building an order.</p>
            </div>
          ) : (
            cart.map((cartItem) => (
              <div key={cartItem.menuItem.id} className="flex items-start gap-4">
                <img src={cartItem.menuItem.image || "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=200&auto=format&fit=crop"} alt={cartItem.menuItem.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-black text-slate-900 truncate">{cartItem.menuItem.name}</h4>
                  <p className="text-[12px] font-bold text-slate-500 truncate mt-0.5">Regular</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 px-2 py-1 border border-slate-200 rounded-lg print:border-none print:px-0">
                    <button onClick={() => updateQuantity(cartItem.menuItem.id, -1)} className="text-slate-400 hover:text-slate-900 print:hidden"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="text-[13px] font-black text-slate-900">{cartItem.quantity} <span className="hidden print:inline text-[11px] text-slate-500 font-bold ml-1">x ₹{cartItem.menuItem.price}</span></span>
                    <button onClick={() => updateQuantity(cartItem.menuItem.id, 1)} className="text-slate-400 hover:text-slate-900 print:hidden"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <span className="text-[14px] font-black text-slate-900 w-12 text-right">₹{cartItem.menuItem.price * cartItem.quantity}</span>
                  <button onClick={() => removeFromCart(cartItem.menuItem.id)} className="text-red-400 hover:text-red-600 transition-colors print:hidden"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}

          {orderNote ? (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Order Note</p>
                <p className="text-[13px] font-bold text-amber-900">{orderNote}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                <Dialog>
                  <DialogTrigger
                    onClick={() => setTempNote(orderNote)}
                    className="text-[12px] font-black text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    Edit
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-0">
                    <div className="bg-[#5D34F5] p-6 text-white text-center">
                      <DialogTitle className="text-xl font-black mb-1 text-white">Order Note</DialogTitle>
                      <p className="text-purple-200 text-[13px] font-medium">Add special instructions for the kitchen</p>
                    </div>
                    <div className="p-6">
                      <textarea
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        placeholder="E.g. No onions, extra spicy, allergy to peanuts..."
                        className="w-full h-32 p-4 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] resize-none"
                      />
                      <div className="flex justify-end gap-3 mt-4">
                        <DialogClose className="px-5 py-2.5 text-[14px] font-black text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</DialogClose>
                        <DialogClose
                          onClick={() => setOrderNote(tempNote)}
                          className="px-5 py-2.5 bg-[#5D34F5] text-white text-[14px] font-black rounded-xl hover:bg-[#4B28C9] transition-colors shadow-sm shadow-purple-200"
                        >
                          Save Note
                        </DialogClose>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <button onClick={() => setOrderNote("")} className="text-[12px] font-black text-red-500 hover:text-red-700 transition-colors">Remove</button>
              </div>
            </div>
          ) : (
            <Dialog>
              <DialogTrigger
                onClick={() => setTempNote("")}
                className="text-[#5D34F5] text-[13px] font-black flex items-center gap-2 hover:opacity-80 transition-opacity mt-4 outline-none print:hidden"
              >
                <Plus className="w-4 h-4" />
                Add Order Note
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-0">
                <div className="bg-[#5D34F5] p-6 text-white text-center">
                  <DialogTitle className="text-xl font-black mb-1 text-white">Order Note</DialogTitle>
                  <p className="text-purple-200 text-[13px] font-medium">Add special instructions for the kitchen</p>
                </div>
                <div className="p-6">
                  <textarea
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    placeholder="E.g. No onions, extra spicy, allergy to peanuts..."
                    className="w-full h-32 p-4 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] resize-none"
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <DialogClose className="px-5 py-2.5 text-[14px] font-black text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</DialogClose>
                    <DialogClose
                      onClick={() => setOrderNote(tempNote)}
                      className="px-5 py-2.5 bg-[#5D34F5] text-white text-[14px] font-black rounded-xl hover:bg-[#4B28C9] transition-colors shadow-sm shadow-purple-200"
                    >
                      Save Note
                    </DialogClose>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Bottom Summary & Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-100">

          <div className="space-y-2.5 mb-5 text-[13px]">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">Subtotal</span>
              <span className="font-black text-slate-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">CGST (2.5%)</span>
              <span className="font-black text-slate-900">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">SGST (2.5%)</span>
              <span className="font-black text-slate-900">₹{sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">Service Charge <span className="inline-block w-3 h-3 rounded-full border border-slate-300 text-center text-[8px] leading-none text-slate-400 ml-1 pb-0.5">i</span></span>
              <span className="font-black text-slate-900">₹0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">Discount</span>
              <span className="font-black text-emerald-500">-₹0.00</span>
            </div>
          </div>

          <div className="bg-[#F8F7FF] rounded-2xl p-4 flex justify-between items-center mb-6">
            <span className="text-[18px] font-black text-slate-900">Total</span>
            <span className="text-[24px] font-black text-slate-900">₹{total.toFixed(2)}</span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full h-14 rounded-xl bg-[#5D34F5] text-white flex items-center justify-center gap-2 font-black text-[15px] shadow-lg shadow-[#5D34F5]/30 hover:bg-[#4A2ABF] disabled:opacity-50 disabled:pointer-events-none transition-colors mb-3 print:hidden"
          >
            <CreditCard className="w-5 h-5" />
            Proceed to Payment
          </button>

          <div className="flex gap-2 print:hidden">
            <button
              disabled={cart.length === 0}
              onClick={() => {
                toast.success("Printing bill...");
                window.print();
              }}
              className="flex-1 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-1.5 text-slate-700 font-black text-[12px] sm:text-[13px] hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 shrink-0" />
              Print
            </button>
            <button
              disabled={cart.length === 0}
              onClick={async () => {
                const success = await handlePlaceOrder("PENDING", "Cash");
                if (success) {
                  toast.success("Order saved successfully");
                  clearOrder();
                }
              }}
              className="flex-1 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-1.5 text-[#5D34F5] font-black text-[12px] sm:text-[13px] hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
            >
              <Save className="w-4 h-4 shrink-0" />
              Save
            </button>
            <button
              disabled={cart.length === 0}
              onClick={clearOrder}
              className="flex-1 h-12 rounded-xl border border-red-200 bg-white flex items-center justify-center gap-1.5 text-red-500 font-black text-[12px] sm:text-[13px] hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              Clear
            </button>
          </div>
        </div>

      </div>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-8 border-0 shadow-2xl flex flex-col items-center justify-center text-center print:hidden">
          <DialogTitle className="text-2xl font-black text-slate-900 mb-2">Scan to Pay</DialogTitle>
          <p className="text-slate-500 font-medium mb-8">Amount to pay: <strong className="text-slate-900 text-lg">₹{total.toFixed(2)}</strong></p>

          <div className="w-56 h-56 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center shadow-inner mb-8 p-4">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=restaurant@bank&pn=FoodiePOS&am=${total.toFixed(2)}&cu=INR`} alt="QR Code" className="w-full h-full object-contain" />
          </div>

          <div className="flex flex-col w-full gap-3">
            <button className="w-full h-14 rounded-xl bg-slate-900 text-white font-black text-[15px] hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-md" onClick={async () => {
              const success = await handlePlaceOrder("PAID", "UPI");
              if (success) {
                toast.success("Payment Received & Order Saved! Printing bill...");
                setTimeout(() => {
                  window.print();
                  setTimeout(() => {
                    setIsPaymentModalOpen(false);
                    clearOrder();
                  }, 500);
                }, 100);
              }
            }}>
              <Printer className="w-5 h-5" />
              Confirm & Print Bill
            </button>
            <div className="flex gap-3 w-full">
              <button className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </button>
              <button className="flex-1 h-12 rounded-xl bg-[#5D34F5] text-white font-bold hover:bg-[#4A2ABF] transition-colors" onClick={async () => {
                const success = await handlePlaceOrder("PAID", "UPI");
                if (success) {
                  toast.success("Payment Received Successfully!");
                  setIsPaymentModalOpen(false);
                  clearOrder();
                }
              }}>
                Confirm Only
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Printable Receipt (Only visible during print) */}
      <style>{`
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 15px;
            background: white;
            color: black;
            font-family: monospace;
          }
          [data-sonner-toaster], #sonner-toaster, .sonner-toast { display: none !important; }
        }
      `}</style>
      <div id="printable-receipt" className="hidden print:block text-[12px] m-0">
        <h1 className="text-center font-bold text-2xl mb-1">Foodie Cafe</h1>
        <p className="text-center text-[10px] mb-4 text-slate-500">
          Date: {mounted ? `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}
        </p>

        <div className="flex justify-between mb-3 text-[13px] font-bold">
          <span>Table: {selectedTable}</span>
          <span>Guests: {guests}</span>
        </div>

        <div className="border-t border-b border-dashed border-slate-400 py-2 mb-2 space-y-1">
          <div className="flex justify-between font-bold text-[14px] mb-2 pb-1 border-b border-dashed border-slate-300">
            <span>Item</span>
            <span>Amt</span>
          </div>
          {cart.map(c => (
            <div key={c.menuItem.id} className="flex justify-between text-[13px]">
              <span>{c.quantity}x {c.menuItem.name}</span>
              <span>₹{(c.menuItem.price * c.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-0.5 mb-2 mt-3 text-[13px]">
          <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>CGST (2.5%):</span><span>₹{cgst.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>SGST (2.5%):</span><span>₹{sgst.toFixed(2)}</span></div>
        </div>
        <div className="flex justify-between font-black text-lg border-t border-dashed border-slate-400 pt-2 mt-2">
          <span>Total:</span><span>₹{total.toFixed(2)}</span>
        </div>

        <p className="text-center font-bold mt-8 text-[13px]">Thank you for dining with us!</p>
      </div>
    </div>
  );
}
