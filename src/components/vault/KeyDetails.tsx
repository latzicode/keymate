'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Key {
  id: string;
  name: string;
  type: 'personal' | 'contact';
  publicKey: string;
  privateKey?: string;
  createdAt: string;
  lastUsed: string;
}

interface KeyDetailsProps {
  selectedKey: Key | null;
  onClose: () => void;
  onDelete: (keyId: string) => Promise<void>;
}

export default function KeyDetails({ selectedKey, onClose, onDelete }: KeyDetailsProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!selectedKey) return null;

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé ?')) return;
    
    setLoading(true);
    try {
      await onDelete(selectedKey.id);
      onClose();
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-card w-full max-w-2xl rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold">{selectedKey.name}</h2>
            <p className="text-muted">
              {selectedKey.type === 'personal' ? 'Clé personnelle' : 'Clé de contact'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted mb-2">Clé publique</h3>
            <pre className="p-3 bg-background/50 rounded border border-border overflow-auto text-xs">
              {selectedKey.publicKey}
            </pre>
          </div>

          {selectedKey.type === 'personal' && selectedKey.privateKey && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted">Clé privée</h3>
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="text-xs text-primary hover:text-primary-dark"
                >
                  {showPrivateKey ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              {showPrivateKey && (
                <pre className="p-3 bg-red-500/5 rounded border border-red-500/20 overflow-auto text-xs">
                  {selectedKey.privateKey}
                </pre>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              {loading ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
