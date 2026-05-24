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

  const active = 'flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold'
  const inactive = 'flex items-center gap-3 px-4 py-2 rounded-xl text-slate-600 hover:bg-blue-50/80 hover:text-blue-700'

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#e0f2fe_100%)]">
      <aside className="w-72 border-r border-blue-100 bg-white/95 backdrop-blur">
        <div className="p-6 border-b border-blue-100">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">LogiTrust</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Delivery Control</h1>
          <p className="mt-1 text-sm text-slate-500">Dispatch, riders, and tracking in one place.</p>
          {isDemoMode && (
            <div className="mt-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
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
        <div className="p-4 border-t border-blue-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
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