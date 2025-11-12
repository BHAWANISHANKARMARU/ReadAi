import moment from 'moment';
import { useState, useEffect } from 'react';
import Card from './Card';
import { User, Clock, FileText, Save, Trash2 } from 'lucide-react';
import TranscriptModal from './TranscriptModal';
import { useNotification } from '@/app/context/NotificationContext';
import ConfirmationDialog from './ConfirmationDialog';

interface TranscriptEntry {
  speaker?: string;
  utterance?: string;
  text?: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: number;
  transcript?: string | TranscriptEntry[];
  summary?: string;
  duration?: number;
  meetingUrl?: string;
  googleDocsUrl?: string | null;
  source?: 'calendar' | 'extension';
}

interface MeetingCardProps {
  meeting: Meeting;
  onSummaryUpdated: (meetingId: string, summary: string) => void;
  hideSummary?: boolean;
  onDelete: (meetingId: string) => void;
}

const formatDuration = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes % 60).padStart(2, '0');
  const formattedSeconds = String(seconds % 60).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};

interface SummaryProps {
  transcript: string | TranscriptEntry[];
  initialSummary?: string;
  onSummaryGenerated: (summary: string) => void;
  hideSummary?: boolean;
}

const Summary = ({ transcript, initialSummary, onSummaryGenerated, hideSummary }: SummaryProps) => {
  const [summary, setSummary] = useState(initialSummary || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    setSummary(initialSummary || '');
  }, [initialSummary]);

  const generateSummary = async () => {
    setIsGenerating(true);
    addNotification('Generating summary...', 'info');
    let currentTranscript = '';
    if (typeof transcript === 'string') {
      currentTranscript = transcript;
    } else if (Array.isArray(transcript)) {
      currentTranscript = transcript.map(t => {
        if (typeof t === 'string') return t;
        return `${t.speaker || ''}: ${t.utterance || t.text || ''}`;
      }).join('\n');
    }

    if (currentTranscript) {
      try {
        const res = await fetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcript: currentTranscript }),
        });

        if (res.ok) {
          const { summary } = await res.json();
          setSummary(summary);
          onSummaryGenerated(summary);
          addNotification('Summary generated! You can see it on the Summary page.', 'success');
        } else {
          throw new Error('Failed to generate summary');
        }
      } catch (error) {
        console.error('Error summarizing:', error);
        addNotification('Error generating summary.', 'error');
      }
    }
    setIsGenerating(false);
  };

  return (
    <div className="mt-4">
      {!summary && (
        <button
          onClick={generateSummary}
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating Summary...' : 'Generate Summary'}
        </button>
      )}
      {summary && !hideSummary && (
        <div>
          <h4 className="font-bold text-md mb-2 text-gray-800">Summary</h4>
          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200 whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
};

interface SaveButtonsProps {
  title: string;
  date: string;
  participants: number;
  transcript?: string | TranscriptEntry[];
  summary: string;
}

const SaveButtons = ({ title, date, participants, transcript, summary }: SaveButtonsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [googleDocsUrl, setGoogleDocsUrl] = useState('');
  const [notionUrl, setNotionUrl] = useState('');

  const saveToGoogleDoc = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/meetings/save-to-google-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          date,
          participants,
          transcript,
          summary,
        }),
      });

      if (res.ok) {
        const { googleDocsUrl } = await res.json();
        setGoogleDocsUrl(googleDocsUrl);
      } else {
        const errorData = await res.json();
        console.error('Failed to save to Google Docs:', errorData.message);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    }
    setIsSaving(false);
  };

  const saveToNotion = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/meetings/save-to-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          date,
          participants,
          transcript,
          summary,
        }),
      });

      if (res.ok) {
        const { notionUrl } = await res.json();
        setNotionUrl(notionUrl);
      } else {
        const errorData = await res.json();
        console.error('Failed to save to Notion:', errorData.message);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    }
    setIsSaving(false);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center space-x-4">
        {googleDocsUrl ? (
          <a
            href={googleDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm font-medium text-green-600 hover:text-green-800"
          >
            <Save className="w-4 h-4 mr-2" />
            View Google Doc
          </a>
        ) : (
          <button
            onClick={saveToGoogleDoc}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save to Google Docs'}
          </button>
        )}
        {notionUrl ? (
          <a
            href={notionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm font-medium text-green-600 hover:text-green-800"
          >
            <Save className="w-4 h-4 mr-2" />
            View in Notion
          </a>
        ) : (
          <button
            onClick={saveToNotion}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save to Notion'}
          </button>
        )}
      </div>

    </div>
  );
};

const MeetingCard = ({ meeting, onSummaryUpdated, hideSummary, onDelete }: MeetingCardProps) => {
  const { title, date, participants, transcript, summary, duration, meetingUrl, source } = meeting;
  const formattedDate = moment(date).format('MMMM Do YYYY, h:mm:ss a');
  const [showTranscript, setShowTranscript] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState(summary);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setGeneratedSummary(summary);
  }, [summary]);

  const handleSummaryGenerated = (newSummary: string) => {
    setGeneratedSummary(newSummary);
    onSummaryUpdated(meeting.id, newSummary);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(meeting.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <Card>
      <div>
        <div className="d-flex align-items-start justify-content-between mb-2">
          <div className="flex-grow-1">
            <h3 className="h5 fw-semibold mb-1 text-app">{title}</h3>
            <p className="small text-secondary mb-0">{formattedDate}</p>
          </div>
          <div className="d-flex align-items-center">
            <span
              className={`badge ${source === 'extension' ? 'text-bg-success' : 'text-bg-primary'}`}>
              {source === 'extension' ? 'Captured' : 'Calendar'}
            </span>
            <button onClick={handleDelete} className="btn btn-sm btn-ghost text-danger ms-2">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {duration && duration > 0 && (
          <div className="d-flex align-items-center text-secondary small mt-2">
            <Clock className="me-2" />
            <span>{formatDuration(duration)}</span>
          </div>
        )}

        {participants > 0 && (
          <div className="d-flex align-items-center text-secondary small mt-2">
            <User className="me-2" />
            <span>{participants} participant{participants !== 1 ? 's' : ''}</span>
          </div>
        )}

        {meetingUrl && (
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent small d-block mt-2">
            Join Meeting
          </a>
        )}

        {transcript && (
          <div className="mt-3">
            <button
              onClick={() => setShowTranscript(true)}
              className="btn btn-light btn-sm fw-semibold">
              <FileText className="me-2" />
              View Full Transcript
            </button>
          </div>
        )}

        {transcript && (
          <Summary
            transcript={transcript as string | TranscriptEntry[]}
            initialSummary={generatedSummary}
            onSummaryGenerated={handleSummaryGenerated}
            hideSummary={hideSummary}
          />
        )}

        {generatedSummary && !hideSummary && (
          <SaveButtons
            title={title}
            date={date}
            participants={participants}
            transcript={transcript}
            summary={generatedSummary}
          />
        )}

        {showTranscript && transcript && (
          <TranscriptModal transcript={transcript} onClose={() => setShowTranscript(false)} />
        )}
      </div>
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Meeting"
      >
        Are you sure you want to delete this meeting? This action cannot be undone.
      </ConfirmationDialog>
    </Card>
  );
};
export default MeetingCard;