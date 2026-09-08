"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, X } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { MenuItem, OrderItem } from "@/services/cashierService";

interface FoodCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: MenuItem;
  onAdd: (item: OrderItem) => void;
}

export function FoodCustomizationModal({ isOpen, onClose, food, onAdd }: FoodCustomizationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<{name: string; price: number}[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedSize(food.sizes?.[0] || "");
      setSelectedAddons([]);
      setSpecialInstructions("");
    }
  }, [isOpen, food]);

  const handleAddonToggle = (addon: {name: string; price: number}) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.name === addon.name);
      if (exists) {
        return prev.filter(a => a.name !== addon.name);
      } else {
        return [...prev, addon];
      }
    });
  };

  const calculateTotalPrice = () => {
    let price = food.price;
    // Mock size logic: +60 for Medium, +150 for Large
    if (selectedSize === "Medium") price += 60;
    if (selectedSize === "Large") price += 150;
    
    selectedAddons.forEach(a => price += a.price);
    return price;
  };

  const handleAddToCart = () => {
    const itemToAdd: OrderItem = {
      id: `oi_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      menuItemId: food.id,
      name: food.name,
      price: calculateTotalPrice(),
      quantity,
      isVeg: food.isVeg,
      image: food.image,
      selectedSize,
      selectedAddons,
      specialInstructions
    };
    onAdd(itemToAdd);
  };

  const currentPrice = calculateTotalPrice();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-3xl">
        <div className="relative h-48 bg-slate-100">
          <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-700 hover:bg-white shadow-sm transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/20 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-xl">{food.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 shrink-0 rounded-sm border-2 flex items-center justify-center ${food.isVeg ? 'border-emerald-500' : 'border-red-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${food.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{food.isVeg ? 'Veg' : 'Non-Veg'}</span>
                </div>
              </div>
              <div className="text-right">
                 <span className="text-sm font-bold text-slate-500 line-through mr-2 opacity-0"></span> {/* Placeholder for layout */}
                 <span className="text-2xl font-black text-primary">₹{food.price}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Sizes */}
          {food.sizes && food.sizes.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-slate-900 mb-3">Size</h4>
              <div className="space-y-2">
                {food.sizes.map((size) => (
                  <label key={size} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedSize === size ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedSize === size ? 'border-primary' : 'border-slate-300'
                      }`}>
                        {selectedSize === size && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <span className="font-bold text-slate-700">{size}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-500">
                      {size === 'Medium' ? '+₹60' : size === 'Large' ? '+₹150' : 'Included'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {food.addons && food.addons.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-slate-900 mb-3">Add-ons</h4>
              <div className="space-y-2">
                {food.addons.map((addon) => {
                  const isSelected = selectedAddons.some(a => a.name === addon.name);
                  return (
                    <label key={addon.name} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded bg-white border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary bg-primary' : 'border-slate-300'
                        }`}>
                          {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="font-bold text-slate-700">{addon.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-500">+₹{addon.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="mb-6">
             <h4 className="font-bold text-slate-900 mb-2">Special Instructions</h4>
             <textarea 
               placeholder="e.g. Less spicy, no onion..."
               value={specialInstructions}
               onChange={(e) => setSpecialInstructions(e.target.value)}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
             />
          </div>

          {/* Quantity & Add to Order */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
             <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-xl border border-slate-200">
               <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center bg-white text-slate-600 rounded-lg shadow-sm hover:text-primary transition-colors">
                 <Minus className="w-5 h-5" />
               </button>
               <span className="w-6 text-center font-black text-slate-900 text-lg">{quantity}</span>
               <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-white text-slate-600 rounded-lg shadow-sm hover:text-primary transition-colors">
                 <Plus className="w-5 h-5" />
               </button>
             </div>
             
             <Button 
               onClick={handleAddToCart}
               className="h-14 px-8 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
             >
               Add to Order — ₹{currentPrice * quantity}
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
