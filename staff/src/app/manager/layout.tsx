import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { LenisScrollArea } from "@/components/providers/LenisScrollArea";
import { RoleGuard } from "@/components/providers/RoleGuard";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Manager"]}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
          <Header />
          <LenisScrollArea className="flex-1 overflow-y-auto p-6 lg:px-10 lg:pb-10 lg:pt-4">
            <main>
              {children}
            </main>
          </LenisScrollArea>
        </div>
      </div>
    </RoleGuard>
  );
}
