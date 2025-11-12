'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MeetingCard from '@/components/MeetingCard';
import { useSearch } from '@/app/context/SearchContext';
import { useNotification } from '@/app/context/NotificationContext';

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

const SummaryPage = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchQuery } = useSearch();
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/meetings');
        if (res.ok) {
          const allMeetings = await res.json();
          const meetingsWithSummaries = allMeetings.filter((m: Meeting) => m.summary);
          setMeetings(meetingsWithSummaries);
        } else {
          setError('Failed to fetch meetings');
        }
      } catch (err) {
        setError('Failed to fetch meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const handleSummaryUpdated = (meetingId: string, summary: string) => {
    setMeetings((prevMeetings) =>
      prevMeetings.map((m) =>
        m.id === meetingId ? { ...m, summary } : m
      )
    );
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
      <Header title="Summaries" />
      <div className="mt-3">
        {loading ? (
          <div className="text-center py-5">
            <p className="text-secondary">Loading summaries...</p>
          </div>
        ) : error ? (
          <div className="d-flex justify-content-center py-4">
            <div className="alert alert-warning text-start" role="alert">
              {error}
            </div>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="d-flex justify-content-center py-4">
            <div className="alert alert-info mb-0" role="alert">
              No summaries found. Generate a summary for a meeting to see it here.
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {filteredMeetings.map((meeting) => (
              <div key={meeting.id} className="col-12">
                <MeetingCard
                  meeting={meeting}
                  onSummaryUpdated={handleSummaryUpdated}
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

export default SummaryPage;
