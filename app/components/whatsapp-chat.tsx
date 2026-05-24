'use client'

import { useEffect, useMemo, useState } from 'react'

const storageKey = 'logitrust-whatsapp-number'
const defaultWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '2348012345678'
const defaultWhatsAppMessage = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE || 'Hello LogiTrust team! I have a question.'

export function WhatsAppChat() {
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState(defaultWhatsAppNumber)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedNumber = window.localStorage.getItem(storageKey)
    if (storedNumber) {
      setNumber(storedNumber)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, number)
  }, [number])

  const chatUrl = useMemo(() => {
    const normalized = number.trim().replace(/\D/g, '')
    const finalNumber = normalized ? normalized : '2348012345678'

    return `https://wa.me/${finalNumber}?text=${encodeURIComponent(defaultWhatsAppMessage)}`
  }, [number])

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">WhatsApp chat</p>
            <p className="mt-2 text-sm text-slate-600">
              Use the default number or replace it with the customer or rider number you want to reach.
            </p>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            WhatsApp number
          </label>
          <input
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="Enter a WhatsApp number"
            className="mt-1 w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-4 flex gap-2">
            <a
              href={chatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Open chat
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Chat with us on WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-[0_16px_40px_rgba(37,211,102,0.28)] transition hover:scale-[1.02]"
      >
        <img src="/whatsapp.svg" alt="WhatsApp" width={32} height={32} style={{ display: 'block' }} />
      </button>
    </div>
  )
}
