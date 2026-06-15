'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
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
    <div className="flex flex-col h-full">
      {/* Brand — fixed top */}
      <div className="px-5 py-4 border-b border-border shrink-0">
        <span className="font-display text-xl text-charcoal tracking-wide">Elroisè</span>
        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">
          Admin
        </p>
      </div>

      {/* Scrollable middle — calendar first, nav below */}
      <div className="flex-1 overflow-y-auto min-h-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
        <div className="px-3 py-3 border-b border-border">
          <MiniCalendar />
        </div>

        <nav className="px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname.startsWith(href)
                  ? 'bg-charcoal text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* User + Sign out — fixed bottom */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="size-7 rounded-full bg-gold/20 flex items-center justify-center text-xs font-semibold text-gold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full px-1"
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
