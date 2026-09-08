import { WaiterSidebar } from "@/components/waiter/Sidebar";
import { WaiterTopbar } from "@/components/waiter/Topbar";
import { RoleGuard } from "@/components/providers/RoleGuard";

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Waiter", "Manager"]}>
      <div className="flex h-screen overflow-hidden bg-slate-50/50">
        <WaiterSidebar />
        <main className="flex-1 overflow-y-auto">
          <WaiterTopbar />
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
