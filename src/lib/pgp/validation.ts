import * as openpgp from 'openpgp';

export class KeyValidator {
  static async validatePublicKey(publicKey: string): Promise<boolean> {
    try {
      const key = await openpgp.readKey({ armoredKey: publicKey });
      return !key.isPrivate();
    } catch {
      return false;
    }
  }

  static async validatePrivateKey(privateKey: string): Promise<boolean> {
    try {
      const key = await openpgp.readPrivateKey({ armoredKey: privateKey });
      return key.isPrivate();
    } catch {
      return false;
    }
  }

  static async getKeyInfo(publicKey: string) {
    try {
      const key = await openpgp.readKey({ armoredKey: publicKey });
      const userIds = key.getUserIDs();
      const keyId = key.getKeyID().toHex();

      return {
        valid: true,
        userIds,
        keyId,
        algorithm: key.getAlgorithmInfo()
      };
    } catch {
      return {
        valid: false,
        userIds: [],
        keyId: null,
        algorithm: null
      };
    }
  }
}
