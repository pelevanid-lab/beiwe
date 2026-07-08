import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import AppClient from './AppClient';

export default async function AppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <Suspense fallback={<div className="h-screen w-full bg-[var(--color-paper)]"></div>}>
      <AppClient dict={dict.app} />
    </Suspense>
  );
}
