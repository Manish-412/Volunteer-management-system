import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.eventParticipant.deleteMany()
  await prisma.event.deleteMany()
  await prisma.volunteer.deleteMany()
  await prisma.oTP.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  const adminPassword = await bcryptjs.hash('Admin@123', 12)
  const admin = await prisma.user.create({
    data: {
      fullName: 'System Admin',
      email: 'admin@vims.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Create volunteer users
  const volunteerPassword = await bcryptjs.hash('Volunteer@123', 12)
  
  const volunteers = await Promise.all([
    prisma.user.create({
      data: {
        fullName: 'John Doe',
        email: 'john@example.com',
        passwordHash: volunteerPassword,
        role: 'VOLUNTEER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        passwordHash: volunteerPassword,
        role: 'VOLUNTEER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Michael Johnson',
        email: 'michael@example.com',
        passwordHash: volunteerPassword,
        role: 'VOLUNTEER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
  ])
  console.log(`✅ ${volunteers.length} volunteer users created`)

  // Create volunteer profiles
  const volunteerProfiles = await Promise.all([
    prisma.volunteer.create({
      data: {
        userId: volunteers[0].id,
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        gender: 'Male',
        dateOfBirth: new Date('1995-03-15'),
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        skills: ['Teaching', 'Mentoring', 'Software Development'],
        interests: ['Education', 'Tech'],
        availability: ['Weekends', 'Evenings'],
        bloodGroup: 'O+',
        occupation: 'Software Engineer',
        status: 'ACTIVE',
      },
    }),
    prisma.volunteer.create({
      data: {
        userId: volunteers[1].id,
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        phoneNumber: '+0987654321',
        gender: 'Female',
        dateOfBirth: new Date('1992-07-22'),
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        skills: ['Nursing', 'First Aid', 'Counseling'],
        interests: ['Health', 'Community Service'],
        availability: ['Weekdays', 'Weekends'],
        bloodGroup: 'A+',
        occupation: 'Nurse',
        status: 'ACTIVE',
      },
    }),
    prisma.volunteer.create({
      data: {
        userId: volunteers[2].id,
        fullName: 'Michael Johnson',
        email: 'michael@example.com',
        phoneNumber: '+1122334455',
        gender: 'Male',
        dateOfBirth: new Date('1998-11-10'),
        address: '789 Pine Rd',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        skills: ['Event Management', 'Public Speaking', 'Leadership'],
        interests: ['Community Events', 'Youth Programs'],
        availability: ['Weekends', 'Flexible'],
        bloodGroup: 'B+',
        occupation: 'Event Coordinator',
        status: 'ACTIVE',
      },
    }),
  ])
  console.log(`✅ ${volunteerProfiles.length} volunteer profiles created`)

  // Create events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Community Cleanup Drive',
        description: 'Help us clean up the local parks and beaches. We need volunteers to collect trash and help with landscaping.',
        date: new Date(new Date().setDate(new Date().getDate() + 7)),
        location: 'Central Park, New York',
        category: 'Environment',
        requiredVolunteers: 20,
        status: 'UPCOMING',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Tech Workshop for Students',
        description: 'Conduct free coding workshops for underprivileged students. Share your knowledge and inspire the next generation of developers.',
        date: new Date(new Date().setDate(new Date().getDate() + 14)),
        location: 'Community Center, Los Angeles',
        category: 'Education',
        requiredVolunteers: 10,
        status: 'UPCOMING',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Blood Donation Camp',
        description: 'Organize a blood donation drive to help the local blood bank. Both donors and volunteers needed.',
        date: new Date(new Date().setDate(new Date().getDate() + 21)),
        location: 'City Hospital, Chicago',
        category: 'Health',
        requiredVolunteers: 15,
        status: 'UPCOMING',
      },
    }),
  ])
  console.log(`✅ ${events.length} events created`)

  // Create event participants
  const eventParticipants = await Promise.all([
    prisma.eventParticipant.create({
      data: {
        volunteerId: volunteerProfiles[0].id,
        eventId: events[0].id,
        status: 'CONFIRMED',
      },
    }),
    prisma.eventParticipant.create({
      data: {
        volunteerId: volunteerProfiles[1].id,
        eventId: events[2].id,
        status: 'CONFIRMED',
      },
    }),
    prisma.eventParticipant.create({
      data: {
        volunteerId: volunteerProfiles[2].id,
        eventId: events[1].id,
        status: 'REGISTERED',
      },
    }),
  ])
  console.log(`✅ ${eventParticipants.length} event participants created`)

  console.log('✅ Database seeding completed successfully!')
  console.log('\nTest Credentials:')
  console.log('Admin Email: admin@vims.com')
  console.log('Admin Password: Admin@123')
  console.log('Volunteer Email: john@example.com')
  console.log('Volunteer Password: Volunteer@123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
