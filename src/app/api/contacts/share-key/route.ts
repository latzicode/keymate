import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const token = cookies().get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const payload = await verifyToken(token);

    // Récupérer les données
    const { contactId, keyId } = await request.json();

    // Vérifier que la clé existe et appartient à l'utilisateur
    const sourceKey = await prisma.key.findFirst({
      where: {
        id: keyId,
        vault: {
          userId: payload.userId
        }
      }
    });

    if (!sourceKey) {
      return NextResponse.json({ error: 'Clé non trouvée' }, { status: 404 });
    }

    // Vérifier que le contact existe
    const contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { userId: payload.userId, contactId: contactId },
          { userId: contactId, contactId: payload.userId }
        ]
      }
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    // Créer une copie de la clé dans le vault du destinataire
    const destinationVault = await prisma.keyVault.findUnique({
      where: { userId: contactId }
    });

    if (!destinationVault) {
      return NextResponse.json({ error: 'Vault du destinataire non trouvé' }, { status: 404 });
    }

    // Créer la clé partagée avec les nouveaux champs de relation
    const sharedKey = await prisma.key.create({
      data: {
        vaultId: destinationVault.id,
        name: `${sourceKey.name} (partagée par ${payload.username})`,
        publicKey: sourceKey.publicKey,
        type: 'contact',
        originalKeyId: sourceKey.id,
        sharedWithUserId: contactId
      }
    });

    return NextResponse.json({ 
      message: 'Clé partagée avec succès',
      sharedKey 
    });

  } catch (error) {
    console.error('Erreur partage de clé:', error);
    return NextResponse.json(
      { error: 'Erreur lors du partage de la clé' },
      { status: 500 }
    );
  }
}