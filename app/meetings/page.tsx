'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MeetingCard from '@/components/MeetingCard';
import { useSearch } from '@/app/context/SearchContext';

interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: number;
  transcript?: string;
  summary?: string;
  duration?: number;
  meetingUrl?: string;
  googleDocsUrl?: string | null;
  source?: 'calendar' | 'extension';
}

// Re-using the Integration interface defined earlier
interface Integration {
  name: string;
  userId?: string | null; // Make userId optional
  connected: boolean;
  // tokens?: Credentials; // No need for Credentials here as it's not directly used
}

interface Attendee {
  email: string;
  responseStatus: string;
}

const MeetingsPage = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const { searchQuery } = useSearch();

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      setError(null);
      setInfoMessage(null);
      try {
        // Check integration status first (only gates calendar fetch, not extension)
        const integRes = await fetch('/api/integrations');
        const integrations: Integration[] = integRes.ok ? await integRes.json() : [];
        const googleConnected = Array.isArray(integrations)
          ? !!integrations.find((i: Integration) => i.name === 'Google' && i.connected)
          : false;

        console.log('Google Connected Status:', googleConnected);

        if (!googleConnected) {
          setMeetings([]);
          setError('Google integration is disconnected. Connect it in Integrations.');
          setLoading(false);
          return;
        }

        const list: Meeting[] = [];

        const [calendarRes, extRes] = await Promise.all([
          fetch('/api/google/meet'),
          fetch('/api/meetings'),
        ]);

        console.log('Calendar API Response:', calendarRes);
        console.log('Extension API Response:', extRes);

        if (calendarRes.ok) {
          const cal = await calendarRes.json();
          console.log('Calendar Data:', cal);
          list.push(
            ...cal.map((event: { id: string; summary?: string; startTime: string; attendees: Attendee[]; meetingUrl: string; }) => ({
              id: event.id,
              title: event.summary || 'Untitled Meeting',
              date: event.startTime,
              participants: event.attendees?.length || 0,
              meetingUrl: event.meetingUrl,
              source: 'calendar' as const,
            })),
          );
        } else {
          console.error('Calendar API Error:', await calendarRes.text());
        }

        if (extRes.ok) {
          const ext = await extRes.json();
          console.log('Extension Data:', ext);
          list.push(
            ...ext.map((m: { id: string; title?: string; meetingEndTimestamp: string; date: string; transcript: string; summary: string; }) => ({
              id: m.id,
              title: m.title || 'Meeting transcript',
              date: m.meetingEndTimestamp || m.date,
              participants: 0,
              transcript: m.transcript,
              summary: m.summary,
              source: 'extension' as const,
            })),
          );
        } else {
          console.error('Extension API Error:', await extRes.text());
        }

        if (!calendarRes.ok && !extRes.ok) {
          setError('Failed to fetch meetings');
          setMeetings([]);
          return;
        }

        // Sort latest first
        list.sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setMeetings(list);
        if (list.length === 0) {
          setInfoMessage('No meetings yet. Start a new Google Meet to see it here.');
        }
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setError('Failed to fetch meetings');
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
    // Poll periodically to pick up transcripts as the extension posts them
    const interval = setInterval(fetchMeetings, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredMeetings = meetings.filter((meeting) =>
    (meeting.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <Header title="Meetings" />
      <div className="mt-3">
        {loading ? (
          <div className="text-center py-5">
            <p className="text-secondary">Loading meetings...</p>
          </div>
        ) : error ? (
          <div className="d-flex justify-content-center py-4">
            <div className="alert alert-warning text-start" role="alert">
              {error}
            </div>
          </div>
        ) : infoMessage ? (
          <div className="d-flex justify-content-center py-4">
            <div className="alert alert-info mb-0" role="alert">
              {infoMessage}
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {filteredMeetings.map((meeting) => (
              <div key={meeting.id} className="col-12 col-md-6 col-lg-4">
                <MeetingCard meeting={meeting} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsPage;
