import { createClient } from '@supabase/supabase-js'
import { TrackListIllustration } from '@/app/components/page-illustrations'

const supabase = createClient(
  'https://fvceqniysljjuckbahfs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Y2Vxbml5c2xqanVja2JhaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA5MzEsImV4cCI6MjA5NDkyNjkzMX0.b2rzTJ59yPp2lqVUoaJ3JUseaaofzfe1_FKpBRNmFUI'
)

interface Order {
  id: string
  status?: string
  pickup_address?: string
  recipient_address?: string
  delivery_address?: string
  recipient_name?: string
  created_at?: string
}

interface TrackingSession {
  id: string
  order_id: string
  token: string
  is_active: boolean
  expires_at: string
  created_at: string
  orders?: Order
}

function statusColor(status?: string) {
  const s = (status ?? '').toLowerCase()
  if (s === 'delivered') return 'bg-emerald-100 text-emerald-800'
  if (s === 'in_transit') return 'bg-sky-100 text-sky-800'
  if (s === 'out_for_delivery') return 'bg-cyan-100 text-cyan-800'
  if (s === 'picked_up') return 'bg-indigo-100 text-indigo-800'
  if (s === 'cancelled') return 'bg-rose-100 text-rose-800'
  return 'bg-slate-100 text-slate-700'
}

function formatDate(iso?: string | null) {
  if (!iso) return 'N/A'
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < new Date().getTime()
}

function SessionCard({ session }: { session: TrackingSession }) {
  const order = session.orders
  const address = order?.recipient_address ?? order?.delivery_address ?? order?.pickup_address ?? 'No address'
  const trackUrl = '/track/' + session.token
  const expired = isExpired(session.expires_at)

  return (
    <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-[0_18px_45px_rgba(59,130,246,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
            #{session.id.slice(0, 4).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">Order {session.id.slice(0, 8).toUpperCase()}</p>
              {order?.status && (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              )}
              {expired && (
                <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                  Expired
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500 truncate">{address}</p>
            <p className="mt-1 text-xs text-slate-400">
              Created {formatDate(session.created_at)} • Expires {formatDate(session.expires_at)}
            </p>
          </div>
        </div>
        <a
          href={trackUrl}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          View tracking
        </a>
      </div>
    </div>
  )
}

export async function generateMetadata() {
  return {
    title: 'LogiTrust | Track Orders',
    description: 'View active delivery tracking links and their status from the LogiTrust dashboard.',
  }
}

export default async function TrackListPage() {
  const { data: sessions, error } = await supabase
    .from('tracking_sessions')
    .select('*, orders(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const list = (sessions ?? []) as TrackingSession[]

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-[28px] border border-blue-100 bg-white/95 p-6 shadow-[0_20px_70px_rgba(59,130,246,0.12)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Track Orders</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Monitor every live tracking link from one focused dashboard.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Keep an eye on active links, expiration status, and the latest delivery updates in a clean, easy-to-scan view.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {list.length} active link{list.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="rounded-[28px] border border-blue-100 bg-white/90 p-4 shadow-[0_20px_70px_rgba(59,130,246,0.08)]">
          <TrackListIllustration className="w-full" />
        </div>
      </section>

      {error && (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Error: {error.message}
        </div>
      )}

      {list.length === 0 && !error && (
        <div className="rounded-[24px] border border-dashed border-blue-100 bg-white px-6 py-12 text-center text-slate-400">
          No active tracking links yet. Once orders are created, they will appear here.
        </div>
      )}

      <div className="grid gap-4">
        {list.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}