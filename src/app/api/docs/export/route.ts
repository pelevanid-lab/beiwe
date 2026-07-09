import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No Google access token provided.' }, { status: 401 });
    }

    // Export as HTML
    const GOOGLE_DRIVE_EXPORT_API = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/html`;

    const response = await fetch(GOOGLE_DRIVE_EXPORT_API, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Failed to export from Google Drive: ${errorText}` }, { status: response.status });
    }

    const htmlContent = await response.text();
    return NextResponse.json({ success: true, html: htmlContent });

  } catch (error: any) {
    console.error('Docs Export API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
