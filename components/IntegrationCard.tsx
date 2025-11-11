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
    if (loading) return;
    setLoading(true);

    if (name === 'Google' && !connected) {
      window.location.href = '/api/auth/google';
      return;
    }

    try {
      const res = await fetch(`/api/integrations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connected: !connected }),
      });

      if (res.status === 401) {
        alert('Please connect your Google account first.');
        return;
      }

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to update integration.');
      }

      const data = await res.json();
      onConnectionChange(id, data.connected);
    } catch (error) {
      console.error('Error updating integration:', error);
      alert('Something went wrong while updating this integration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          {icon}
          <h3 className="h5 m-0">{name}</h3>
        </div>
        <button
          className={`btn ${connected ? 'btn-outline-danger' : 'btn-primary'}`}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? 'Please wait…' : connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </Card>
  );
};

export default IntegrationCard;
