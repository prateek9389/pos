import { Metadata } from "next";
import { KitchenSidebar } from "@/components/kitchen/Sidebar";
import { KitchenTopbar } from "@/components/kitchen/Topbar";
import { RoleGuard } from "@/components/providers/RoleGuard";

export const metadata: Metadata = {
  title: "Kitchen Panel | Foodie POS",
  description: "Kitchen Display System",
};

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Kitchen", "Kitchen Staff", "Chef", "Manager"]}>
      <div className="h-screen bg-slate-50 dark:bg-[#0F111A] flex overflow-hidden selection:bg-primary/20 transition-colors">
        <KitchenSidebar />
        <main className="flex-1 overflow-y-auto scroll-smooth min-w-0 flex flex-col">
          <KitchenTopbar />
          <div className="flex-1 p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
