'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, Users } from 'lucide-react'
import { useCurrentUser } from '@/components/dashboard-shell'

interface AdminData {
  statistics: Record<string, number>
  recentVolunteers: Array<{ id: string; fullName: string; email: string; status: string }>
  upcomingEvents: Array<{ id: string; title: string; date: string; location: string; participantCount: number; requiredVolunteers: number }>
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Users }) {
  return <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><Icon className="text-indigo-500" size={20} /></div><p className="mt-3 text-3xl font-bold">{value}</p></div>
}

export default function DashboardPage() {
  const user = useCurrentUser()
  const [adminData, setAdminData] = useState<AdminData | null>(null)

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/admin/dashboard').then(response => response.json()).then(result => setAdminData(result.data))
    }
  }, [user])

  if (!user) return null

  if (user.role === 'VOLUNTEER') {
    const events = (user.volunteer?.eventParticipants ?? []).filter(item => item.status !== 'CANCELLED')
    const upcoming = events.filter(item => new Date(item.event.date) >= new Date())
    return (
      <div className="space-y-8">
        <PageIntro title={`Welcome back, ${user.fullName.split(' ')[0]}`} description="Your volunteer activity, upcoming commitments, and profile at a glance." />
        {!user.volunteer && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><strong>Complete your volunteer profile</strong><p className="mt-1 text-sm">Add your contact details, skills, and availability so admins can match you with events.</p><Link href="/profile" className="mt-3 inline-block font-semibold text-amber-900">Set up profile</Link></div>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Joined events" value={events.length} icon={CalendarDays} />
          <StatCard label="Upcoming events" value={upcoming.length} icon={Clock3} />
          <StatCard label="Completed events" value={events.filter(item => item.status === 'COMPLETED').length} icon={CheckCircle2} />
          <StatCard label="Profile status" value={user.volunteer?.status ?? 'Incomplete'} icon={Users} />
        </div>
        <Section title="My upcoming events" action={<Link href="/events">Browse all events</Link>}>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.slice(0, 4).map(item => <EventCard key={item.id} event={item.event} />)}
            {!upcoming.length && <Empty text="You do not have any upcoming events yet." />}
          </div>
        </Section>
      </div>
    )
  }

  const stats = adminData?.statistics
  return (
    <div className="space-y-8">
      <PageIntro title="Admin overview" description="Monitor people, events, and participation across VIMS." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={stats?.totalUsers ?? '--'} icon={Users} />
        <StatCard label="Active volunteers" value={stats?.activeVolunteers ?? '--'} icon={CheckCircle2} />
        <StatCard label="Upcoming events" value={stats?.upcomingEvents ?? '--'} icon={CalendarDays} />
        <StatCard label="Participations" value={stats?.totalParticipations ?? '--'} icon={Clock3} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Upcoming events" action={<Link href="/events">Manage events</Link>}>
          <div className="space-y-3">{adminData?.upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}{!adminData && <Empty text="Loading events..." />}</div>
        </Section>
        <Section title="Recent volunteers" action={<Link href="/volunteers">View volunteers</Link>}>
          <div className="space-y-3">{adminData?.recentVolunteers.map(volunteer => <div key={volunteer.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-semibold">{volunteer.fullName}</p><p className="text-sm text-slate-500">{volunteer.email}</p></div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{volunteer.status}</span></div>)}{!adminData && <Empty text="Loading volunteers..." />}</div>
        </Section>
      </div>
    </div>
  )
}

export function PageIntro({ title, description }: { title: string; description: string }) {
  return <div><h1 className="text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-slate-500">{description}</p></div>
}

export function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><div className="text-sm font-semibold text-indigo-600">{action}</div></div>{children}</section>
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">{text}</div>
}

function EventCard({ event }: { event: { title: string; date: string; location: string } }) {
  return <div className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{event.title}</p><p className="mt-1 text-sm text-slate-500">{new Date(event.date).toLocaleDateString()} · {event.location}</p></div>
}
