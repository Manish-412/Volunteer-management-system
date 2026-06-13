'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useCurrentUser } from '@/components/dashboard-shell'
import { PageIntro, Section } from '../dashboard/page'

export default function SettingsPage() {
  const user = useCurrentUser()
  const [step, setStep] = useState<'current' | 'otp'>('current')
  const [currentPassword, setCurrentPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const body = step === 'current'
      ? { step: 'request-otp', currentPassword }
      : { step: 'verify-and-change', otp, newPassword, confirmPassword }
    const response = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const result = await response.json()
    if (!response.ok) toast.error(result.message || 'Could not update password')
    else if (step === 'current') { setStep('otp'); toast.success('Verification code sent to your email') }
    else { toast.success('Password changed successfully'); setStep('current'); setCurrentPassword(''); setOtp(''); setNewPassword(''); setConfirmPassword('') }
    setLoading(false)
  }

  return <div className="space-y-8"><PageIntro title="Settings" description="Manage account security and verification." /><div className="grid gap-6 xl:grid-cols-2"><Section title="Email verification"><div className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-semibold">{user.email}</p><p className="text-sm text-slate-500">{user.emailVerified ? 'Your email is verified.' : 'Verification is still required.'}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.emailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{user.emailVerified ? 'Verified' : 'Pending'}</span></div></Section><Section title="Change password"><form onSubmit={submit} className="space-y-4">{step === 'current' ? <PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} /> : <><label className="block text-sm font-medium">Email verification code<input value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} className="mt-2 w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" /></label><PasswordField label="New password" value={newPassword} onChange={setNewPassword} /><PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} /></>}<button disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Please wait...' : step === 'current' ? 'Send verification code' : 'Change password'}</button></form></Section></div></div>
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm font-medium">{label}<input type="password" value={value} onChange={event => onChange(event.target.value)} required className="mt-2 w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" /></label> }
