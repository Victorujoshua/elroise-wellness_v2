'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Clock,
  Package,
  Users,
  UserCog,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import MiniCalendar from './MiniCalendar'
import { signOut } from '@/app/(admin)/admin/(dashboard)/actions'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/admin/appointments', label: 'Appointments', icon: ClipboardList },
  { href: '/admin/shifts', label: 'Shifts', icon: Clock },
  { href: '/admin/services', label: 'Services', icon: Package },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/team', label: 'Team', icon: UserCog },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

interface Props {
  user: { name: string; role: string }
}

function NavContent({ user, onNavigate }: Props & { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
      {/* Brand — fixed top */}
      <div className="px-5 py-4 border-b border-border shrink-0">
        <span
          className="text-xl tracking-[0.15em] font-light text-[#2D2926]"
          style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
        >
          Elroisè
        </span>
        <p
          className="text-xs font-medium uppercase tracking-[0.2em] text-[#636B2F] mt-0.5"
          style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
        >
          Admin
        </p>
      </div>

      {/* Scrollable middle — calendar first, nav below */}
      <div className="flex-1 overflow-y-auto min-h-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
        <div className="px-3 py-3 border-b border-border">
          <MiniCalendar />
        </div>

        <nav className="px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200',
                  isActive
                    ? 'bg-[#636B2F] text-white'
                    : 'text-[#2D2926] hover:bg-[#F9F6F2] hover:text-[#2D2926]',
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    isActive ? 'text-white' : 'text-[#2D2926]/70',
                  )}
                />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User + Sign out — fixed bottom */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="size-7 rounded-full bg-[#636B2F] flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-medium text-[#2D2926] truncate"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              {user.name}
            </p>
            <p
              className="text-[10px] text-[#2D2926]/60 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              {user.role}
            </p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 text-xs text-[#2D2926] hover:text-[#636B2F] transition-colors duration-200 w-full px-1"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Sidebar({ user }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-r border-border bg-background h-screen sticky top-0">
        <NavContent user={user} />
      </aside>

      {/* Mobile trigger */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg border border-border bg-background shadow-sm"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </button>

      {/* Mobile Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] p-0" showCloseButton={false}>
          <NavContent user={user} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
