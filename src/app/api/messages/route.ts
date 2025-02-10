import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { EncryptionService } from '@/lib/pgp/encryption';

// Envoyer un message
export async function POST(request: Request) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const { receiverId, content, keyId } = await request.json();

    if (!keyId) {
      return NextResponse.json({ error: 'Clé de chiffrement requise' }, { status: 400 });
    }

    // Vérifie si le destinataire existe
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return NextResponse.json({ error: 'Destinataire non trouvé' }, { status: 404 });
    }

    // Vérifie si ils sont contacts
    const areContacts = await prisma.contact.findFirst({
      where: {
        OR: [
          {
            AND: [
              { userId: payload.userId },
              { contactId: receiverId },
              { status: 'accepted' }
            ]
          },
          {
            AND: [
              { userId: receiverId },
              { contactId: payload.userId },
              { status: 'accepted' }
            ]
          }
        ]
      }
    });

    if (!areContacts) {
      return NextResponse.json({ 
        error: 'Vous devez être contacts pour échanger des messages' 
      }, { status: 403 });
    }

    // On enregistre directement le message sans re-chiffrer
    const message = await prisma.message.create({
      data: {
        senderId: payload.userId,
        receiverId,
        content,  // On garde le message tel qu'il est
        usedKeyId: keyId
      }
    });

    return NextResponse.json({ message });

  } catch (error) {
    console.error('POST Message Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
} 