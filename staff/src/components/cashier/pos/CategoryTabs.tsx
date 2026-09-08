import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryTabs({ categories, selectedCategory, onSelectCategory }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        return (
          <Button
            key={category}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "rounded-full px-5 whitespace-nowrap h-10 font-semibold transition-all",
              isSelected 
                ? "bg-primary text-white shadow-md hover:bg-primary/90" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            )}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </Button>
        );
      })}
    </div>
  );
}
