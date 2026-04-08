import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline,
}) => {
  return (
    <div className="flex items-center space-x-3">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '8px',
        backgroundColor: isOnline ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${isOnline ? '#bbf7d0' : '#fecaca'}`,
      }}>
        {isOnline ? (
          <Wifi style={{ width: '14px', height: '14px', color: '#16a34a' }} />
        ) : (
          <WifiOff style={{ width: '14px', height: '14px', color: '#dc2626' }} />
        )}
        <span style={{
          fontSize: '11px',
          fontWeight: '600',
          color: isOnline ? '#16a34a' : '#dc2626'
        }}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
};
export default ConnectionStatus;
