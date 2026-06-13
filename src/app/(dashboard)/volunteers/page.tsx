'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/components/dashboard-shell'
import { Empty, PageIntro, Section } from '../dashboard/page'

interface Volunteer {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  city: string | null
  skills: string[]
  status: string
  eventCount: number
}

export default function VolunteersPage() {
  const user = useCurrentUser()
  const router = useRouter()
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard')
  }, [router, user])

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    const timer = setTimeout(() => fetch(`/api/volunteers?limit=50&search=${encodeURIComponent(search)}`).then(response => response.json()).then(result => setVolunteers(result.data?.volunteers ?? [])), 250)
    return () => clearTimeout(timer)
  }, [search, user])

  if (user?.role !== 'ADMIN') return null

  return <div className="space-y-8"><PageIntro title="Volunteer management" description="Search volunteer profiles and review availability, skills, and activity." /><Section title={`${volunteers.length} volunteers`} action={<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search volunteers..." className="w-56 rounded-lg border px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" />}><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="p-3">Volunteer</th><th className="p-3">Contact</th><th className="p-3">Skills</th><th className="p-3">Events</th><th className="p-3">Status</th></tr></thead><tbody>{volunteers.map(volunteer => <tr key={volunteer.id} className="border-b last:border-0"><td className="p-3 font-semibold">{volunteer.fullName}<span className="block text-xs font-normal text-slate-500">{volunteer.city || 'Location not set'}</span></td><td className="p-3">{volunteer.email}<span className="block text-xs text-slate-500">{volunteer.phoneNumber}</span></td><td className="p-3"><div className="flex max-w-xs flex-wrap gap-1">{volunteer.skills.slice(0, 3).map(skill => <span key={skill} className="rounded bg-slate-100 px-2 py-1 text-xs">{skill}</span>)}</div></td><td className="p-3">{volunteer.eventCount}</td><td className="p-3"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{volunteer.status}</span></td></tr>)}</tbody></table>{!volunteers.length && <Empty text="No volunteer profiles found." />}</div></Section></div>
}
