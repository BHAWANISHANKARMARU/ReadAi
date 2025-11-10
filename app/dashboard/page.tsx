'use client';
import Header from '@/components/Header';
import Card from '@/components/Card';
import { useEffect, useState } from 'react';

const DashboardPage = () => {
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setError(null);
      try {
        const [calRes, meetRes, mailRes] = await Promise.all([
          fetch('/api/google/calendar/events'),
          fetch('/api/google/meet'),
          fetch('/api/gmail/reports'),
        ]);
        if (calRes.ok) setCalendarEvents(await calRes.json());
        if (meetRes.ok) setMeetings(await meetRes.json());
        if (mailRes.ok) setEmails(await mailRes.json());
        if (!calRes.ok && !meetRes.ok && !mailRes.ok) {
          setError('Please connect your Google account in Integrations.');
        }
      } catch {
        setError('Failed to load Google data.');
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="flex-1 p-4">
      <Header title="Dashboard" />
      <div className="mt-3">
        {error && <div className="alert alert-warning">{error}</div>}
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <Card>
              <h5 className="mb-1">Upcoming Calendar Events</h5>
              <p className="text-secondary small mb-3">Next 7 shown</p>
              <ul className="list-unstyled m-0">
                {calendarEvents.slice(0, 7).map((e: any) => (
                  <li key={e.id || e.start?.dateTime} className="mb-2">
                    <span className="fw-semibold">{e.summary || e.name || 'Event'}</span>
                    <div className="small text-secondary">
                      {new Date(e.start?.dateTime || e.start?.date || Date.now()).toLocaleString()}
                    </div>
                  </li>
                ))}
                {calendarEvents.length === 0 && <li className="small text-secondary">No events found.</li>}
              </ul>
            </Card>
          </div>
          <div className="col-12 col-md-4">
            <Card>
              <h5 className="mb-1">Recent Google Meet meetings</h5>
              <p className="text-secondary small mb-3">{meetings.length} found</p>
              <ul className="list-unstyled m-0">
                {meetings.slice(0, 7).map((m: any) => (
                  <li key={m.id} className="mb-2">
                    <span className="fw-semibold">{m.name}</span>
                    <div className="small text-secondary">{new Date(m.startTime).toLocaleString()}</div>
                  </li>
                ))}
                {meetings.length === 0 && <li className="small text-secondary">No meetings found.</li>}
              </ul>
            </Card>
          </div>
          <div className="col-12 col-md-4">
            <Card>
              <h5 className="mb-1">Latest Gmail items</h5>
              <p className="text-secondary small mb-3">{emails.length} fetched</p>
              <ul className="list-unstyled m-0">
                {emails.slice(0, 7).map((r: any) => (
                  <li key={r.id} className="mb-2">
                    <span className="fw-semibold">{r.title}</span>
                    <div className="small text-secondary">{new Date(r.date).toLocaleString()}</div>
                  </li>
                ))}
                {emails.length === 0 && <li className="small text-secondary">No emails found.</li>}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
