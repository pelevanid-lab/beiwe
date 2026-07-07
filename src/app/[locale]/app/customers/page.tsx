import { getDictionary } from '@/lib/dictionaries';
import CustomersClient from './CustomersClient';

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <CustomersClient dict={dict.app} />;
}
