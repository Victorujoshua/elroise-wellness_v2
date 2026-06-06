'use client'

import { useCartStore } from '@/lib/cart'

const fmt = (n: number) => n.toLocaleString('en-US')

export default function CartDrawer() {
  const items = useCartStore((s) => s.items)
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <div
      aria-modal="true"
      aria-label="Shopping cart"
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`relative bg-bg w-full max-w-md h-full flex flex-col shadow-2xl transition-transform duration-500 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-charcoal/10">
          <div>
            <h2 className="text-lg font-light text-charcoal">
              Your <span className="italic serif text-gold">Cart</span>
            </h2>
            {itemCount > 0 && (
              <p className="text-[10px] uppercase tracking-widest text-charcoal/40 mt-0.5">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="text-charcoal/40 hover:text-charcoal text-2xl font-light leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {items.length === 0 ? (
            <p className="text-sm text-charcoal/40 font-light text-center mt-24">
              Your cart is empty.
            </p>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 pb-6 border-b border-charcoal/8"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light text-charcoal truncate">
                      Grip Socks — {item.color}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-charcoal/40 mt-1">
                      {item.size}
                    </p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        aria-label="Decrease quantity"
                        className="w-7 h-7 border border-charcoal/20 rounded-sm text-charcoal hover:border-gold hover:text-gold transition-colors text-sm leading-none"
                      >
                        −
                      </button>
                      <span className="text-sm font-light text-charcoal w-4 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                        className="w-7 h-7 border border-charcoal/20 rounded-sm text-charcoal hover:border-gold hover:text-gold transition-colors text-sm leading-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <p className="text-sm font-light text-charcoal">
                      ₦{fmt(item.price * item.qty)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.color} ${item.size}`}
                      className="text-[10px] uppercase tracking-widest text-charcoal/30 hover:text-red-400 transition-colors font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-8 py-6 border-t border-charcoal/10 space-y-4">
            <div className="flex justify-between items-baseline">
              <p className="text-xs uppercase tracking-widest text-charcoal/50">Total</p>
              <p className="text-xl font-light text-charcoal">₦{fmt(total)}</p>
            </div>

            {/* Disabled checkout — Week 2 */}
            <button
              disabled
              title="Checkout coming in Week 2"
              className="w-full py-4 bg-charcoal/20 text-charcoal/40 text-[10px] uppercase tracking-[0.4em] font-bold rounded-sm cursor-not-allowed"
            >
              Proceed to Checkout
            </button>
            <p className="text-[9px] text-charcoal/35 text-center font-light tracking-wide">
              Paystack integration arriving in Week 2
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
