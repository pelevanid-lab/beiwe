import { getDictionary } from '@/lib/dictionaries';
import InboxClient from './InboxClient';

export default async function InboxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <InboxClient dict={dict} />;
}
