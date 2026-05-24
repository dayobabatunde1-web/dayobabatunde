'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Package, Users, MapPinned, LogOut } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    const syncDemoMode = () => {
      setIsDemoMode(window.localStorage.getItem('logitrust-demo-mode') === 'true')
    }

    syncDemoMode()
    window.addEventListener('storage', syncDemoMode)
    window.addEventListener('logitrust-demo-mode-changed', syncDemoMode)
    return () => {
      window.removeEventListener('storage', syncDemoMode)
      window.removeEventListener('logitrust-demo-mode-changed', syncDemoMode)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const active = 'flex items-center gap-3 px-4 py-2 rounded-xl bg-sky-500/20 text-white font-semibold'
  const inactive = 'flex items-center gap-3 px-4 py-2 rounded-xl text-sky-200 hover:bg-sky-500/20 hover:text-white'

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-sky-400 via-blue-600 to-blue-900">
      <aside className="w-72 border-r border-sky-500/40 bg-blue-900/80 backdrop-blur">
        <div className="p-6 border-b border-sky-500/40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">LogiTrust</p>
          <h1 className="mt-2 text-xl font-bold text-white">Delivery Control</h1>
          <p className="mt-1 text-sm text-sky-300">Dispatch, riders, and tracking in one place.</p>
          {isDemoMode && (
            <div className="mt-3 inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200">
              Demo mode
            </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className={pathname === '/dashboard' ? active : inactive}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </a>
          <a href="/dashboard/orders" className={pathname === '/dashboard/orders' ? active : inactive}>
            <Package size={18} />
            <span>Orders</span>
          </a>
          <a href="/dashboard/riders" className={pathname === '/dashboard/riders' ? active : inactive}>
            <Users size={18} />
            <span>Riders</span>
          </a>
          <a href="/dashboard/track" className={pathname === '/dashboard/track' ? active : inactive}>
            <MapPinned size={18} />
            <span>Track</span>
          </a>
        </nav>
        <div className="p-4 border-t border-sky-500/40">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sky-300 transition hover:bg-rose-500/20 hover:text-rose-300"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 sm:p-8 lg:p-10">
        {children}
      </main>
    </div>
  )
}