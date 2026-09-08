import { Metadata } from "next";
import Sidebar from "@/components/cashier/layout/Sidebar";
import Topbar from "@/components/cashier/layout/Topbar";
import { RoleGuard } from "@/components/providers/RoleGuard";

export const metadata: Metadata = {
  title: "Cashier POS - Foodie POS",
  description: "Fast Billing. Smooth Service.",
};

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Cashier", "Manager"]}>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 lg:ml-[280px] print:ml-0 print:overflow-visible">
          <Topbar />
          <main className="flex-1 overflow-y-auto relative">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
