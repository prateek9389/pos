"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Star, Heart, ArrowLeft, HeartOff, Utensils, Bell, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, documentId } from "firebase/firestore";
import { useWishlistStore } from "@/lib/wishlist-store";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function WishlistPage() {
  const { items: wishlistItems, toggleWishlist, isInWishlist } = useWishlistStore();

  const [favoriteItems, setFavoriteItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hydration fix for zustand persist
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!mounted) return;
      if (wishlistItems.length === 0) {
        setFavoriteItems([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Firestore 'in' query limit is 10, so chunk the array
        const chunks = [];
        for (let i = 0; i < wishlistItems.length; i += 10) {
          chunks.push(wishlistItems.slice(i, i + 10));
        }
        
        let items: any[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, "menuItems"), where(documentId(), "in", chunk));
          const snap = await getDocs(q);
          snap.docs.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        }
        setFavoriteItems(items);
      } catch (error) {
        console.error("Error fetching wishlist items:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWishlist();
  }, [wishlistItems, mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-4 bg-[#F8FAFC] min-h-screen font-sans relative isolate overflow-hidden">

      {/* Background decorations (Subtle sparkles & floating shapes) */}
      <div className="absolute top-20 right-[15%] text-blue-200/40 rotate-12">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
      </div>
      <div className="absolute top-32 left-[10%] text-blue-200/40 -rotate-12">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
      </div>

      {/* Back to Menu Button - Top Left Corner */}
      <Link href="/menu" className="absolute top-6 left-4 md:left-8 z-50 group flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 px-4 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:-translate-y-0.5">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> Back to Menu
      </Link>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-20 relative z-10 w-full flex flex-col h-full">

        {/* Header */}
        <div className="mb-4">

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[32px] md:text-[38px] font-black text-slate-900 tracking-tight leading-none mb-1.5">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">Wishlist</span>
              </h1>
              <p className="text-slate-500 font-medium text-[13px] md:text-[14px]">
                All the dishes you love in one place.<br className="hidden sm:block" /> Ready to order your favorites?
                <span className="inline-block ml-1 text-blue-400">✨</span>
              </p>
            </div>

            {favoriteItems.length > 0 && (
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200/60 flex items-center gap-1.5 text-xs font-black text-slate-700 w-fit">
                <Heart className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                <span>{favoriteItems.length} saved</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="popLayout">
          {favoriteItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 flex-1">
              {favoriteItems.map((item, index) => {
                const isLiked = isInWishlist(item.id);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                    key={item.id}
                    className="h-full"
                  >
                    <Link href={`/food/${item.id}`} className="group block h-full outline-none">
                      <Card className="rounded-[2rem] border-2 border-white shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_30px_-10px_rgba(59,130,246,0.15)] hover:border-blue-100 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-xl h-full flex flex-col relative isolate">

                        {/* Like Button */}
                        <button
                          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110 group/btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(item.id);
                          }}
                        >
                          <Heart className={`w-4 h-4 transition-colors duration-300 ${isLiked ? 'fill-blue-500 text-blue-500 group-hover/btn:fill-blue-400' : 'text-slate-400 group-hover/btn:text-blue-500'}`} />
                        </button>

                        <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden rounded-t-[2rem] m-1 w-[calc(100%-8px)] h-[calc(100%-8px)]">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        <CardContent className="p-4 flex flex-col flex-1 bg-transparent">
                          <h3 className="font-black text-lg text-slate-900 mb-1 group-hover:text-blue-500 transition-colors duration-300 line-clamp-1 tracking-tight">
                            {item.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 flex-1 leading-relaxed">
                            {item.description}
                          </p>

                          <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-100/80">
                            <div className="font-black text-xl text-slate-900 tracking-tight">₹{item.price}</div>
                            <Button
                              size="sm"
                              className="rounded-full font-bold px-5 bg-slate-900 text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 shadow-lg shadow-slate-900/20 hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 h-9 text-xs"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            >
                              Add <span className="ml-1 text-base leading-none">+</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8 sm:py-10 text-center bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative z-10 w-full mb-6 border border-slate-100/50 flex-1 min-h-[360px] max-h-[420px]"
            >
              {/* Custom Illustration */}
              <div className="relative w-36 h-36 mb-4 flex items-center justify-center scale-90 sm:scale-100">
                <div className="absolute inset-0 bg-blue-50 rounded-full scale-110 opacity-70"></div>
                <div className="absolute -top-3 right-3 w-5 h-5 text-blue-400"><Heart className="w-full h-full fill-current" /></div>
                <div className="absolute bottom-3 -right-1 text-blue-300"><Sparkles className="w-4 h-4" /></div>
                <div className="absolute top-8 -left-3 text-blue-300"><Sparkles className="w-3 h-3" /></div>

                {/* Basket & Card Graphic */}
                <div className="relative z-10 flex flex-col items-center mt-6">
                  {/* Floating Card */}
                  <div className="bg-white w-20 h-20 rounded-xl shadow-lg border border-slate-100 flex items-center justify-center mb-[-16px] relative z-0">
                    <Heart className="w-8 h-8 text-blue-400" strokeWidth={2.5} />
                  </div>
                  {/* Purple Basket */}
                  <div className="w-28 h-14 bg-[#6366F1] rounded-b-xl rounded-t-sm relative z-10 shadow-md flex items-center justify-center gap-1.5">
                    <div className="w-1 h-6 bg-white/30 rounded-full"></div>
                    <div className="w-1 h-6 bg-white/30 rounded-full"></div>
                    <div className="w-1 h-6 bg-white/30 rounded-full"></div>
                    <div className="w-1 h-6 bg-white/30 rounded-full"></div>
                    {/* Basket Handle */}
                    <div className="absolute -right-3 top-1 w-5 h-1.5 bg-[#6366F1] rotate-45 rounded-full"></div>
                  </div>
                </div>
              </div>

              <h3 className="text-[24px] font-black text-[#0F172A] mb-2 tracking-tight">
                Your wishlist is <span className="text-[#3B82F6]">empty</span>
              </h3>
              <p className="text-slate-500 font-medium text-[14px] max-w-sm mx-auto mb-6 leading-relaxed px-4">
                You haven't saved any dishes yet. Start exploring our menu to find your new favorites!
              </p>

              <Link href="/menu">
                <Button
                  className="rounded-full font-bold bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 px-6 h-11 text-[14px] border-0"
                >
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-2">
                    <Utensils className="w-3 h-3 text-[#3B82F6]" />
                  </div>
                  Explore Menu
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Features Bar */}
        <div className="bg-white rounded-[20px] shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100 p-3 sm:p-4 mt-auto w-full overflow-x-auto custom-scrollbar">
          <div className="flex items-center justify-between min-w-[700px] gap-3">

            <div className="flex items-center gap-2.5 flex-1 border-r border-slate-100 pr-3">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <Heart className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-slate-900 leading-tight">Save Your Favorites</h4>
                <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">Add dishes you love</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-1 border-r border-slate-100 px-3">
              <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-slate-900 leading-tight">Quick Access</h4>
                <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">Find saved items anytime</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-1 border-r border-slate-100 px-3">
              <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-slate-900 leading-tight">Easy Ordering</h4>
                <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">Add to cart in one tap</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-1 pl-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-slate-900 leading-tight">Personalized Picks</h4>
                <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">Discover more you'll love</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
