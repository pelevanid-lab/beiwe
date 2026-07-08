import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Google Pub/Sub sends the message in body.message.data (base64 encoded)
    if (!body.message || !body.message.data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const decodedData = Buffer.from(body.message.data, 'base64').toString('utf8');
    const data = JSON.parse(decodedData);
    const { emailAddress, historyId } = data;

    if (!emailAddress) {
      return NextResponse.json({ error: 'No email address found' }, { status: 400 });
    }

    // Fetch the stored tokens for this user
    const tokenDoc = await adminDb.collection('google_tokens').doc(emailAddress).get();
    
    if (!tokenDoc.exists) {
      console.warn(`No token found for email: ${emailAddress}`);
      return NextResponse.json({ success: true }); // Return 200 so Pub/Sub doesn't retry
    }

    let { access_token, refresh_token } = tokenDoc.data()!;

    // In a production app, we would check if access_token is expired and refresh it using refresh_token here.
    // For simplicity, we assume access_token is valid.

    // 1. Fetch History to find new messages
    const historyRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const historyData = await historyRes.json();
    
    if (!historyRes.ok) {
      console.error('History API Error:', historyData);
      return NextResponse.json({ success: true }); // Acknowledge to prevent retries
    }

    // historyData.history contains arrays of messagesAdded
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

    if (newMessages.length === 0) {
      // Sometimes it's just a label change or send event. We can also just fetch the single latest message.
      // But let's fetch the actual new messages added.
    }

    // 2. Fetch the actual content of new messages
    for (const msgId of newMessages) {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const msgData = await msgRes.json();
      
      if (!msgRes.ok) continue;

      // Extract details
      const headers = msgData.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Konusuz';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Bilinmeyen';
      const to = headers.find((h: any) => h.name === 'To')?.value || emailAddress;

      // Extremely basic body extraction (assuming text/plain or snippet)
      let textBody = msgData.snippet || '';

      // Prepare Document
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

      // 3. Save to Firestore `inbox_messages`
      await adminDb.collection('inbox_messages').doc(msgData.id).set(inboxMessage, { merge: true });
      console.log(`Saved new message ${msgData.id} to Firestore!`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
