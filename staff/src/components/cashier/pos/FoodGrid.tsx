import { MenuItem } from "@/services/cashierService";
import { FoodCard } from "./FoodCard";
import { Frown } from "lucide-react";

interface FoodGridProps {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
}

export function FoodGrid({ items, onAdd }: FoodGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Frown className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No items found</p>
        <p className="text-sm">Try adjusting your search or category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 pb-8">
      {items.map((item) => (
        <FoodCard key={item.id} item={item} onAdd={onAdd} />
      ))}
    </div>
  );
}
