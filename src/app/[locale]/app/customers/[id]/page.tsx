import { getDictionary } from '@/lib/dictionaries';
import CustomerDetailClient from './CustomerDetailClient';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);

  return <CustomerDetailClient dict={dict} id={id} />;
}
