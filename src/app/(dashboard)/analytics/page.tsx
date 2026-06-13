'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/components/dashboard-shell'
import { Empty, PageIntro, Section } from '../dashboard/page'

interface AnalyticsData { volunteersByStatus: Array<{ status: string; _count: number }>; eventsByStatus: Array<{ status: string; _count: number }> }

function Bars({ rows }: { rows: Array<{ status: string; _count: number }> }) {
  const max = Math.max(...rows.map(row => row._count), 1)
  return <div className="space-y-4">{rows.map(row => <div key={row.status}><div className="mb-1 flex justify-between text-sm"><span>{row.status.replace('_', ' ')}</span><strong>{row._count}</strong></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(row._count / max) * 100}%` }} /></div></div>)}{!rows.length && <Empty text="No analytics available yet." />}</div>
}

export default function AnalyticsPage() {
  const user = useCurrentUser()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  useEffect(() => { if (user?.role === 'ADMIN') fetch('/api/admin/dashboard').then(response => response.json()).then(result => setData(result.data)); else if (user) router.replace('/dashboard') }, [router, user])
  if (user?.role !== 'ADMIN') return null
  return <div className="space-y-8"><PageIntro title="Analytics" description="A clear view of volunteer and event health." /><div className="grid gap-6 lg:grid-cols-2"><Section title="Volunteers by status"><Bars rows={data?.volunteersByStatus ?? []} /></Section><Section title="Events by status"><Bars rows={data?.eventsByStatus ?? []} /></Section></div></div>
}
