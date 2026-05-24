import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://fvceqniysljjuckbahfs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Y2Vxbml5c2xqanVja2JhaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA5MzEsImV4cCI6MjA5NDkyNjkzMX0.b2rzTJ59yPp2lqVUoaJ3JUseaaofzfe1_FKpBRNmFUI"
);

interface TrackingSession {
  id: string;
  order_id: string;
  token: string;
  is_active: boolean;
  expires_at: string;
  last_accessed_at: string | null;
  created_at: string;
}

interface Order {
  id: string;
  status?: string;
  recipient_name?: string;
  recipient_address?: string;
  delivery_address?: string;
  pickup_address?: string;
  delivery_notes?: string;
  created_at?: string;
  estimated_delivery?: string;
  tracking_number?: string;
  [key: string]: unknown;
}

const STATUS_STEPS = [
  { key: "pending",          label: "Order Placed",     icon: "📋" },
  { key: "picked_up",        label: "Picked Up",        icon: "📦" },
  { key: "in_transit",       label: "In Transit",       icon: "🚚" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
  { key: "delivered",        label: "Delivered",        icon: "✅" },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 0,
  picked_up: 1,
  in_transit: 2,
  out_for_delivery: 3,
  delivered: 4,
};

function getStatusIndex(status?: string) {
  if (!status) return 0;
  return STATUS_INDEX[status.toLowerCase()] ?? 0;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = "bg-gray-100 text-gray-600";
  if (s === "delivered") cls = "bg-green-100 text-green-700";
  else if (s === "in_transit") cls = "bg-blue-100 text-blue-700";
  else if (s === "out_for_delivery") cls = "bg-yellow-100 text-yellow-700";
  else if (s === "picked_up") cls = "bg-purple-100 text-purple-700";
  else if (s === "cancelled") cls = "bg-red-100 text-red-700";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-md flex flex-col min-h-screen">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-orange-600">LogiTrust</h1>
        <p className="text-xs text-gray-500">Delivery Management</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <a href="/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-orange-50 text-gray-700 hover:text-orange-600">
          <span>⊞</span>
          <span>Dashboard</span>
        </a>
        <a href="/dashboard/orders" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-orange-50 text-gray-700 hover:text-orange-600">
          <span>📦</span>
          <span>Orders</span>
        </a>
        <a href="/dashboard/riders" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-orange-50 text-gray-700 hover:text-orange-600">
          <span>👥</span>
          <span>Riders</span>
        </a>
      </nav>
      <div className="p-4 border-t">
        <a href="/auth/login" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600">
          <span>↩</span>
          <span>Logout</span>
        </a>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex gap-3 items-start">
      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ErrorContent({ title, message, debug, isDev }: {
  title: string;
  message: string;
  debug: Record<string, unknown>;
  isDev: boolean;
}) {
  return (
    <Shell>
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Track Delivery</h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full border-2 border-red-300 text-red-500 flex items-center justify-center text-xl font-bold mx-auto mb-4">
            !
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-sm text-gray-500">{message}</p>
          {isDev && (
            <details className="mt-5 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-left">
              <summary className="cursor-pointer font-semibold text-yellow-800">
                🔍 Debug info
              </summary>
              <pre className="mt-2 overflow-auto text-yellow-900">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </Shell>
  );
}

export async function generateMetadata() {
  return {
    title: "LogiTrust | Track Delivery",
    description: "Open a live LogiTrust tracking page for an order delivery update.",
  };
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const isDev = process.env.NODE_ENV === "development";
  let debugInfo: Record<string, unknown> = { decodedToken: token };

  if (!token || token === "undefined") {
    return (
      <ErrorContent
        title="Invalid Link"
        message="No tracking token was provided."
        debug={debugInfo}
        isDev={isDev}
      />
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("tracking_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  debugInfo = { ...debugInfo, sessionError, session };

  if (sessionError || !session) {
    return (
      <ErrorContent
        title="Tracking link not found"
        message="We couldn't find a delivery matching this link."
        debug={debugInfo}
        isDev={isDev}
      />
    );
  }

  const s = session as TrackingSession;

  if (!s.is_active) {
    return (
      <ErrorContent
        title="Link Deactivated"
        message="This tracking link has been deactivated."
        debug={debugInfo}
        isDev={isDev}
      />
    );
  }

  if (new Date(s.expires_at) < new Date()) {
    return (
      <ErrorContent
        title="Link Expired"
        message={`This link expired on ${formatDate(s.expires_at)}.`}
        debug={debugInfo}
        isDev={isDev}
      />
    );
  }

  supabase
    .from("tracking_sessions")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", s.id)
    .then(() => {});

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", s.order_id)
    .maybeSingle();

  debugInfo = { ...debugInfo, orderError, order };

  const o = order as Order | null;
  const currentStep = getStatusIndex(o?.status);
  const deliveryAddress = o?.recipient_address ?? o?.delivery_address;

  return (
    <Shell>
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Track Delivery</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-gray-800">Delivery Status</h2>
              {o?.status && <StatusBadge status={o.status} />}
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Tracking ID:{" "}
              <span className="font-semibold text-gray-600">
                #{o?.tracking_number ?? s.id.slice(0, 8).toUpperCase()}
              </span>
            </p>
            <div>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                let dotClass = "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ";
                dotClass += done ? "bg-orange-500 text-white " : "bg-gray-200 text-gray-400 ";
                dotClass += active ? "ring-4 ring-orange-100" : "";
                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center w-6 shrink-0">
                      <div className={dotClass}>
                        {done && !active ? "✓" : active ? "●" : ""}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 flex-1 min-h-[20px] my-1 ${i < currentStep ? "bg-orange-500" : "bg-gray-200"}`} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 pb-5 pt-0.5">
                      <span>{step.icon}</span>
                      <span className={`text-sm ${active ? "text-orange-600 font-bold" : done ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-5">Delivery Details</h2>
            <div className="space-y-4">
              {deliveryAddress && <DetailRow icon="📍" label="Delivering To" value={deliveryAddress} />}
              {o?.pickup_address && <DetailRow icon="🏠" label="Pickup From" value={o.pickup_address} />}
              {o?.recipient_name && <DetailRow icon="👤" label="Recipient" value={o.recipient_name} />}
              {o?.estimated_delivery && <DetailRow icon="🗓️" label="Est. Delivery" value={formatDate(o.estimated_delivery)} />}
              <DetailRow icon="🕒" label="Order Placed" value={formatDate(o?.created_at ?? s.created_at)} />
              {o?.delivery_notes && <DetailRow icon="📝" label="Notes" value={o.delivery_notes} />}
            </div>
            <p className="text-xs text-gray-300 mt-6">
              Link valid until {formatDate(s.expires_at)} · Last checked {formatDate(s.last_accessed_at)}
            </p>
          </div>

        </div>

        {isDev && (
          <details className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs">
            <summary className="cursor-pointer font-semibold text-yellow-800">
              🔍 Debug info (dev only)
            </summary>
            <pre className="mt-2 overflow-auto text-yellow-900">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </Shell>
  );
}