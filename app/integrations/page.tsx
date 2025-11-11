'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import IntegrationCard from '@/components/IntegrationCard';
import { Google, Zoom, Outlook } from '@/components/icons';

interface Integration {
  id: number;
  name: string;
  connected: boolean;
}

const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/integrations', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Failed to load integrations');
        }
        const data = await res.json();
        setIntegrations(data);
      } catch (err) {
        console.error('Error fetching integrations:', err);
        setError('Unable to load integrations right now. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchIntegrations();
  }, []);

  const handleConnectionChange = (id: number, connected: boolean) => {
    setIntegrations((prev) =>
      prev.map((integration: Integration) =>
        integration.id === id ? { ...integration, connected } : integration
      )
    );
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Google':
        return <Google />;
      case 'Zoom':
        return <Zoom />;
      case 'Outlook':
        return <Outlook />;
      default:
        return null;
    }
  };

  const googleIntegration = integrations.find((integration) => integration.name === 'Google');

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <Header title="Integrations" />
      <div className="mt-3">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && googleIntegration && !googleIntegration.connected && (
          <div className="alert alert-warning" role="alert">
            Connect your Google account to sync meetings, notes, and reports automatically.
          </div>
        )}

        {loading ? (
          <div className="text-secondary">Loading integrations…</div>
        ) : (
          <div className="row g-3">
            {integrations.map((integration: Integration) => (
              <div key={integration.id} className="col-12 col-md-6 col-lg-4">
                <IntegrationCard
                  id={integration.id}
                  name={integration.name}
                  icon={getIcon(integration.name)}
                  connected={integration.connected}
                  onConnectionChange={handleConnectionChange}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPage;
