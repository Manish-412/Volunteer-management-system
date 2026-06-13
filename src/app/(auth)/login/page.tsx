'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'VOLUNTEER' | 'ADMIN'>('VOLUNTEER')
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, rememberMe }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || 'Login failed')
        return
      }

      toast.success('Login successful!')
      
      // Store token in localStorage for client-side use
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token)
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-600 text-sm mt-2">Choose the workspace that matches your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            {(['VOLUNTEER', 'ADMIN'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${role === option ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {option === 'VOLUNTEER' ? 'Volunteer' : 'Admin'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            Remember me for 7 days
          </label>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        {/* OTP Login Link */}
        <Link
          href="/login-otp"
          className="w-full block text-center py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
        >
          Sign in with OTP
        </Link>

        {/* Links */}
        <div className="mt-6 text-center space-y-2">
          <Link href="/forgot-password" className="block text-sm text-indigo-600 hover:underline">
            Forgot password?
          </Link>
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-indigo-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p className="font-medium mb-2">Demo Credentials:</p>
          <p>Admin: <code className="bg-white px-2 py-1 rounded">admin@vims.com</code></p>
          <p>Volunteer: <code className="bg-white px-2 py-1 rounded">john@example.com</code></p>
          <p className="mt-1 text-xs">Use the matching account type above.</p>
        </div>
      </div>
    </div>
  )
}
