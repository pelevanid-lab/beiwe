import { getDictionary } from '@/lib/dictionaries';
import RoomClient from './RoomClient';

export default async function RoomPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.locale as any);
  
  return <RoomClient dict={dict} roomId={resolvedParams.id} />;
}
