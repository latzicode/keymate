import { useState, useEffect } from 'react';

interface Key {
  id: string;
  name: string;
  type: 'personal' | 'contact';
  publicKey: string;
}

interface ShareKeyModalProps {
  contactId: string;
  onClose: () => void;
  onShare: (keyId: string) => Promise<void>;
}

export default function ShareKeyModal({ contactId, onClose, onShare }: ShareKeyModalProps) {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await fetch('/api/vault');
        const data = await res.json();
        // On ne montre que les clés personnelles pour le partage
        setKeys(data.vault.keys.filter((k: Key) => k.type === 'personal'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchKeys();
  }, []);

  const handleShare = async () => {
    if (!selectedKeyId) return;
    
    setSharing(true);
    try {
      await onShare(selectedKeyId);
      onClose();
      // Rafraîchir la page pour voir les nouvelles clés
      window.location.reload();
    } catch (error) {
      setError('Erreur lors du partage de la clé');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-card p-6 rounded-lg max-w-md w-full border border-border">
          <p className="text-center text-foreground">Chargement des clés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg max-w-md w-full border border-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Partager une clé</h3>
          <button 
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {keys.length > 0 ? (
            <>
              <div className="space-y-2">
                {keys.map(key => (
                  <div
                    key={key.id}
                    className={`p-3 rounded-lg cursor-pointer border transition-all ${
                      selectedKeyId === key.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:cyber-glow'
                    }`}
                    onClick={() => setSelectedKeyId(key.id)}
                  >
                    <p className="font-medium">{key.name}</p>
                    <p className="text-sm text-muted">Clé personnelle</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-muted hover:text-foreground"
                >
                  Annuler
                </button>
                <button
                  onClick={handleShare}
                  disabled={!selectedKeyId || sharing}
                  className="btn-primary"
                >
                  {sharing ? 'Partage en cours...' : 'Partager'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">Aucune clé personnelle disponible</p>
              <p className="text-sm text-muted mt-2">
                Générez d'abord une clé dans votre vault pour pouvoir la partager
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}