'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useCurrentUser } from '@/components/dashboard-shell'
import { PageIntro, Section } from '../dashboard/page'

const emptyForm = { fullName: '', phoneNumber: '', city: '', country: '', occupation: '', skills: '', interests: '', availability: '' }

export default function ProfilePage() {
  const user = useCurrentUser()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      fullName: user.fullName,
      phoneNumber: user.volunteer?.phoneNumber ?? '',
      city: user.volunteer?.city ?? '',
      country: user.volunteer?.country ?? '',
      occupation: user.volunteer?.occupation ?? '',
      skills: user.volunteer?.skills.join(', ') ?? '',
      interests: user.volunteer?.interests.join(', ') ?? '',
      availability: user.volunteer?.availability.join(', ') ?? '',
    })
  }, [user])

  if (!user) return null

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (user.role === 'ADMIN') return
    setSaving(true)
    const payload = {
      ...form,
      skills: split(form.skills),
      interests: split(form.interests),
      availability: split(form.availability),
    }
    const response = await fetch(user.volunteer ? `/api/volunteers/${user.volunteer.id}` : '/api/volunteers', {
      method: user.volunteer ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await response.json()
    response.ok ? toast.success('Profile saved') : toast.error(result.message || 'Could not save profile')
    setSaving(false)
  }

  return <div className="space-y-8"><PageIntro title="My profile" description="Keep your account and volunteer information accurate." /><div className="grid gap-6 xl:grid-cols-[1fr_2fr]"><Section title="Account"><dl className="space-y-4 text-sm"><Info label="Name" value={user.fullName} /><Info label="Email" value={user.email} /><Info label="Role" value={user.role} /><Info label="Email status" value={user.emailVerified ? 'Verified' : 'Verification pending'} /></dl></Section><Section title={user.role === 'ADMIN' ? 'Administrator account' : 'Volunteer details'}>{user.role === 'ADMIN' ? <p className="text-sm text-slate-500">Administrator profiles are managed through the user account. Volunteer-only details are intentionally not required.</p> : <form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><Field label="Full name" value={form.fullName} onChange={value => setForm({ ...form, fullName: value })} required /><Field label="Phone number" value={form.phoneNumber} onChange={value => setForm({ ...form, phoneNumber: value })} required /><Field label="City" value={form.city} onChange={value => setForm({ ...form, city: value })} /><Field label="Country" value={form.country} onChange={value => setForm({ ...form, country: value })} /><Field label="Occupation" value={form.occupation} onChange={value => setForm({ ...form, occupation: value })} /><Field label="Availability" value={form.availability} onChange={value => setForm({ ...form, availability: value })} placeholder="Weekends, Evenings" /><div className="sm:col-span-2"><Field label="Skills" value={form.skills} onChange={value => setForm({ ...form, skills: value })} placeholder="Teaching, First aid, Design" /></div><div className="sm:col-span-2"><Field label="Interests" value={form.interests} onChange={value => setForm({ ...form, interests: value })} placeholder="Education, Environment" /></div><button disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 sm:col-span-2">{saving ? 'Saving...' : user.volunteer ? 'Save changes' : 'Create volunteer profile'}</button></form>}</Section></div></div>
}

function split(value: string) { return value.split(',').map(item => item.trim()).filter(Boolean) }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div> }
function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) { return <label className="block text-sm font-medium">{label}<input value={value} required={required} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" /></label> }
