import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    // Vérifie si ils sont contacts
    const areContacts = await prisma.contact.findFirst({
      where: {
        OR: [
          {
            AND: [
              { userId: payload.userId },
              { contactId: params.userId },
              { status: 'accepted' }
            ]
          },
          {
            AND: [
              { userId: params.userId },
              { contactId: payload.userId },
              { status: 'accepted' }
            ]
          }
        ]
      }
    });

    if (!areContacts) {
      return NextResponse.json({ 
        error: 'Vous devez être contacts pour voir les messages' 
      }, { status: 403 });
    }

    // Récupère tous les messages entre les deux utilisateurs
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            AND: [
              { senderId: payload.userId },
              { receiverId: params.userId }
            ]
          },
          {
            AND: [
              { senderId: params.userId },
              { receiverId: payload.userId }
            ]
          }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('GET Messages Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
} 