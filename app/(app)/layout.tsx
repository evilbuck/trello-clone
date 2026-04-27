import { QueryProvider } from '@/components/providers/QueryProvider';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthFromCookies } from '@/lib/auth/jwt';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthFromCookies();

  if (!auth) {
    redirect('/login');
  }

  return (
    <QueryProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="container mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/boards" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Trello Clone
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="h-[calc(100vh-57px)]">{children}</main>
      </div>
    </QueryProvider>
  );
}
