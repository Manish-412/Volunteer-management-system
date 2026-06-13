import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthorizationError, NotFoundError, errorResponse, successResponse } from '@/lib/api'
import { getUserIdFromRequest, getUserRoleFromRequest } from '@/utils/helpers'

const assignmentSchema = z.object({
  volunteerId: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request)
    const { id: eventId } = await params
    const { volunteerId } = assignmentSchema.parse(await request.json())

    const [event, volunteer] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.volunteer.findUnique({ where: { id: volunteerId } }),
    ])

    if (!event) throw new NotFoundError('Event')
    if (!volunteer) throw new NotFoundError('Volunteer')

    const participant = await prisma.eventParticipant.upsert({
      where: { volunteerId_eventId: { volunteerId, eventId } },
      update: { status: 'REGISTERED' },
      create: { volunteerId, eventId, status: 'REGISTERED' },
      include: { volunteer: { select: { id: true, fullName: true, phoneNumber: true, skills: true } } },
    })

    return NextResponse.json(successResponse('Volunteer assigned successfully', participant))
  } catch (error: any) {
    return handleError(error, 'Failed to assign volunteer')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request.headers)
    if (!userId) throw new AuthorizationError('You must be logged in to respond')

    const { id: eventId } = await params
    const body = z.object({ response: z.enum(['ACCEPT', 'REJECT']) }).parse(await request.json())
    const volunteer = await prisma.volunteer.findUnique({ where: { userId } })
    if (!volunteer) throw new NotFoundError('Volunteer profile')

    const assignment = await prisma.eventParticipant.findUnique({
      where: { volunteerId_eventId: { volunteerId: volunteer.id, eventId } },
    })
    if (!assignment) throw new NotFoundError('Event invitation')

    const updated = await prisma.eventParticipant.update({
      where: { id: assignment.id },
      data: { status: body.response === 'ACCEPT' ? 'CONFIRMED' : 'CANCELLED' },
    })

    return NextResponse.json(successResponse(
      body.response === 'ACCEPT' ? 'Event invitation accepted' : 'Event invitation rejected',
      updated
    ))
  } catch (error: any) {
    return handleError(error, 'Failed to respond to invitation')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request)
    const { id: eventId } = await params
    const { volunteerId } = assignmentSchema.parse(await request.json())

    const assignment = await prisma.eventParticipant.findUnique({
      where: { volunteerId_eventId: { volunteerId, eventId } },
    })
    if (!assignment) throw new NotFoundError('Assignment')

    await prisma.eventParticipant.delete({ where: { id: assignment.id } })
    return NextResponse.json(successResponse('Volunteer removed from event'))
  } catch (error: any) {
    return handleError(error, 'Failed to remove volunteer')
  }
}

function requireAdmin(request: NextRequest) {
  if (getUserRoleFromRequest(request.headers) !== 'ADMIN') {
    throw new AuthorizationError('Only admins can manage event assignments')
  }
}

function handleError(error: any, fallback: string) {
  if (error.name === 'ZodError') {
    return NextResponse.json(errorResponse('Invalid volunteer assignment'), { status: 400 })
  }
  return NextResponse.json(
    errorResponse(error.message || fallback),
    { status: error.statusCode || 500 }
  )
}
