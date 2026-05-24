type IllustrationProps = {
  className?: string
}

export function AuthIllustration({ className = 'w-full max-w-sm' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={className}
      role="img"
      aria-label="Login and signup illustration"
      fill="none"
    >
      <rect width="420" height="320" rx="32" fill="#e0f2fe" />
      <circle cx="92" cy="84" r="30" fill="#93c5fd" />
      <rect x="48" y="138" width="146" height="18" rx="9" fill="#bfdbfe" />
      <rect x="48" y="170" width="124" height="14" rx="7" fill="#dbeafe" />
      <rect x="48" y="208" width="170" height="18" rx="9" fill="#60a5fa" />
      <rect x="255" y="54" width="110" height="110" rx="28" fill="#ffffff" stroke="#93c5fd" strokeWidth="4" />
      <rect x="284" y="88" width="52" height="10" rx="5" fill="#0f172a" opacity="0.9" />
      <rect x="284" y="109" width="38" height="8" rx="4" fill="#38bdf8" />
      <path d="M236 226C236 193.863 262.863 167 295 167H322C354.137 167 381 193.863 381 226V252H236V226Z" fill="#0f172a" />
      <circle cx="295" cy="206" r="18" fill="#93c5fd" />
      <circle cx="295" cy="206" r="8" fill="#ffffff" />
    </svg>
  )
}

export function DashboardIllustration({ className = 'w-full max-w-md' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={className}
      role="img"
      aria-label="Dashboard illustration"
      fill="none"
    >
      <rect width="420" height="320" rx="32" fill="#eff6ff" />
      <rect x="42" y="44" width="336" height="232" rx="24" fill="#ffffff" stroke="#bfdbfe" strokeWidth="3" />
      <rect x="66" y="76" width="120" height="18" rx="9" fill="#dbeafe" />
      <rect x="66" y="114" width="186" height="14" rx="7" fill="#e0f2fe" />
      <rect x="66" y="154" width="84" height="74" rx="20" fill="#2563eb" />
      <rect x="170" y="154" width="84" height="74" rx="20" fill="#38bdf8" />
      <rect x="274" y="154" width="84" height="74" rx="20" fill="#dbeafe" />
      <path d="M80 228C120 196 160 196 200 228" stroke="#93c5fd" strokeWidth="5" strokeLinecap="round" />
      <circle cx="320" cy="90" r="30" fill="#93c5fd" />
      <circle cx="320" cy="90" r="12" fill="#ffffff" />
    </svg>
  )
}

export function OrdersIllustration({ className = 'w-full max-w-md' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={className}
      role="img"
      aria-label="Orders illustration"
      fill="none"
    >
      <rect width="420" height="320" rx="32" fill="#f0f9ff" />
      <rect x="48" y="50" width="324" height="220" rx="24" fill="#ffffff" stroke="#bfdbfe" strokeWidth="3" />
      <rect x="72" y="82" width="116" height="18" rx="9" fill="#dbeafe" />
      <rect x="72" y="118" width="252" height="12" rx="6" fill="#e0f2fe" />
      <rect x="72" y="146" width="252" height="14" rx="7" fill="#bae6fd" />
      <rect x="72" y="176" width="132" height="12" rx="6" fill="#bfdbfe" />
      <rect x="72" y="206" width="184" height="12" rx="6" fill="#e0f2fe" />
      <rect x="298" y="158" width="26" height="70" rx="13" fill="#38bdf8" />
      <path d="M298 176H324" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="310" cy="194" r="10" fill="#ffffff" />
      <path d="M312 194L309 197L307 199" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RidersIllustration({ className = 'w-full max-w-md' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={className}
      role="img"
      aria-label="Riders illustration"
      fill="none"
    >
      <rect width="420" height="320" rx="32" fill="#f0f9ff" />
      <circle cx="118" cy="108" r="34" fill="#93c5fd" />
      <rect x="68" y="154" width="100" height="10" rx="5" fill="#dbeafe" />
      <rect x="68" y="180" width="84" height="10" rx="5" fill="#bfdbfe" />
      <rect x="215" y="74" width="134" height="140" rx="22" fill="#ffffff" stroke="#bfdbfe" strokeWidth="3" />
      <circle cx="282" cy="124" r="26" fill="#2563eb" />
      <path d="M250 220C250 192.386 272.386 170 300 170H326C353.614 170 376 192.386 376 220V248H250V220Z" fill="#0f172a" />
      <path d="M248 202H356" stroke="#93c5fd" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function TrackListIllustration({ className = 'w-full max-w-md' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={className}
      role="img"
      aria-label="Track list illustration"
      fill="none"
    >
      <rect width="420" height="320" rx="32" fill="#eff6ff" />
      <rect x="56" y="56" width="308" height="208" rx="24" fill="#ffffff" stroke="#bfdbfe" strokeWidth="3" />
      <path d="M90 112H334" stroke="#93c5fd" strokeWidth="4" strokeLinecap="round" />
      <rect x="90" y="136" width="244" height="12" rx="6" fill="#dbeafe" />
      <rect x="90" y="166" width="180" height="12" rx="6" fill="#bae6fd" />
      <rect x="90" y="196" width="140" height="12" rx="6" fill="#e0f2fe" />
      <circle cx="324" cy="250" r="26" fill="#2563eb" />
      <path d="M324 238V262M312 250H336" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="90" cy="252" r="16" fill="#38bdf8" />
    </svg>
  )
}

export function PublicTrackIllustration({ className = 'w-full max-w-md' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={className}
      role="img"
      aria-label="Tracking page illustration"
      fill="none"
    >
      <rect width="420" height="320" rx="32" fill="#e0f2fe" />
      <rect x="52" y="56" width="316" height="208" rx="24" fill="#ffffff" stroke="#bfdbfe" strokeWidth="3" />
      <circle cx="108" cy="116" r="28" fill="#2563eb" />
      <path d="M108 102V130M90 116H126" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <path d="M84 182C112 152 146 148 178 170C210 192 244 198 290 176" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
      <circle cx="290" cy="176" r="15" fill="#93c5fd" />
      <rect x="86" y="214" width="84" height="10" rx="5" fill="#dbeafe" />
      <rect x="186" y="214" width="120" height="10" rx="5" fill="#bfdbfe" />
    </svg>
  )
}
