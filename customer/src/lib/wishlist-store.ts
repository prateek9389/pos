import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
  items: string[]; // Store array of food IDs
  toggleWishlist: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      toggleWishlist: (id) => {
        const currentItems = get().items;
        if (currentItems.includes(id)) {
          // Remove if it exists
          set({ items: currentItems.filter((itemId) => itemId !== id) });
        } else {
          // Add if it doesn't exist
          set({ items: [...currentItems, id] });
        }
      },
      
      clearWishlist: () => set({ items: [] }),
      
      isInWishlist: (id) => get().items.includes(id),
      
      getItemCount: () => get().items.length,
    }),
    {
      name: 'foodie-wishlist-storage', // key in local storage
    }
  )
);
