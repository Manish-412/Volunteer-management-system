'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const emailFromQuery = searchParams.get('email') || ''
    const emailFromStorage = typeof window !== 'undefined' ? localStorage.getItem('pendingVerificationEmail') || '' : ''
    const resolvedEmail = emailFromQuery || emailFromStorage

    if (resolvedEmail) {
      setEmail(resolvedEmail)
      localStorage.setItem('pendingVerificationEmail', resolvedEmail)
    }
  }, [searchParams])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          purpose: 'EMAIL_VERIFICATION',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || 'Verification failed')
        return
      }

      toast.success('Email verified successfully!')
      localStorage.removeItem('pendingVerificationEmail')
      router.push('/dashboard')
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      console.error('Verify email error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-400/30">
            <span className="text-2xl font-bold text-emerald-300">V</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Verify your email</h1>
          <p className="mt-2 text-sm text-slate-300">
            Enter the 6-digit OTP sent to your email address.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400/50"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-center text-2xl tracking-[0.4em] text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
          <Link href="/register" className="hover:text-white hover:underline">
            Back to register
          </Link>
          <Link href="/login" className="hover:text-white hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
