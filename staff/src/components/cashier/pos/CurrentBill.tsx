import { OrderItem, OrderType } from "@/services/cashierService";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrentBillProps {
  items: OrderItem[];
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  table: string | null;
  setTable: (table: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClear: () => void;
  onPlaceOrder: () => void;
  onSendToKitchen: () => void;
}

export function CurrentBill({
  items,
  orderType,
  setOrderType,
  table,
  setTable,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  onPlaceOrder,
  onSendToKitchen
}: CurrentBillProps) {
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.05; // 5% GST
  const total = subtotal + gst;

  return (
    <div className="w-[400px] flex-shrink-0 bg-white border-l border-slate-200 h-full flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Current Bill</h2>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            Clear All
          </Button>
        )}
      </div>

      {/* Order Context Controls */}
      <div className="p-4 border-b border-slate-100 space-y-4 bg-slate-50">
        <div className="flex bg-slate-200/50 p-1 rounded-xl">
          {(["Dine In", "Takeaway", "Delivery"] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={cn(
                "flex-1 text-sm font-semibold py-2 rounded-lg transition-all",
                orderType === type 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {orderType === "Dine In" && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Table:</span>
            <select 
              className="flex-1 bg-white border border-slate-200 rounded-lg text-sm p-2 font-semibold text-slate-900 focus:outline-none focus:border-primary"
              value={table || ""}
              onChange={(e) => setTable(e.target.value)}
            >
              <option value="" disabled>Select Table</option>
              <option value="T-1">T-1 (Ground Floor)</option>
              <option value="T-12">T-12 (Ground Floor)</option>
              <option value="T-5">T-5 (Ground Floor)</option>
            </select>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl opacity-50">🛒</span>
            </div>
            <p className="font-medium text-slate-600">Your bill is empty</p>
            <p className="text-sm">Add items from the menu</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 bg-white">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{item.name}</h4>
                {item.selectedSize && <p className="text-xs text-slate-500 mt-0.5">Size: {item.selectedSize}</p>}
                {item.selectedAddons && item.selectedAddons.length > 0 && (
                  <p className="text-xs text-slate-500 truncate">
                    + {item.selectedAddons.map(a => a.name).join(", ")}
                  </p>
                )}
                <p className="font-black text-slate-900 text-sm mt-1">₹{item.price}</p>
              </div>
              
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-100">
                  <button 
                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                  <button 
                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  className="text-red-400 hover:text-red-600 p-1"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals & Actions */}
      <div className="p-5 border-t border-slate-100 bg-white">
        <div className="space-y-2.5 mb-5">
          <div className="flex justify-between text-sm font-medium text-slate-500">
            <span>Subtotal</span>
            <span className="text-slate-900">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium text-slate-500">
            <span>GST (5%)</span>
            <span className="text-slate-900">₹{gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium text-slate-500">
            <span>Discount</span>
            <span className="text-green-600">-₹0.00</span>
          </div>
          <div className="h-px w-full bg-slate-100 my-2"></div>
          <div className="flex justify-between text-xl font-black text-slate-900">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
            disabled={items.length === 0}
          >
            Hold Order
          </Button>
          <Button 
            variant="secondary"
            className="w-full h-12 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800"
            onClick={onSendToKitchen}
            disabled={items.length === 0}
          >
            Send to Kitchen
          </Button>
        </div>

        <Button 
          className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform"
          onClick={onPlaceOrder}
          disabled={items.length === 0}
        >
          Place Order
        </Button>
      </div>
    </div>
  );
}
