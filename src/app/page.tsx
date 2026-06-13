import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="font-bold text-xl">VIMS</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
              Login
            </Link>
            <Link href="/register" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Volunteer Information Management System
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Streamline volunteer recruitment, management, and event coordination with our comprehensive platform.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
            Start Managing Volunteers
          </Link>
          <Link href="/login" className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-4">🔐</div>
              <h3 className="font-bold text-lg mb-2">Secure Authentication</h3>
              <p className="text-gray-600">Email/password login with OTP verification and JWT tokens</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="font-bold text-lg mb-2">Volunteer Management</h3>
              <p className="text-gray-600">Complete volunteer profiles with skills, interests, and availability tracking</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-4">📅</div>
              <h3 className="font-bold text-lg mb-2">Event Management</h3>
              <p className="text-gray-600">Create, manage, and track volunteer participation in events</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-bold text-lg mb-2">Admin Dashboard</h3>
              <p className="text-gray-600">Analytics, reporting, and comprehensive management tools</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-4">🔔</div>
              <h3 className="font-bold text-lg mb-2">Email Notifications</h3>
              <p className="text-gray-600">Automated emails for OTP, verification, and password reset</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-4">⚙️</div>
              <h3 className="font-bold text-lg mb-2">Role-Based Access</h3>
              <p className="text-gray-600">Admin and volunteer roles with permissions management</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-12">Built with Modern Tech</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-semibold text-indigo-600 mb-2">Frontend</p>
              <p className="text-gray-600">Next.js 15<br/>React 19<br/>TypeScript</p>
            </div>
            <div>
              <p className="font-semibold text-indigo-600 mb-2">Styling</p>
              <p className="text-gray-600">Tailwind CSS<br/>shadcn/ui<br/>Responsive Design</p>
            </div>
            <div>
              <p className="font-semibold text-indigo-600 mb-2">Backend</p>
              <p className="text-gray-600">Next.js API Routes<br/>Zod Validation<br/>Middleware</p>
            </div>
            <div>
              <p className="font-semibold text-indigo-600 mb-2">Database</p>
              <p className="text-gray-600">PostgreSQL<br/>Prisma ORM<br/>Supabase</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of organizations managing their volunteers effectively
          </p>
          <Link href="/register" className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition font-medium">
            Create Your Account Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 VIMS - Volunteer Information Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
