'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AuthIllustration } from '@/app/components/page-illustrations'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'LogiTrust | Sign Up'
  }, [])

  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    business_name: '',
    contact_name: '',
    phone: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: vendorError } = await supabase.from('vendors').insert({
        auth_user_id: data.user.id,
        business_name: form.business_name,
        contact_name: form.contact_name,
        phone: form.phone,
        email: form.email,
      })

      if (vendorError) {
        setError(vendorError.message)
        setLoading(false)
        return
      }

      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="rounded-[30px] border border-blue-100 bg-white/90 p-4 shadow-[0_20px_70px_rgba(59,130,246,0.1)]">
          <AuthIllustration className="w-full" />
        </div>

        <div className="rounded-[28px] border border-blue-100 bg-white/95 p-6 shadow-[0_20px_70px_rgba(59,130,246,0.12)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Create your workspace</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Start your delivery management workflow in minutes.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Bring your orders, riders, and customer updates under one trusted system with a clean and modern dashboard.
          </p>
          {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
          <form onSubmit={handleSignup} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Business Name</label>
                <input name="business_name" value={form.business_name} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Contact Name</label>
                <input name="contact_name" value={form.contact_name} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <a href="/auth/login" className="font-semibold text-blue-700">Login</a>
          </p>
        </div>
      </div>
    </main>
  )
}