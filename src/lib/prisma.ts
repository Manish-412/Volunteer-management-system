import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Prevent multiple Prisma instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }

const client =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

// Prisma generates the OTP model delegate with an uppercase-cased property name.
// Keep the existing application code working by exposing a lowercase alias.
if (!(client as any).otp && (client as any).oTP) {
  ;(client as any).otp = (client as any).oTP
}

export const prisma = client

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
