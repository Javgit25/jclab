import React from 'react';
import { ConfigurationPanel } from './ConfigurationPanel';

interface ConnectionStatusProps {
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline,
  backupStatus,
  syncQueueLength
}) => {
  return (
    <div className="flex items-center space-x-3">
      {/* Solo el botón de configuración */}
      <ConfigurationPanel />
    </div>
  );
};
export default ConnectionStatus;
