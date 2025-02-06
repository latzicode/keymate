import * as openpgp from 'openpgp';

export async function encryptMessage(message: string, publicKey: string) {
  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: message }),
    encryptionKeys: await openpgp.readKey({ armoredKey: publicKey })
  });

  return encrypted;
}

export async function decryptMessage(
  encryptedMessage: string, 
  privateKey: string,
  password: string
) {
  const decrypted = await openpgp.decrypt({
    message: await openpgp.readMessage({ armoredMessage: encryptedMessage }),
    decryptionKeys: await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
      password
    })
  });

  return decrypted.data;
} 