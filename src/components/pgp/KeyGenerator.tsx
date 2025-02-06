'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface KeyGeneratorProps {
  onGenerate: (keyPair: { publicKey: string; privateKey: string }) => void;
}

export default function KeyGenerator({ onGenerate }: KeyGeneratorProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      onGenerate(data.keyPair);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-4">Générer une nouvelle paire de clés</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la clé"
          className="input-field"
          required
          disabled={loading}
        />

        <motion.button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <span>Génération en cours...</span>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full" />
            </div>
          ) : (
            'Générer'
          )}
        </motion.button>
      </form>
    </div>
  );
}
