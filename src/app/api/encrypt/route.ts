import { NextResponse } from 'next/server';
import { EncryptionService } from '@/lib/pgp/encryption';

export async function POST(req: Request) {
  try {
    const { message, keyId, userId } = await req.json();
    
    const { encrypted } = await EncryptionService.encryptMessage(
      message,
      keyId,
      userId
    );

    return NextResponse.json({ encrypted });
  } catch (error) {
    console.error('Erreur encryption:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chiffrement' },
      { status: 500 }
    );
  }
}