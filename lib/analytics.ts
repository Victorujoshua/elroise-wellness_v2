declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}
