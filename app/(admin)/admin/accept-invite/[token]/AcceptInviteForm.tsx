'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { acceptInvite } from './actions'

const inputClass =
  'w-full px-3 py-2 text-sm border border-charcoal/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors'

interface Props {
  token: string
  defaultName: string
  email: string
  role: string
}

export default function AcceptInviteForm({ token, defaultName, email, role }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd       = new FormData(e.currentTarget)
    const fullName = fd.get('full_name') as string
    const password = fd.get('password') as string
    const confirm  = fd.get('confirm_password') as string

    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setError(null)
    startTransition(async () => {
      const result = await acceptInvite(token, fullName, password)
      if (result.success) {
        setDone(true)
      } else {
        setError(result.error)
      }
    })
  }

  if (done) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-charcoal/10 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 mb-4">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-gold">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M7.5 12.5l3 3 6-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-charcoal mb-1">Account created</p>
        <p className="text-xs text-charcoal/50 mb-6">
          You can now sign in to the admin portal.
        </p>
        <Link
          href="/admin/login"
          className="inline-block px-6 py-2.5 bg-charcoal text-white text-xs font-medium rounded-lg hover:bg-charcoal/90 transition-colors"
        >
          Sign in →
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-charcoal/10 p-8 space-y-5"
    >
      <p className="text-xs text-charcoal/50">
        You&apos;ve been invited as{' '}
        <span className="font-medium text-charcoal capitalize">{role}</span>.
        Set your name and a password to complete sign-up.
      </p>

      <div>
        <label className="block text-xs font-medium text-charcoal/70 mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-3 py-2 text-sm border border-charcoal/10 rounded-lg bg-charcoal/5 text-charcoal/50 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal/70 mb-1.5">Full name</label>
        <input
          name="full_name"
          required
          defaultValue={defaultName}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal/70 mb-1.5">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal/70 mb-1.5">
          Confirm password
        </label>
        <input
          name="confirm_password"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 bg-charcoal text-white text-sm font-medium rounded-lg hover:bg-charcoal/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
