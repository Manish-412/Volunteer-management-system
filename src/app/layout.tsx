import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'VIMS - Volunteer Information Management System',
  description: 'A comprehensive platform for managing volunteers and events',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
