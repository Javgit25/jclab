import { useState, useEffect, useCallback } from 'react';
import { SyncAction, DoctorInfo, BiopsyForm } from '../types';

export function useSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Detectar conectividad
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('✅ Conexión restaurada');
      if (syncQueue.length > 0) {
        processSyncQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('❌ Conexión perdida - trabajando offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueue]);

  // Cargar cola de sincronización del localStorage
  useEffect(() => {
    const savedQueue = localStorage.getItem('syncQueue');
    const savedBackupTime = localStorage.getItem('lastBackupTime');
    
    if (savedQueue) {
      setSyncQueue(JSON.parse(savedQueue));
    }
    
    if (savedBackupTime) {
      setLastBackupTime(savedBackupTime);
    }
  }, []);

  // Guardar cola de sincronización
  const saveSyncQueue = useCallback((queue: SyncAction[]) => {
    localStorage.setItem('syncQueue', JSON.stringify(queue));
    setSyncQueue(queue);
  }, []);

  // Simular envío a Google Sheets
  const sendToGoogleSheets = useCallback(async (data: any) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          console.log('📊 SIMULACIÓN: Datos que se enviarían a Google Sheets:', data);
          resolve({ success: true, id: Date.now() });
        } else {
          reject(new Error('Error simulado de conexión'));
        }
      }, 1000 + Math.random() * 2000);
    });
  }, []);

  // Procesar cola de sincronización
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || isSyncing || syncQueue.length === 0) {
      return;
    }

    setIsSyncing(true);
    setBackupStatus('syncing');
    console.log('🔄 Iniciando sincronización de', syncQueue.length, 'elementos');

    const successfulActions: string[] = [];
    const failedActions: SyncAction[] = [];

    for (const action of syncQueue) {
      try {
        console.log('📤 Sincronizando:', action.type, action.id);
        
        let dataToSend;
        switch (action.type) {
          case 'new_biopsy':
            dataToSend = {
              action: 'INSERT',
              data: action.biopsy,
              doctor: action.doctor,
              sheet: 'daily_biopsies'
            };
            break;
          case 'daily_report':
            dataToSend = {
              action: 'INSERT_BATCH',
              data: action.biopsies,
              doctor: action.doctor,
              sheet: 'daily_reports',
              date: action.date
            };
            break;
          default:
            throw new Error('Tipo de acción no reconocido');
        }

        await sendToGoogleSheets(dataToSend);
        successfulActions.push(action.id);
        console.log('✅ Sincronizado:', action.id);
        
      } catch (error) {
        console.error('❌ Error sincronizando:', action.id, (error as Error).message);
        failedActions.push(action);
      }
    }

    const remainingQueue = syncQueue.filter(action => !successfulActions.includes(action.id));
    saveSyncQueue(remainingQueue);

    setIsSyncing(false);
    
    if (failedActions.length === 0) {
      setBackupStatus('success');
      setLastBackupTime(new Date().toISOString());
      localStorage.setItem('lastBackupTime', new Date().toISOString());
      console.log('✅ Sincronización completa');
    } else {
      setBackupStatus('error');
      console.log('⚠️ Sincronización parcial:', failedActions.length, 'fallos');
    }

    setTimeout(() => {
      setBackupStatus('idle');
    }, 3000);
  }, [isOnline, isSyncing, syncQueue, saveSyncQueue, sendToGoogleSheets]);

  // Agregar acción a la cola de sincronización
  const addToSyncQueue = useCallback((action: Omit<SyncAction, 'id' | 'timestamp'>) => {
    const newAction: SyncAction = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...action
    };
    
    const updatedQueue = [...syncQueue, newAction];
    saveSyncQueue(updatedQueue);
    
    console.log('📝 Acción agregada a cola de sincronización:', action.type);
    
    if (isOnline) {
      processSyncQueue();
    }
  }, [syncQueue, saveSyncQueue, isOnline, processSyncQueue]);

  // Forzar sincronización manual
  const forceSyncNow = useCallback(() => {
    if (isOnline && syncQueue.length > 0) {
      processSyncQueue();
    }
  }, [isOnline, syncQueue, processSyncQueue]);

  return {
    isOnline,
    syncQueue,
    isSyncing,
    lastBackupTime,
    backupStatus,
    addToSyncQueue,
    forceSyncNow
  };
}