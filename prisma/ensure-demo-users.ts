import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const [adminPassword, volunteerPassword] = await Promise.all([
    bcryptjs.hash('Admin@123', 12),
    bcryptjs.hash('Volunteer@123', 12),
  ])

  await prisma.user.upsert({
    where: { email: 'admin@vims.com' },
    update: {
      fullName: 'System Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      fullName: 'System Admin',
      email: 'admin@vims.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  const volunteer = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {
      fullName: 'John Doe',
      passwordHash: volunteerPassword,
      role: 'VOLUNTEER',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: volunteerPassword,
      role: 'VOLUNTEER',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  await prisma.volunteer.upsert({
    where: { userId: volunteer.id },
    update: {},
    create: {
      userId: volunteer.id,
      fullName: volunteer.fullName,
      email: volunteer.email,
      phoneNumber: '+1234567890',
      city: 'New York',
      country: 'USA',
      skills: ['Teaching', 'Software Development'],
      interests: ['Education', 'Technology'],
      availability: ['Weekends'],
      occupation: 'Software Engineer',
    },
  })

  console.log('Demo users are ready.')
}

main()
  .finally(async () => prisma.$disconnect())
