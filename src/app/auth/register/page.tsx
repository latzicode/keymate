'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const RegisterPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      setError('Tous les champs sont requis');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Email invalide');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Le nom d\'utilisateur doit faire au moins 3 caractères');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      // Redirection vers le login après inscription réussie
      router.push('/auth/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Keymate</h1>
        <p className="text-muted mt-2">Créer un compte sécurisé</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="input-field"
            placeholder="Email"
            disabled={loading}
          />
          
          <input
            type="text"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
            className="input-field"
            placeholder="Nom d'utilisateur"
            disabled={loading}
          />

          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="input-field"
            placeholder="Mot de passe"
            disabled={loading}
          />

          <input
            type="password"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input-field"
            placeholder="Confirmer le mot de passe"
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="btn-primary w-full relative"
          disabled={loading}
        >
          {loading ? 'Création du compte...' : 'Créer un compte'}
        </button>
      </form>

      <div className="text-center text-sm">
        <Link href="/auth/login" className="text-primary hover:text-primary-dark">
          Déjà un compte ? Se connecter
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage; 