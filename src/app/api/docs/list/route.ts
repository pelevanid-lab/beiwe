import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // In Next.js App Router, you'd extract the token from headers:
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No Google access token provided.' }, { status: 401 });
    }

    // Google Drive API V3 Endpoint to list documents only
    const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document'&fields=files(id,name,modifiedTime,webViewLink,iconLink,owners)&orderBy=modifiedTime desc";

    const response = await fetch(GOOGLE_DRIVE_API, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error?.message || 'Failed to fetch from Google Drive' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, files: data.files });

  } catch (error: any) {
    console.error('Docs List API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
