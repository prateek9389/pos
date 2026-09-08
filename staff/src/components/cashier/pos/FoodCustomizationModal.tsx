import { useState } from "react";
import { MenuItem, OrderItem } from "@/services/cashierService";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodCustomizationModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (orderItem: OrderItem) => void;
}

export function FoodCustomizationModal({ item, isOpen, onClose, onAddToCart }: FoodCustomizationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [instructions, setInstructions] = useState("");

  // Reset state when a new item is selected
  // We can do this with a useEffect or by resetting before opening, but for simplicity, we'll reset when item changes.

  if (!item) return null;

  // Set default size if not selected but available
  if (item.sizes && item.sizes.length > 0 && !selectedSize) {
    setSelectedSize(item.sizes[0]);
  }

  const handleToggleAddon = (addonName: string) => {
    const newSet = new Set(selectedAddons);
    if (newSet.has(addonName)) {
      newSet.delete(addonName);
    } else {
      newSet.add(addonName);
    }
    setSelectedAddons(newSet);
  };

  const calculateTotal = () => {
    let price = item.price;
    // Addon prices
    if (item.addons) {
      item.addons.forEach(a => {
        if (selectedAddons.has(a.name)) price += a.price;
      });
    }
    return price * quantity;
  };

  const handleAdd = () => {
    const orderItem: OrderItem = {
      id: `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      price: calculateTotal() / quantity, // Base price + addons
      quantity: quantity,
      isVeg: item.isVeg,
      image: item.image,
      selectedSize: selectedSize || undefined,
      selectedAddons: item.addons?.filter(a => selectedAddons.has(a.name)),
      specialInstructions: instructions || undefined,
    };
    onAddToCart(orderItem);
    // Reset internal state
    setQuantity(1);
    setSelectedSize("");
    setSelectedAddons(new Set());
    setInstructions("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none">
        {/* Header Image */}
        <div className="h-48 w-full relative bg-slate-100">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-black text-white leading-tight">{item.name}</h2>
            <p className="text-primary-foreground/90 font-bold text-lg mt-1">₹{item.price}</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          
          {/* Size Selection */}
          {item.sizes && item.sizes.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Select Size</h3>
              <div className="grid grid-cols-3 gap-3">
                {item.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "py-3 rounded-xl border text-sm font-bold transition-all",
                      selectedSize === size
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addons && item.addons.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Add-ons</h3>
              <div className="space-y-2">
                {item.addons.map(addon => {
                  const isSelected = selectedAddons.has(addon.name);
                  return (
                    <label 
                      key={addon.name} 
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                        isSelected ? "border-primary bg-primary/5" : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={isSelected}
                          onChange={() => handleToggleAddon(addon.name)}
                        />
                        <span className={cn("font-semibold text-sm", isSelected ? "text-primary" : "text-slate-700")}>
                          {addon.name}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-slate-500">+₹{addon.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Special Instructions</h3>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-slate-400"
              rows={3}
              placeholder="E.g., Extra spicy, no onions, etc."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <span className="font-bold text-slate-900">Quantity</span>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-200">
              <button 
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-8 text-center font-black text-lg text-slate-900">{quantity}</span>
              <button 
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <Button 
            className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/25"
            onClick={handleAdd}
          >
            Add to Bill — ₹{calculateTotal()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
