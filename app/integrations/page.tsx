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

  useEffect(() => {
    const fetchIntegrations = async () => {
      const res = await fetch('/api/integrations');
      const data = await res.json();
      setIntegrations(data);
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

  return (
    <div className="flex-1 p-10">
      <Header title="Integrations" />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration: Integration) => (
          <IntegrationCard
            key={integration.id}
            id={integration.id}
            name={integration.name}
            icon={getIcon(integration.name)}
            connected={integration.connected}
            onConnectionChange={handleConnectionChange}
          />
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPage;
