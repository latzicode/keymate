import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { KeyManager } from '@/lib/pgp/keyManager';

export async function GET() {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const vault = await prisma.keyVault.findUnique({
      where: { userId: payload.userId },
      include: {
        keys: {
          orderBy: { lastUsed: 'desc' }
        }
      }
    });

    if (!vault) {
      return NextResponse.json({ error: 'Vault non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ vault });

  } catch (error) {
    console.error('GET Vault Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const { name, publicKey } = await request.json();

    if (!name || !publicKey) {
      return NextResponse.json({ 
        error: 'Nom et clé publique requis' 
      }, { status: 400 });
    }

    const importedKey = await KeyManager.importPublicKey(
      payload.userId,
      name,
      publicKey
    );

    return NextResponse.json({ key: importedKey });

  } catch (error) {
    console.error('POST Vault Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
