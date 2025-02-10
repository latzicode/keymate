'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import KeyList from '@/components/vault/KeyList';
import KeyDetails from '@/components/vault/KeyDetails';
import KeyGenerator from '@/components/pgp/KeyGenerator';
import ShareKeyModal from '@/components/vault/ShareKeyModal';
import KeySelector from '@/components/pgp/KeySelector';
import EncryptionVisualizer from '@/components/pgp/EncryptionVisualizer';

interface User {
  id: string;
  email: string;
  username: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  keyId: string;
}

interface Contact {
  id: string;
  username: string;
  email: string;
  sharedKeys?: { id: string; name: string }[];
}

interface PendingRequest {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

interface Key {
  id: string;
  name: string;
  type: 'personal' | 'contact';
  publicKey: string;
  privateKey?: string;
  createdAt: string;
  lastUsed: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Contact[]>([]);
  const [sentRequests, setSentRequests] = useState<PendingRequest[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedKey, setSelectedKey] = useState<Key | null>(null);
  const [showKeyGenerator, setShowKeyGenerator] = useState(false);
  const [sharingWithContact, setSharingWithContact] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [encryptedPreview, setEncryptedPreview] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<{[key: string]: string}>({});
  const [isDecrypting, setIsDecrypting] = useState<{[key: string]: boolean}>({});
  const [showDecryptModal, setShowDecryptModal] = useState<string | null>(null);
  const [keys, setKeys] = useState<Key[]>([]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charge l'utilisateur connecté
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Non authentifié');
        return res.json();
      })
      .then(data => setUser(data.user))
      .catch(() => router.push('/auth/login'));
  }, [router]);

  // Charge les contacts et demandes
  useEffect(() => {
    if (user) {
      fetch('/api/contacts')
        .then(res => res.json())
        .then(data => {
          setContacts(data.contacts);
          setPendingRequests(data.pendingRequests);
          setSentRequests(data.sentRequests);
        });
    }
  }, [user]);

  // Charge les messages quand un contact est sélectionné
  useEffect(() => {
    if (selectedContact) {
      fetch(`/api/messages/${selectedContact.id}`)
        .then(res => res.json())
        .then(data => setMessages(data.messages))
        .catch(console.error);
    }
  }, [selectedContact]);

  // Polling des messages toutes les 3 secondes
  useEffect(() => {
    if (!selectedContact) return;

    const fetchMessages = () => {
      fetch(`/api/messages/${selectedContact.id}`)
        .then(res => res.json())
        .then(data => setMessages(data.messages))
        .catch(console.error);
    };

    // Premier chargement
    fetchMessages();

    // Polling toutes les 3 secondes
    const interval = setInterval(fetchMessages, 3000);

    // Cleanup
    return () => clearInterval(interval);
  }, [selectedContact]);

  // Recherche d'utilisateurs
  const handleSearch = async () => {
    if (searchTerm.length < 3) return;
    setLoading(true);
    
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      setSearchResults(data.users);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un contact
  const addContact = async (contactId: string) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId })
      });
      
      if (res.ok) {
        const data = await res.json();
        setContacts(prev => [...prev, data.contact]);
        setSearchResults([]);
        setSearchTerm('');
      }
    } catch (error) {
      console.error('Erreur d\'ajout:', error);
    }
  };

  // Accepter une demande
  const handleAccept = async (requestId: string) => {
    try {
      const res = await fetch(`/api/contacts/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      });
      
      if (res.ok) {
        const data = await res.json();
        setContacts(prev => [...prev, data.contact]);
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Refuser une demande
  const handleReject = async (requestId: string) => {
    try {
      const res = await fetch(`/api/contacts/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      });
      
      if (res.ok) {
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Envoyer un message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedContact.id,
          content: newMessage
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST'
      });

      if (res.ok) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const handleKeyGenerated = async (keyPair: { publicKey: string; privateKey: string }) => {
    setShowKeyGenerator(false);
    // Rafraîchir la liste des clés
    window.location.reload();
  };

  // Modifier le handler de partage
  const handleShareKey = async (keyId: string) => {
    if (!sharingWithContact) return;
    
    try {
      const res = await fetch('/api/contacts/share-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: sharingWithContact,
          keyId
        })
      });

      if (!res.ok) throw new Error('Erreur lors du partage de la clé');
      
      // Rafraîchir la liste des contacts
      window.location.reload();
    } catch (error) {
      console.error('Erreur partage:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (isEncrypting && selectedKeyId && newMessage && user?.id) {
      const encrypt = async () => {
        try {
          const res = await fetch('/api/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: newMessage,
              keyId: selectedKeyId,
              userId: user.id
            })
          });

          if (!res.ok) throw new Error('Erreur chiffrement');
          
          const { encrypted } = await res.json();
          setEncryptedPreview(encrypted);
        } catch (error) {
          console.error('Erreur chiffrement:', error);
        } finally {
          setIsEncrypting(false);
        }
      };
      
      encrypt();
    }
  }, [isEncrypting, selectedKeyId, newMessage, user?.id]);

  // Fonction d'envoi du message chiffré
  const sendEncryptedMessage = async () => {
    if (!encryptedPreview) return;  // On s'assure qu'on a un message chiffré
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedContact.id,
          content: encryptedPreview,  // On envoie exactement le même message chiffré
          keyId: selectedKeyId
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur envoi message');
      }

      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      setEncryptedPreview('');
    } catch (error) {
      console.error('Erreur envoi:', error);
    }
  };

  const decryptMessage = async (messageId: string, encryptedContent: string, keyId: string) => {
    console.log('1. Tentative déchiffrement:', { messageId, encryptedContent: encryptedContent.substring(0, 100), keyId });
    
    try {
      const res = await fetch('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: encryptedContent,
          keyId,
          userId: user?.id
        })
      });
      
      console.log('2. Réponse API:', res.status);
      const data = await res.json();
      console.log('3. Données reçues:', data);

      if (!res.ok) throw new Error(data.error);
      
      setDecryptedMessages(prev => ({
        ...prev,
        [messageId]: data.decrypted
      }));
    } catch (error) {
      console.error('4. ERREUR:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadKeys = async () => {
      const res = await fetch("/api/keys");
      const data = await res.json();
      setKeys(data.keys);
    };

    loadKeys();
  }, [user]);

  if (!user) return null;

  return (
    <div className="h-screen flex">
      <div className="w-80 flex-shrink-0 cyber-card border-r border-border flex flex-col">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-shrink min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0">
                {/* Avatar */}
              </div>
              <div className="truncate">
                <h2 className="font-bold truncate">{user?.username}</h2>
                <p className="text-sm text-muted truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="btn-primary ml-2 flex-shrink-0"
            >
              Déco
            </button>
          </div>
        </div>

        <div className="cyber-card border-b border-border">
          {/* ligne cyber */}
        </div>

        <div className="flex-1 overflow-y-auto">
          {pendingRequests?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">Demandes reçues</h3>
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <div key={request.id} className="p-3 bg-card/50 rounded-lg">
                    <p className="font-medium">{request.user.username}</p>
                    <p className="text-sm text-muted mb-2">{request.user.email}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request.id)}
                        className="btn-primary text-sm py-1 px-3"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="text-sm text-red-500 hover:text-red-400"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sentRequests.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">Demandes envoyées</h3>
              <div className="space-y-3">
                {sentRequests.map(request => (
                  <div key={request.id} className="p-3 bg-card/50 rounded-lg">
                    <p className="font-medium">{request.user.username}</p>
                    <p className="text-sm text-muted">{request.user.email}</p>
                    <p className="text-xs text-muted mt-2">En attente...</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold mb-4">Contacts</h3>
            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Rechercher un utilisateur..."
                  className="input-field flex-1"
                />
                <button 
                  onClick={handleSearch}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? '...' : 'Rechercher'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map(result => (
                    <div 
                      key={result.id}
                      className="p-3 bg-card/50 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{result.username}</p>
                        <p className="text-sm text-muted">{result.email}</p>
                      </div>
                      <button
                        onClick={() => addContact(result.id)}
                        className="text-primary hover:text-primary-dark"
                      >
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {contacts?.map(contact => contact && (
                <div
                  key={contact.id}
                  className={`p-3 rounded-lg ${
                    selectedContact?.id === contact?.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-card hover:cyber-glow'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div 
                      className="cursor-pointer" 
                      onClick={() => setSelectedContact(contact)}
                    >
                      <p className="font-medium">{contact.username}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                      {contact.sharedKeys?.map((key) => (
                        <p key={key.id} className="text-xs text-primary mt-1">
                          {key.name}
                        </p>
                      ))}
                    </div>
                    {(!contact.sharedKeys || contact.sharedKeys.length === 0) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingWithContact(contact.id);
                        }}
                        className="text-sm text-primary hover:text-primary-dark"
                      >
                        Partager une clé
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {contacts.length === 0 && (
                <p className="text-center text-muted py-4">
                  Aucun contact pour le moment
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Vault</h3>
              <button
                onClick={() => setShowKeyGenerator(true)}
                className="text-sm text-primary hover:text-primary-dark"
              >
                + Nouvelle clé
              </button>
            </div>
            <KeyList onKeySelect={setSelectedKey} />
          </div>
        </div>

        {showKeyGenerator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Générer une nouvelle clé</h3>
                <button onClick={() => setShowKeyGenerator(false)}>✕</button>
              </div>
              <KeyGenerator onGenerate={handleKeyGenerated} />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-border">
          {selectedContact ? (
            <>
              <h2 className="font-semibold">{selectedContact.username}</h2>
              <p className="text-sm text-muted">{selectedContact.email}</p>
            </>
          ) : (
            <h2 className="text-xl font-semibold mb-2">
              Sélectionnez un contact pour démarrer une conversation
            </h2>
          )}
        </div>

        <div className="cyber-card border-b border-border">
          {/* ligne cyber */}
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedKey ? (
            <div className="p-4">
              <KeyDetails
                selectedKey={selectedKey}
                onClose={() => setSelectedKey(null)}
                onDelete={async (keyId) => {
                  try {
                    const res = await fetch(`/api/keys/${keyId}`, {
                      method: 'DELETE'
                    });
                    if (!res.ok) throw new Error('Erreur suppression');
                    setSelectedKey(null);
                    window.location.reload();
                  } catch (error) {
                    console.error('Erreur:', error);
                  }
                }}
              />
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {messages.map((message) => (
                <>
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.senderId === user?.id
                          ? 'bg-primary text-white'
                          : 'bg-card'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.senderId !== user?.id && (
                      <button
                        onClick={() => setShowDecryptModal(message.id)}
                        className="inline-flex items-center justify-center ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Déchiffrer
                      </button>
                    )}
                  </div>
                  {decryptedMessages[message.id] && (
                    <div className="text-xs text-green-400 mt-1">
                      Message déchiffré : {decryptedMessages[message.id]}
                    </div>
                  )}
                </>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="input-field"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="btn-primary"
            >
              Envoyer
            </button>
          </form>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">
              Chiffrer avec :
            </span>
            
            <div className="flex-1 relative overflow-hidden">
              <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 pb-2">
                {selectedContact?.sharedKeys?.map((key) => (
                  <button
                    key={key.id}
                    onClick={() => setSelectedKeyId(key.id)}
                    className={`
                      flex-shrink-0 px-3 py-1 rounded-full text-sm
                      ${selectedKeyId === key.id 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      }
                    `}
                  >
                    {key.name}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setIsEncrypting(true)}
              disabled={!selectedKeyId || !newMessage}
              className="btn-secondary text-sm px-3 py-1 flex-shrink-0"
            >
              Chiffrer
            </button>
          </div>

          <EncryptionVisualizer
            originalMessage={newMessage}
            encryptedMessage={encryptedPreview}
            isEncrypting={isEncrypting}
            selectedKeyName={selectedContact?.sharedKeys?.find(k => k.id === selectedKeyId)?.name}
          />

          {encryptedPreview && !isEncrypting && (
            <button
              onClick={sendEncryptedMessage}
              className="mt-4 btn-primary"
            >
              Envoyer le message chiffré
            </button>
          )}
        </div>
      </div>

      {/* Ajouter le modal */}
      {sharingWithContact && (
        <ShareKeyModal
          contactId={sharingWithContact}
          onClose={() => setSharingWithContact(null)}
          onShare={handleShareKey}
        />
      )}

      {/* Modal avec UNIQUEMENT les clés privées */}
      {showDecryptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700 shadow-xl">
            <h3 className="text-lg font-medium mb-4 text-white">Déchiffrer le message</h3>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Choisir une de vos clés privées :</div>
              <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                {keys.filter(key => key.type === 'personal').map((key) => (
                  <button
                    key={key.id}
                    onClick={() => {
                      const message = messages.find(m => m.id === showDecryptModal);
                      if (message) {
                        decryptMessage(message.id, message.content, key.id);
                        setShowDecryptModal(null);
                      }
                    }}
                    className="flex items-center justify-between p-2 rounded border border-gray-700 hover:bg-gray-800 text-white"
                  >
                    <div>
                      <div className="font-medium">{key.name}</div>
                      <div className="text-xs text-gray-400">Ma clé privée</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowDecryptModal(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 