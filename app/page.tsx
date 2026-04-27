import { redirect } from 'next/navigation';
import { getAuthFromCookies } from '@/lib/auth/jwt';

export default async function HomePage() {
  const auth = await getAuthFromCookies();

  if (auth) {
    redirect('/boards');
  }

  redirect('/login');
}
