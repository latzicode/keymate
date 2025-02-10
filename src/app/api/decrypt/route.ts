import { NextResponse } from 'next/server';
import { EncryptionService } from '@/lib/pgp/encryption';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { message, keyId, userId } = await req.json();

    // Récupérer la clé privée de l'utilisateur
    const userKey = await prisma.key.findFirst({
      where: {
        id: keyId,
        vault: {
          userId: userId
        }
      }
    });

    if (!userKey) {
      throw new Error('Clé non trouvée');
    }

    // Utiliser la bonne méthode de déchiffrement
    const decrypted = await EncryptionService.decryptMessage(message, keyId);

    return NextResponse.json({ decrypted });
  } catch (error) {
    console.error('Erreur decryption:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du déchiffrement' },
      { status: 500 }
    );
  }
}