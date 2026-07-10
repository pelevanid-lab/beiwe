import { NextRequest, NextResponse } from 'next/server';

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

    // FIRE-AND-FORGET: Save to Firestore in background. Dynamic import ensures
    // any Firebase init failure NEVER crashes the redirect.
    if (data.access_token) {
      saveTokenToFirestore(data.access_token, data.refresh_token).catch((err) => {
        console.error('Background Firestore save failed (non-critical):', err?.message);
      });
    }

    const params = new URLSearchParams();
    if (data.access_token) params.set('access_token', data.access_token);
    if (data.refresh_token) params.set('refresh_token', data.refresh_token);
    if (data.expires_in) params.set('expires_in', data.expires_in);

    const state = searchParams.get('state');
    if (state) {
      try {
        const stateStr = Buffer.from(state, 'base64').toString('utf-8');
        const stateObj = JSON.parse(stateStr);
        if (stateObj.service) params.set('service', stateObj.service);
        if (stateObj.returnTo) params.set('returnTo', stateObj.returnTo);
      } catch (e) {
        // legacy string state
        params.set('service', state);
      }
    }

    return NextResponse.redirect(new URL(`/tr/app/integrations/google?${params.toString()}`, req.url));

  } catch (err: any) {
    console.error('Callback handling error:', err);
    return NextResponse.redirect(new URL(`/tr/app/integrations/google?error=${encodeURIComponent(err.message)}`, req.url));
  }
}

// Completely isolated — any error here is logged but NEVER surfaces to the user
async function saveTokenToFirestore(accessToken: string, refreshToken?: string) {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const adminDb = getAdminDb();

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const userInfo = await userInfoRes.json();

    if (userInfo.email) {
      await adminDb.collection('google_tokens').doc(userInfo.email).set({
        access_token: accessToken,
        refresh_token: refreshToken || null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`Token saved to Firestore for: ${userInfo.email}`);
    }
  } catch (err: any) {
    console.error('saveTokenToFirestore error:', err?.message);
  }
}
