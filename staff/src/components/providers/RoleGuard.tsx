"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem("staffSession");
    if (!sessionStr) {
      router.replace("/login");
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      const rawRole = (session.role || "").toLowerCase().trim();

      const normalize = (r: string) => {
        const lower = r.toLowerCase().trim();
        if (lower.includes("kitchen") || lower.includes("chef") || lower.includes("cook")) return "kitchen";
        if (lower.includes("cashier")) return "cashier";
        if (lower.includes("waiter")) return "waiter";
        if (lower.includes("manager")) return "manager";
        return lower;
      };

      const userRole = normalize(rawRole);
      const normalizedAllowed = allowedRoles.map(normalize);

      if (userRole === "manager" || normalizedAllowed.includes(userRole) || allowedRoles.map(r => r.toLowerCase()).includes(rawRole)) {
        setAuthorized(true);
      } else {
        // Redirect to their respective dashboard if accessing an unauthorized panel
        if (userRole === "waiter") router.replace("/waiter/dashboard");
        else if (userRole === "cashier") router.replace("/cashier/pos");
        else if (userRole === "kitchen") router.replace("/kitchen/dashboard");
        else router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [allowedRoles, router]);

  if (!authorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FD]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5D34F5]" />
      </div>
    );
  }

  return <>{children}</>;
}
