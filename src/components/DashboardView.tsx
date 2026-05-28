import React from 'react';
import LogoutButton from '@/components/LogoutButton';

interface User {
  name: string;
  role: string;
  email: string;
  bio: string;
}

interface DashboardViewProps {
  token: string;
  user: User;
  cookieDisplay: string;
  ssrProof: {
    renderedAt: string;
    route: string;
    authHeaderPresent: boolean;
    dataSource: string;
  };
}

export default function DashboardView({ token, user, cookieDisplay, ssrProof }: DashboardViewProps) {
  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '640px' }}>
        <div className="dashboard-header">
          <div>
            <h1 className="card-title">Secure Dashboard</h1>
            <p className="card-subtitle">Server-Side Rendered (SSR) Protected Area</p>
          </div>
          <span className="user-badge">{user.role}</span>
        </div>

        <div className="cookie-status-panel">
          <span className="cookie-status-label">Document Cookies (ignored for auth):</span>
          <span className="cookie-status-value">{cookieDisplay}</span>
        </div>

        <div className="info-grid">
          <div className="info-item ssr-proof">
            <div className="info-label">HTML Output State</div>
            <div className="info-value">
              User data was resolved on the server before this HTML was returned.
            </div>
            <dl className="proof-list">
              <div>
                <dt>Route</dt>
                <dd>{ssrProof.route}</dd>
              </div>
              <div>
                <dt>Authorization header</dt>
                <dd>{ssrProof.authHeaderPresent ? 'present during SSR' : 'missing'}</dd>
              </div>
              <div>
                <dt>Rendered at</dt>
                <dd>
                  <time dateTime={ssrProof.renderedAt}>{ssrProof.renderedAt}</time>
                </dd>
              </div>
              <div>
                <dt>Data source</dt>
                <dd>{ssrProof.dataSource}</dd>
              </div>
            </dl>
          </div>

          <div className="info-item">
            <div className="info-label">Authentication Method</div>
            <div className="info-value" style={{ display: 'flex', alignItems: 'center' }}>
              Service Worker Authorization Header
              <span className="badge-green">No auth cookie</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Authenticated Profile</div>
            <div className="info-value">
              <strong>{user.name}</strong> ({user.email})
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">SSR Payload Verified Bio</div>
            <div className="info-value" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {user.bio}
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-label">Authorization Token Received by Server</div>
            <div className="info-value" style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
              Bearer {token}
            </div>
          </div>
        </div>

        <div className="tech-explanation">
          <h4>How Single-URL SSR Auth works:</h4>
          <p>1. When you authenticated, the token was saved to <strong>IndexedDB</strong>, and the page was reloaded.</p>
          <p>2. During the reload request (GET <code>/</code>), the active <strong>Service Worker</strong> intercepted the navigation request.</p>
          <p>3. The Service Worker read the token from IndexedDB, copied the request headers, appended the <code>Authorization: Bearer [token]</code> header, and forwarded the request to the Next.js backend.</p>
          <p>4. The Next.js SSR Server processed the request on the root route (<code>/</code>), extracted the header, verified the user, and returned HTML that already contains this Dashboard data—<strong>all under the same URL</strong>.</p>
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}
