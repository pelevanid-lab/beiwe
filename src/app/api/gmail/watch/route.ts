import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    const accessToken = authHeader.split(' ')[1];

    // Topic Name from env or fallback to a standard name for the project
    // User must create this topic in GCP and grant permissions to gmail-api-push@system.gserviceaccount.com
    const topicName = process.env.GMAIL_PUBSUB_TOPIC || 'projects/saule-core/topics/gmail-push';

    // Call Gmail API watch
    const watchRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labelIds: ['INBOX'], // Watch for new incoming messages
        topicName: topicName,
      }),
    });

    const data = await watchRes.json();

    if (!watchRes.ok) {
      console.error('Watch API Error:', data);
      return NextResponse.json({ error: data.error?.message || 'Failed to setup watch' }, { status: watchRes.status });
    }

    return NextResponse.json({ success: true, historyId: data.historyId, expiration: data.expiration });

  } catch (error: any) {
    console.error('Watch API Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
