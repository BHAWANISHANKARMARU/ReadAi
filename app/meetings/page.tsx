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
  transcripts?: any[];
  transcript?: string | any[];
  summary?: string;
  duration?: number;
  meetingUrl?: string;
  googleDocsUrl?: string | null;
  source?: 'calendar' | 'extension';
}

const MeetingsPage = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchQuery } = useSearch();

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      setError(null);
      try {
        const [calendarRes, extRes] = await Promise.all([
          fetch('/api/google/meet'),
          fetch('/api/meetings'),
        ]);

        const list: Meeting[] = [];

        if (calendarRes.ok) {
          const cal = await calendarRes.json();
          list.push(
            ...cal.map((event: any) => ({
              id: event.id,
              title: event.name,
              date: event.startTime,
              participants: event.attendees?.length || 0,
              meetingUrl: event.meetingUrl,
              source: 'calendar' as const,
            })),
          );
        }

        if (extRes.ok) {
          const ext = await extRes.json();
          list.push(
            ...ext.map((m: any) => ({
              id: m.id,
              title: m.title,
              date: m.meetingEndTimestamp || m.date,
              participants: 0,
              transcript: m.transcript,
              summary: m.summary,
              source: 'extension' as const,
            })),
          );
        }

        if (!calendarRes.ok && !extRes.ok) {
          const data = await calendarRes.json().catch(() => ({}));
          setError(data.message || 'Failed to fetch meetings');
          setMeetings([]);
          return;
        }

        // Sort latest first
        list.sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setMeetings(list);
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
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="text-center py-5">
            <p className="text-danger mb-2">{error}</p>
            <p className="small text-secondary">Please connect your Google account in the Integrations page</p>
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
