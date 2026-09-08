"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

interface Branch {
  id: string;
  name: string;
  restaurantId: string;
}

interface BranchContextType {
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  branches: Branch[];
  loadingBranches: boolean;
}

const BranchContext = createContext<BranchContextType>({
  selectedBranchId: "",
  setSelectedBranchId: () => {},
  branches: [],
  loadingBranches: true,
});

export const useBranchContext = () => useContext(BranchContext);

export const BranchProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "branches"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBranches = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        restaurantId: doc.data().restaurantId,
      })) as Branch[];
      
      setBranches(fetchedBranches);
      setLoadingBranches(false);
      
      if (fetchedBranches.length > 0) {
        setSelectedBranchId((prev) => prev === "" ? "all" : prev);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <BranchContext.Provider value={{ selectedBranchId, setSelectedBranchId, branches, loadingBranches }}>
      {children}
    </BranchContext.Provider>
  );
};
