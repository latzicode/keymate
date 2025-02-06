import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Supprime le cookie d'authentification
    cookies().delete('auth-token');
    
    return NextResponse.json({ 
      message: 'Déconnecté avec succès' 
    });
  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json({ 
      error: 'Une erreur est survenue' 
    }, { status: 500 });
  }
}