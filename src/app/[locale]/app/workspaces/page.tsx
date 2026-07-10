import { getDictionary } from '@/lib/dictionaries';
import WorkspacesClient from './WorkspacesClient';

export default async function WorkspacesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <WorkspacesClient dict={dict} />;
}
