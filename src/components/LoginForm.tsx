'use client';

import React, { useState, useEffect } from 'react';
import { setItem, removeItem } from '@/utils/db';

export default function LoginForm() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If the login form is rendered, it means the server verified that the user is unauthenticated.
    // Clean up any stale or invalid token in client-side IndexedDB to prevent confusion.
    const clearStaleToken = async () => {
      try {
        await removeItem('accessToken');
      } catch (err) {
        console.error('[LoginForm] Failed to clear stale token:', err);
      }
    };
    clearStaleToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Save the received token securely inside IndexedDB
        await setItem('accessToken', data.token);
        
        console.log('[LoginForm] Token stored. Triggering page reload for SW interception...');
        
        // Hard reload the window. The active Service Worker will intercept the reload
        // request to / and inject the Authorization: Bearer header.
        window.location.reload();
      } else {
        setError(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      console.error('[LoginForm] Authentication failed:', err);
      setError('Communication with the security gateway failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <h1 className="card-title">SW Auth Sandbox</h1>
        <p className="card-subtitle">
          Single-URL Next.js SSR Auth demo using Service Worker header injection & IndexedDB.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              className="form-input"
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              className="form-input"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Decrypting Session...' : 'Authenticate'}
          </button>
        </form>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--card-border)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            lineHeight: '1.6',
          }}
        >
          <p style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            💡 Demo Credentials (Pre-filled):
          </p>
          <p>• Username: <code style={{ color: '#fff', background: '#000', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>admin</code></p>
          <p>• Password: <code style={{ color: '#fff', background: '#000', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>password</code></p>
        </div>
      </div>
    </div>
  );
}
