'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AuthIllustration } from '@/app/components/page-illustrations'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'vendor',
  })

  useEffect(() => {
    document.title = 'LogiTrust | Login'
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    if (form.role === 'vendor') {
      router.push('/dashboard')
    } else if (form.role === 'rider') {
      router.push('/dashboard/riders')
    } else {
      router.push('/track')
    }
  }

  const roles = [
    { value: 'vendor', label: 'Vendor', description: 'Manage orders and deliveries', icon: '🏢' },
    { value: 'rider', label: 'Rider', description: 'View assigned deliveries', icon: '🛵' },
    { value: 'client', label: 'Client', description: 'Track your orders', icon: '📦' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-600 to-blue-900 px-6 py-12 sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">

        <div className="rounded-[28px] border border-sky-500 bg-blue-900/95 p-6 shadow-[0_20px_70px_rgba(59,130,246,0.2)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Welcome back</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Sign in to LogiTrust.</h1>
          <p className="mt-4 text-sm leading-7 text-sky-200">
            Select your role and sign in with your email and password.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl bg-rose-500/20 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-sky-200">I am a...</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`rounded-2xl border p-3 text-center transition ${
                      form.role === r.value
                        ? 'border-sky-400 bg-sky-500/30 text-white'
                        : 'border-sky-600/40 bg-sky-800/30 text-sky-300 hover:bg-sky-700/30'
                    }`}
                  >
                    <div className="text-2xl">{r.icon}</div>
                    <div className="mt-1 text-xs font-semibold">{r.label}</div>
                    <div className="mt-0.5 text-[10px] text-sky-400 leading-tight">{r.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-sky-200">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-sky-600 bg-sky-800/60 px-4 py-3 text-white placeholder-sky-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-sky-200">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-sky-600 bg-sky-800/60 px-4 py-3 text-white placeholder-sky-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : `Sign in as ${roles.find(r => r.value === form.role)?.label}`}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-sky-300">
            Don't have an account?{' '}
            <a href="/auth/signup" className="font-semibold text-white hover:text-sky-200">
              Create one
            </a>
          </p>
        </div>

        <div className="rounded-[30px] border border-sky-500 bg-sky-800/90 p-4 shadow-[0_20px_70px_rgba(59,130,246,0.2)]">
          <AuthIllustration className="w-full" />
        </div>
      </div>
    </main>
  )
}