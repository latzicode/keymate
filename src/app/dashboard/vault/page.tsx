'use client';

import { useState } from 'react';
import KeyGenerator from '@/components/pgp/KeyGenerator';
import KeyList from '@/components/vault/KeyList';
import KeyDetails from '@/components/vault/KeyDetails';

interface Key {
  id: string;
  name: string;
  type: 'personal' | 'contact';
  publicKey: string;
  privateKey?: string;
  createdAt: string;
  lastUsed: string;
}

export default function VaultPage() {
  const [selectedKey, setSelectedKey] = useState<Key | null>(null);

  const handleKeyGenerated = async (keyPair: { publicKey: string; privateKey: string }) => {
    // Rafraîchir la liste des clés
    window.location.reload();
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Rafraîchir la page après suppression
      window.location.reload();
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Vault de Clés</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <KeyList onKeySelect={setSelectedKey} />
        </div>

        <div>
          <KeyGenerator onGenerate={handleKeyGenerated} />
        </div>
      </div>

      {selectedKey && (
        <KeyDetails
          selectedKey={selectedKey}
          onClose={() => setSelectedKey(null)}
          onDelete={handleDeleteKey}
        />
      )}
    </div>
  );
}
