import { getDictionary } from '@/lib/dictionaries';
import NotesClient from './NotesClient';

export default async function NotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <NotesClient dict={dict.app} />;
}
