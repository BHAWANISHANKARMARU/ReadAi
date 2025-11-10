'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import NoteCard from '@/components/NoteCard';
import { useSearch } from '@/app/context/SearchContext';

interface Note {
  id: string;
  title: string;
  summary?: string;
}

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchQuery } = useSearch();

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch local notes
        const [notesRes, gmailRes] = await Promise.all([
          fetch('/api/notes'),
          fetch('/api/gmail/reports'),
        ]);
        const notesData = notesRes.ok ? await notesRes.json() : [];
        const gmailData = gmailRes.ok ? await gmailRes.json() : [];
        // Map gmail subjects/snippets to quick notes
        const gmailNotes = (gmailData || []).map((g: any) => ({
          id: `gmail-${g.id}`,
          title: g.title,
          summary: g.snippet,
        }));
        setNotes([...notesData, ...gmailNotes]);
      } catch (err: any) {
        setError(err.message);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <Header title="Notes" />
      <div className="mt-3">
        {loading ? (
          <p>Loading notes...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="row g-3">
            {filteredNotes.map((note) => (
              <div key={note.id} className="col-12 col-md-6 col-lg-4">
                <NoteCard title={note.title} summary={note.summary} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
