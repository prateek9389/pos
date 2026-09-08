"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Star, Heart, LayoutGrid, Pizza, Coffee, UtensilsCrossed, Package, Utensils, Cake, ChefHat, ChevronDown, LayoutList, Check, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useCartStore } from "@/lib/cart-store";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useBranchStore } from "@/lib/branch-store";

const getCategoryIcon = (id: string, isActive: boolean) => {
  const className = `w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-primary"}`;
  switch (id) {
    case 'all': return <LayoutGrid className={className} />;
    case 'pizza': return <Pizza className={className} />;
    case 'burger': return <Utensils className={className} />;
    case 'pasta': return <UtensilsCrossed className={className} />;
    case 'beverages': return <Coffee className={className} />;
    case 'desserts': return <Cake className={className} />;
    case 'sides': return <UtensilsCrossed className={className} />;
    case 'combo': return <Package className={className} />;
    default: return <Utensils className={className} />;
  }
};

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [maxPrice, setMaxPrice] = useState(1000);
  const [dietPrefs, setDietPrefs] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);

  const { selectedBranchId } = useBranchStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { items: cartItems, addItem, updateQuantity, removeItem } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    const fetchMenuData = async () => {
      if (!selectedBranchId) return;
      
      setIsLoading(true);
      try {
        const catSnap = await getDocs(collection(db, "menuCategories"));
        const cats: any[] = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Add an 'all' category at the beginning
        cats.unshift({ id: 'all', name: 'All Menu', description: 'Everything' });
        setCategories(cats);
        
        const q = query(
          collection(db, "menuItems"),
          where("available", "==", true)
        );
        const itemSnap = await getDocs(q);
        const items = itemSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(item => !item.branchId || item.branchId === selectedBranchId);
        setMenuItems(items);
        
      } catch (error) {
        console.error("Error fetching menu data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMenuData();
  }, [selectedBranchId]);

  const filteredItems = menuItems.filter(item => {
    if (activeCategory !== "all") {
      const catObj = categories.find(c => c.id === activeCategory);
      if (!catObj) return false;
      if (item.categoryId !== activeCategory) {
        if (!(item.name?.toLowerCase().includes(catObj.name.toLowerCase()) || 
            catObj.name.toLowerCase().includes(item.name?.toLowerCase().split(" ")[0]))) {
          return false;
        }
      }
    }
    
    if (item.price > maxPrice) return false;
    
    if (dietPrefs.length > 0) {
      if (dietPrefs.includes("Veg") && !item.isVeg) return false;
      if (dietPrefs.includes("Non-Veg") && item.isVeg) return false;
      // You can add more specific logic for Vegan/Gluten Free if those properties exist on items
    }
    
    if (minRating && (item.rating || 0) < minRating) return false;
    
    return true;
  });

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      foodId: item.id,
      name: item.name,
      price: item.price,
      originalBasePrice: item.price,
      quantity: 1,
      image: item.image
    });
  };

  return (
    <div className="flex flex-col bg-slate-50 font-sans min-h-[calc(100vh-70px)]">
      {/* Main Content Area */}
      <div className="flex-1 p-4 lg:p-8 relative isolate w-full" ref={scrollRef}>
        
        {/* Header section in main content */}
        <div className="flex flex-col lg:flex-row mb-8 relative z-10 w-full overflow-hidden rounded-[2.5rem] bg-[#5B2EFF] p-8 shadow-2xl shadow-[#5B2EFF]/30">
          
          {/* Decorative blur blobs */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-100px] left-[20%] w-48 h-48 bg-[#FFB020]/20 rounded-full blur-[60px]" />

          <div className="w-full lg:w-1/2 self-center z-10 py-6 pl-2 lg:pl-6 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Premium Quality</span>
            </div>
            <h2 className="text-4xl md:text-[3.5rem] font-black text-white tracking-tight leading-none mb-4 drop-shadow-sm">
              Our Menu
            </h2>
            <p className="text-indigo-100 font-medium text-lg lg:text-xl max-w-md leading-relaxed">
              Discover delicious food crafted with love, passion, and the freshest ingredients.
            </p>
          </div>
          
          <div className="hidden lg:block w-1/2 absolute top-0 right-0 h-full overflow-hidden rounded-r-[2.5rem]">
            <div className="absolute inset-0">
              <Image 
                src="https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&auto=format&fit=crop&q=80" 
                alt="Delicious Pasta" 
                fill 
                className="object-cover"
              />
              {/* gradient overlay to fade left side into background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#5B2EFF] via-[#5B2EFF]/80 to-transparent w-full" />
              <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent w-1/2 right-0" />
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B2EFF]"></div>
          </div>
        ) : (
          <>
            {/* Main 2-column layout */}
            <div className="flex flex-col-reverse lg:flex-row gap-8 items-start">
              
              {/* Left Column - Grid */}
              <div className="flex-1 flex flex-col min-w-0">
                
                {/* Categories Bar */}
                <div className="flex overflow-x-auto gap-3 lg:gap-4 mb-8 hide-scrollbar relative z-10 pb-2 snap-x">
                  {categories.map((category) => {
                    const isActive = activeCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className={`group flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-3 lg:py-4 rounded-2xl transition-all duration-300 snap-start shrink-0 ${
                          isActive 
                            ? 'bg-[#5B2EFF] shadow-lg shadow-[#5B2EFF]/30 text-white scale-[1.02]' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 shadow-[0_2px_10px_rgb(0,0,0,0.02)]'
                        }`}
                      >
                        <div className={`p-2 lg:p-2.5 rounded-xl transition-colors ${
                          isActive ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-white'
                        }`}>
                          {getCategoryIcon(category.id, isActive)}
                        </div>
                        <span className="font-bold text-sm lg:text-[15px] tracking-wide whitespace-nowrap">{category.name}</span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Sort and View toggles */}
                <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500 font-medium">Sort by:</span>
                <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                  Popularity <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <div className="hidden sm:flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                <button className="flex items-center gap-2 bg-[#5B2EFF]/10 px-5 py-1.5 rounded-full text-sm font-bold text-[#5B2EFF] transition-colors">
                  <LayoutGrid className="w-4 h-4" /> Grid View
                </button>
                <button className="flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
                  <LayoutList className="w-4 h-4" /> List View
                </button>
              </div>
            </div>

            {/* Grid */}
            <AnimatePresence mode="popLayout">
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 relative z-10 pb-10">
                  {filteredItems.map((item, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -20 }}
                      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                      key={item.id}
                      className="h-full"
                    >
                      <Card className="rounded-[1.5rem] border border-slate-200 shadow-[0_2px_15px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:border-slate-300 transition-all duration-300 overflow-hidden bg-white h-full flex flex-col group p-2 relative">
                        <Link href={`/food/${item.id}`} className="flex flex-col h-full w-full cursor-pointer relative z-0">
                        <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden rounded-[1.2rem]">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-slate-900/10 to-transparent opacity-80" />
                          
                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex gap-2 z-10">
                            {item.isVeg !== undefined && (
                              <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${item.isVeg ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {item.isVeg ? 'VEG' : 'NON-VEG'}
                              </span>
                            )}
                          </div>
                          
                          {/* Heart Button */}
                          <button 
                            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:bg-rose-500 hover:scale-110 group/btn border border-white/10"
                            onClick={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              toggleWishlist(item.id);
                            }}
                          >
                            <Heart className={`w-4 h-4 transition-colors duration-300 ${mounted && isInWishlist(item.id) ? 'fill-white text-white' : 'text-white'}`} />
                          </button>

                          <div className="absolute bottom-3 left-3 flex gap-2 z-10">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-800 shadow-sm border border-slate-100">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {item.rating}
                            </span>
                          </div>
                        </div>
                        
                        <CardContent className="p-4 flex flex-col flex-1 bg-transparent px-2 pb-2">
                          <h3 className="font-bold text-[17px] text-slate-900 mb-1.5 group-hover:text-[#5B2EFF] transition-colors duration-300 line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-[13px] text-slate-500 font-medium line-clamp-2 mb-4 flex-1">
                            {item.description}
                          </p>
                          
                          <div className="flex justify-between items-center mt-auto pt-2">
                            <div className="font-black text-[18px] text-slate-900 tracking-tight">₹{item.price}</div>
                            <div className="flex items-center gap-2 relative z-20">
                              <Button 
                                size="sm" 
                                className="rounded-[0.8rem] font-bold px-4 bg-[#5B2EFF]/10 text-[#5B2EFF] hover:bg-[#5B2EFF]/20 hover:text-[#5B2EFF] h-9 border-0 shadow-none transition-colors"
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation();
                                  handleAddToCart(item);
                                }}
                              >
                                <span className="mr-1 text-base leading-none font-medium">+</span> Add
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                        </Link>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm"
                >
                  <Search className="w-10 h-10 text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No items found</h3>
                  <p className="text-slate-500 font-medium text-sm">Try selecting a different category.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Sidebar */}
          <div className="w-full lg:w-[320px] xl:w-[350px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-24 pb-6">
            
            {/* Your Order Card */}
            <Card className="shrink-0 rounded-[1.5rem] border border-slate-200 shadow-sm p-6 overflow-hidden bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#5B2EFF]/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[#5B2EFF]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-none">Your Order</h3>
                  <p className="text-xs text-slate-500 mt-1.5 font-medium">{cartItems.length} items in cart</p>
                </div>
              </div>
              
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-28 h-28 relative mb-2">
                    <div className="absolute inset-0 bg-[#5B2EFF]/5 rounded-full blur-2xl opacity-70"></div>
                    <div className="relative w-full h-full rounded-full flex items-center justify-center">
                      <Image src="https://illustrations.popsy.co/amber/basket.svg" alt="Empty Cart" width={80} height={80} className="opacity-80 drop-shadow-md grayscale-[20%]" />
                    </div>
                  </div>
                  <h4 className="font-bold text-[#5B2EFF] mb-1">Your cart is empty</h4>
                  <p className="text-xs text-slate-500 font-medium">Add items from the menu</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex flex-col gap-3 pr-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm border-b border-slate-50 pb-3">
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden relative shrink-0 bg-slate-100 border border-slate-100 shadow-sm">
                          <Image src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} alt={item.name} fill className="object-cover" />
                        </div>
                        {/* Details */}
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-700 font-medium leading-tight">{item.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <button onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)} className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                              <span className="text-xs font-bold leading-none -mt-0.5">-</span>
                            </button>
                            <span className="text-xs font-bold w-3 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-5 h-5 bg-[#5B2EFF]/10 rounded-full flex items-center justify-center text-[#5B2EFF] hover:bg-[#5B2EFF]/20 transition-colors">
                              <span className="text-xs font-bold leading-none -mt-0.5">+</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                        <button onClick={() => removeItem(item.id)} className="text-[10px] text-red-500 font-bold hover:underline">Remove</button>
                      </div>
                    </div>
                  ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 mb-4">
                    <span className="text-slate-500 font-medium text-sm">Total</span>
                    <span className="font-black text-slate-900 text-lg">
                      ₹{cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)}
                    </span>
                  </div>
                  <Link href="/cart">
                    <Button className="w-full bg-[#5B2EFF] hover:bg-[#5B2EFF]/90 text-white rounded-xl h-11 font-bold shadow-md shadow-[#5B2EFF]/25 transition-all">
                      Proceed to Checkout
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Filter by Card */}
            <Card className="shrink-0 rounded-[1.5rem] border border-slate-200 shadow-sm p-6 bg-white">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg text-slate-900">Filter by</h3>
                <button 
                  onClick={() => { setMaxPrice(1000); setDietPrefs([]); setMinRating(null); }}
                  className="text-xs font-bold text-[#5B2EFF] hover:underline"
                >
                  Clear All
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-slate-800 mb-5">Max Price</h4>
                <div className="relative mb-4 pt-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="2000" 
                    step="50"
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#5B2EFF]"
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>₹0</span>
                  <span className="text-[#5B2EFF] font-bold text-sm">₹{maxPrice}</span>
                </div>
              </div>

              {/* Dietary Preference */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-slate-800 mb-4">Dietary Preference</h4>
                <div className="grid grid-cols-2 gap-4">
                  {["Veg", "Non-Veg", "Vegan", "Gluten Free"].map((diet) => {
                    const isActive = dietPrefs.includes(diet);
                    return (
                      <label key={diet} className="flex items-center gap-2.5 cursor-pointer group" onClick={(e) => {
                        e.preventDefault();
                        if (isActive) setDietPrefs(dietPrefs.filter(d => d !== diet));
                        else setDietPrefs([...dietPrefs, diet]);
                      }}>
                        <div className={`w-5 h-5 rounded-[0.4rem] flex items-center justify-center transition-colors shadow-sm ${isActive ? (diet === 'Veg' || diet === 'Vegan' ? 'bg-emerald-500 text-white border-transparent' : diet === 'Non-Veg' ? 'bg-rose-500 text-white border-transparent' : 'bg-[#5B2EFF] text-white border-transparent') : 'border-2 border-slate-200 bg-white group-hover:border-slate-300'}`}>
                          {isActive && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{diet}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-4">Rating</h4>
                <div className="flex flex-wrap gap-2.5">
                  {[4.0, 4.5, 5.0].map((rating) => {
                    const isActive = minRating === rating;
                    return (
                      <button 
                        key={rating}
                        onClick={() => setMinRating(isActive ? null : rating)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-[0.6rem] border text-xs font-semibold shadow-sm transition-colors ${isActive ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isActive ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} /> {rating}{rating < 5.0 && '+'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Combo Banner */}
            <div className="shrink-0 rounded-[1.5rem] bg-gradient-to-br from-[#5B2EFF]/10 via-purple-50 to-white border border-purple-100 p-6 relative overflow-hidden shadow-sm">
              <div className="relative z-10 w-2/3">
                <h3 className="font-black text-[#5B2EFF] text-lg leading-tight mb-2">Make it a Combo!</h3>
                <p className="text-xs text-slate-500 font-medium mb-5">Save up to 20% on combos</p>
                <Button className="bg-white hover:bg-slate-50 text-[#5B2EFF] font-bold border border-[#5B2EFF]/20 rounded-xl h-9 text-xs px-5 shadow-sm transition-colors">
                  Explore Combos
                </Button>
              </div>
              <div className="absolute -right-6 -bottom-6 w-36 h-36 opacity-90 drop-shadow-xl">
                <Image src="https://images.unsplash.com/photo-1594212871465-96144eeb1d12?w=300&auto=format&fit=crop&q=80" alt="combo" fill className="object-cover rounded-full mix-blend-multiply" />
              </div>
            </div>

          </div>

        </div>
          </>
        )}
      </div>
    </div>
  );
}
