"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Sidebar } from "./layout/Sidebar";
import { Header } from "./layout/Header";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { BranchProvider } from "@/context/BranchContext";

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (loading) return;

      if (pathname === "/login") {
        if (user && user.email === "prateeksengar8882@gmail.com") {
          router.push("/");
        } else {
          setIsChecking(false);
        }
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      if (user.email !== "prateeksengar8882@gmail.com") {
        await signOut(auth);
        router.push("/login");
        return;
      }

      setIsChecking(false);
    };

    verifyUser();
  }, [user, loading, pathname, router]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <>
      <BranchProvider>
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <Header />
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </BranchProvider>
    </>
  );
};
