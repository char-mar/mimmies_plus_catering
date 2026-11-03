import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_ITEM_QUANTITY = 99;

export interface CartItem {
  variantId: string;
  menuId: string;
  menuName: string;
  variantSize: string | null;
  unitPrice: string;
  imageUrl: string | null;
  quantity: number;
}

type NewCartItem = Omit<CartItem, "quantity">;

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: NewCartItem, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

function clampQuantity(quantity: number): number {
  return Math.min(Math.max(Math.round(quantity), 1), MAX_ITEM_QUANTITY);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (entry) => entry.variantId === item.variantId,
          );

          if (existing) {
            return {
              items: state.items.map((entry) =>
                entry.variantId === item.variantId
                  ? {
                      ...entry,
                      ...item,
                      quantity: clampQuantity(entry.quantity + quantity),
                    }
                  : entry,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { ...item, quantity: clampQuantity(quantity) },
            ],
          };
        }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter(
            (entry) => entry.variantId !== variantId,
          ),
        })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((entry) =>
            entry.variantId === variantId
              ? { ...entry, quantity: clampQuantity(quantity) }
              : entry,
          ),
        })),
      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "mimmies-plus-cart",
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function selectCartCount(state: CartState): number {
  return state.items.reduce((total, item) => total + item.quantity, 0);
}

export function selectCartSubtotal(state: CartState): number {
  return state.items.reduce(
    (total, item) => total + Number(item.unitPrice) * item.quantity,
    0,
  );
}

export function cartItemTotal(item: CartItem): number {
  return Number(item.unitPrice) * item.quantity;
}
