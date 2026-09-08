import { cn } from "@/lib/utils";
import { Users, MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableData {
  id: string;
  name?: string;
  tableId?: string;
  seats: number;
  status: string;
  floor?: string;
}

interface TableCardProps {
  table: TableData;
  onDelete: (id: string) => void;
}

export function TableCard({ table, onDelete }: TableCardProps) {
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

  const config = getStatusConfig(table.status || "AVAILABLE");
  const tableName = table.name || table.tableId || "Unknown";
  const displayName = tableName.startsWith('T-') ? tableName : `T-${tableName}`;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 border-2 transition-all duration-300 flex flex-col justify-between min-h-[160px] shadow-sm relative group",
        config.wrapper
      )}
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Users className="w-[18px] h-[18px]" strokeWidth={2.5} />
          <span className="text-[15px] font-bold">{table.seats}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full", config.badgeBg)}>
            <div className={cn("w-2 h-2 rounded-full", config.dot)} />
            <span className={cn("text-[11px] font-black uppercase tracking-wider", config.badgeText)}>
              {table.status || "AVAILABLE"}
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-black/5 rounded-full inline-flex items-center justify-center shrink-0">
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-2xl shadow-xl">
              <DropdownMenuItem onClick={() => onDelete(table.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-xl">
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-8 mb-6">
        <h3 className="text-[32px] font-black text-[#0f172a] tracking-tight leading-none">
          {displayName}
        </h3>
      </div>
      
      <div className="mt-auto flex items-center justify-between">
         <span className={cn("text-[14px] font-bold", config.bottomColor)}>
            {config.bottomText}
         </span>
      </div>
    </div>
  );
}
