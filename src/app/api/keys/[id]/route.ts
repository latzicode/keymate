import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const key = await prisma.key.findFirst({
      where: {
        id: params.id,
        vault: {
          userId: payload.userId
        }
      }
    });

    if (!key) {
      return NextResponse.json({ error: 'Clé non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ key });

  } catch (error) {
    console.error('GET Key Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const { name } = await request.json();

    const key = await prisma.key.findFirst({
      where: {
        id: params.id,
        vault: {
          userId: payload.userId
        }
      }
    });

    if (!key) {
      return NextResponse.json({ error: 'Clé non trouvée' }, { status: 404 });
    }

    const updatedKey = await prisma.key.update({
      where: { id: params.id },
      data: { name }
    });

    return NextResponse.json({ key: updatedKey });

  } catch (error) {
    console.error('PATCH Key Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const key = await prisma.key.findFirst({
      where: {
        id: params.id,
        vault: {
          userId: payload.userId
        }
      }
    });

    if (!key) {
      return NextResponse.json({ error: 'Clé non trouvée' }, { status: 404 });
    }

    await prisma.key.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Clé supprimée' });

  } catch (error) {
    console.error('DELETE Key Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
