'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

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
}

interface Contact {
  id: string;
  username: string;
  email: string;
}

interface PendingRequest {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
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
                  onClick={() => setSelectedContact(contact)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedContact?.id === contact?.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-card hover:cyber-glow'
                  }`}
                >
                  <p className="font-medium">{contact?.username || 'Utilisateur'}</p>
                  <p className="text-sm text-muted">{contact?.email || 'Email non disponible'}</p>
                </div>
              ))}
              
              {contacts.length === 0 && (
                <p className="text-center text-muted py-4">
                  Aucun contact pour le moment
                </p>
              )}
            </div>
          </div>
        </div>
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
          <div className="p-4 space-y-4">
            {messages.map(message => (
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
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
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
      </div>
    </div>
  );
} 