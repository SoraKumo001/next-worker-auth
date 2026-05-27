import { headers, cookies } from 'next/headers';
import LoginForm from '@/components/LoginForm';
import DashboardView from '@/components/DashboardView';

// Mock user verification logic
async function verifyUser(token: string) {
  if (token === 'mock-session-token-xyz789') {
    return {
      name: 'Demo Admin',
      role: 'Administrator',
      email: 'admin@demo-sandbox.io',
      bio: 'This content was server-side rendered (SSR) directly on the root route (/). During page reload, the Service Worker successfully intercepted the document request, extracted the token from IndexedDB, and attached it inside the headers. Next.js resolved the auth state and served this Dashboard panel instead of the LoginForm, keeping the URL completely unchanged.',
    };
  }
  return null;
}

export default async function RootPage() {
  const headersList = await headers();
  const cookiesList = await cookies();
  
  const authHeader = headersList.get('authorization');
  let user = null;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    user = await verifyUser(token);
  }

  // Display cookies to prove they are empty or contain no authentication tokens
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
      />
    );
  }

  // Render LoginForm if no valid authorization header is present
  return <LoginForm />;
}
