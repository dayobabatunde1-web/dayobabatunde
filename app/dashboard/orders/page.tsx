'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { appendActivity, appendAudit, buildWhatsAppUrl, canManageOrders, createSeedDemoOrders, createSeedDemoRiders, DEFAULT_VENDOR_ID, estimateEta, getFilterLabel, getOrderNote, isAtRisk, isToday, loadActivityFeed, loadAuditLog, loadLocalOrders, loadLocalRiders, loadProofRecords, loadStoredState, saveActivityFeed, saveAuditLog, saveLocalOrders, saveLocalRiders, saveOrderNote, saveProofRecords, statusLabel, statusOrder, type ActivityRecord, type AuditEntry, type DashboardRole, type FilterPreset, type ProofRecord } from '@/lib/ops-state'
import { Download, Edit, FileText, Plus, Search, ShieldCheck, X } from 'lucide-react'
import { OrdersIllustration } from '@/app/components/page-illustrations'

interface OrderRecord {
  id: string
  order_ref?: string
  customer_name: string
  customer_phone?: string
  customer_whatsapp?: string
  pickup_address?: string
  delivery_address: string
  package_description?: string
  delivery_fee?: number
  rider_id?: string | null
  status: string
  created_at?: string
  riders?: { name?: string }
  notes?: string
}

interface RiderRecord {
  id: string
  name: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  assigned: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-sky-100 text-sky-800',
  out_for_delivery: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-700',
}

const filterPresets: FilterPreset[] = ['all', 'today', 'pending', 'at-risk', 'delivered']

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [riders, setRiders] = useState<RiderRecord[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('all')
  const [proofRecords, setProofRecords] = useState<ProofRecord[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityRecord[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [invoiceHtml, setInvoiceHtml] = useState('')
  const [editOrder, setEditOrder] = useState<OrderRecord | null>(null)
  const [role, setRole] = useState<DashboardRole>('admin')
  const [vendorId, setVendorId] = useState(DEFAULT_VENDOR_ID)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_whatsapp: '',
    pickup_address: '',
    delivery_address: '',
    package_description: '',
    delivery_fee: '',
    rider_id: '',
    status: 'pending',
    notes: '',
  })

  useEffect(() => {
    document.title = 'LogiTrust | Orders'
  }, [])

  useEffect(() => {
    setRole(loadStoredState<DashboardRole>('logitrust-role', 'admin'))
    setProofRecords(loadProofRecords())
    setActivityFeed(loadActivityFeed())
    setAuditLog(loadAuditLog())
  }, [])

  useEffect(() => {
    saveProofRecords(proofRecords)
  }, [proofRecords])

  useEffect(() => {
    saveActivityFeed(activityFeed)
  }, [activityFeed])

  useEffect(() => {
    saveAuditLog(auditLog)
  }, [auditLog])

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

          const [ordersResponse, ridersResponse] = await Promise.all([
            supabase
              .from('orders')
              .select('*, riders(name)')
              .eq('vendor_id', remoteVendorId)
              .order('created_at', { ascending: false }),
            supabase
              .from('riders')
              .select('id, name')
              .eq('vendor_id', remoteVendorId)
              .eq('is_active', true),
          ])

          if (!ordersResponse.error) {
            setOrders((ordersResponse.data || []) as OrderRecord[])
            saveLocalOrders((ordersResponse.data || []) as unknown as ReturnType<typeof loadLocalOrders>)
          }

          if (!ridersResponse.error) {
            setRiders((ridersResponse.data || []) as RiderRecord[])
            saveLocalRiders((ridersResponse.data || []) as unknown as ReturnType<typeof loadLocalRiders>)
          }

          return
        }
      } catch {
        // fall through to local demo mode
      }

      const localOrders = loadLocalOrders()
      const localRiders = loadLocalRiders()
      setVendorId(DEFAULT_VENDOR_ID)
      setIsDemoMode(true)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('logitrust-demo-mode', 'true')
        window.dispatchEvent(new Event('logitrust-demo-mode-changed'))
      }
      setOrders(localOrders.length ? (localOrders as unknown as OrderRecord[]) : createSeedDemoOrders() as unknown as OrderRecord[])
      setRiders(localRiders.length ? (localRiders as unknown as RiderRecord[]) : createSeedDemoRiders() as unknown as RiderRecord[])

      if (localOrders.length === 0) {
        saveLocalOrders(createSeedDemoOrders())
      }

      if (localRiders.length === 0) {
        saveLocalRiders(createSeedDemoRiders())
      }
    }

    init()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageOrders(role)) {
      alert('You do not have permission to create orders.')
      return
    }

    setLoading(true)

    const orderRef = `LGT-${Date.now().toString().slice(-6)}`
    const riderName = riders.find((rider) => rider.id === form.rider_id)?.name
    const createdOrder: OrderRecord = {
      id: `local-${Date.now()}`,
      order_ref: orderRef,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_whatsapp: form.customer_whatsapp,
      pickup_address: form.pickup_address,
      delivery_address: form.delivery_address,
      package_description: form.package_description,
      delivery_fee: parseFloat(form.delivery_fee) || 0,
      rider_id: form.rider_id || null,
      status: form.rider_id ? 'assigned' : 'pending',
      created_at: new Date().toISOString(),
      riders: riderName ? { name: riderName } : undefined,
      notes: form.notes,
    }

    if (vendorId !== DEFAULT_VENDOR_ID) {
      const { data, error } = await supabase.from('orders').insert({
        vendor_id: vendorId,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_whatsapp: form.customer_whatsapp,
        pickup_address: form.pickup_address,
        delivery_address: form.delivery_address,
        package_description: form.package_description,
        delivery_fee: parseFloat(form.delivery_fee) || 0,
        rider_id: form.rider_id || null,
        status: form.rider_id ? 'assigned' : 'pending',
      }).select('*, riders(name)')

      if (!error && data) {
        const remoteOrder = data[0] as OrderRecord
        setOrders((previousOrders) => [remoteOrder, ...previousOrders])
        saveLocalOrders([remoteOrder as unknown as Awaited<ReturnType<typeof loadLocalOrders>>[number], ...loadLocalOrders()])
        saveOrderNote(remoteOrder.id, form.notes)
        appendActivity(`Created order ${remoteOrder.order_ref || remoteOrder.id.slice(0, 8)} for ${remoteOrder.customer_name}`)
        appendAudit(`Created order ${remoteOrder.order_ref || remoteOrder.id.slice(0, 8)}`)
        setShowModal(false)
        setForm({
          customer_name: '',
          customer_phone: '',
          customer_whatsapp: '',
          pickup_address: '',
          delivery_address: '',
          package_description: '',
          delivery_fee: '',
          rider_id: '',
          status: 'pending',
          notes: '',
        })
        setLoading(false)
        return
      }
    }

    setOrders((previousOrders) => [createdOrder, ...previousOrders])
    saveLocalOrders([createdOrder as unknown as Awaited<ReturnType<typeof loadLocalOrders>>[number], ...loadLocalOrders()])
    saveOrderNote(createdOrder.id, form.notes)
    appendActivity(`Created order ${createdOrder.order_ref} for ${createdOrder.customer_name}`)
    appendAudit(`Created order ${createdOrder.order_ref}`)
    setShowModal(false)
    setForm({
      customer_name: '',
      customer_phone: '',
      customer_whatsapp: '',
      pickup_address: '',
      delivery_address: '',
      package_description: '',
      delivery_fee: '',
      rider_id: '',
      status: 'pending',
      notes: '',
    })

    setLoading(false)
  }

  const handleStatusChange = async (orderId: string, status: string) => {
    if (!canManageOrders(role)) {
      alert('You do not have permission to update order status.')
      return
    }

    const nextOrders = orders.map((order) => order.id === orderId ? { ...order, status } : order)
    setOrders(nextOrders)
    saveLocalOrders(nextOrders as unknown as Awaited<ReturnType<typeof loadLocalOrders>>)

    if (vendorId !== DEFAULT_VENDOR_ID) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
      if (error) {
        alert('Error: ' + error.message)
      }
    }

    appendActivity(`Updated order ${orderId.slice(0, 8)} to ${statusLabel(status)}`)
    appendAudit(`Status updated to ${statusLabel(status)} for ${orderId.slice(0, 8)}`)
  }

  const openEditOrder = (order: OrderRecord) => {
    if (!canManageOrders(role)) {
      alert('You do not have permission to edit orders.')
      return
    }

    setEditOrder(order)
    setForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || '',
      customer_whatsapp: order.customer_whatsapp || '',
      pickup_address: order.pickup_address || '',
      delivery_address: order.delivery_address,
      package_description: order.package_description || '',
      delivery_fee: order.delivery_fee?.toString() || '',
      rider_id: order.rider_id || '',
      status: order.status,
      notes: getOrderNote(order.id),
    })
    setShowEditModal(true)
  }

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editOrder || !canManageOrders(role)) return

    const riderName = riders.find((rider) => rider.id === form.rider_id)?.name
    const nextOrders = orders.map((order) => order.id === editOrder.id ? {
      ...order,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_whatsapp: form.customer_whatsapp,
      pickup_address: form.pickup_address,
      delivery_address: form.delivery_address,
      package_description: form.package_description,
      delivery_fee: parseFloat(form.delivery_fee) || 0,
      rider_id: form.rider_id || null,
      status: form.status,
      riders: riderName ? { name: riderName } : order.riders,
      notes: form.notes,
    } : order)

    setOrders(nextOrders)
    saveLocalOrders(nextOrders as unknown as Awaited<ReturnType<typeof loadLocalOrders>>)
    saveOrderNote(editOrder.id, form.notes)

    if (vendorId !== DEFAULT_VENDOR_ID) {
      const { error } = await supabase.from('orders').update({
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_whatsapp: form.customer_whatsapp,
        pickup_address: form.pickup_address,
        delivery_address: form.delivery_address,
        package_description: form.package_description,
        delivery_fee: parseFloat(form.delivery_fee) || 0,
        rider_id: form.rider_id || null,
        status: form.status,
      }).eq('id', editOrder.id)

      if (error) {
        alert('Error: ' + error.message)
      }
    }

    appendActivity(`Edited order ${editOrder.id.slice(0, 8)} and saved notes`)
    appendAudit(`Edited order ${editOrder.id.slice(0, 8)}`)
    setShowEditModal(false)
    setEditOrder(null)
  }

  const handleProofUpload = async (orderId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    let previewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : '')
      }
      reader.readAsDataURL(file)
    })

    let storagePath = ''
    let source: 'supabase' | 'local' = 'local'

    try {
      const filePath = `${orderId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const { error } = await supabase.storage.from('delivery-proofs').upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      })

      if (!error) {
        storagePath = filePath
        source = 'supabase'
        const { data } = supabase.storage.from('delivery-proofs').getPublicUrl(filePath)
        if (data?.publicUrl) {
          previewUrl = data.publicUrl
        }
      }
    } catch {
      storagePath = ''
      source = 'local'
    }

    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      orderId,
      fileName: file.name,
      previewUrl,
      storagePath: storagePath || undefined,
      source,
      uploadedAt: new Date().toISOString(),
    }

    setProofRecords((previous) => [record, ...previous].slice(0, 12))
    setSelectedOrderId(orderId)
    appendActivity(`Uploaded proof for order ${orderId.slice(0, 8)} (${file.name})`)
    appendAudit(`Proof uploaded for order ${orderId.slice(0, 8)}`)
  }

  const handleGenerateInvoice = (order: OrderRecord) => {
    const invoice = `
      <html>
        <head>
          <title>Invoice - ${order.order_ref || order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin-bottom: 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 18px; }
            .box { border: 1px solid #bfdbfe; border-radius: 16px; padding: 16px; }
            .label { color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
            .value { margin-top: 6px; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>LogiTrust Invoice</h1>
          <p>Order reference: ${order.order_ref || order.id}</p>
          <div class="grid">
            <div class="box">
              <div class="label">Customer</div>
              <div class="value">${order.customer_name}</div>
              <div class="value">${order.customer_phone || order.customer_whatsapp || 'No contact'}</div>
            </div>
            <div class="box">
              <div class="label">Delivery</div>
              <div class="value">${order.delivery_address}</div>
              <div class="value">${order.pickup_address || 'Pickup not set'}</div>
            </div>
          </div>
          <div class="box" style="margin-top: 18px;">
            <div class="label">Summary</div>
            <div class="value">Package: ${order.package_description || 'Standard delivery'}</div>
            <div class="value">Status: ${order.status.replace(/_/g, ' ')}</div>
            <div class="value">Fee: ₦${(order.delivery_fee || 0).toLocaleString()}</div>
          </div>
        </body>
      </html>
    `

    setInvoiceHtml(invoice)
    setSelectedOrderId(order.id)
  }

  const openCustomerChat = (order: OrderRecord) => {
    const chatUrl = buildWhatsAppUrl(order.customer_whatsapp || order.customer_phone, `Hello ${order.customer_name}, I want to confirm the current status of order ${order.order_ref || order.id}.`)

    if (!chatUrl) {
      alert('No customer contact is available for this order.')
      return
    }

    window.open(chatUrl, '_blank', 'noopener,noreferrer')
  }

  const printInvoice = () => {
    if (!invoiceHtml) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    appendAudit(`Invoice exported for order ${selectedOrderId.slice(0, 8)}`)
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const riderName = order.riders?.name || riders.find((rider) => rider.id === order.rider_id)?.name || ''
      const matchesSearch = `${order.customer_name} ${order.customer_phone || ''} ${order.customer_whatsapp || ''} ${order.delivery_address} ${order.order_ref || ''} ${riderName}`.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const matchesPreset = filterPreset === 'all'
        || (filterPreset === 'today' && isToday(order.created_at))
        || (filterPreset === 'pending' && order.status === 'pending')
        || (filterPreset === 'delivered' && order.status === 'delivered')
        || (filterPreset === 'at-risk' && isAtRisk(order))
      return matchesSearch && matchesStatus && matchesPreset
    })
  }, [orders, riders, searchTerm, statusFilter, filterPreset])

  const canEditOrders = canManageOrders(role)
  const recentProofs = proofRecords.slice(0, 4)
  const operationalAlerts = useMemo(() => ({
    pending: filteredOrders.filter((order) => order.status === 'pending').length,
    atRisk: filteredOrders.filter((order) => isAtRisk(order)).length,
  }), [filteredOrders])

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-[28px] border border-blue-100 bg-white/95 p-6 shadow-[0_20px_70px_rgba(59,130,246,0.12)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Orders</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Create and track orders from a single, organized view.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Add orders, filter the queue, edit existing records, upload delivery proof, and generate invoices from the same page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowModal(true)}
              disabled={!canEditOrders}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} />
              <span>{canEditOrders ? 'New order' : 'Read-only mode'}</span>
            </button>
            <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              {orders.length} active orders
            </div>
            <div className="rounded-full border border-blue-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {filteredOrders.length} visible
            </div>
          </div>
        </div>
        <div className="rounded-[28px] border border-blue-100 bg-white/90 p-4 shadow-[0_20px_70px_rgba(59,130,246,0.08)]">
          <OrdersIllustration className="w-full" />
        </div>
      </section>

      {isDemoMode && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo mode is active: showing local fallback data because Supabase vendor access is not available right now. Your changes are saved in this browser session.
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Search and filters</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">Find the order you need fast</h2>
            </div>
            <div className="flex flex-1 items-center gap-2 md:max-w-md">
              <Search size={18} className="text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search customer, address, or phone"
                className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All statuses</option>
              {statusOrder.map((status) => (
                <option key={status} value={status}>{statusLabel(status)}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {filterPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFilterPreset(preset)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filterPreset === preset ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                >
                  {getFilterLabel(preset)}
                </button>
              ))}
            </div>
            <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {filteredOrders.length} matching orders
            </div>
            <div className="rounded-full border border-blue-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              Role: {role}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Pending</p>
              <p className="mt-2 text-lg font-bold text-amber-900">{operationalAlerts.pending}</p>
            </div>
            <div className="rounded-[20px] bg-rose-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Delay watch</p>
              <p className="mt-2 text-lg font-bold text-rose-900">{operationalAlerts.atRisk}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Delivery proof</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">Quick proof capture & record</h2>
            </div>
            <ShieldCheck className="text-blue-600" size={20} />
          </div>
          <div className="mt-4 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Use the upload button on any order to capture proof and keep delivery evidence linked to the order.
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-slate-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Ref</th>
                <th className="px-6 py-3 text-left font-semibold">Customer</th>
                <th className="px-6 py-3 text-left font-semibold">Delivery Address</th>
                <th className="px-6 py-3 text-left font-semibold">Rider</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">ETA</th>
                <th className="px-6 py-3 text-left font-semibold">Fee</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-blue-50/40">
                  <td className="px-6 py-4 font-mono text-xs text-slate-700">{order.order_ref || order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{order.customer_name}</p>
                    <p className="text-sm text-slate-500">{order.customer_phone || order.customer_whatsapp || 'No contact'}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{order.delivery_address}</td>
                  <td className="px-6 py-4 text-slate-700">{order.riders?.name || 'Unassigned'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(event) => handleStatusChange(order.id, event.target.value)}
                      disabled={!canEditOrders}
                      className="rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {statusOrder.map((status) => (
                        <option key={status} value={status}>{statusLabel(status)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <div className="flex flex-col gap-1">
                      <span>{estimateEta(order.status).label}</span>
                      {isAtRisk(order) ? <span className="text-xs font-semibold text-rose-600">Delay risk</span> : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">₦{(order.delivery_fee || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditOrder(order)}
                        disabled={!canEditOrders}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateInvoice(order)}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        <FileText size={14} />
                        Export PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => openCustomerChat(order)}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        <Download size={14} />
                        Chat
                      </button>
                      <label className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${canEditOrders ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        <Download size={14} />
                        Proof
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          disabled={!canEditOrders}
                          onChange={(event) => handleProofUpload(order.id, event)}
                        />
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No orders match your search. Adjust your filters or create a new order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Invoice preview</p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">Print or review the selected invoice</h2>
          {invoiceHtml ? (
            <div className="mt-4 rounded-[20px] border border-blue-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Invoice generated for order {selectedOrderId.slice(0, 8)}.</p>
              <button
                type="button"
                onClick={printInvoice}
                className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Export PDF
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-[20px] border border-dashed border-blue-100 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Generate an invoice from any order to preview it here.
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Proof activity</p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">Recent delivery proof previews</h2>
          <div className="mt-4 space-y-3">
            {recentProofs.length === 0 ? (
              <div className="rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">No proof has been uploaded yet.</div>
            ) : (
              recentProofs.map((proof) => (
                <div key={proof.id} className="rounded-[20px] bg-blue-50 px-4 py-3 text-sm text-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{proof.fileName}</p>
                      <p className="text-xs text-slate-500">Order {proof.orderId.slice(0, 8)} • {proof.source}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">{proof.uploadedAt.slice(0, 10)}</span>
                  </div>
                  {proof.previewUrl.startsWith('data:image') ? (
                    <img src={proof.previewUrl} alt={proof.fileName} className="mt-3 max-h-40 w-full rounded-2xl object-cover" />
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Activity timeline</p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">Latest operational events</h2>
          <div className="mt-4 space-y-3">
            {(activityFeed.length === 0 && auditLog.length === 0) ? (
              <div className="rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">No activity has been recorded yet.</div>
            ) : (
              [...activityFeed, ...auditLog].slice(0, 8).map((entry, index) => (
                <div key={`${entry.id}-${index}`} className="rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{('message' in entry ? entry.message : entry.action)}</p>
                    <span className="text-xs text-slate-500">{entry.createdAt.slice(0, 10)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">New order</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900">Add delivery details</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-full bg-blue-50 p-2 text-blue-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-3">
              {[
                { label: 'Customer Name', name: 'customer_name', placeholder: 'Enter customer name' },
                { label: 'Customer Phone', name: 'customer_phone', placeholder: 'Enter regular phone number' },
                { label: 'Customer WhatsApp', name: 'customer_whatsapp', placeholder: 'Enter WhatsApp number', type: 'tel' },
                { label: 'Pickup Address', name: 'pickup_address', placeholder: 'Pickup location' },
                { label: 'Delivery Address', name: 'delivery_address', placeholder: 'Delivery destination' },
                { label: 'Package Description', name: 'package_description', placeholder: 'Describe the package' },
                { label: 'Delivery Fee (?)', name: 'delivery_fee', placeholder: '0' },
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
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes / comments</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Add internal notes for the order"
                  className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Assign Rider</label>
                <select
                  name="rider_id"
                  value={form.rider_id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Unassigned</option>
                  {riders.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Creating...' : 'Create order'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Edit order</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900">Update delivery details</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="rounded-full bg-blue-50 p-2 text-blue-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateOrder} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {statusOrder.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Customer Name</label>
                <input name="customer_name" value={form.customer_name} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Customer Phone</label>
                <input name="customer_phone" value={form.customer_phone} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Customer WhatsApp</label>
                <input name="customer_whatsapp" value={form.customer_whatsapp} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Pickup Address</label>
                <input name="pickup_address" value={form.pickup_address} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Delivery Address</label>
                <input name="delivery_address" value={form.delivery_address} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Package Description</label>
                <textarea name="package_description" value={form.package_description} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Delivery Fee</label>
                <input name="delivery_fee" value={form.delivery_fee} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes / comments</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Internal note for this order" className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Assign Rider</label>
                <select name="rider_id" value={form.rider_id} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                  <option value="">Unassigned</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>{rider.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                Save changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
