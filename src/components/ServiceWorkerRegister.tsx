'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ServiceWorkerStatus = 'initializing' | 'active' | 'unsupported' | 'error';

const ServiceWorkerStatusContext = createContext<ServiceWorkerStatus>('initializing');

export function useServiceWorkerStatus() {
  return useContext(ServiceWorkerStatusContext);
}

export default function ServiceWorkerRegister({ children }: { children: React.ReactNode }) {
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus>('initializing');

  const statusLabel = useMemo(() => swStatus.toUpperCase(), [swStatus]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      queueMicrotask(() => setSwStatus('unsupported'));
      return;
    }

    if (navigator.serviceWorker.controller) {
      queueMicrotask(() => setSwStatus('active'));
      return;
    }

    let isMounted = true;
    let onControllerChange: ((event: Event) => void) | null = null;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[Register] SW registered:', registration);

        if (navigator.serviceWorker.controller) {
          if (isMounted) {
            setSwStatus('active');
          }
          return;
        }

        const handleControllerChange = () => {
          console.log('[Register] Controller changed, SW now in control');
          if (isMounted) {
            setSwStatus('active');
          }
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };

        onControllerChange = handleControllerChange;
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      } catch (error) {
        console.error('[Register] SW registration failed:', error);
        if (isMounted) {
          setSwStatus('error');
        }
      }
    };

    registerSW();

    return () => {
      isMounted = false;
      if (onControllerChange) {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      }
    };
  }, []);

  return (
    <ServiceWorkerStatusContext.Provider value={swStatus}>
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
        SW: {statusLabel}
      </div>
      {children}
    </ServiceWorkerStatusContext.Provider>
  );
}
