'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCurrentUser } from '@/components/dashboard-shell'
import { Empty, PageIntro, Section } from '../dashboard/page'
import type { UserRole } from '@/types/dashboard'

interface UserItem { id: string; fullName: string; email: string; role: UserRole; emailVerified: boolean; lastLoginAt: string | null }

export default function UsersPage() {
  const currentUser = useCurrentUser()
  const router = useRouter()
  const [users, setUsers] = useState<UserItem[]>([])

  const load = () => fetch('/api/admin/users?limit=100').then(response => response.json()).then(result => setUsers(result.data?.users ?? []))
  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      void load()
    } else if (currentUser) {
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  const changeRole = async (id: string, role: UserRole) => {
    const response = await fetch(`/api/admin/users/${id}?action=role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    if (!response.ok) {
      toast.error('Could not update role')
      return
    }
    toast.success('User role updated')
    load()
  }

  if (currentUser?.role !== 'ADMIN') return null
  return <div className="space-y-8"><PageIntro title="Users & roles" description="Control who has administrative access. New registrations remain volunteers by default." /><Section title={`${users.length} user accounts`}><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="p-3">User</th><th className="p-3">Verification</th><th className="p-3">Last login</th><th className="p-3">Role</th></tr></thead><tbody>{users.map(user => <tr key={user.id} className="border-b last:border-0"><td className="p-3 font-semibold">{user.fullName}<span className="block text-xs font-normal text-slate-500">{user.email}</span></td><td className="p-3">{user.emailVerified ? 'Verified' : 'Pending'}</td><td className="p-3 text-slate-500">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td><td className="p-3"><select value={user.role} disabled={user.id === currentUser.id} onChange={event => changeRole(user.id, event.target.value as UserRole)} className="rounded-lg border px-3 py-2 disabled:opacity-50"><option value="VOLUNTEER">Volunteer</option><option value="ADMIN">Admin</option></select></td></tr>)}</tbody></table>{!users.length && <Empty text="No users found." />}</div></Section></div>
}
