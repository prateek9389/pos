"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  ListOrdered, 
  Grid2X2, 
  Menu as MenuIcon, 
  CalendarDays,
  Settings, 
  LogOut,
  UtensilsCrossed,
  PlusCircle,
  FileText,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Power,
  LineChart as LineChartIcon,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";

const navItems = [
  { name: "Dashboard", href: "/waiter/dashboard", icon: Home },
  { name: "Tables", href: "/waiter/tables", icon: Grid2X2 },
  { name: "New Order", href: "/waiter/create-order", icon: PlusCircle },
  { name: "Active Orders", href: "/waiter/orders", icon: ListOrdered, badge: 8 },
  { name: "Reservations", href: "/waiter/reservations", icon: CalendarDays },
  { name: "Menu", href: "/waiter/menu", icon: MenuIcon },
  { name: "Customers", href: "/waiter/customers", icon: Users },

  { name: "Settings", href: "/waiter/settings", icon: Settings },
];

export function WaiterSidebar({ isMobile = false }: { isMobile?: boolean } = {}) {
  const pathname = usePathname();

  return (
    <aside className={cn("w-[260px] h-screen bg-[#141226] text-slate-300 flex-col flex-shrink-0 relative overflow-hidden font-sans border-r border-white/5", !isMobile && "hidden lg:flex")}>
      
      {/* Brand */}
      <div className="p-8 pb-6 flex items-center gap-4 relative z-10 shrink-0">
        <div className="w-10 h-10 bg-[#5D34F5] rounded-xl flex items-center justify-center shadow-lg shadow-[#5D34F5]/30">
          <UtensilsCrossed className="w-5 h-5 text-white drop-shadow-md" />
        </div>
        <div>
          <h1 className="text-[18px] font-black text-white tracking-tight leading-none mb-1 drop-shadow-md">Foodie POS</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E879F9] shadow-[0_0_8px_rgba(232,121,249,0.8)]"></div>
            <span className="text-[10px] font-bold text-[#E879F9] uppercase tracking-wider">Waiter Panel</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navItems.map((item) => {
          const isActive = item.href === "/waiter/dashboard" 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
            
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "bg-[#2A1D6A] text-white shadow-md shadow-[#2A1D6A]/20" 
                  : "text-[#8E95AD] hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-4 relative z-10">
                <item.icon className={cn(
                  "w-4 h-4 transition-transform duration-300", 
                  isActive ? "text-white scale-110 drop-shadow-md" : "text-[#8E95AD] group-hover:scale-110"
                )} />
                {item.name}
              </div>
              
              {item.badge && (
                <div className="bg-[#5D34F5] text-white text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm relative z-10">
                  {item.badge}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Info */}
      <div className="p-4 relative z-10 shrink-0 space-y-4">
        {/* Your Performance Card */}
        <div className="bg-[#1C1A31] border border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <LineChartIcon className="w-4 h-4 text-slate-400" />
            <span className="text-[12px] font-bold text-slate-300">Today's Sales</span>
          </div>
          
          <div className="relative z-10 mb-4">
            <h4 className="text-[28px] font-black text-white leading-none mb-2">₹18,450</h4>
            <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
               ▲ 12.5% <span className="text-slate-400">vs yesterday</span>
            </p>
          </div>

          <div className="flex items-center justify-center relative w-full h-[50px] -mx-2 mb-[-10px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { value: 10 }, { value: 15 }, { value: 8 }, { value: 20 }, { value: 12 }, { value: 25 }, { value: 22 }, { value: 30 }
              ]}>
                <Line type="monotone" dataKey="value" stroke="#5D34F5" strokeWidth={3} dot={{ r: 3, fill: "#5D34F5", strokeWidth: 2, stroke: "#1C1A31" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Link
          href="/login"
          className="flex items-center gap-3 justify-center w-full p-4 rounded-xl text-sm font-bold text-[#E11D48] bg-transparent border border-[#E11D48]/20 hover:bg-[#E11D48]/10 transition-all group"
        >
          <LogOut className="w-4 h-4" />
          End Shift
        </Link>
      </div>
    </aside>
  );
}
