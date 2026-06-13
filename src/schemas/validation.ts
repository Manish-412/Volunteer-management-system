import { z } from 'zod'

// Authentication Schemas
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['ADMIN', 'VOLUNTEER']),
  rememberMe: z.boolean().optional().default(false),
})

export const sendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['LOGIN', 'EMAIL_VERIFICATION', 'PASSWORD_RESET', 'CHANGE_PASSWORD']),
})

export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  purpose: z.enum(['LOGIN', 'EMAIL_VERIFICATION', 'PASSWORD_RESET', 'CHANGE_PASSWORD']),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ['newPassword'],
})

// Volunteer Schemas
export const createVolunteerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bloodGroup: z.string().optional(),
  occupation: z.string().optional(),
})

export const updateVolunteerSchema = createVolunteerSchema.partial()

// Event Schemas
export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  requiredVolunteers: z.number().min(1, 'At least 1 volunteer required'),
})

export const updateEventSchema = createEventSchema.partial()

export const respondToAssignmentSchema = z.object({
  response: z.enum(['ACCEPT', 'REJECT']),
})

// Admin Schemas
export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'DEACTIVATED']),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'VOLUNTEER']),
})

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SendOTPInput = z.infer<typeof sendOTPSchema>
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type CreateVolunteerInput = z.infer<typeof createVolunteerSchema>
export type UpdateVolunteerInput = z.infer<typeof updateVolunteerSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
