'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import KeySelector from '@/components/pgp/KeySelector';
import EncryptionVisualizer from '@/components/pgp/EncryptionVisualizer';

interface Contact {
  id: string;
  username: string;
  email: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  usedKeyId?: string;
}

export default function SecureChatPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedPreview, setEncryptedPreview] = useState('');

  // Charger les contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/contacts');
        const data = await res.json();
        setContacts(data.allContacts || []);
      } catch (error) {
        console.error('Erreur chargement contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Charger les messages quand un contact est sélectionné
  useEffect(() => {
    if (selectedContact) {
      const fetchMessages = async () => {
        try {
          const res = await fetch(`/api/messages/${selectedContact.id}`);
          const data = await res.json();
          setMessages(data.messages);
        } catch (error) {
          console.error('Erreur chargement messages:', error);
        }
      };

      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Polling
      return () => clearInterval(interval);
    }
  }, [selectedContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !selectedKeyId) return;

    setIsEncrypting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedContact.id,
          content: newMessage,
          keyId: selectedKeyId
        })
      });

      if (!res.ok) throw new Error('Erreur envoi message');

      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      setEncryptedPreview('');
    } catch (error) {
      console.error('Erreur envoi:', error);
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Liste des contacts */}
        <div className="md:col-span-1 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Contacts</h2>
          <div className="space-y-2">
            {loading ? (
              <div className="animate-pulse">Chargement des contacts...</div>
            ) : contacts.length > 0 ? (
              contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full text-left p-2 rounded ${
                    selectedContact?.id === contact.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {contact.username}
                </button>
              ))
            ) : (
              <div className="text-gray-500">
                Aucun contact pour le moment
              </div>
            )}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="md:col-span-3 space-y-4">
          {selectedContact ? (
            <>
              <div className="bg-card rounded-lg p-4 h-[500px] overflow-y-auto">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`mb-4 ${
                      message.senderId === selectedContact.id
                        ? 'text-left'
                        : 'text-right'
                    }`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        message.senderId === selectedContact.id
                          ? 'bg-muted/10'
                          : 'bg-primary/10'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4">
                <KeySelector
                  onSelect={setSelectedKeyId}
                  type="encryption"
                />

                {selectedKeyId && (
                  <>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Votre message..."
                      className="w-full p-3 bg-card rounded-lg resize-none"
                      rows={3}
                    />

                    <EncryptionVisualizer
                      originalMessage={newMessage}
                      encryptedMessage={encryptedPreview}
                      isEncrypting={isEncrypting}
                      selectedKeyName={selectedKeyId}
                    />

                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isEncrypting}
                      className="btn-primary w-full"
                    >
                      {isEncrypting ? 'Chiffrement...' : 'Envoyer'}
                    </button>
                  </>
                )}
              </form>
            </>
          ) : (
            <div className="text-center text-muted py-8">
              Sélectionnez un contact pour démarrer une conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
