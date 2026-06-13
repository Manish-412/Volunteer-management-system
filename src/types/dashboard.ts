export type UserRole = 'ADMIN' | 'VOLUNTEER'

export interface CurrentUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  emailVerified: boolean
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  volunteer: {
    id: string
    status: string
    phoneNumber: string
    city: string | null
    country: string | null
    occupation: string | null
    skills: string[]
    interests: string[]
    availability: string[]
    eventParticipants: Array<{
      id: string
      status: string
      event: {
        id: string
        title: string
        date: string
        location: string
        status: string
      }
    }>
  } | null
}
