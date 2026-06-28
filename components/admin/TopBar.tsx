'use client'

import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/calendar': 'Calendar',
  '/admin/appointments': 'Appointments',
  '/admin/shifts': 'Shifts',
  '/admin/services': 'Services',
  '/admin/clients': 'Clients',
  '/admin/team': 'Team',
  '/admin/settings': 'Settings',
}

interface Props {
  user: { name: string; role: string }
}

export default function TopBar({ user }: Props) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'Admin'

  return (
    <header className="h-12 flex items-center justify-between px-5 border-b border-border shrink-0 bg-background">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-2.5">
        <span className="text-xs text-muted-foreground hidden sm:block">{user.name}</span>
        <div className="size-7 rounded-full bg-[#636B2F]/15 flex items-center justify-center text-xs font-semibold text-[#636B2F]">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
