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
      `Subject: ${subject || ''}`,
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

    // At this point we could optionally save this sent message to Firestore
    // For now we rely on Gmail placing it in the Sent folder and Webhook pulling it if configured.

    return NextResponse.json({ success: true, messageId: sendData.id, threadId: sendData.threadId });

  } catch (error: any) {
    console.error('Send Email API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
