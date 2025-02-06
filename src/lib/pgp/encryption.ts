import * as openpgp from 'openpgp';
import { prisma } from '@/lib/prisma';

export class EncryptionService {
  static async encryptMessage(
    message: string,
    keyId: string,
    senderId: string
  ): Promise<{ encrypted: string; keyVersion: string }> {
    const key = await prisma.key.findUnique({
      where: { id: keyId }
    });

    if (!key) {
      throw new Error('Clé non trouvée');
    }

    const publicKey = await openpgp.readKey({ armoredKey: key.publicKey });
    
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: message }),
      encryptionKeys: publicKey
    });

    return {
      encrypted: encrypted as string,
      keyVersion: publicKey.getKeyID().toHex()
    };
  }

  static async decryptMessage(
    encryptedMessage: string,
    keyId: string
  ): Promise<string> {
    const key = await prisma.key.findUnique({
      where: { id: keyId }
    });

    if (!key?.privateKey) {
      throw new Error('Clé privée non trouvée');
    }

    const privateKey = await openpgp.readPrivateKey({
      armoredKey: key.privateKey
    });

    const message = await openpgp.readMessage({
      armoredMessage: encryptedMessage
    });

    const { data: decrypted } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey
    });

    return decrypted as string;
  }
}
