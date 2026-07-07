import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ blocked: false });

  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const xFrame = res.headers.get('x-frame-options');
    const csp = res.headers.get('content-security-policy');

    let blocked = false;
    if (xFrame && (xFrame.toUpperCase().includes('DENY') || xFrame.toUpperCase().includes('SAMEORIGIN'))) {
      blocked = true;
    }
    if (csp && csp.toLowerCase().includes('frame-ancestors')) {
      blocked = true;
    }

    return NextResponse.json({ blocked });
  } catch (error) {
    // If fetch fails completely
    return NextResponse.json({ blocked: true });
  }
}
