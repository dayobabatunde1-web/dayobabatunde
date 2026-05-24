'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DEFAULT_VENDOR_ID, createSeedDemoRiders, loadLocalRiders, saveLocalRiders } from '@/lib/ops-state'
import { Plus, X } from 'lucide-react'
import { RidersIllustration } from '@/app/components/page-illustrations'

interface RiderRecord {
  id: string
  name: string
  phone?: string
  whatsapp_phone?: string
  vehicle_type?: string
  vehicle_plate?: string
  status?: string
  created_at?: string
}

export default function RidersPage() {
  const [riders, setRiders] = useState<RiderRecord[]>([])
  const [vendorId, setVendorId] = useState(DEFAULT_VENDOR_ID)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp_phone: '',
    vehicle_type: 'motorcycle',
    vehicle_plate: '',
  })

  useEffect(() => {
    document.title = 'LogiTrust | Riders'
  }, [])

  useEffect(() => {
    const init = async () => {
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
          const { data } = await supabase
            .from('riders')
            .select('*')
            .eq('vendor_id', remoteVendorId)
            .order('created_at', { ascending: false })
          const remoteRiders = (data || []) as RiderRecord[]
          setRiders(remoteRiders)
          saveLocalRiders(remoteRiders as unknown as ReturnType<typeof loadLocalRiders>)
          return
        }
      } catch {
        // fall through to local demo mode
      }

      const localRiders = loadLocalRiders()
      setVendorId(DEFAULT_VENDOR_ID)
      setIsDemoMode(true)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('logitrust-demo-mode', 'true')
        window.dispatchEvent(new Event('logitrust-demo-mode-changed'))
      }
      setRiders(localRiders.length ? (localRiders as RiderRecord[]) : createSeedDemoRiders() as RiderRecord[])
      if (localRiders.length === 0) {
        saveLocalRiders(createSeedDemoRiders())
      }
    }
    init()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const newRider: RiderRecord = {
      id: `local-${Date.now()}`,
      name: form.name,
      phone: form.phone,
      whatsapp_phone: form.whatsapp_phone,
      vehicle_type: form.vehicle_type,
      vehicle_plate: form.vehicle_plate,
      status: 'available',
      created_at: new Date().toISOString(),
    }

    if (vendorId !== DEFAULT_VENDOR_ID) {
      const { data, error } = await supabase
        .from('riders')
        .insert({ ...form, vendor_id: vendorId })
        .select()

      if (!error && data) {
        setRiders([data[0] as RiderRecord, ...riders])
        saveLocalRiders([data[0] as unknown as ReturnType<typeof loadLocalRiders>[number], ...loadLocalRiders()])
        setShowModal(false)
        setForm({ name: '', phone: '', whatsapp_phone: '', vehicle_type: 'motorcycle', vehicle_plate: '' })
        setLoading(false)
        return
      }
    }

    const nextRiders = [newRider, ...riders]
    setRiders(nextRiders)
    saveLocalRiders(nextRiders as unknown as ReturnType<typeof loadLocalRiders>)
    setShowModal(false)
    setForm({ name: '', phone: '', whatsapp_phone: '', vehicle_type: 'motorcycle', vehicle_plate: '' })
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-800',
    on_delivery: 'bg-sky-100 text-sky-800',
    offline: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-[28px] border border-blue-100 bg-white/95 p-6 shadow-[0_20px_70px_rgba(59,130,246,0.12)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Riders</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Keep your rider team organized and ready for every dispatch.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Add rider details, track availability, and keep communications consistent across your delivery operations.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={18} />
              <span>Add rider</span>
            </button>
            <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              {riders.length} rider{riders.length === 1 ? '' : 's'} in view
            </div>
          </div>
        </div>
        <div className="rounded-[28px] border border-blue-100 bg-white/90 p-4 shadow-[0_20px_70px_rgba(59,130,246,0.08)]">
          <RidersIllustration className="w-full" />
        </div>
      </section>

      {isDemoMode && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo mode is active: showing local fallback data because Supabase vendor access is not available right now. Your changes are saved in this browser session.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {riders.map(rider => (
          <div key={rider.id} className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-[0_18px_45px_rgba(59,130,246,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{rider.name}</h3>
                <p className="text-sm text-slate-500">{rider.phone}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[rider.status || 'available'] || 'bg-slate-100 text-slate-700'}`}>
                {rider.status?.replace(/_/g, ' ') || 'available'}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-700">Vehicle:</span> {rider.vehicle_type} — {rider.vehicle_plate || 'No plate'}</p>
              <p><span className="font-semibold text-slate-700">WhatsApp:</span> {rider.whatsapp_phone}</p>
            </div>
          </div>
        ))}
        {riders.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-blue-100 bg-white px-6 py-12 text-center text-slate-400 md:col-span-2 xl:col-span-3">
            No riders yet. Add your first rider to start planning dispatches.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Add rider</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900">Create a rider profile</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-full bg-blue-50 p-2 text-blue-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddRider} className="space-y-3">
              {[
                { label: 'Full Name', name: 'name', placeholder: 'Enter rider name' },
                { label: 'Phone', name: 'phone', placeholder: 'Enter regular phone number' },
                { label: 'WhatsApp Phone', name: 'whatsapp_phone', placeholder: 'Enter WhatsApp number', type: 'tel' },
                { label: 'Vehicle Plate', name: 'vehicle_plate', placeholder: 'Enter vehicle plate' },
              ].map(field => (
                <div key={field.name}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{field.label}</label>
                  <input
                    name={field.name}
                    type={field.type || 'text'}
                    inputMode={field.type === 'tel' ? 'tel' : undefined}
                    autoComplete={field.type === 'tel' ? 'tel' : undefined}
                    placeholder={field.placeholder}
                    value={(form as any)[field.name]}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Vehicle Type</label>
                <select
                  name="vehicle_type"
                  value={form.vehicle_type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Adding...' : 'Add rider'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}