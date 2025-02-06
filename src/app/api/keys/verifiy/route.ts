import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { KeyValidator } from '@/lib/pgp/validation';

export async function POST(request: Request) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const { publicKey } = await request.json();

    if (!publicKey) {
      return NextResponse.json({ error: 'Clé publique requise' }, { status: 400 });
    }

    const keyInfo = await KeyValidator.getKeyInfo(publicKey);

    return NextResponse.json({ keyInfo });

  } catch (error) {
    console.error('Verify Key Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}