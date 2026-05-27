'use client';

import React from 'react';
import { removeItem } from '@/utils/db';

export default function LogoutButton() {
  const handleLogout = async () => {
    // Clear access token from IndexedDB
    await removeItem('accessToken');
    
    // Perform a clean hard redirect back to home to clear any cached document state
    window.location.href = '/';
  };

  return (
    <button className="btn-secondary" onClick={handleLogout}>
      Terminate Session (Logout)
    </button>
  );
}
