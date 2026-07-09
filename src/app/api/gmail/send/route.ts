import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    const accessToken = authHeader.split(' ')[1];

    const body = await request.json();
    const { to, subject, text, threadId } = body;

    if (!to || !text) {
      return NextResponse.json({ error: 'Missing "to" or "text" fields' }, { status: 400 });
    }

    // Prepare raw email using standard RFC 2822 formatting
    // Ensure properly formatted headers
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject ? `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=` : ''}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      '',
      text,
    ];
    
    const email = emailLines.join('\r\n');
    
    // Base64url encode the email
    const base64EncodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Call Gmail API
    const gmailApiUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
    
    const sendRes = await fetch(gmailApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64EncodedEmail,
        ...(threadId && { threadId })
      }),
    });

    const sendData = await sendRes.json();

    if (!sendRes.ok) {
      console.error('Gmail send error:', sendData);
      return NextResponse.json({ error: sendData.error?.message || 'Failed to send email' }, { status: sendRes.status });
    }

    // Fetch user email for Firestore record
    let emailAddress = 'me';
    try {
      const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        emailAddress = profileData.emailAddress;
      }
    } catch(e) {}

    // Save this sent message to Firestore immediately
    try {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      const adminDb = getAdminDb();
      
      const inboxMessage = {
        id: sendData.id,
        threadId: sendData.threadId,
        sender: emailAddress,
        to: to,
        platform: 'gmail',
        preview: (subject || 'Konusuz') + ' - ' + text,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        unread: false,
        folder: 'sent',
        ownerEmail: emailAddress,
        history: [
          { 
            sender: 'me', 
            text: (subject ? `<${subject}> \n\n` : '') + text, 
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
          }
        ]
      };

      await adminDb.collection('inbox_messages').doc(sendData.id).set(inboxMessage, { merge: true });
    } catch(e) {
      console.error('Failed to save sent message to Firestore:', e);
    }

    return NextResponse.json({ success: true, messageId: sendData.id, threadId: sendData.threadId });

  } catch (error: any) {
    console.error('Send Email API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
