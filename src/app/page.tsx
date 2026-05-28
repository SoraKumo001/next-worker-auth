import { headers, cookies } from 'next/headers';
import LoginForm from '@/components/LoginForm';
import DashboardView from '@/components/DashboardView';

interface VerifiedUser {
  name: string;
  role: string;
  email: string;
  bio: string;
}

// Mock user verification logic
async function verifyUser(token: string): Promise<VerifiedUser | null> {
  if (token === 'mock-session-token-xyz789') {
    return {
      name: 'Demo Admin',
      role: 'Administrator',
      email: 'admin@demo-sandbox.io',
      bio: 'This content was server-side rendered (SSR) directly on the root route (/). After the Service Worker took control of the page, the reload request carried an Authorization header derived from the token in IndexedDB. Next.js resolved the auth state and served this Dashboard panel under the same URL.',
    };
  }
  return null;
}

export default async function RootPage() {
  const headersList = await headers();
  const cookiesList = await cookies();
  
  const authHeader = headersList.get('authorization');
  let user: VerifiedUser | null = null;
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    user = await verifyUser(token);
  }

  // Used only for the demo display. Authentication itself does not depend on cookies.
  const allCookies = cookiesList.getAll();
  const cookieDisplay = allCookies.length > 0 
    ? allCookies.map(c => `${c.name}=${c.value}`).join('; ') 
    : '(empty)';

  if (user && token) {
    return (
      <DashboardView 
        token={token} 
        user={user} 
        cookieDisplay={cookieDisplay} 
        ssrProof={{
          renderedAt: new Date().toISOString(),
          route: '/',
          authHeaderPresent: true,
          dataSource: 'RootPage Server Component before HTML output',
        }}
      />
    );
  }

  // Render LoginForm if no valid authorization header is present
  return <LoginForm />;
}
