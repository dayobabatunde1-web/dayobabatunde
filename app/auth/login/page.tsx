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
    <main className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-600 to-blue-900 px-6 py-12 sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="rounded-[28px] border border-sky-500 bg-blue-900/95 p-6 shadow-[0_20px_70px_rgba(59,130,246,0.2)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Welcome back</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Sign in to manage your deliveries with confidence.</h1>
          <p className="mt-4 text-sm leading-7 text-sky-200">
            You can open the dashboard directly, and you can still use the WhatsApp panel to chat with support or a customer whenever you need to.
          </p>

          <div className="mt-6 rounded-[24px] bg-sky-800/60 border border-sky-600 px-4 py-4 text-sm text-sky-200">
            {status}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleOpenDashboard}
              className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Open dashboard
            </button>
            <a href="/auth/signup" className="rounded-full border border-sky-500 px-5 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-800">
              Create an account
            </a>
          </div>
        </div>

        <div className="rounded-[30px] border border-sky-500 bg-sky-800/90 p-4 shadow-[0_20px_70px_rgba(59,130,246,0.2)]">
          <AuthIllustration className="w-full" />
        </div>
      </div>
    </main>
  )
}