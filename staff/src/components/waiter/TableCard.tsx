import { cn } from "@/lib/utils";
import type { Table } from "@/services/cashierService";
import { Users } from "lucide-react";

interface TableCardProps {
  table: Table;
  onClick: (table: Table) => void;
}

export function TableCard({ table, onClick }: TableCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return {
          wrapper: "bg-white border-[#10B981]/20 hover:border-[#10B981]/40",
          badgeBg: "bg-[#10B981]/10",
          badgeText: "text-[#10B981]",
          dot: "bg-[#10B981]",
          bottomText: "Ready to seat",
          bottomColor: "text-[#10B981]",
        };
      case "OCCUPIED":
        return {
          wrapper: "bg-white border-orange-200 hover:border-orange-300",
          badgeBg: "bg-orange-100",
          badgeText: "text-orange-600",
          dot: "bg-orange-500",
          bottomText: "Occupied",
          bottomColor: "text-orange-600",
        };
      case "RESERVED":
        return {
          wrapper: "bg-white border-[#5D34F5]/20 hover:border-[#5D34F5]/40",
          badgeBg: "bg-[#5D34F5]/10",
          badgeText: "text-[#5D34F5]",
          dot: "bg-[#5D34F5]",
          bottomText: "Reserved",
          bottomColor: "text-[#5D34F5]",
        };
      default:
        return {
          wrapper: "bg-white border-slate-200 hover:border-slate-300",
          badgeBg: "bg-slate-100",
          badgeText: "text-slate-600",
          dot: "bg-slate-500",
          bottomText: "Unknown",
          bottomColor: "text-slate-500",
        };
    }
  };

  const config = getStatusConfig(table.status);

  return (
    <div
      onClick={() => onClick(table)}
      className={cn(
        "rounded-2xl p-5 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] shadow-sm",
        config.wrapper
      )}
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Users className="w-[18px] h-[18px]" strokeWidth={2.5} />
          <span className="text-[15px] font-bold">{table.seats}</span>
        </div>
        
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full", config.badgeBg)}>
          <div className={cn("w-2 h-2 rounded-full", config.dot)} />
          <span className={cn("text-[11px] font-black uppercase tracking-wider", config.badgeText)}>
            {table.status}
          </span>
        </div>
      </div>

      <div className="mt-8 mb-6">
        <h3 className="text-[32px] font-black text-[#0f172a] tracking-tight leading-none">
          T-{table.name}
        </h3>
      </div>
      
      <div className="mt-auto flex items-center justify-between">
         <span className={cn("text-[14px] font-bold", config.bottomColor)}>
            {config.bottomText}
         </span>
         
         {table.status === 'OCCUPIED' && table.currentAmount && (
           <span className="text-sm font-bold text-slate-600">
             ₹{table.currentAmount.toFixed(2)}
           </span>
         )}
         {table.status === 'RESERVED' && (
           <span className="text-sm font-bold text-slate-600">
             Today, 7:30 PM
           </span>
         )}
      </div>
    </div>
  );
}
