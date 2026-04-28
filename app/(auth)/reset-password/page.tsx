import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

function ResetPasswordFormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-10 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-10 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-10 animate-pulse rounded-md bg-blue-200 dark:bg-blue-900" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Set New Password</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter your new password below
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
          <Suspense fallback={<ResetPasswordFormFallback />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
