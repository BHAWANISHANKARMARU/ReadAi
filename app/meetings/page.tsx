'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import MeetingCard from '@/components/MeetingCard';
import { useSearch } from '@/app/context/SearchContext';
import { useNotification } from '@/app/context/NotificationContext';
import { RotateCw } from 'lucide-react'; // Import RotateCw icon

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
  const { addNotification } = useNotification();

  const fetchMeetings = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleSummaryUpdated = async (meetingId: string, summary: string) => {
    const meetingToUpdate = meetings.find((m) => m.id === meetingId);
    if (!meetingToUpdate) return;

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: meetingId,
          summary,
          title: meetingToUpdate.title,
          meetingEndTimestamp: meetingToUpdate.date,
          transcript: meetingToUpdate.transcript,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save summary');
      }
    } catch (error) {
      console.error('Error saving summary:', error);
    }
  };

  const handleDelete = async (meetingId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMeetings(prevMeetings => prevMeetings.filter(m => m.id !== meetingId));
        addNotification('Meeting deleted successfully.', 'success');
      } else {
        throw new Error('Failed to delete meeting');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      addNotification('Error deleting meeting.', 'error');
    }
  };

  const filteredMeetings = meetings.filter((meeting) =>
    (meeting.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="mb-3">
        <Header title="Meetings" />
      </div>
      {/* New div for refresh button, aligned to the right, below the header */}
      <div className="flex justify-end mb-3">
        <button
          onClick={fetchMeetings}
          className="p-2 text-blue-500 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          disabled={loading}
        >
          {loading ? (
            <RotateCw className="animate-spin" size={20} />
          ) : (
            <RotateCw size={20} />
          )}
        </button>
      </div>
      <div className="mt-3">
        {loading && meetings.length === 0 ? (
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
                <MeetingCard
                  meeting={meeting}
                  onSummaryUpdated={handleSummaryUpdated}
                  hideSummary={true}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsPage;