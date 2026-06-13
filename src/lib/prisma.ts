import { PrismaClient } from '@prisma/client'

// Prevent multiple Prisma instances in development
const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const client =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

// Keep existing OTP alias
if (!(client as any).otp && (client as any).oTP) {
  ;(client as any).otp = (client as any).oTP
}

export const prisma = client

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma