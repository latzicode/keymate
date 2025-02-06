'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Key {
  id: string;
  name: string;
  type: 'personal' | 'contact';
  createdAt: string;
  lastUsed: string;
}

interface KeyListProps {
  onKeySelect: (key: Key) => void;
}

export default function KeyList({ onKeySelect }: KeyListProps) {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await fetch('/api/vault');
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);
        setKeys(data.vault.keys);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchKeys();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Chargement du vault...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erreur: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">Clés personnelles</h3>
          {keys.filter(k => k.type === 'personal').map(key => (
            <KeyCard key={key.id} keyData={key} onClick={() => onKeySelect(key)} />
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Clés de contacts</h3>
          {keys.filter(k => k.type === 'contact').map(key => (
            <KeyCard key={key.id} keyData={key} onClick={() => onKeySelect(key)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KeyCard({ keyData, onClick }: { keyData: Key; onClick: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      className="p-4 bg-card hover:bg-card/80 rounded-lg cursor-pointer mb-2"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{keyData.name}</h4>
          <p className="text-sm text-muted">
            Créée le {new Date(keyData.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
          keyData.type === 'personal' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-muted/10 text-muted'
        }`}>
          {keyData.type === 'personal' ? 'Personnelle' : 'Contact'}
        </span>
      </div>
    </motion.div>
  );
}
