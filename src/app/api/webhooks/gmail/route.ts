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

    let { access_token, lastHistoryId, refresh_token } = tokenDoc.data()!;

    // Test token and refresh if expired (401)
    let isTokenValid = false;
    let testRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/profile`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (testRes.status === 401 && refresh_token) {
      // Refresh token
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        access_token = refreshData.access_token;
        await adminDb.collection('google_tokens').doc(emailAddress).set({ 
          access_token: access_token, 
          updatedAt: new Date().toISOString() 
        }, { merge: true });
        await adminDb.collection('webhook_logs').add({ info: 'Token refreshed successfully in webhook', emailAddress });
      } else {
        await adminDb.collection('webhook_logs').add({ error: 'Token refresh failed in webhook', emailAddress });
      }
    }

    // Save the NEW historyId as the baseline for the NEXT webhook
    await adminDb.collection('google_tokens').doc(emailAddress).set({ lastHistoryId: historyId }, { merge: true });

    let newMessages: string[] = [];

    if (lastHistoryId) {
      // 1. Fetch History using the PREVIOUS historyId
      const historyRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${lastHistoryId}`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (historyData.history) {
          historyData.history.forEach((hist: any) => {
            if (hist.messagesAdded) {
              hist.messagesAdded.forEach((msgInfo: any) => {
                newMessages.push(msgInfo.message.id);
              });
            }
          });
        }
      } else {
        // History ID might be expired (404), fallback to fetching latest messages
        const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=3`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          newMessages = (listData.messages || []).map((m: any) => m.id);
        }
      }
    } else {
      // First webhook ever, no previous historyId, fallback to latest messages
      const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=3`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        newMessages = (listData.messages || []).map((m: any) => m.id);
      }
    }

    // Deduplicate in case history returned duplicates
    newMessages = Array.from(new Set(newMessages));

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

      const headers = msgData.payload?.headers || [];
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
        unread: msgData.labelIds?.includes('UNREAD') || false,
        folder: msgData.labelIds?.includes('SENT') ? 'sent' : 'inbox',
        ownerEmail: emailAddress,
        history: [
          { 
            sender: msgData.labelIds?.includes('SENT') ? 'me' : 'them', 
            text: subject + '\n\n' + textBody, 
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
          }
        ]
      };

      await adminDb.collection('inbox_messages').doc(msgData.id).set(inboxMessage, { merge: true });
      await adminDb.collection('webhook_logs').add({ info: 'Successfully saved message', msgId });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    try {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      const adminDb = getAdminDb();
      await adminDb.collection('webhook_logs').add({ 
        timestamp: new Date().toISOString(),
        critical_error: error.message || 'Unknown error',
        stack: error.stack
      });
    } catch (e) {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
