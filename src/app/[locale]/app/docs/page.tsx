import { getDictionary } from '@/lib/dictionaries';
import DocsClient from './DocsClient';

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <DocsClient dict={dict} />;
}
