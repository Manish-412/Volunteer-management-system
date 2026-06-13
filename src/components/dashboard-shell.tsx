'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import type { CurrentUser } from '@/types/dashboard'

const UserContext = createContext<CurrentUser | null>(null)

export function useCurrentUser() {
  return useContext(UserContext)
}

const commonNavigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/profile', label: 'My profile', icon: UserCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const adminNavigation = [
  { href: '/volunteers', label: 'Volunteers', icon: Users },
  { href: '/users', label: 'Users & roles', icon: UserCircle },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async response => {
        if (!response.ok) throw new Error('Unauthorized')
        const result = await response.json()
        setUser(result.data)
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('token')
    toast.success('Logged out successfully')
    router.replace('/login')
  }

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-500">Loading your workspace...</div>
  }

  const navigation = user.role === 'ADMIN'
    ? [...commonNavigation.slice(0, 2), ...adminNavigation, ...commonNavigation.slice(2)]
    : commonNavigation

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
            <Link href="/dashboard" className="flex shrink-0 items-center gap-2 text-lg font-bold text-slate-900 hover:no-underline">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm text-white">V</span>
              VIMS
            </Link>
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {navigation.map(item => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:no-underline ${
                      active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={16} />{item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight">{user.fullName}</p>
                <p className="text-xs text-slate-500">{user.role === 'ADMIN' ? 'Administrator' : 'Volunteer'}</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{user.role}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${user.emailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} title={user.emailVerified ? 'Email verified' : 'Email not verified'} />
              <button onClick={logout} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                <LogOut size={16} /><span className="hidden xl:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 lg:p-8">{children}</main>
      </div>
    </UserContext.Provider>
  )
}
