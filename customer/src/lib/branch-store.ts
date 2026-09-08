import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BranchStore {
  selectedBranchId: string;
  selectedBranchName: string;
  setSelectedBranch: (id: string, name: string) => void;
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      selectedBranchId: "",
      selectedBranchName: "",
      setSelectedBranch: (id, name) => set({ selectedBranchId: id, selectedBranchName: name }),
    }),
    {
      name: 'branch-storage',
    }
  )
);
