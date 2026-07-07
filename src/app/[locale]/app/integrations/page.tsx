import { getDictionary } from '@/lib/dictionaries';
import IntegrationsClient from './IntegrationsClient';

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <IntegrationsClient dict={dict.app} />;
}
