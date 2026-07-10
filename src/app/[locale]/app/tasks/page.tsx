import TasksClient from './TasksClient';
import { getDictionary } from '@/lib/dictionaries';

export const metadata = {
  title: 'Görevler | Beiwe',
  description: 'Görevlerinizi ve yapacaklarınızı yönetin',
};

export default async function TasksPage({ params: { locale } }: { params: { locale: string } }) {
  const dict = await getDictionary(locale);

  return <TasksClient dict={dict} />;
}
