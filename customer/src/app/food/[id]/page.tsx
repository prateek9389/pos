"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Share2, Star, ShieldCheck } from "lucide-react";
import { use, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCartStore } from "@/lib/cart-store";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function FoodDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const docRef = doc(db, "menuItems", resolvedParams.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such document!");
        }
      } catch (err) {
        console.error("Failed to fetch item", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [resolvedParams.id]);

  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Set default size when item loads
  useEffect(() => {
    if (item && item.sizes && item.sizes.length > 0 && !selectedSize) {
      setSelectedSize(item.sizes[0]);
    }
  }, [item]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Product Not Found</h1>
        <Button onClick={() => router.push('/menu')}>Back to Menu</Button>
      </div>
    );
  }

  const basePrice = selectedSize ? selectedSize.price : (item.price || 0);
  const addonsTotal = selectedAddons.reduce((total, addonId) => {
    const addon = item.addons?.find((a: any) => a.id === addonId);
    return total + (addon?.price || 0);
  }, 0);

  const totalPrice = (basePrice + addonsTotal) * quantity;

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      foodId: item.id,
      name: item.name,
      price: basePrice + addonsTotal,
      originalBasePrice: item.price,
      quantity,
      image: item.image,
      size: selectedSize || undefined,
      addons: item.addons?.filter((a: any) => selectedAddons.includes(a.id)),
    });
    router.push('/cart');
  };

  return (
    <div className="flex flex-col flex-1 pb-24 bg-[#F8FAFC] min-h-screen font-sans">

      {/* Back to Menu Button - Top Left Corner */}
      <Link href="/menu" className="absolute top-6 left-4 md:left-8 z-50 group flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 px-4 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:-translate-y-0.5">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> Back to Menu
      </Link>

      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="container mx-auto max-w-6xl flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-slate-50 border border-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-colors">
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-slate-50 border border-slate-100 text-slate-500 hover:text-[#6366F1] hover:bg-indigo-50 transition-colors">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row gap-12">

        {/* Left - Images */}
        <div className="md:w-1/2 flex flex-col gap-5">
          <div className="relative w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-4 border-white bg-white">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex gap-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#8B5CF6] shadow-sm">
              <Image src={item.image} alt="Thumb 1" fill className="object-cover" />
            </div>
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer hover:border-purple-300 transition-colors">
              <Image src={item.image} alt="Thumb 2" fill className="object-cover opacity-70 hover:opacity-100 transition-opacity" />
            </div>
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer">
              <Image src={item.image} alt="Thumb 3" fill className="object-cover opacity-40 hover:opacity-50 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center text-white text-[15px] font-black tracking-wide">+2 MORE</div>
            </div>
          </div>
        </div>

        {/* Right - Details */}
        <div className="md:w-1/2 flex flex-col pt-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl lg:text-[40px] font-black text-slate-900 tracking-tight leading-none">{item.name}</h1>
              {item.isVeg !== undefined && (
                <div className={`w-6 h-6 border-2 rounded flex items-center justify-center ${item.isVeg ? 'border-emerald-600' : 'border-red-600'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                </div>
              )}
            </div>
            <div className="text-[32px] font-black text-slate-900">₹{basePrice}</div>
          </div>

          <div className="flex items-center gap-2.5 mb-8 text-[14px]">
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md text-amber-700 font-bold border border-amber-200/50">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{item.rating}</span>
            </div>
            <span className="text-slate-400 font-medium underline decoration-slate-300 underline-offset-4 cursor-pointer">{item.reviews} reviews</span>
          </div>

          { (item.desc || item.description) && (
            <p className="text-slate-500 mb-6 text-[16px] leading-relaxed max-w-lg font-medium">
              {item.desc || item.description}
            </p>
          )}

          {item.addedBy && (
            <div className="flex items-center gap-2 mb-10 text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 w-fit shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Added by <strong className="text-slate-700">{item.addedBy}</strong></span>
            </div>
          )}

          {/* Sizes */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="mb-10">
              <h3 className="font-black text-slate-900 mb-4 text-[18px]">Select Size</h3>
              <div className="grid grid-cols-3 gap-4">
                {item.sizes.map((size: any) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${selectedSize?.id === size.id
                        ? "border-[#8B5CF6] bg-purple-50/50 shadow-[0_4px_15px_rgba(139,92,246,0.1)]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                  >
                    <span className={`font-black mb-1.5 text-[15px] ${selectedSize?.id === size.id ? 'text-[#7C3AED]' : 'text-slate-700'}`}>
                      {size.name}
                    </span>
                    <span className={`text-[13px] font-bold ${selectedSize?.id === size.id ? 'text-[#8B5CF6]' : 'text-slate-500'}`}>
                      ₹{size.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addons && item.addons.length > 0 && (
            <div className="mb-10">
              <h3 className="font-black text-slate-900 mb-4 text-[18px]">Add-ons</h3>
              <div className="flex flex-col gap-3">
                {item.addons.map((addon: any) => (
                  <label key={addon.id} htmlFor={addon.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${selectedAddons.includes(addon.id) ? 'border-[#8B5CF6] bg-purple-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        id={addon.id}
                        className="rounded-md border-slate-300 data-[state=checked]:bg-[#8B5CF6] data-[state=checked]:border-[#8B5CF6] w-5 h-5 shadow-sm"
                        checked={selectedAddons.includes(addon.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAddons([...selectedAddons, addon.id]);
                          } else {
                            setSelectedAddons(selectedAddons.filter(id => id !== addon.id));
                          }
                        }}
                      />
                      <span className="text-[15px] font-bold text-slate-700">
                        {addon.name}
                      </span>
                    </div>
                    <span className="text-[15px] font-black text-slate-900">+₹{addon.price}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-5 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 rounded-t-3xl">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Quantity</div>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl h-14 p-1 shadow-sm w-[140px]">
              <button
                className="w-12 h-12 flex items-center justify-center text-slate-500 hover:bg-white hover:text-black hover:shadow-sm rounded-xl font-medium text-2xl transition-all"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <span className="flex-1 text-center font-black text-[18px]">{quantity}</span>
              <button
                className="w-12 h-12 flex items-center justify-center text-slate-500 hover:bg-white hover:text-black hover:shadow-sm rounded-xl font-medium text-2xl transition-all"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-[#6366F1] to-[#D946EF] hover:from-[#4F46E5] hover:to-[#C026D3] text-white rounded-2xl px-10 h-14 text-[17px] font-black min-w-[280px] shadow-[0_8px_25px_rgba(168,85,247,0.35)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.45)] hover:scale-[1.02] transition-all duration-300 border-0"
            onClick={handleAddToCart}
          >
            Add to Cart — ₹{totalPrice}
          </Button>

        </div>
      </div>

    </div>
  );
}
