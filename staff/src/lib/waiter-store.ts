import { create } from 'zustand';

interface WaiterState {
  searchQuery: string;
  selectedDate: string;
  selectedBranch: string;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: string) => void;
  setSelectedBranch: (branch: string) => void;
}

export const useWaiterStore = create<WaiterState>((set) => ({
  searchQuery: "",
  selectedDate: "Today, 24 May 2025",
  selectedBranch: "Connaught Place",
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),
}));
