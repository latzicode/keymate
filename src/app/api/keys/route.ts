import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { KeyManager } from '@/lib/pgp/keyManager';
import { KeyValidator } from '@/lib/pgp/validation';

// Liste des clés de l'utilisateur
export async function GET() {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const keys = await KeyManager.getKeys(payload.userId);
    
    return NextResponse.json({
      keys: keys.map(key => ({
        id: key.id,
        name: key.name,
        type: key.type,
        createdAt: key.createdAt,
        lastUsed: key.lastUsed
      }))
    });

  } catch (error) {
    console.error('GET Keys Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

// Génération d'une nouvelle paire de clés
export async function POST(request: Request) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }

    const keyPair = await KeyManager.generateKeyPair(payload.userId, name);

    return NextResponse.json({ keyPair });

  } catch (error) {
    console.error('POST Key Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
