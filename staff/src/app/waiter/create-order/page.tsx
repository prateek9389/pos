"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Plus, Minus, ArrowLeft, Trash2, Users, 
  ShoppingBag, UtensilsCrossed, Bike, ShoppingCart, 
  Bookmark, Pause, Heart, SlidersHorizontal, ClipboardList, Tag, Armchair 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { waiterService } from "@/services/waiterService";
import type { MenuItem, OrderItem, Table } from "@/services/cashierService";
import { FoodCustomizationModal } from "@/components/waiter/FoodCustomizationModal";
import { toast } from "sonner";


export default function CreateOrder() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [guests, setGuests] = useState(4);
  const [orderType, setOrderType] = useState("Dine In");
  
  // Cart state
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  // Customization modal state
  const [selectedFood, setSelectedFood] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Customer Modal
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [customerData, setCustomerData] = useState({ name: "", phone: "", email: "" });
  const [tableId, setTableId] = useState("");
  const [tableName, setTableName] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tId = params.get("tableId");
    const tName = params.get("tableName");
    if (tId) setTableId(tId);
    if (tName) setTableName(tName);
  }, []);

  const handleSaveCustomer = () => {
    if (!customerData.name || !customerData.phone) {
      toast.error("Name and Phone are required.");
      return;
    }
    toast.success("Customer added successfully!");
    setIsNewCustomerOpen(false);
    setCustomerData({ name: "", phone: "", email: "" });
  };

  useEffect(() => {
    let unsubscribe = () => {};
    const loadCategories = async () => {
      const categoryData = await waiterService.getCategories();
      setCategories(categoryData);
    };
    
    loadCategories();
    
    waiterService.subscribeToMenu((items) => {
      setMenu(items);
    }).then((unsub: any) => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredMenu = menu.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category.toUpperCase() === activeCategory.toUpperCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });


  const handleFoodClick = (item: MenuItem) => {
    setSelectedFood(item);
    setIsModalOpen(true);
  };

  const handleAddToCart = (orderItem: OrderItem) => {
    setCart(prev => [...prev, orderItem]);
    setIsModalOpen(false);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.05;
  const serviceCharge = subtotal * 0.02;
  const total = subtotal + gst + serviceCharge;

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    toast.success("Order sent to kitchen successfully!", {
      description: `Table ${tableName || "Walk-in"} • ${cart.length} items`,
    });
    console.log("Sending order to kitchen:", { cart, total, tableId: tableId || "Walk-in", guests });
    router.push("/waiter/orders");
  };



  return (
    <div className="h-full flex flex-col bg-white -mx-4 lg:-mx-8 -my-4 lg:-my-8 font-sans">
      
      {/* Top Controls Row (Full Width) */}
      <div className="p-6 border-b border-slate-100 shrink-0 bg-white z-10 flex flex-col xl:flex-row gap-6">
        {/* Order Type Tabs */}
        <div className="flex p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 shrink-0 w-full xl:w-auto h-[68px]">
          {["Dine In", "Takeaway", "Delivery"].map(type => {
            const isActive = orderType === type;
            let Icon = UtensilsCrossed;
            if (type === "Takeaway") Icon = ShoppingBag;
            if (type === "Delivery") Icon = Bike;
            
            return (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex flex-1 xl:flex-none items-center justify-center gap-2 px-6 rounded-xl text-[13px] font-black transition-all duration-200 ${
                  isActive 
                    ? "bg-white text-[#5D34F5] shadow-[0_2px_10px_rgba(0,0,0,0.06)]" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {type}
              </button>
            )
          })}
        </div>

        {/* Guests & Customer */}
        <div className="flex-1 bg-[#F8F7FF] rounded-[20px] p-2.5 flex flex-col md:flex-row md:items-center gap-3 border border-[#E5DFFF] min-h-[68px]">
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm shrink-0">
            <span className="text-[12px] font-bold text-slate-500 mr-1">Guests</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-lg bg-slate-50 border border-slate-100"><Minus className="w-3.5 h-3.5" /></button>
              <span className="font-black text-[14px] text-slate-900 w-4 text-center">{guests}</span>
              <button onClick={() => setGuests(guests + 1)} className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-lg bg-slate-50 border border-slate-100"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 justify-end">
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5D34F5]/50" />
              <input 
                placeholder="Search customer..." 
                className="w-full h-[44px] pl-10 pr-4 bg-white/60 border border-slate-200/60 rounded-xl text-[13px] font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-[#5D34F5]/30 focus:ring-2 focus:ring-[#5D34F5]/10 transition-all placeholder:text-slate-400" 
              />
            </div>
            
            <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
              <DialogTrigger>
                <div className="h-[44px] px-5 font-black text-white bg-[#5D34F5] rounded-xl hover:bg-[#4A2ABF] shadow-md shadow-[#5D34F5]/20 transition-all flex items-center gap-2 text-[13px] shrink-0 cursor-pointer">
                  <Plus className="w-4 h-4" />
                  New
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900">Add New Customer</DialogTitle>
                </DialogHeader>
                <div className="grid gap-5 py-4">
                  <div className="grid gap-2">
                    <label className="text-[13px] font-bold text-slate-700">Full Name</label>
                    <input 
                      value={customerData.name} 
                      onChange={e => setCustomerData({...customerData, name: e.target.value})} 
                      placeholder="e.g. John Doe" 
                      className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-[13px] font-bold text-slate-700">Phone Number</label>
                    <input 
                      value={customerData.phone} 
                      onChange={e => setCustomerData({...customerData, phone: e.target.value})} 
                      placeholder="e.g. +91 9876543210" 
                      className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-[13px] font-bold text-slate-700">Email Address (Optional)</label>
                    <input 
                      value={customerData.email} 
                      onChange={e => setCustomerData({...customerData, email: e.target.value})} 
                      placeholder="e.g. john@example.com" 
                      className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all" 
                    />
                  </div>
                </div>
                <DialogFooter className="mt-2">
                  <DialogClose>
                    <div className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-black text-[13px] hover:bg-slate-50 transition-colors flex items-center cursor-pointer">Cancel</div>
                  </DialogClose>
                  <button 
                    onClick={handleSaveCustomer}
                    className="h-11 px-5 rounded-xl bg-[#5D34F5] text-white font-black text-[13px] shadow-lg shadow-[#5D34F5]/30 hover:bg-[#4A2ABF] transition-colors"
                  >
                    Save Customer
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Area: Menu Browsing */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          
          <div className="p-6 shrink-0 space-y-6">

            {/* Menu Search & Categories */}
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-5 py-2.5 text-[13px] font-black rounded-full whitespace-nowrap transition-colors border ${
                      activeCategory === category 
                        ? "bg-[#5D34F5] text-white border-[#5D34F5]" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Food Grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMenu.map(item => (
                <div 
                  key={item.id} 
                  className="bg-white border border-slate-200 rounded-[20px] overflow-hidden group hover:border-[#5D34F5] hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    {/* Tags overlay */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest text-[#5D34F5] uppercase shadow-sm">
                      {item.category}
                    </div>
                    
                    <button 
                      onClick={() => toast.success(`${item.name} added to favorites!`)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                    >
                       <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="p-4 bg-white relative">
                    <h3 className="font-black text-[15px] text-slate-900 leading-tight mb-3 truncate">{item.name}</h3>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-slate-900 text-[18px] leading-none">₹{item.price}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-[#10B981]' : 'bg-red-500'}`} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleFoodClick(item)}
                        className="w-10 h-10 rounded-full bg-[#5D34F5] text-white flex items-center justify-center hover:bg-[#4A2ABF] shadow-md shadow-[#5D34F5]/20 transition-all hover:scale-105"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Combo Banner */}
            <div className="mt-8 bg-[#FFF4E5] rounded-[24px] p-6 flex flex-col sm:flex-row items-center justify-between border border-[#FFE2B8] relative overflow-hidden">
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 flex items-center justify-center shrink-0">
                  <Tag className="w-6 h-6 text-[#F97316]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-900 mb-1">Make it a combo!</h3>
                  <p className="text-[13px] font-bold text-slate-600">Add any burger + fries + cold drink and get 10% off</p>
                </div>
              </div>
              
              <button 
                onClick={() => toast.info("Combo deals will be available in the next update!")}
                className="mt-4 sm:mt-0 relative z-10 px-6 h-11 rounded-xl bg-[#F97316] text-white text-[13px] font-black hover:bg-[#EA580C] shadow-lg shadow-[#F97316]/20 transition-colors flex items-center gap-2 shrink-0"
              >
                <Tag className="w-4 h-4" />
                View Combos
              </button>
            </div>
          </div>
        </div>

        {/* Right Area: Current Order Panel */}
        <div className="w-full lg:w-[420px] bg-white flex flex-col shrink-0 border-l border-slate-100 h-[50vh] lg:h-auto z-10 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="p-6 pb-4 flex flex-col gap-3 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-black text-slate-900">Current Order</h2>
              {cart.length > 0 && (
                <button 
                  onClick={() => setCart([])}
                  className="flex items-center gap-1.5 text-[12px] font-black text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>
            
            <Dialog open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
              <DialogTrigger>
                {tableName ? (
                  <div className="flex items-center gap-2.5 bg-[#5D34F5]/5 border border-[#5D34F5]/10 rounded-xl p-2.5 hover:bg-[#5D34F5]/10 transition-colors cursor-pointer w-full text-left group">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                      <Armchair className="w-4 h-4 text-[#5D34F5]" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-[10px] font-black text-[#5D34F5]/70 uppercase tracking-widest leading-none mb-1">Selected Table</span>
                      <span className="font-black text-[14px] text-[#5D34F5] leading-none">{tableName}</span>
                    </div>
                    <div className="text-[10px] font-bold text-[#5D34F5]/50 uppercase px-2 py-1 bg-white rounded border border-[#5D34F5]/10 shrink-0">Change</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-2.5 hover:bg-slate-100 transition-colors cursor-pointer w-full text-left group">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0 border border-slate-200 group-hover:scale-110 transition-transform">
                      <Plus className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">No Table Selected</span>
                      <span className="font-bold text-[13px] text-slate-600 leading-none">Walk-in Order</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 bg-white rounded border border-slate-200 shrink-0">Select</div>
                  </div>
                )}
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden border-0 shadow-2xl">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <DialogTitle className="text-[20px] font-black text-slate-900">Select a Table</DialogTitle>
                  <p className="text-[13px] font-bold text-slate-500 mt-1">Assign this order to a specific table</p>
                </div>
                <div className="p-6 grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
                  <div 
                    onClick={() => {
                      setTableId("");
                      setTableName("");
                      setOrderType("Takeaway"); // Or default
                      
                      // Update URL
                      const newUrl = new URL(window.location.href);
                      newUrl.searchParams.delete("tableId");
                      newUrl.searchParams.delete("tableName");
                      window.history.replaceState({}, '', newUrl);
                      
                      setIsTableModalOpen(false);
                    }}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${!tableId ? "border-[#5D34F5] bg-[#5D34F5]/5" : "border-slate-100 bg-white hover:border-slate-200"}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Search className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="font-black text-slate-900 text-[14px]">Walk-in</span>
                  </div>
                  {tables.map(table => (
                    <div 
                      key={table.id}
                      onClick={() => {
                        setTableId(table.id);
                        setTableName(table.name);
                        setGuests(table.seats);
                        setOrderType("Dine In");
                        
                        // Update URL
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.set("tableId", table.id);
                        newUrl.searchParams.set("tableName", table.name);
                        window.history.replaceState({}, '', newUrl);
                        
                        setIsTableModalOpen(false);
                      }}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        tableId === table.id ? "border-[#5D34F5] bg-[#5D34F5]/5" : "border-slate-100 bg-white hover:border-slate-200"
                      } ${table.status !== "AVAILABLE" && tableId !== table.id ? "opacity-50" : ""}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tableId === table.id ? "bg-[#5D34F5] text-white" : "bg-slate-100 text-slate-500"}`}>
                        <Armchair className="w-5 h-5" />
                      </div>
                      <span className="font-black text-slate-900 text-[14px]">{table.name}</span>
                      {table.status !== "AVAILABLE" && tableId !== table.id && (
                        <span className="text-[10px] font-bold text-red-500 uppercase mt-[-4px]">{table.status}</span>
                      )}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4 min-h-[300px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center pt-10">
                <div className="w-24 h-24 bg-[#F5F3FF] rounded-full flex items-center justify-center mb-6 relative">
                  <ClipboardList className="w-10 h-10 text-[#C4B5FD]" />
                  <div className="absolute top-2 right-2 text-[#A78BFA] text-xl">✨</div>
                </div>
                <h3 className="text-[18px] font-black text-slate-900 mb-2">Your order is empty</h3>
                <p className="text-[13px] font-bold text-slate-500 max-w-[200px] mx-auto">Add items from the menu to get started</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-[70px] h-[70px] bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-slate-900 text-[14px] leading-tight pr-2">{item.name}</h4>
                        <span className="font-black text-slate-900 text-[14px]">₹{item.price * item.quantity}</span>
                      </div>
                      {(item.selectedSize || item.selectedAddons?.length) && (
                        <p className="text-[11px] font-bold text-slate-500 mt-1">
                          {item.selectedSize && `${item.selectedSize}`}
                          {item.selectedSize && item.selectedAddons?.length ? ' • ' : ''}
                          {item.selectedAddons?.map(a => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-md"><Minus className="w-3 h-3" /></button>
                        <span className="font-black text-[12px] w-4 text-center text-slate-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-md"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                         <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>

            {/* Summary Footer */}
            <div className="p-6 bg-white shrink-0 border-t border-slate-100">
             <div className="bg-slate-50 rounded-[20px] p-5 space-y-3 mb-6">
                <div className="flex justify-between text-[13px] font-bold text-slate-500">
                  <span>Subtotal</span>
                  <span className="text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px] font-bold text-slate-500">
                  <span>GST (5%)</span>
                  <span className="text-slate-900">₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px] font-bold text-slate-500 pb-3 border-b border-dashed border-slate-300">
                  <span>Service Charge (2%)</span>
                  <span className="text-slate-900">₹{serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end pt-1">
                  <span className="text-[16px] font-black text-slate-900">Total</span>
                  <span className="text-[24px] font-black text-[#5D34F5] leading-none">₹{total.toFixed(2)}</span>
                </div>
             </div>

             <div className="space-y-3">
               <Button 
                 onClick={handleSendToKitchen}
                 disabled={cart.length === 0}
                 className="w-full h-14 text-[15px] font-black rounded-2xl bg-[#5D34F5] hover:bg-[#4A2ABF] shadow-lg shadow-[#5D34F5]/20 flex items-center justify-center gap-2 transition-all"
               >
                 <ShoppingCart className="w-5 h-5" />
                 Review Order <span className="ml-1 opacity-70">&gt;</span>
               </Button>
               
               <div className="flex gap-3">
                 <button 
                   onClick={() => toast.success("Order saved as draft!")}
                   className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 text-slate-600 text-[13px] font-black hover:bg-slate-50 transition-colors"
                 >
                   <Bookmark className="w-4 h-4 text-[#5D34F5]" />
                   Save Order
                 </button>
                 <button 
                   onClick={() => toast.success("Order placed on hold!")}
                   className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 text-slate-600 text-[13px] font-black hover:bg-slate-50 transition-colors"
                 >
                   <Pause className="w-4 h-4 text-[#5D34F5]" />
                   Hold Order
                 </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedFood && (
        <FoodCustomizationModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          food={selectedFood}
          onAdd={handleAddToCart}
        />
      )}
    </div>
  );
}
