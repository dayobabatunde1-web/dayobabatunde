'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DEFAULT_VENDOR_ID, createSeedDemoOrders, createSeedDemoRiders, loadLocalOrders, loadLocalRiders, saveLocalOrders, saveLocalRiders } from '@/lib/ops-state'
import { BellRing, CheckCircle, Clock, Package, Users, BarChart3, Navigation, Smartphone, Mail, Send, RefreshCw, ShieldCheck, BellDot, Inbox, Download, UserCog, MapPinned } from 'lucide-react'

interface RiderRecord {
  id: string
  name: string
  is_active?: boolean
  current_location?: string
}

interface OrderRecord {
  id: string
  customer_name: string
  customer_whatsapp?: string
  customer_phone?: string
  status: string
  delivery_address: string
  created_at?: string
}

const statusOrder = ['pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']
const routePoints = [
  { left: 18, top: 26 },
  { left: 36, top: 18 },
  { left: 52, top: 36 },
  { left: 68, top: 24 },
  { left: 82, top: 45 },
]

function loadStoredState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

function saveStoredState<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function normalizeContactNumber(value?: string) {
  if (!value) return ''
  const digits = value.trim().replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('234') ? digits : digits.startsWith('0') ? `234${digits.slice(1)}` : digits
}

function buildWhatsAppUrl(value?: string, message = 'Hello, please confirm your delivery details.') {
  const normalized = normalizeContactNumber(value)
  if (!normalized) return ''
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    totalRiders: 0,
  })
  const [liveRiders, setLiveRiders] = useState<RiderRecord[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [sentNotifications, setSentNotifications] = useState<Record<string, boolean>>({})
  const [notificationLog, setNotificationLog] = useState<string[]>([])
  const [routeCursor, setRouteCursor] = useState(0)
  const [role, setRole] = useState<'admin' | 'dispatcher' | 'rider'>('admin')
  const [vendorId, setVendorId] = useState(DEFAULT_VENDOR_ID)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [browserPermission, setBrowserPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [lastSynced, setLastSynced] = useState<string>('Never')
  const [syncing, setSyncing] = useState(false)
  const [connectionState, setConnectionState] = useState<'live' | 'polling'>('polling')
  const [proofs, setProofs] = useState<string[]>([])

  useEffect(() => {
    document.title = 'LogiTrust | Dashboard'
  }, [])

  useEffect(() => {
    const savedRole = loadStoredState<'admin' | 'dispatcher' | 'rider'>('logitrust-role', 'admin')
    setRole(savedRole)
    setNotificationLog(loadStoredState<string[]>('logitrust-notifications', []))
    setProofs(loadStoredState<string[]>('logitrust-proofs', []))
    if (typeof Notification !== 'undefined') {
      setBrowserPermission(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'default')
    }
  }, [])

  useEffect(() => {
    saveStoredState('logitrust-role', role)
  }, [role])

  useEffect(() => {
    saveStoredState('logitrust-notifications', notificationLog)
  }, [notificationLog])

  useEffect(() => {
    saveStoredState('logitrust-proofs', proofs)
  }, [proofs])

  const fetchDashboardData = async () => {
    setSyncing(true)
    setConnectionState('polling')

    try {
      const vendorResponse = await supabase.from('vendors').select('id').limit(1)
      if (!vendorResponse.error && vendorResponse.data?.length) {
        const remoteVendorId = vendorResponse.data[0].id
        setVendorId(remoteVendorId)
        setIsDemoMode(false)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('logitrust-demo-mode', 'false')
          window.dispatchEvent(new Event('logitrust-demo-mode-changed'))
        }

        const [ordersResponse, ridersResponse] = await Promise.all([
          supabase.from('orders').select('*').eq('vendor_id', remoteVendorId),
          supabase.from('riders').select('*').eq('vendor_id', remoteVendorId),
        ])

        const allOrders = ordersResponse.data || []
        const allRiders = ridersResponse.data || []
        const activeRiders = allRiders.filter((rider: RiderRecord) => rider.is_active)

        setOrders(allOrders)
        setLiveRiders(activeRiders)
        saveLocalOrders(allOrders as never[])
        saveLocalRiders(allRiders as never[])
        setStats({
          totalOrders: allOrders.length,
          activeOrders: allOrders.filter((order: OrderRecord) => ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'].includes(order.status)).length,
          deliveredOrders: allOrders.filter((order: OrderRecord) => order.status === 'delivered').length,
          totalRiders: allRiders.length,
        })
        setLastSynced(new Date().toLocaleTimeString())
        setSyncing(false)
        return
      }
    } catch {
      // fall through to local fallback
    }

    const localOrders = loadLocalOrders()
    const localRiders = loadLocalRiders()
    const fallbackOrders = localOrders.length ? localOrders : createSeedDemoOrders()
    const fallbackRiders = localRiders.length ? localRiders : createSeedDemoRiders()

    setVendorId(DEFAULT_VENDOR_ID)
    setIsDemoMode(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('logitrust-demo-mode', 'true')
      window.dispatchEvent(new Event('logitrust-demo-mode-changed'))
    }
    setOrders(fallbackOrders as unknown as OrderRecord[])
    setLiveRiders(fallbackRiders as unknown as RiderRecord[])
    saveLocalOrders(fallbackOrders)
    saveLocalRiders(fallbackRiders)
    setStats({
      totalOrders: fallbackOrders.length,
      activeOrders: fallbackOrders.filter((order: OrderRecord) => ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'].includes(order.status)).length,
      deliveredOrders: fallbackOrders.filter((order: OrderRecord) => order.status === 'delivered').length,
      totalRiders: fallbackRiders.length,
    })
    setLastSynced(new Date().toLocaleTimeString())
    setSyncing(false)
  }

  useEffect(() => {
    fetchDashboardData()
    const interval = window.setInterval(fetchDashboardData, 15000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let dashboardChannel: ReturnType<typeof supabase.channel> | undefined

    const subscribeToDashboard = async () => {
      if (vendorId === DEFAULT_VENDOR_ID) return

      dashboardChannel = supabase
        .channel('dashboard-live-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vendorId}` },
          () => {
            setConnectionState('live')
            fetchDashboardData()
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'riders', filter: `vendor_id=eq.${vendorId}` },
          () => {
            setConnectionState('live')
            fetchDashboardData()
          },
        )
        .subscribe()
    }

    subscribeToDashboard()

    return () => {
      if (dashboardChannel) {
        supabase.removeChannel(dashboardChannel)
      }
    }
  }, [vendorId])

  useEffect(() => {
    if (liveRiders.length === 0) return

    const interval = window.setInterval(() => {
      setRouteCursor((previous) => (previous + 1) % routePoints.length)
    }, 3200)

    return () => window.clearInterval(interval)
  }, [liveRiders.length])

  const analytics = useMemo(() => {
    const statusCounts = statusOrder.map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    }))

    const completionRate = stats.totalOrders === 0 ? 0 : Math.round((stats.deliveredOrders / stats.totalOrders) * 100)
    const riderLoad = stats.totalRiders === 0 ? 0 : Math.round((stats.activeOrders / stats.totalRiders) * 10) / 10
    const notificationQueue = orders.filter((order) => ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'].includes(order.status)).length

    const now = new Date()
    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now)
      date.setDate(now.getDate() - (6 - index))
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        key: date.toISOString().slice(0, 10),
        count: 0,
      }
    })

    orders.forEach((order) => {
      if (!order.created_at) return
      const createdDate = new Date(order.created_at)
      const key = createdDate.toISOString().slice(0, 10)
      const day = last7Days.find((entry) => entry.key === key)
      if (day) day.count += 1
    })

    return {
      completionRate,
      riderLoad,
      notificationQueue,
      statusCounts,
      dailyTrend: last7Days,
    }
  }, [orders, stats])

  const customerNotifications = useMemo(() => {
    return orders
      .filter((order) => ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'].includes(order.status))
      .slice(0, 4)
      .map((order) => ({
        id: order.id,
        customer: order.customer_name,
        address: order.delivery_address,
        contactNumber: order.customer_whatsapp || order.customer_phone || '',
        channel: order.customer_whatsapp ? 'WhatsApp' : order.customer_phone ? 'SMS' : 'Manual',
        message:
          order.status === 'picked_up'
            ? 'Your parcel has been picked up and is on the way.'
            : order.status === 'in_transit'
              ? 'Your delivery is now in transit and should arrive soon.'
              : order.status === 'out_for_delivery'
                ? 'Your delivery is out for delivery and will arrive shortly.'
                : 'Your order has been assigned and is moving through the dispatch queue.',
      }))
  }, [orders])

  const sendNotification = (item: { id: string; customer: string; channel: string; contactNumber?: string; message: string }) => {
    setSentNotifications((previous) => ({ ...previous, [item.id]: true }))

    if (item.channel === 'WhatsApp' && item.contactNumber) {
      window.open(buildWhatsAppUrl(item.contactNumber, item.message), '_blank', 'noopener,noreferrer')
    } else if (item.channel === 'SMS' && item.contactNumber) {
      window.open(`sms:${item.contactNumber}?body=${encodeURIComponent(item.message)}`, '_blank', 'noopener,noreferrer')
    }

    const message = item.contactNumber
      ? `Opened ${item.channel} update for ${item.customer}`
      : `Prepared ${item.channel} update for ${item.customer}`

    setNotificationLog((previous) => [message, ...previous].slice(0, 8))
  }

  const sendAllNotifications = () => {
    customerNotifications.forEach((item) => {
      setSentNotifications((previous) => ({ ...previous, [item.id]: true }))
      sendNotification(item)
    })

    setNotificationLog((previous) => [`Sent updates to ${customerNotifications.length} active customers`, ...previous].slice(0, 8))
  }

  const requestBrowserNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setNotificationLog((previous) => ['Browser notifications are not supported in this environment.', ...previous].slice(0, 8))
      return
    }

    const permission = await Notification.requestPermission()
    setBrowserPermission(permission)
    setNotificationLog((previous) => [`Browser notifications permission: ${permission}`, ...previous].slice(0, 8))
  }

  const sendBrowserPush = () => {
    if (typeof Notification === 'undefined') {
      setNotificationLog((previous) => ['Browser notifications are not available right now.', ...previous].slice(0, 8))
      return
    }

    if (Notification.permission !== 'granted') {
      setNotificationLog((previous) => ['Allow browser notifications to send push updates.', ...previous].slice(0, 8))
      return
    }

    new Notification('LogiTrust update', {
      body: `${stats.activeOrders} deliveries are currently active and ${stats.deliveredOrders} have been completed.`,
    })

    setNotificationLog((previous) => ['Browser push notification sent to the current device.', ...previous].slice(0, 8))
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    const nextOrders = orders.map((order) => order.id === id ? { ...order, status } : order)
    setOrders(nextOrders)
    saveLocalOrders(nextOrders as never[])

    if (vendorId !== DEFAULT_VENDOR_ID) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id)
      if (error) {
        setNotificationLog((previous) => [`Failed to update order ${id}: ${error.message}`, ...previous].slice(0, 8))
        return
      }
    }

    setNotificationLog((previous) => [`Updated order ${id} to ${status.replace(/_/g, ' ')}`, ...previous].slice(0, 8))
  }

  const cards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: Package, tone: 'bg-blue-600' },
    { label: 'Active Deliveries', value: stats.activeOrders, icon: Clock, tone: 'bg-sky-500' },
    { label: 'Delivered', value: stats.deliveredOrders, icon: CheckCircle, tone: 'bg-emerald-500' },
    { label: 'Total Riders', value: stats.totalRiders, icon: Users, tone: 'bg-indigo-500' },
  ]

  const animatedRiders = liveRiders.slice(0, 3).map((rider, index) => ({
    ...rider,
    point: routePoints[(routeCursor + index) % routePoints.length],
  }))

  const latestProofs = proofs.slice(0, 3)

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-[28px] border border-blue-100 bg-white/95 p-6 shadow-[0_20px_70px_rgba(59,130,246,0.12)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Overview</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Keep every delivery moving with a calm, clear dashboard.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Review orders, rider activity, tracking status, customer communication, and operational controls from one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/dashboard/orders" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
              Manage orders
            </a>
            <a href="/dashboard/track" className="rounded-full border border-blue-200 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
              Open tracking
            </a>
            <button
              type="button"
              onClick={() => fetchDashboardData()}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-blue-100 bg-blue-50/80 p-4 shadow-[0_20px_70px_rgba(59,130,246,0.08)]">
          <div className="rounded-[24px] bg-white p-4 shadow-[0_14px_40px_rgba(59,130,246,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Live operations</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{stats.activeOrders} active deliveries</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Last sync: {lastSynced}
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${connectionState === 'live' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                  {connectionState === 'live' ? 'Realtime connected' : 'Polling updates'}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-lg font-bold text-slate-900">{stats.totalRiders}</div>
                <div>Riders</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-lg font-bold text-slate-900">{analytics.notificationQueue}</div>
                <div>Needs update</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-lg font-bold text-slate-900">{analytics.completionRate}%</div>
                <div>Completion</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isDemoMode && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo mode is active: showing local fallback data because Supabase vendor access is not available right now. Your changes are saved in this browser session.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-[0_18px_45px_rgba(59,130,246,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
              <div className={`${card.tone} rounded-2xl p-3 text-white`}>
                <card.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Live driver map</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Follow rider movement with an animated route view</h2>
            </div>
            <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {liveRiders.length} riders online
            </div>
          </div>

          <div className="relative mt-5 h-64 overflow-hidden rounded-[24px] border border-blue-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_22%),linear-gradient(135deg,_#eff6ff_0%,_#ffffff_45%,_#dbeafe_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-70">
              <path d="M8 28 C22 22, 34 20, 50 28 S76 40, 92 24" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 58 C28 50, 44 56, 62 46 S82 34, 94 42" fill="none" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" />
            </svg>

            {animatedRiders.map((rider, index) => (
              <div
                key={rider.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white bg-white/95 px-3 py-2 shadow-[0_12px_30px_rgba(37,99,235,0.16)]"
                style={{ left: `${rider.point.left}%`, top: `${rider.point.top}%` }}
              >
                <p className="text-[11px] font-semibold text-slate-900">{rider.name}</p>
                <p className="text-[10px] text-slate-500">{rider.current_location || 'En route to next stop'}</p>
              </div>
            ))}

            {animatedRiders.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                Create active riders to see the live route map.
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Nearest rider</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{liveRiders[0]?.name || 'Waiting for assignment'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Route pulse</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{liveRiders.length > 0 ? 'Updating every 3s' : 'No active route'}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">ETA window</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">15–30 min</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Customer notifications</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Keep customers informed with the right message</h2>
            </div>
            <BellRing className="text-blue-600" size={20} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={sendAllNotifications}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Send size={16} />
              Send updates
            </button>
            <button
              type="button"
              onClick={requestBrowserNotifications}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              <BellDot size={16} />
              {browserPermission === 'granted' ? 'Notifications enabled' : 'Enable browser push'}
            </button>
            <button
              type="button"
              onClick={sendBrowserPush}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              <Inbox size={16} />
              Test push
            </button>
            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {customerNotifications.length} active notifications
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {customerNotifications.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.customer}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.address}</p>
                    <p className="mt-2 text-sm text-slate-700">{item.message}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                      {item.channel === 'WhatsApp' ? <Smartphone size={12} /> : <Mail size={12} />}
                      {item.channel}
                    </span>
                    <button
                      onClick={() => sendNotification(item)}
                      className={`mt-3 block w-full rounded-full px-3 py-2 text-xs font-semibold transition ${
                        sentNotifications[item.id]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {sentNotifications[item.id] ? 'Message opened' : item.channel === 'WhatsApp' ? 'Open chat' : 'Send update'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {customerNotifications.length === 0 && (
              <div className="rounded-[22px] border border-dashed border-blue-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Create an active order and customer updates will appear here.
              </div>
            )}
          </div>

          <div className="mt-4 rounded-[20px] bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notification history</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {notificationLog.length === 0 ? (
                <li>No notifications sent yet.</li>
              ) : (
                notificationLog.map((entry, index) => (
                  <li key={`${entry}-${index}`}>{entry}</li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Analytics dashboard</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Understand delivery performance at a glance</h2>
            </div>
            <BarChart3 className="text-blue-600" size={20} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Delivery completion</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${analytics.completionRate}%` }} />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.completionRate}%</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Rider load</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, analytics.riderLoad * 20)}%` }} />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.riderLoad.toFixed(1)} orders / rider</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-900">Daily delivery trend</p>
            <div className="mt-4 flex items-end gap-3">
              {analytics.dailyTrend.map((day) => {
                const height = Math.max(16, day.count * 24)
                return (
                  <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end justify-center rounded-[18px] bg-blue-50 px-2 pt-2">
                      <div
                        className="w-full rounded-t-[14px] bg-gradient-to-t from-blue-600 to-sky-400"
                        style={{ height: `${height}px` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{day.label}</span>
                    <span className="text-sm font-bold text-slate-900">{day.count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {analytics.statusCounts.map((item) => {
              const maxCount = Math.max(...analytics.statusCounts.map((entry) => entry.count), 1)
              const percent = Math.round((item.count / maxCount) * 100)

              return (
                <div key={item.status} className="rounded-[22px] border border-blue-100 bg-blue-50/50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.status.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-500">{item.count} orders</p>
                    </div>
                    <div className="w-32">
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Role controls</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Role-based access and visibility</h2>
              </div>
              <ShieldCheck className="text-blue-600" size={20} />
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Current role</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as 'admin' | 'dispatcher' | 'rider')}
                className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="admin">Admin</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="rider">Rider</option>
              </select>
            </div>
            <div className="mt-4 rounded-[20px] bg-blue-50 px-4 py-3 text-sm text-slate-700">
              {role === 'admin' && 'Full operations view enabled for admin workflows.'}
              {role === 'dispatcher' && 'Dispatch and order controls are highlighted for fast routing.'}
              {role === 'rider' && 'Rider-focused view enabled with route updates and delivery visibility.'}
            </div>
          </div>

          <div className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Delivery proof</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Proof captured for recent deliveries</h2>
              </div>
              <Download className="text-blue-600" size={20} />
            </div>
            <div className="mt-4 space-y-3">
              {latestProofs.length === 0 ? (
                <div className="rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">Upload proof from the Orders page to see it here.</div>
              ) : (
                latestProofs.map((proof, index) => (
                  <div key={`${proof}-${index}`} className="rounded-[20px] bg-blue-50 px-4 py-3 text-sm text-slate-700 break-all">
                    {proof}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Live order queue</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Update order status from the dashboard</h2>
          </div>
          <MapPinned className="text-blue-600" size={20} />
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {orders.slice(0, 6).map((order) => (
            <div key={order.id} className="rounded-[22px] border border-blue-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{order.customer_name}</p>
                  <p className="text-sm text-slate-500">{order.delivery_address}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700">{order.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusOrder.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, status)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      order.status === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    {status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
