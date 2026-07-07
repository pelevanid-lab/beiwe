import { getDictionary } from '@/lib/dictionaries';
import AppointmentsClient from './AppointmentsClient';

export default async function AppointmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <AppointmentsClient dict={dict.app} />;
}
