import { MenuItem } from "@/services/cashierService";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface FoodCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export function FoodCard({ item, onAdd }: FoodCardProps) {
  return (
    <div 
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/20 transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={() => onAdd(item)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 p-2">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 leading-tight mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
        
        <div className="flex-1"></div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-900">₹{item.price}</span>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-md w-max mt-1",
              item.isVeg 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-red-100 text-red-700 border border-red-200"
            )}>
              {item.isVeg ? "Veg" : "Non-Veg"}
            </span>
          </div>

          <Button 
            size="sm"
            variant="outline"
            className="rounded-xl h-10 w-10 p-0 border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
