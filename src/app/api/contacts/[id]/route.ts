import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const { action } = await request.json();

    const contact = await prisma.contact.findUnique({
      where: { id: params.id }
    });

    if (!contact || contact.contactId !== payload.userId) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    if (action === 'accept') {
      const updatedContact = await prisma.contact.update({
        where: { id: params.id },
        data: { 
          status: 'accepted',
          trustLevel: 1 // Niveau de base
        },
        include: {
          contactUser: {
            select: { id: true, username: true, email: true }
          }
        }
      });

      return NextResponse.json({
        contact: updatedContact.contactUser
      });
    }

    if (action === 'reject') {
      await prisma.contact.delete({
        where: { id: params.id }
      });

      return NextResponse.json({
        message: 'Demande refusée'
      });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

  } catch (error) {
    console.error('PATCH Contact Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
} 