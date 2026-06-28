'use client'

import { useState, useTransition } from 'react'
import { signIn } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await signIn(
        fd.get('email') as string,
        fd.get('password') as string,
      )
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-[#F3EFEA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-[#2D2926] tracking-wide">Elroisè</h1>
          <p className="text-sm text-[#2D2926]/60 mt-1">Admin Portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-[#2D2926]/10 p-8 space-y-5"
        >
          <div>
            <label className="block text-xs font-medium text-[#2D2926]/70 mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 text-sm border border-[#2D2926]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#636B2F]/40 focus:border-[#636B2F] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2D2926]/70 mb-1.5">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 text-sm border border-[#2D2926]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#636B2F]/40 focus:border-[#636B2F] transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-[#2D2926] text-white text-sm font-medium rounded-lg hover:bg-[#2D2926]/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
