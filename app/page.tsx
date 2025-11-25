import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

export default async function Home() {
  // Check if user is authenticated
  const user = await getCurrentUser();

  // Redirect based on authentication state
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
