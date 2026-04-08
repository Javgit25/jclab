import React from 'react';
// Icons removed - using simple dot indicator

interface ConnectionStatusProps {
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      padding: '2px 6px',
      borderRadius: '6px',
      backgroundColor: isOnline ? 'rgba(22,163,106,0.15)' : 'rgba(220,38,38,0.15)',
    }}>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        backgroundColor: isOnline ? '#16a34a' : '#dc2626',
      }} />
      <span style={{
        fontSize: '9px',
        fontWeight: '600',
        color: isOnline ? '#16a34a' : '#dc2626'
      }}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};
export default ConnectionStatus;
