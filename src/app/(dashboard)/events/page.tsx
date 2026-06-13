'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, MapPin, Plus, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Empty, PageIntro, Section } from '../dashboard/page'
import { useCurrentUser } from '@/components/dashboard-shell'

interface EventItem {
  id: string
  title: string
  description: string
  date: string
  location: string
  category: string
  requiredVolunteers: number
  participantCount: number
  status: string
}

interface MyInvitation {
  id: string
  status: string
  event: {
    id: string
    title: string
    date: string
    location: string
    status: string
  }
}

interface Volunteer {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  skills: string[]
  status: string
}

interface EventDetail extends EventItem {
  participants: Array<{
    id: string
    volunteerId: string
    status: string
    volunteer: Pick<Volunteer, 'id' | 'fullName' | 'phoneNumber' | 'skills'>
  }>
}

const blankEvent = {
  title: '',
  description: '',
  date: '',
  location: '',
  category: '',
  requiredVolunteers: 1,
}

export default function EventsPage() {
  const user = useCurrentUser()
  const [events, setEvents] = useState<EventItem[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [form, setForm] = useState(blankEvent)
  const [saving, setSaving] = useState(false)

  const loadEvents = useCallback(() => {
    setLoading(true)
    return fetch(`/api/events?limit=50&search=${encodeURIComponent(search)}`)
      .then(response => response.json())
      .then(result => setEvents(result.data?.events ?? []))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => void loadEvents(), 250)
    return () => clearTimeout(timer)
  }, [loadEvents])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/volunteers?limit=100&status=ACTIVE')
        .then(response => response.json())
        .then(result => setVolunteers(result.data?.volunteers ?? []))
    }
  }, [user])

  const createEvent = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, date: new Date(form.date).toISOString() }),
    })
    const result = await response.json()
    if (response.ok) {
      toast.success('Event created successfully')
      setForm(blankEvent)
      setShowCreate(false)
      await loadEvents()
    } else {
      toast.error(result.message || 'Could not create event')
    }
    setSaving(false)
  }

  const openAssignments = async (eventId: string) => {
    const response = await fetch(`/api/events/${eventId}`)
    const result = await response.json()
    if (response.ok) setSelectedEvent(result.data)
    else toast.error(result.message || 'Could not load assignments')
  }

  const updateAssignment = async (volunteerId: string, assigned: boolean) => {
    if (!selectedEvent) return
    const response = await fetch(`/api/events/${selectedEvent.id}/participants`, {
      method: assigned ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteerId }),
    })
    const result = await response.json()
    if (!response.ok) {
      toast.error(result.message || 'Could not update assignment')
      return
    }
    toast.success(assigned ? 'Volunteer assigned' : 'Volunteer removed')
    await openAssignments(selectedEvent.id)
    await loadEvents()
  }

  const respondToInvitation = async (eventId: string, responseValue: 'ACCEPT' | 'REJECT') => {
    const response = await fetch(`/api/events/${eventId}/participants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: responseValue }),
    })
    const result = await response.json()
    if (!response.ok) {
      toast.error(result.message || 'Could not respond to invitation')
      return
    }
    toast.success(responseValue === 'ACCEPT' ? 'Invitation accepted' : 'Invitation rejected')
    window.location.reload()
  }

  const invitations = (user?.volunteer?.eventParticipants ?? []) as MyInvitation[]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro title={user?.role === 'ADMIN' ? 'Event management' : 'Discover events'} description={user?.role === 'ADMIN' ? 'Create events and assign the right volunteers.' : 'Find opportunities where your time and skills can make a difference.'} />
        {user?.role === 'ADMIN' && <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={18} />Create event</button>}
      </div>
      {user?.role === 'VOLUNTEER' && <Section title="My event invitations"><div className="space-y-3">{invitations.map(invitation => <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-semibold">{invitation.event.title}</p><p className="mt-1 text-sm text-slate-500">{new Date(invitation.event.date).toLocaleString()} · {invitation.event.location}</p><span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${invitation.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : invitation.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{invitation.status === 'REGISTERED' ? 'Awaiting your response' : invitation.status}</span></div>{invitation.status === 'REGISTERED' && <div className="flex gap-2"><button onClick={() => respondToInvitation(invitation.event.id, 'REJECT')} className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Reject</button><button onClick={() => respondToInvitation(invitation.event.id, 'ACCEPT')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Accept</button></div>}</div>)}{!invitations.length && <Empty text="You do not have any event invitations." />}</div></Section>}
      <Section title="All events" action={<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search events..." className="w-56 rounded-lg border px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" />}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map(event => (
            <article key={event.id} className="rounded-2xl border p-5 transition hover:border-indigo-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{event.category}</span><span className="text-xs font-semibold text-slate-500">{event.status}</span></div>
              <h2 className="mt-4 text-lg font-bold">{event.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{event.description}</p>
              <div className="mt-5 space-y-2 text-sm text-slate-600">
                <p className="flex gap-2"><CalendarDays size={16} />{new Date(event.date).toLocaleString()}</p>
                <p className="flex gap-2"><MapPin size={16} />{event.location}</p>
                <p className="flex gap-2"><Users size={16} />{event.participantCount} / {event.requiredVolunteers} volunteers</p>
              </div>
              {user?.role === 'ADMIN' && <button onClick={() => openAssignments(event.id)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 px-3 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"><UserPlus size={17} />Assign volunteers</button>}
            </article>
          ))}
          {!events.length && <div className="md:col-span-2 xl:col-span-3"><Empty text={loading ? 'Loading events...' : 'No events match your search.'} /></div>}
        </div>
      </Section>

      {showCreate && <Modal title="Create event" close={() => setShowCreate(false)}><form onSubmit={createEvent} className="grid gap-4 sm:grid-cols-2"><Field label="Title" value={form.title} onChange={title => setForm({ ...form, title })} required /><Field label="Category" value={form.category} onChange={category => setForm({ ...form, category })} required /><Field label="Date and time" type="datetime-local" value={form.date} onChange={date => setForm({ ...form, date })} required /><Field label="Location" value={form.location} onChange={location => setForm({ ...form, location })} required /><Field label="Required volunteers" type="number" value={String(form.requiredVolunteers)} onChange={value => setForm({ ...form, requiredVolunteers: Number(value) })} required /><label className="block text-sm font-medium sm:col-span-2">Description<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} required rows={4} className="mt-2 w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" /></label><button disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 sm:col-span-2">{saving ? 'Creating...' : 'Create event'}</button></form></Modal>}

      {selectedEvent && <Modal title={`Assign volunteers · ${selectedEvent.title}`} close={() => setSelectedEvent(null)}><p className="mb-4 text-sm text-slate-500">{selectedEvent.participants.filter(item => item.status !== 'CANCELLED').length} of {selectedEvent.requiredVolunteers} required volunteers assigned.</p><div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">{volunteers.map(volunteer => {
        const assignment = selectedEvent.participants.find(item => item.volunteerId === volunteer.id)
        const assigned = Boolean(assignment && assignment.status !== 'CANCELLED')
        const statusLabel = assignment?.status === 'REGISTERED' ? 'Invitation pending' : assignment?.status === 'CONFIRMED' ? 'Accepted' : assignment?.status === 'CANCELLED' ? 'Rejected' : null
        const statusClass = assignment?.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : assignment?.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
        return <div key={volunteer.id} className="flex items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-semibold">{volunteer.fullName}</p><p className="text-sm text-slate-500">{volunteer.email}</p>{statusLabel && <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{statusLabel}</span>}<div className="mt-2 flex flex-wrap gap-1">{volunteer.skills.slice(0, 3).map(skill => <span key={skill} className="rounded bg-slate-100 px-2 py-1 text-xs">{skill}</span>)}</div></div><button onClick={() => updateAssignment(volunteer.id, !assigned)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${assigned ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{assigned ? 'Remove' : assignment?.status === 'CANCELLED' ? 'Re-invite' : 'Invite'}</button></div>
      })}{!volunteers.length && <Empty text="No active volunteer profiles are available." />}</div></Modal>}
    </div>
  )
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-bold">{title}</h2><button onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={20} /></button></div>{children}</div></div>
}

function Field({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block text-sm font-medium">{label}<input type={type} min={type === 'number' ? 1 : undefined} value={value} onChange={event => onChange(event.target.value)} required={required} className="mt-2 w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
}
