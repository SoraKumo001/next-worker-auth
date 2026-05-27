'use client';

import React, { useEffect, useState } from 'react';

export default function ServiceWorkerRegister({ children }: { children: React.ReactNode }) {
  const [swStatus, setSwStatus] = useState<'initializing' | 'active' | 'unsupported' | 'error'>(() => {
    if (typeof window === 'undefined') return 'initializing';
    if (!('serviceWorker' in navigator)) return 'unsupported';
    if (navigator.serviceWorker.controller) return 'active';
    return 'initializing';
  });

  useEffect(() => {
    // If Service Workers are unsupported or already active, no need to register
    if (swStatus === 'unsupported' || swStatus === 'active') {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[Register] SW registered:', registration);

        if (navigator.serviceWorker.controller) {
          setSwStatus('active');
          return;
        }

        // Monitor when the service worker actually takes control of the page
        const onControllerChange = () => {
          console.log('[Register] Controller changed, SW now in control');
          setSwStatus('active');
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        };

        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      } catch (error) {
        console.error('[Register] SW registration failed:', error);
        setSwStatus('error');
      }
    };

    registerSW();
  }, [swStatus]);

  return (
    <>
      {/* Floating status badge for visual debugging without blocking SSR html */}
      <div 
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          padding: '0.4rem 0.85rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          fontFamily: 'monospace',
          background: swStatus === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          border: `1px solid ${swStatus === 'active' ? 'var(--success)' : '#f59e0b'}`,
          color: swStatus === 'active' ? 'var(--success)' : '#f59e0b',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        🛡️ SW: {swStatus.toUpperCase()}
      </div>
      {children}
    </>
  );
}
