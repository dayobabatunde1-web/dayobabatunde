export type DashboardRole = 'admin' | 'dispatcher' | 'rider'

export type FilterPreset = 'all' | 'today' | 'pending' | 'at-risk' | 'delivered'

export interface ProofRecord {
  id: string
  orderId: string
  fileName: string
  previewUrl: string
  storagePath?: string
  source: 'supabase' | 'local'
  uploadedAt: string
}

export interface ActivityRecord {
  id: string
  message: string
  createdAt: string
}

export interface AuditEntry {
  id: string
  action: string
  createdAt: string
}

export interface OrderNoteRecord {
  orderId: string
  note: string
  updatedAt: string
}

export const statusOrder = ['pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']

export function loadStoredState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveStoredState<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function normalizeContactNumber(value?: string) {
  if (!value) return ''
  const digits = value.trim().replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('234') ? digits : digits.startsWith('0') ? `234${digits.slice(1)}` : digits
}

export function buildWhatsAppUrl(value?: string, message = 'Hello, please confirm your delivery details.') {
  const normalized = normalizeContactNumber(value)
  if (!normalized) return ''
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

export function loadProofRecords() {
  return loadStoredState<ProofRecord[]>('logitrust-proof-records', [])
}

export function saveProofRecords(records: ProofRecord[]) {
  saveStoredState('logitrust-proof-records', records)
}

export function loadActivityFeed() {
  return loadStoredState<ActivityRecord[]>('logitrust-activity-feed', [])
}

export function saveActivityFeed(feed: ActivityRecord[]) {
  saveStoredState('logitrust-activity-feed', feed)
}

export function loadAuditLog() {
  return loadStoredState<AuditEntry[]>('logitrust-audit-log', [])
}

export function saveAuditLog(entries: AuditEntry[]) {
  saveStoredState('logitrust-audit-log', entries)
}

export function loadOrderNotes() {
  return loadStoredState<OrderNoteRecord[]>('logitrust-order-notes', [])
}

export function saveOrderNotes(notes: OrderNoteRecord[]) {
  saveStoredState('logitrust-order-notes', notes)
}

export function appendActivity(message: string) {
  const feed = loadActivityFeed()
  const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, message, createdAt: new Date().toISOString() }
  saveActivityFeed([entry, ...feed].slice(0, 12))
  return entry
}

export function appendAudit(action: string) {
  const entries = loadAuditLog()
  const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, action, createdAt: new Date().toISOString() }
  saveAuditLog([entry, ...entries].slice(0, 20))
  return entry
}

export function getOrderNote(orderId: string) {
  const notes = loadOrderNotes()
  return notes.find((note) => note.orderId === orderId)?.note || ''
}

export function saveOrderNote(orderId: string, note: string) {
  const notes = loadOrderNotes()
  const nextNotes = notes.filter((entry) => entry.orderId !== orderId)
  nextNotes.unshift({ orderId, note, updatedAt: new Date().toISOString() })
  saveOrderNotes(nextNotes)
  return note
}

export function statusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

export function estimateEta(status: string) {
  switch (status) {
    case 'pending':
      return { label: '30 min', minutes: 30 }
    case 'assigned':
      return { label: '20 min', minutes: 20 }
    case 'picked_up':
      return { label: '15 min', minutes: 15 }
    case 'in_transit':
      return { label: '10 min', minutes: 10 }
    case 'out_for_delivery':
      return { label: '5 min', minutes: 5 }
    case 'delivered':
      return { label: 'Delivered', minutes: 0 }
    default:
      return { label: 'Pending', minutes: 30 }
  }
}

export function isAtRisk(order: { status: string; created_at?: string }, thresholdMinutes = 180) {
  if (!order.created_at) return false
  if (['delivered', 'cancelled'].includes(order.status)) return false
  const createdAt = new Date(order.created_at)
  if (Number.isNaN(createdAt.getTime())) return false
  return Date.now() - createdAt.getTime() > thresholdMinutes * 60 * 1000
}

export function getFilterLabel(preset: FilterPreset) {
  if (preset === 'all') return 'All orders'
  if (preset === 'today') return 'Today'
  if (preset === 'pending') return 'Pending'
  if (preset === 'at-risk') return 'At risk'
  return 'Delivered'
}

export function isToday(value?: string) {
  if (!value) return false
  const orderDate = new Date(value)
  const today = new Date()
  return orderDate.getFullYear() === today.getFullYear() && orderDate.getMonth() === today.getMonth() && orderDate.getDate() === today.getDate()
}

export function canManageOrders(role: DashboardRole) {
  return role !== 'rider'
}

export function canViewAudit(role: DashboardRole) {
  return role === 'admin'
}

export const DEFAULT_VENDOR_ID = 'local-default-vendor'

export interface DemoOrderRecord {
  id: string
  order_ref: string
  customer_name: string
  customer_phone?: string
  customer_whatsapp?: string
  pickup_address?: string
  delivery_address: string
  package_description?: string
  delivery_fee?: number
  rider_id?: string | null
  status: string
  created_at: string
  riders?: { name?: string }
  notes?: string
}

export interface DemoRiderRecord {
  id: string
  name: string
  phone?: string
  whatsapp_phone?: string
  vehicle_type?: string
  vehicle_plate?: string
  status?: string
  created_at?: string
}

export function loadLocalOrders() {
  return loadStoredState<DemoOrderRecord[]>('logitrust-local-orders', [])
}

export function saveLocalOrders(orders: DemoOrderRecord[]) {
  saveStoredState('logitrust-local-orders', orders)
}

export function loadLocalRiders() {
  return loadStoredState<DemoRiderRecord[]>('logitrust-local-riders', [])
}

export function saveLocalRiders(riders: DemoRiderRecord[]) {
  saveStoredState('logitrust-local-riders', riders)
}

export function createSeedDemoOrders() {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  return [
    {
      id: 'demo-order-1',
      order_ref: 'LGT-1001',
      customer_name: 'Ada Johnson',
      customer_phone: '08012345678',
      customer_whatsapp: '08012345678',
      pickup_address: 'Ikeja',
      delivery_address: 'Victoria Island',
      package_description: 'Electronics parcel',
      delivery_fee: 2500,
      rider_id: 'demo-rider-1',
      status: 'assigned',
      created_at: yesterday.toISOString(),
      riders: { name: 'Musa K.' },
      notes: 'Confirm receiver before delivery.',
    },
    {
      id: 'demo-order-2',
      order_ref: 'LGT-1002',
      customer_name: 'Chris Bello',
      customer_phone: '08123456789',
      customer_whatsapp: '08123456789',
      pickup_address: 'Lekki Phase 1',
      delivery_address: 'Ajah',
      package_description: 'Documents and small box',
      delivery_fee: 1500,
      rider_id: 'demo-rider-2',
      status: 'in_transit',
      created_at: now.toISOString(),
      riders: { name: 'Amina T.' },
      notes: 'Customer asked for live tracking.',
    },
  ]
}

export function createSeedDemoRiders() {
  return [
    {
      id: 'demo-rider-1',
      name: 'Musa K.',
      phone: '09010000001',
      whatsapp_phone: '09010000001',
      vehicle_type: 'motorcycle',
      vehicle_plate: 'LGT-101',
      status: 'available',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rider-2',
      name: 'Amina T.',
      phone: '09010000002',
      whatsapp_phone: '09010000002',
      vehicle_type: 'car',
      vehicle_plate: 'LGT-202',
      status: 'on_delivery',
      created_at: new Date().toISOString(),
    },
  ]
}

export function ensureLocalDemoData() {
  const orders = loadLocalOrders()
  const riders = loadLocalRiders()

  if (orders.length === 0) {
    saveLocalOrders(createSeedDemoOrders())
  }

  if (riders.length === 0) {
    saveLocalRiders(createSeedDemoRiders())
  }

  return { orders: loadLocalOrders(), riders: loadLocalRiders() }
}
