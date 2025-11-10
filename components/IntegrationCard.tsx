import { ReactNode, useState } from 'react';
import Card from './Card';

interface IntegrationCardProps {
  id: number;
  name: string;
  icon: ReactNode;
  connected: boolean;
  onConnectionChange: (id: number, connected: boolean) => void;
}

const IntegrationCard = ({
  id,
  name,
  icon,
  connected,
  onConnectionChange,
}: IntegrationCardProps) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    if (name === 'Google' && !connected) {
      window.location.href = '/api/auth/google';
      return;
    }

    const res = await fetch(`/api/integrations/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connected: !connected }),
      }
    );
    const data = await res.json();
    onConnectionChange(id, data.connected);
    setLoading(false);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon}
          <h3 className="text-xl font-bold ml-4">{name}</h3>
        </div>
        <button
          className={`px-4 py-2 rounded-lg text-white ${
            connected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? 'Loading...' : connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </Card>
  );
};

export default IntegrationCard;
