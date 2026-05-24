import { createClient } from '@supabase/supabase-js'
import { TrackListIllustration } from '@/app/components/page-illustrations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    <div className="rounded-[24px] border border-sky-600 bg-sky-800 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-700 text-sm font-bold text-white">
            #{session.id.slice(0, 4).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-white">
                Order {session.id.slice(0, 8).toUpperCase()}
              </p>
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
            <p className="mt-1 text-sm text-sky-300 truncate">{address}</p>
            <p className="mt-1 text-xs text-sky-400">
              Created {formatDate(session.created_at)} • Expires {formatDate(session.expires_at)}
            </p>
          </div>
        </div>
        
         <a href={trackUrl}
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
    description: 'View active delivery tracking links.',
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
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-blue-900 p-6 space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-[28px] border border-sky-600 bg-sky-900/95 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Track Orders</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Monitor every live tracking link from one focused dashboard.
          </h1>
          <p className="mt-4 text-sm leading-7 text-sky-200">
            Keep an eye on active links, expiration status, and the latest delivery updates.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-sky-600 bg-sky-800 px-4 py-2 text-sm font-semibold text-sky-200">
            {list.length} active link{list.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="rounded-[28px] border border-sky-600 bg-sky-800/90 p-4">
          <TrackListIllustration className="w-full" />
        </div>
      </section>

      {error && (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Error: {error.message}
        </div>
      )}

      {list.length === 0 && !error && (
        <div className="rounded-[24px] border border-dashed border-sky-600 bg-sky-800 px-6 py-12 text-center text-sky-300">
          No active tracking links yet.
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