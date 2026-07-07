import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No Google access token provided.' }, { status: 401 });
    }

    // Google Calendar API V3 Endpoint - fetch upcoming events
    const timeMin = new Date().toISOString();
    const GOOGLE_CALENDAR_API = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime&maxResults=50`;

    const response = await fetch(GOOGLE_CALENDAR_API, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error?.message || 'Failed to fetch from Google Calendar' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, events: data.items });

  } catch (error: any) {
    console.error('Calendar Sync API GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, appointment } = body;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No Google access token provided.' }, { status: 401 });
    }

    // Google Calendar API V3 Endpoint
    let GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    if (appointment.createMeet) {
      GOOGLE_CALENDAR_API += '?conferenceDataVersion=1';
    }

    // Format Beiwe appointment to Google Calendar Event format
    const eventTitle = appointment.customer && appointment.customer !== 'Bilinmeyen Müşteri' 
      ? `${appointment.customer} - ${appointment.title}`
      : appointment.title || 'Beiwe Randevusu';

    const event = {
      summary: eventTitle,
      description: `Beiwe Asistanı üzerinden planlandı.\n\nMüşteri: ${appointment.customer || 'Bilinmeyen Müşteri'}\nKonu: ${appointment.title}`,
      start: {
        dateTime: appointment.start, // ISO string (e.g. '2026-07-10T10:00:00Z')
        timeZone: appointment.timeZone || 'Europe/Istanbul',
      },
      end: {
        dateTime: appointment.end, // ISO string
        timeZone: appointment.timeZone || 'Europe/Istanbul',
      },
      ...(appointment.createMeet && {
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      })
    };

    const response = await fetch(GOOGLE_CALENDAR_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error?.message || 'Failed to sync with Google Calendar' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      googleEventId: data.id,
      hangoutLink: data.hangoutLink 
    });

  } catch (error: any) {
    console.error('Calendar Sync API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { token, title, start } = body;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No Google access token provided.' }, { status: 401 });
    }

    // 1. Fetch upcoming events around the start time
    const timeMin = new Date(new Date(start).getTime() - 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000).toISOString();
    const GOOGLE_CALENDAR_API = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;

    const response = await fetch(GOOGLE_CALENDAR_API, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch events for deletion' }, { status: response.status });
    }

    const data = await response.json();
    
    // 2. Find the event
    const eventToDelete = data.items?.find((e: any) => 
      e.summary === title && new Date(e.start?.dateTime).getTime() === new Date(start).getTime()
    );

    if (eventToDelete) {
      // 3. Delete the event
      const deleteRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (deleteRes.ok) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: 'Failed to delete event' }, { status: deleteRes.status });
      }
    }

    return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });

  } catch (error: any) {
    console.error('Calendar Sync API DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
