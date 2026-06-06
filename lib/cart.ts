import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: string      // `${colorId}::${size}` — upsert key
  color: string   // 'White'
  colorId: string // 'white'
  size: string    // 'XS / S'
  qty: number
  price: number   // integer naira
}

type CartStore = {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (item) =>
        set((state) => {
          const id = `${item.colorId}::${item.size}`
          const existing = state.items.find((i) => i.id === id)
          return {
            items: existing
              ? state.items.map((i) =>
                  i.id === id ? { ...i, qty: i.qty + item.qty } : i
                )
              : [...state.items, { ...item, id }],
          }
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) =>
        set((state) => ({
          items:
            qty < 1
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'elroise-cart',
      partialize: (state) => ({ items: state.items }), // isOpen not persisted
    }
  )
)
