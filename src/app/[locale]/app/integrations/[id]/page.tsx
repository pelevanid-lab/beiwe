import { getDictionary } from '@/lib/dictionaries';
import IntegrationSetupClient from './IntegrationSetupClient';

export default async function IntegrationSetupPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);

  return <IntegrationSetupClient dict={dict} integrationId={id} />;
}
