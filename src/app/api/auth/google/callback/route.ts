import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/tr/app/integrations/google?error=${error}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/tr/app/integrations/google?error=no_code', req.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Redirect URI must exactly match what is configured in Google Cloud Console
    // Since we're usually running locally on 3000:
    const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Google Client ID or Secret in environment variables");
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Token Exchange Error:', data);
      throw new Error(data.error_description || data.error || 'Failed to exchange token');
    }

    // data contains access_token, refresh_token (if first time or prompt=consent), expires_in
    // We redirect back to the frontend with the tokens in the URL fragment or query so the client can save them.
    // Use query params for simplicity. The frontend will grab them and strip them from the URL immediately.
    
    // FETCH USER INFO TO SAVE TO FIRESTORE
    if (data.access_token) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        });
        const userInfo = await userInfoRes.json();
        if (userInfo.email) {
          await adminDb.collection('google_tokens').doc(userInfo.email).set({
            access_token: data.access_token,
            refresh_token: data.refresh_token || null,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (err) {
        console.error('Failed to save token to Firestore:', err);
      }
    }

    const params = new URLSearchParams();
    if (data.access_token) params.set('access_token', data.access_token);
    if (data.refresh_token) params.set('refresh_token', data.refresh_token);
    if (data.expires_in) params.set('expires_in', data.expires_in);
    
    const state = searchParams.get('state');
    if (state) params.set('service', state);

    return NextResponse.redirect(new URL(`/tr/app/integrations/google?${params.toString()}`, req.url));

  } catch (err: any) {
    console.error('Callback handling error:', err);
    return NextResponse.redirect(new URL(`/tr/app/integrations/google?error=${encodeURIComponent(err.message)}`, req.url));
  }
}
