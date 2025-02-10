import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// Récupérer les contacts et demandes
export async function GET() {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    console.log('=== DIAGNOSTIC CONTACTS ===');
    console.log('UserId:', payload.userId);

    // Contacts acceptés où l'utilisateur est l'INITIATEUR
    const contactsAsUser = await prisma.contact.findMany({
      where: {
        userId: payload.userId,
        status: 'accepted'
      },
      include: {
        contactUser: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    // Contacts acceptés où l'utilisateur est le DESTINATAIRE
    const contactsAsContact = await prisma.contact.findMany({
      where: {
        contactId: payload.userId,
        status: 'accepted'
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    // Demandes REÇUES en attente
    const pendingRequests = await prisma.contact.findMany({
      where: {
        contactId: payload.userId,
        status: 'pending'
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    // Demandes ENVOYÉES en attente
    const sentRequests = await prisma.contact.findMany({
      where: {
        userId: payload.userId,
        status: 'pending'
      },
      include: {
        contactUser: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    // Combine les contacts des deux côtés
    const allContacts = [
      ...contactsAsUser.map(c => c.contactUser),
      ...contactsAsContact.map(c => c.user)
    ];

    // Juste après la récupération des contacts (ligne 72)
    const sharedKeys = await prisma.key.findMany({
      where: {
        type: 'contact',
        vault: {
          userId: payload.userId
        },
        originalKey: {
          vault: {
            userId: {
              in: allContacts.map(c => c.id)
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        originalKey: {
          select: {
            vault: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    // Attacher les clés aux contacts
    const contactsWithKeys = allContacts.map(contact => ({
      ...contact,
      sharedKeys: sharedKeys.filter(k => k.originalKey?.vault.userId === contact.id)
    }));

    return NextResponse.json({
      contacts: contactsWithKeys,
      pendingRequests: pendingRequests.map(r => ({
        id: r.id,
        user: r.user
      })),
      sentRequests: sentRequests.map(r => ({
        id: r.id,
        user: r.contactUser
      }))
    });

  } catch (error) {
    console.error('GET Contacts Error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

// Envoyer une demande d'ami
export async function POST(request: Request) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);

    const { contactId } = await request.json();

    // 1. Empêcher de s'ajouter soi-même
    if (contactId === payload.userId) {
      return NextResponse.json({ 
        error: 'Vous ne pouvez pas vous ajouter vous-même' 
      }, { status: 400 });
    }

    // 2. Vérifier TOUTES les relations possibles
    const existingRelation = await prisma.contact.findFirst({
      where: {
        OR: [
          { 
            AND: [
              { userId: payload.userId },
              { contactId: contactId }
            ]
          },
          { 
            AND: [
              { userId: contactId },
              { contactId: payload.userId }
            ]
          }
        ]
      }
    });

    if (existingRelation) {
      // 3. Message d'erreur plus précis
      const status = existingRelation.status;
      if (status === 'pending') {
        return NextResponse.json({ 
          error: 'Une demande est déjà en cours' 
        }, { status: 400 });
      }
      if (status === 'accepted') {
        return NextResponse.json({ 
          error: 'Cette personne est déjà dans vos contacts' 
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: 'Une relation existe déjà' 
      }, { status: 400 });
    }

    // 4. Création de la demande avec plus de logs
    console.log('Création demande:', { userId: payload.userId, contactId });
    const contact = await prisma.contact.create({
      data: {
        userId: payload.userId,
        contactId,
        status: 'pending',
        trustLevel: 1
      },
      include: {
        contactUser: {
          select: { id: true, username: true, email: true }
        }
      }
    });
    console.log('Demande créée:', contact);

    return NextResponse.json({
      request: {
        id: contact.id,
        user: contact.contactUser
      }
    });

  } catch (error) {
    console.error('POST Contact Error:', error);
    return NextResponse.json({ 
      error: 'Une erreur est survenue lors de l\'ajout du contact' 
    }, { status: 500 });
  }
} 