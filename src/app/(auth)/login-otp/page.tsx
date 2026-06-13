'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, KeyRound, LoaderCircle, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

type Step = 'email' | 'otp'

interface AuthResponse {
  message?: string
  data?: {
    token?: string
  }
  errors?: Record<string, string[]>
}

function getErrorMessage(data: AuthResponse, fallback: string) {
  const fieldError = data.errors && Object.values(data.errors).flat()[0]
  return fieldError || data.message || fallback
}

export default function LoginWithOtpPage() {
  const router = useRouter()
  const otpInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return

    const timer = window.setInterval(() => {
      setResendIn(current => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendIn])

  useEffect(() => {
    if (step === 'otp') {
      otpInputRef.current?.focus()
    }
  }, [step])

  const sendOtp = async () => {
    setIsSending(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: 'LOGIN',
        }),
      })
      const data = (await response.json()) as AuthResponse

      if (!response.ok) {
        toast.error(getErrorMessage(data, 'Unable to send the code'))
        return false
      }

      setStep('otp')
      setOtp('')
      setResendIn(RESEND_SECONDS)
      toast.success('A sign-in code was sent to your email')
      return true
    } catch (error) {
      console.error('Send login OTP error:', error)
      toast.error('Unable to reach the server. Please try again.')
      return false
    } finally {
      setIsSending(false)
    }
  }

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    await sendOtp()
  }

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()

    if (otp.length !== OTP_LENGTH) {
      toast.error('Enter the complete 6-digit code')
      return
    }

    setIsVerifying(true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
          purpose: 'LOGIN',
        }),
      })
      const data = (await response.json()) as AuthResponse

      if (!response.ok) {
        toast.error(getErrorMessage(data, 'The code could not be verified'))
        return
      }

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token)
      }

      toast.success('You are signed in')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Verify login OTP error:', error)
      toast.error('Unable to reach the server. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resendIn > 0 || isSending) return
    await sendOtp()
  }

  const editEmail = () => {
    setStep('email')
    setOtp('')
    setResendIn(0)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.28),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_35%)]" />
      <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/75 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white hover:no-underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to password sign in
        </Link>

        <div className="mb-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-400/30">
            {step === 'email' ? (
              <KeyRound className="h-7 w-7 text-indigo-300" />
            ) : (
              <Mail className="h-7 w-7 text-indigo-300" />
            )}
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
            Passwordless access
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {step === 'email' ? 'Sign in with OTP' : 'Check your inbox'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {step === 'email'
              ? "We'll email you a secure, single-use code that expires in 5 minutes."
              : (
                <>
                  Enter the 6-digit code sent to{' '}
                  <span className="font-medium text-slate-200">{email}</span>.
                </>
              )}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending || !email.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3.5 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Sending code...
                </>
              ) : (
                'Send sign-in code'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="otp" className="block text-sm font-medium text-slate-200">
                  One-time code
                </label>
                <button
                  type="button"
                  onClick={editEmail}
                  className="text-xs font-medium text-indigo-300 transition hover:text-indigo-200"
                >
                  Change email
                </button>
              </div>

              <input
                ref={otpInputRef}
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                placeholder="000000"
                required
                maxLength={OTP_LENGTH}
                aria-describedby="otp-help"
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-4 text-center font-mono text-3xl font-semibold tracking-[0.35em] text-white outline-none transition placeholder:text-slate-700 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
              />
              <p id="otp-help" className="mt-2 text-xs text-slate-500">
                Codes can only be used once and expire after 5 minutes.
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifying || otp.length !== OTP_LENGTH}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3.5 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isVerifying ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Verify and sign in
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendIn > 0 || isSending}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          New to VIMS?{' '}
          <Link href="/register" className="font-semibold text-indigo-300 hover:text-indigo-200">
            Create an account
          </Link>
        </div>
      </section>
    </main>
  )
}
