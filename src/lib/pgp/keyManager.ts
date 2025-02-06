import * as openpgp from 'openpgp';
import { prisma } from '@/lib/prisma';

export interface KeyPairInfo {
  name: string;
  publicKey: string;
  privateKey?: string;
  type: 'personal' | 'contact';
}

export class KeyManager {
  static async generateKeyPair(userId: string, name: string): Promise<KeyPairInfo> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) throw new Error('Utilisateur non trouvé');

    const { privateKey, publicKey } = await openpgp.generateKey({
      type: 'ecc',
      curve: 'curve25519',
      userIDs: [{ name, email: user.email }],
      format: 'armored'
    });

    // Création dans le vault
    const vault = await prisma.keyVault.findUnique({
      where: { userId }
    });

    if (!vault) {
      throw new Error('Vault non trouvé');
    }

    const key = await prisma.key.create({
      data: {
        vaultId: vault.id,
        name,
        publicKey,
        privateKey,
        type: 'personal'
      }
    });

    return {
      name: key.name,
      publicKey: key.publicKey,
      privateKey: key.privateKey || undefined,
      type: 'personal'
    };
  }

  static async importPublicKey(userId: string, name: string, publicKey: string): Promise<KeyPairInfo> {
    // Validation de la clé
    try {
      await openpgp.readKey({ armoredKey: publicKey });
    } catch {
      throw new Error('Clé publique invalide');
    }

    const vault = await prisma.keyVault.findUnique({
      where: { userId }
    });

    if (!vault) {
      throw new Error('Vault non trouvé');
    }

    const key = await prisma.key.create({
      data: {
        vaultId: vault.id,
        name,
        publicKey,
        type: 'contact'
      }
    });

    return {
      name: key.name,
      publicKey: key.publicKey,
      type: 'contact'
    };
  }

  static async getKeys(userId: string) {
    const vault = await prisma.keyVault.findUnique({
      where: { userId },
      include: {
        keys: true
      }
    });

    return vault?.keys || [];
  }
}
