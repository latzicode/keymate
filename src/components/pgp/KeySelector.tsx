'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Key {
  id: string;
  name: string;
  type: 'personal' | 'contact';
  lastUsed: string;
}

interface KeySelectorProps {
  onSelect: (keyId: string) => void;
  type?: 'encryption' | 'decryption';
}

export default function KeySelector({ onSelect, type = 'encryption' }: KeySelectorProps) {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await fetch('/api/keys');
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        // Filtrer les clés selon le type d'opération
        const filteredKeys = data.keys.filter((key: Key) => 
          type === 'encryption' ? key.type === 'contact' : key.type === 'personal'
        );

        setKeys(filteredKeys);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchKeys();
  }, [type]);

  if (loading) {
    return <div className="animate-pulse">Chargement des clés...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted">
        {type === 'encryption' ? 'Choisir une clé de chiffrement' : 'Choisir une clé de déchiffrement'}
      </h4>
      
      <div className="grid gap-2">
        {keys.map((key) => (
          <motion.button
            key={key.id}
            onClick={() => onSelect(key.id)}
            className="p-3 bg-card hover:bg-card/80 rounded-lg text-left transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="font-medium">{key.name}</div>
            <div className="text-sm text-muted">
              Dernière utilisation: {new Date(key.lastUsed).toLocaleDateString()}
            </div>
          </motion.button>
        ))}
      </div>

      {keys.length === 0 && (
        <div className="text-center text-muted py-4">
          Aucune clé disponible
        </div>
      )}
    </div>
  );
}
