import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo');

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Missing Google Client ID" }, { status: 500 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;
  
  const ALL_SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/contacts.readonly'
  ].join(' ');

  const stateObj = { service: 'all', returnTo: returnTo || '' };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(ALL_SCOPES)}&access_type=offline&prompt=consent&state=${state}&include_granted_scopes=true`;

  return NextResponse.redirect(authUrl);
}
