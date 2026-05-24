'use client'

import { useEffect, useState } from 'react'
import { AuthIllustration } from '@/app/components/page-illustrations'

export default function LoginPage() {
  const [status, setStatus] = useState('You can access the dashboard directly. Use the WhatsApp panel if you want to chat with a team member.')

  useEffect(() => {
    document.title = 'LogiTrust | Login'
  }, [])

  const handleOpenDashboard = () => {
    setStatus('Opening your dashboard...')
    window.location.replace('/dashboard')
  }

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="rounded-[28px] border border-blue-100 bg-white/95 p-6 shadow-[0_20px_70px_rgba(59,130,246,0.12)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Welcome back</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Sign in to manage your deliveries with confidence.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            You can open the dashboard directly, and you can still use the WhatsApp panel to chat with support or a customer whenever you need to.
          </p>

          <div className="mt-6 rounded-[24px] bg-blue-50 px-4 py-4 text-sm text-slate-700">
            {status}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleOpenDashboard}
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Open dashboard
            </button>
            <a href="/auth/signup" className="rounded-full border border-blue-200 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
              Create an account
            </a>
          </div>
        </div>

        <div className="rounded-[30px] border border-blue-100 bg-white/90 p-4 shadow-[0_20px_70px_rgba(59,130,246,0.1)]">
          <AuthIllustration className="w-full" />
        </div>
      </div>
    </main>
  )
}