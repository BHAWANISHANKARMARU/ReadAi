
'use client';

interface TranscriptEntry {
  speaker?: string;
  utterance?: string;
  text?: string;
}

interface TranscriptModalProps {
  transcript: string | TranscriptEntry[];
  onClose: () => void;
}

const TranscriptModal = ({ transcript, onClose }: TranscriptModalProps) => {
  const formatTranscript = (data: string | TranscriptEntry[]) => {
    if (Array.isArray(data)) {
      return data.map((entry, index) => {
        if (typeof entry === 'string') {
          return <p key={index} className="mb-1">{entry}</p>;
        }
        const speaker = entry.speaker || 'Unknown';
        const text = entry.utterance || entry.text || '';
        return (
          <p key={index} className="mb-1">
            <span className="font-semibold">{speaker}:</span> {text}
          </p>
        );
      });
    }
    return <p className="whitespace-pre-wrap">{data}</p>;
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050 }}
    >
      <div className="card card-app p-4 w-100" style={{ maxWidth: 800, maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 m-0">Full Transcript</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn btn-sm btn-outline-secondary"
            type="button"
          >
            ×
          </button>
        </div>
        <div className="small">
          {formatTranscript(transcript)}
        </div>
      </div>
    </div>
  );
};

export default TranscriptModal;
