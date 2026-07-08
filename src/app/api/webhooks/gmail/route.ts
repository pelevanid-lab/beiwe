import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const adminDb = getAdminDb();

    // Log the raw incoming webhook to Firestore so we can see it
    await adminDb.collection('webhook_logs').add({
      timestamp: new Date().toISOString(),
      source: 'gmail',
      payload: body
    });

    if (!body.message || !body.message.data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const decodedData = Buffer.from(body.message.data, 'base64').toString('utf8');
    const data = JSON.parse(decodedData);
    const { emailAddress, historyId } = data;

    if (!emailAddress) {
      return NextResponse.json({ error: 'No email address found' }, { status: 400 });
    }

    const tokenDoc = await adminDb.collection('google_tokens').doc(emailAddress).get();
    
    if (!tokenDoc.exists) {
      await adminDb.collection('webhook_logs').add({ error: 'No token found', emailAddress });
      return NextResponse.json({ success: true });
    }

    let { access_token } = tokenDoc.data()!;

    // 1. Fetch History
    const historyRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const historyData = await historyRes.json();
    
    if (!historyRes.ok) {
      await adminDb.collection('webhook_logs').add({ error: 'History API Error', data: historyData });
      return NextResponse.json({ success: true }); 
    }

    const newMessages: string[] = [];
    if (historyData.history) {
      historyData.history.forEach((hist: any) => {
        if (hist.messagesAdded) {
          hist.messagesAdded.forEach((msgInfo: any) => {
            newMessages.push(msgInfo.message.id);
          });
        }
      });
    }

    await adminDb.collection('webhook_logs').add({ info: 'New Messages Found', count: newMessages.length, newMessages });

    // 2. Fetch the actual content
    for (const msgId of newMessages) {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const msgData = await msgRes.json();
      
      if (!msgRes.ok) {
        await adminDb.collection('webhook_logs').add({ error: 'Message API Error', msgId, data: msgData });
        continue;
      }

      const headers = msgData.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Konusuz';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Bilinmeyen';
      const to = headers.find((h: any) => h.name === 'To')?.value || emailAddress;

      let textBody = msgData.snippet || '';

      const inboxMessage = {
        id: msgData.id,
        threadId: msgData.threadId,
        sender: from,
        to: to,
        platform: 'gmail',
        preview: subject + ' - ' + textBody,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        unread: msgData.labelIds.includes('UNREAD'),
        folder: msgData.labelIds.includes('SENT') ? 'sent' : 'inbox',
        ownerEmail: emailAddress,
        history: [
          { sender: 'them', text: subject + '\n\n' + textBody, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }
        ]
      };

      await adminDb.collection('inbox_messages').doc(msgData.id).set(inboxMessage, { merge: true });
      await adminDb.collection('webhook_logs').add({ info: 'Successfully saved message', msgId });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
