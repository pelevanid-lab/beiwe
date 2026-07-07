import { getDictionary } from '@/lib/dictionaries';
import AppClient from './AppClient';

export default async function AppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <AppClient dict={dict.app} />;
}
