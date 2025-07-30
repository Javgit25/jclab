import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RotateCw } from 'lucide-react';

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
    <div className="flex items-center space-x-2">
      {isOnline ? (
        <div className="flex items-center space-x-1 text-green-600">
          <Wifi size={16} />
          <span className="text-xs">Online</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-red-600">
          <WifiOff size={16} />
          <span className="text-xs">Offline</span>
        </div>
      )}
      
      <div className="flex items-center space-x-1">
        {backupStatus === 'syncing' && (
          <div className="text-blue-600 animate-spin">
            <RotateCw size={16} />
          </div>
        )}
        {backupStatus === 'success' && (
          <Cloud className="text-green-600" size={16} />
        )}
        {backupStatus === 'error' && (
          <CloudOff className="text-red-600\" size={16} />
        )}
        {syncQueueLength > 0 && (
          <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
            {syncQueueLength} pendiente{syncQueueLength !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};
export default ConnectionStatus;
