import React from 'react';
import { Cloud, RotateCw, AlertCircle } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';

interface SyncPanelProps {
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
  lastBackupTime: string | null;
  isSyncing: boolean;
  onForceSyncNow: () => void;
}

export const SyncPanel: React.FC<SyncPanelProps> = ({
  isOnline,
  backupStatus,
  syncQueueLength,
  lastBackupTime,
  isSyncing,
  onForceSyncNow
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Estado de Sincronización</h3>
          <div className="flex items-center space-x-4 mt-1">
            <ConnectionStatus 
              isOnline={isOnline}
              backupStatus={backupStatus}
              syncQueueLength={syncQueueLength}
            />
            {lastBackupTime && (
              <span className="text-xs text-gray-500">
                Último backup: {new Date(lastBackupTime).toLocaleString('es-AR')}
              </span>
            )}
          </div>
        </div>
        
        {isOnline && syncQueueLength > 0 && (
          <button
            onClick={onForceSyncNow}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs px-3 py-2 rounded-lg flex items-center space-x-1"
          >
            {isSyncing ? (
              <RotateCw className="animate-spin\" size={14} />
            ) : (
              <Cloud size={14} />
            )}
            <span>Sincronizar ahora</span>
          </button>
        )}
      </div>
      
      {!isOnline && syncQueueLength > 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-yellow-600" size={16} />
            <span className="text-sm text-yellow-800">
              Trabajando offline. Los datos se sincronizarán cuando vuelva la conexión.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};