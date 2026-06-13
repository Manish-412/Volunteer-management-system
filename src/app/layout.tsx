import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/providers'

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
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
