import Card from './Card';
import { File } from './icons';

interface NoteCardProps {
  title: string;
  summary?: string;
}

const NoteCard = ({ title, summary = 'No summary available' }: NoteCardProps) => {
  return (
    <Card>
      <h3 className="h5 fw-bold mb-2">{title}</h3>
      <p className="small d-flex align-items-center text-secondary">
        <File className="me-2" />
        {summary}
      </p>
    </Card>
  );
};

export default NoteCard;
