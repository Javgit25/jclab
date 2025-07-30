// BiopsyTracker v2.0 - Optimizado para Tablet - Deployed 2025-07-29
import React, { useState, useEffect, useCallback } from 'react';
import { DoctorInfo, BiopsyForm } from './types';
import { LoginScreen } from './components/LoginScreen';
import { MainScreen } from './components/MainScreen';
import { NewBiopsyScreen } from './components/NewBiopsyScreen';
import { TodayListScreen } from './components/TodayListScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { AdminPanel } from './components/AdminPanel';

// Tipos locales para la app
interface HistoryEntry {
  id: string;
  date: string;
  timestamp: string;
  biopsies: BiopsyForm[];
  doctorInfo: DoctorInfo;
}

interface SyncAction {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  [key: string]: any; // Permitir cualquier propiedad adicional
}

type ScreenType = 'login' | 'main' | 'newBiopsy' | 'todayList' | 'history' | 'admin';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [todayBiopsies, setTodayBiopsies] = useState<BiopsyForm[]>([]);
  const [frequentTissues, setFrequentTissues] = useState<string[]>([]);
  const [historyData, setHistoryData] = useState<Record<string, HistoryEntry>>({});
  
  // Estado de conectividad y sincronización
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>([]);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cargar datos guardados al iniciar
  useEffect(() => {
    console.log('App - Cargando datos iniciales');
    loadSavedData();
  }, []);

  // Cargar historial cuando cambie doctorInfo
  useEffect(() => {
    if (doctorInfo) {
      console.log('App - Doctor logueado, cargando historial:', doctorInfo);
      loadHistoryData();
    }
  }, [doctorInfo]);

  // Función para generar clave única basada en EMAIL
  const generateDoctorKey = useCallback((email: string) => {
    // Normalizar email: minúsculas y sin espacios
    const normalizedEmail = email.toLowerCase().trim().replace(/\s+/g, '');
    return `doctor_${normalizedEmail}`;
  }, []);

  // Función para cargar datos guardados
  const loadSavedData = useCallback(() => {
    try {
      // Cargar información del doctor
      const savedDoctorInfo = localStorage.getItem('currentDoctorInfo');
      if (savedDoctorInfo) {
        const parsedDoctorInfo = JSON.parse(savedDoctorInfo);
        console.log('App - Doctor info cargada:', parsedDoctorInfo);
        
        // Verificar que tenga email
        if (parsedDoctorInfo.email) {
          setDoctorInfo(parsedDoctorInfo);
          setCurrentScreen('main');
        } else {
          console.log('App - Doctor guardado sin email, requiere nuevo login');
          localStorage.removeItem('currentDoctorInfo');
        }
      }

      // Cargar biopsias del día actual (solo si hay doctor con email)
      if (savedDoctorInfo) {
        const parsedDoctorInfo = JSON.parse(savedDoctorInfo);
        if (parsedDoctorInfo.email) {
          const today = new Date().toDateString();
          const doctorKey = generateDoctorKey(parsedDoctorInfo.email);
          const todayKey = `${doctorKey}_today_${today}`;
          
          const savedTodayBiopsies = localStorage.getItem(todayKey);
          if (savedTodayBiopsies) {
            const parsedBiopsies = JSON.parse(savedTodayBiopsies);
            console.log('App - Biopsias del día cargadas:', parsedBiopsies.length);
            setTodayBiopsies(parsedBiopsies);
          }
        }
      }

      // Cargar tejidos frecuentes
      const savedFrequentTissues = localStorage.getItem('frequentTissues');
      if (savedFrequentTissues) {
        const parsedTissues = JSON.parse(savedFrequentTissues);
        setFrequentTissues(parsedTissues);
      }

      // Cargar cola de sincronización
      const savedSyncQueue = localStorage.getItem('syncQueue');
      if (savedSyncQueue) {
        const parsedQueue = JSON.parse(savedSyncQueue);
        setSyncQueue(parsedQueue);
      }
    } catch (error) {
      console.error('App - Error cargando datos:', error);
    }
  }, [generateDoctorKey]);

  // Función para cargar historial
  const loadHistoryData = useCallback(() => {
    if (!doctorInfo || !doctorInfo.email) {
      console.log('App - loadHistoryData: No hay doctorInfo con email disponible');
      return;
    }

    const doctorKey = generateDoctorKey(doctorInfo.email);
    const historyKey = `${doctorKey}_history`;
    console.log('App - loadHistoryData: Cargando historial con key:', historyKey);
    
    try {
      const savedHistory = localStorage.getItem(historyKey);
      console.log('App - loadHistoryData: Datos raw del localStorage:', savedHistory);
      
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        console.log('App - loadHistoryData: Historial parseado:', parsedHistory);
        console.log('App - loadHistoryData: Cantidad de entradas:', Object.keys(parsedHistory).length);
        setHistoryData(parsedHistory);
      } else {
        console.log('App - loadHistoryData: No hay historial guardado, inicializando vacío');
        setHistoryData({});
      }
    } catch (error) {
      console.error('App - loadHistoryData: Error al cargar historial:', error);
      setHistoryData({});
    }
  }, [doctorInfo, generateDoctorKey]);

  // Función para guardar datos automáticamente
  const saveData = useCallback(() => {
    try {
      if (doctorInfo && doctorInfo.email) {
        // Guardar información del doctor
        localStorage.setItem('currentDoctorInfo', JSON.stringify(doctorInfo));

        // Guardar biopsias del día
        const today = new Date().toDateString();
        const doctorKey = generateDoctorKey(doctorInfo.email);
        const todayKey = `${doctorKey}_today_${today}`;
        localStorage.setItem(todayKey, JSON.stringify(todayBiopsies));
      }

      // Guardar tejidos frecuentes
      localStorage.setItem('frequentTissues', JSON.stringify(frequentTissues));

      // Guardar cola de sincronización
      localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
    } catch (error) {
      console.error('App - Error guardando datos:', error);
    }
  }, [doctorInfo, todayBiopsies, frequentTissues, syncQueue, generateDoctorKey]);

  // Auto-guardar datos cuando cambien
  useEffect(() => {
    saveData();
  }, [saveData]);

  // Función para agregar a cola de sincronización
  const addToSyncQueue = useCallback((action: Partial<SyncAction>) => {
    const newAction: SyncAction = {
      type: action.type || 'sync',
      data: action.data || {},
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...action
    };

    setSyncQueue(prev => [...prev, newAction]);

    // Intentar sincronizar si hay conexión
    if (isOnline) {
      syncData([newAction]);
    }
  }, [isOnline]);

  // Función para sincronizar datos
  const syncData = useCallback(async (actions: SyncAction[]) => {
    if (!isOnline || actions.length === 0) return;

    setBackupStatus('syncing');

    try {
      // Simular sincronización con servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En una aplicación real, aquí enviarías los datos al servidor
      console.log('App - Sincronizando acciones:', actions);

      // Remover acciones sincronizadas de la cola
      setSyncQueue(prev => prev.filter(item => !actions.some(action => action.id === item.id)));
      
      setBackupStatus('success');
      
      // Resetear estado después de un tiempo
      setTimeout(() => setBackupStatus('idle'), 2000);
    } catch (error) {
      console.error('App - Error sincronizando:', error);
      setBackupStatus('error');
      setTimeout(() => setBackupStatus('idle'), 3000);
    }
  }, [isOnline]);

  // Intentar sincronizar cola pendiente cuando se conecte
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      syncData(syncQueue);
    }
  }, [isOnline, syncQueue, syncData]);

  // Función para login - CORREGIDA para validar EMAIL
  const handleLogin = useCallback((info: DoctorInfo) => {
    console.log('App - Login exitoso:', info);
    
    // Validar que tenga email
    if (!info.email || info.email.trim() === '') {
      alert('❌ Error: El email es obligatorio para guardar los datos.\n\nPor favor, ingrese un email válido para continuar.');
      return;
    }

    // Normalizar y validar email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(info.email.trim())) {
      alert('❌ Error: Por favor ingrese un email válido.\n\nEjemplo: doctor@hospital.com');
      return;
    }

    setDoctorInfo(info);
    setCurrentScreen('main');
    
    // Limpiar biopsias del día anterior si es necesario
    const today = new Date().toDateString();
    if (info.loginDate !== today) {
      setTodayBiopsies([]);
    }

    console.log('App - Login completado para email:', info.email);
  }, []);

  // Función para guardar biopsia
  const saveBiopsy = useCallback((newBiopsy: BiopsyForm) => {
    console.log('App - Guardando nueva biopsia:', newBiopsy);
    console.log('App - Biopsias actuales antes de guardar:', todayBiopsies.length);
    
    const updatedBiopsies = [...todayBiopsies, newBiopsy];
    setTodayBiopsies(updatedBiopsies);
    
    console.log('App - Biopsias totales después de guardar:', updatedBiopsies.length);
    
    // Agregar a cola de sincronización
    if (doctorInfo) {
      addToSyncQueue({
        type: 'new_biopsy',
        biopsy: newBiopsy,
        doctor: doctorInfo,
        date: new Date().toDateString()
      });
    }
    
    // REMOVIDO: alert de confirmación
  }, [todayBiopsies, doctorInfo, addToSyncQueue]);

  // Función para actualizar tejidos frecuentes
  const updateFrequentTissues = useCallback((tissue: string) => {
    if (!tissue || tissue.trim() === '') return;

    setFrequentTissues(prev => {
      const tissueToAdd = tissue.trim();
      if (prev.includes(tissueToAdd)) {
        // Mover al principio si ya existe
        return [tissueToAdd, ...prev.filter(t => t !== tissueToAdd)];
      } else {
        // Agregar al principio y mantener solo los últimos 10
        return [tissueToAdd, ...prev].slice(0, 10);
      }
    });
  }, []);

  // Función para guardar en historial - CORREGIDA para usar EMAIL
  const saveToHistory = useCallback(() => {
    if (!doctorInfo || !doctorInfo.email) {
      console.log('App - saveToHistory: No hay doctorInfo con email disponible');
      alert('❌ Error: No se puede guardar el historial sin email del médico.');
      return;
    }

    console.log('App - saveToHistory: Guardando en historial');
    console.log('App - saveToHistory: Biopsias a guardar:', todayBiopsies.length);

    const doctorKey = generateDoctorKey(doctorInfo.email);
    const historyKey = `${doctorKey}_history`;
    const currentHistory = JSON.parse(localStorage.getItem(historyKey) || '{}');
    const today = new Date().toDateString();
    
    // Generar un ID único que incluya timestamp para evitar sobrescritura
    const uniqueId = `${doctorKey}_${today}_${Date.now()}`;
    
    const newEntry = {
      id: uniqueId,
      date: today,
      biopsies: [...todayBiopsies],
      doctorInfo: { ...doctorInfo },
      totalCount: todayBiopsies.length,
      timestamp: new Date().toISOString()
    };
    
    // Usar el ID único como key en lugar de solo la fecha
    currentHistory[uniqueId] = newEntry;
    
    localStorage.setItem(historyKey, JSON.stringify(currentHistory));
    setHistoryData(currentHistory);
    
    // Guardar en el almacén de remitos del administrador
    saveRemitosToAdmin(newEntry);
    
    console.log('App - saveToHistory: Historial guardado exitosamente con ID:', uniqueId);
    console.log('App - saveToHistory: Usando clave de doctor:', doctorKey);
    
    setTodayBiopsies([]);
  }, [doctorInfo, todayBiopsies, generateDoctorKey]);

  // ✅ FUNCIÓN MODIFICADA - Guardar remitos en el almacén del administrador con cantidades PAP y Citología
  const saveRemitosToAdmin = useCallback((remito: HistoryEntry) => {
    try {
      const adminRemitos = JSON.parse(localStorage.getItem('adminRemitos') || '[]');
      
      // Convertir el formato de remito a formato de administrador
      const adminRemito = {
        id: `R${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID único
        medico: `${(remito.doctorInfo as any).firstName || ''} ${(remito.doctorInfo as any).lastName || ''}`,
        email: remito.doctorInfo.email || '',
        fecha: remito.date,
        hospital: (remito.doctorInfo as any).hospitalName || remito.doctorInfo.hospital || '',
        biopsias: remito.biopsies.map(biopsy => {
          // Convertir servicios del formato de la app al formato del admin
          const servicios = {
            cassetteNormal: parseInt(biopsy.cassettes) || 0,
            cassetteUrgente: biopsy.servicios?.cassetteUrgente ? 1 : 0,
            profundizacion: 0, // Este campo no existe en la app, se puede agregar después
            pap: biopsy.servicios?.pap ? 1 : 0,
            papUrgente: biopsy.servicios?.papUrgente ? 1 : 0,
            citologia: biopsy.servicios?.citologia ? 1 : 0,
            citologiaUrgente: biopsy.servicios?.citologiaUrgente ? 1 : 0,
            corteBlanco: biopsy.servicios?.corteBlancoComun ? (biopsy.servicios.corteBlancoComunQuantity || 1) : 0,
            corteBlancoIHQ: biopsy.servicios?.corteBlancoIHQ ? (biopsy.servicios.corteBlancoIHQQuantity || 1) : 0,
            giemsaPASMasson: biopsy.servicios?.giemsaPASMasson ? 1 : 0
          };

          return {
            numero: biopsy.number,
            tejido: biopsy.tissueType,
            tipo: biopsy.type,
            cassettes: parseInt(biopsy.cassettes) || 0,
            trozos: parseInt(biopsy.pieces) || 0,
            desclasificar: biopsy.declassify === 'Sí' ? 'Sí' : 'No',
            servicios: servicios,
            // ✅ NUEVOS CAMPOS AGREGADOS PARA MANEJAR CANTIDADES:
            papQuantity: biopsy.papQuantity || 0,           // Cantidad de PAP
            citologiaQuantity: biopsy.citologiaQuantity || 0 // Cantidad de vidrios de citología
          };
        }),
        estado: 'pendiente',
        timestamp: remito.timestamp, // Agregar timestamp para ordenamiento
        doctorEmail: remito.doctorInfo.email // NUEVO: Agregar email para identificación
      };
      
      // No verificar duplicados por médico/fecha, siempre agregar
      // Esto permite múltiples remitos del mismo médico en el mismo día
      adminRemitos.push(adminRemito);
      
      // Ordenar por timestamp (más reciente primero)
      adminRemitos.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      
      localStorage.setItem('adminRemitos', JSON.stringify(adminRemitos));
      console.log('App - Remito guardado para administrador:', adminRemito);
    } catch (error) {
      console.error('App - Error guardando remito para administrador:', error);
    }
  }, []);

  // Función para finalizar remito del día
  const finishDailyReport = useCallback(() => {
    console.log('App - Finalizando remito del día');
    console.log('App - Biopsias del día:', todayBiopsies.length);
    
    if (todayBiopsies.length === 0) {
      alert('No hay biopsias cargadas para finalizar el remito.');
      return;
    }
    
    // Guardar en historial
    saveToHistory();
    
    // Agregar a cola de sincronización
    if (doctorInfo) {
      addToSyncQueue({
        type: 'daily_report',
        biopsies: todayBiopsies,
        doctor: doctorInfo,
        date: new Date().toDateString()
      });
    }
    
    // Ir a la pantalla principal
    setCurrentScreen('main');
    
    alert(`✅ Remito del día finalizado!\n\n📊 Total: ${todayBiopsies.length} biopsia${todayBiopsies.length !== 1 ? 's' : ''}\n📅 Fecha: ${new Date().toLocaleDateString('es-AR')}\n\n💾 Los datos se guardaron en el historial. Puedes descargar el archivo desde allí.`);
  }, [todayBiopsies, saveToHistory, doctorInfo, addToSyncQueue]);

  // Función para finalizar remito desde Step7 con biopsia actual - CORREGIDA
  const finishDailyReportFromStep7 = useCallback((currentBiopsy: BiopsyForm) => {
    console.log('App - Finalizando remito desde Step7 con biopsia actual:', currentBiopsy);
    
    // Primero actualizar frecuencia de tejidos
    updateFrequentTissues(currentBiopsy.tissueType);
    
    // Agregar la biopsia actual a las del día
    const updatedBiopsies = [...todayBiopsies, currentBiopsy];
    console.log('App - Biopsias totales para el remito:', updatedBiopsies.length);
    
    // Guardar en historial inmediatamente
    if (!doctorInfo || !doctorInfo.email) {
      alert('Error: Información del doctor o email no disponible');
      return;
    }

    const doctorKey = generateDoctorKey(doctorInfo.email);
    const historyKey = `${doctorKey}_history`;
    const currentHistory = JSON.parse(localStorage.getItem(historyKey) || '{}');
    const today = new Date().toDateString();
    
    // Generar ID único con timestamp
    const uniqueId = `${doctorKey}_${today}_${Date.now()}`;
    
    const remito = {
      id: uniqueId,
      date: today,
      biopsies: updatedBiopsies,
      doctorInfo: { ...doctorInfo },
      totalCount: updatedBiopsies.length,
      timestamp: new Date().toISOString()
    };

    // Usar ID único como key
    currentHistory[uniqueId] = remito;
    
    // Guardar en localStorage
    localStorage.setItem(historyKey, JSON.stringify(currentHistory));
    setHistoryData(currentHistory);
    
    // Guardar en el almacén del administrador
    saveRemitosToAdmin(remito);
    
    // Agregar a cola de sincronización
    addToSyncQueue({
      type: 'daily_report',
      biopsies: updatedBiopsies,
      doctor: doctorInfo,
      date: today
    });
    
    // Limpiar el día actual
    setTodayBiopsies([]);
    
    // Ir a pantalla principal
    setCurrentScreen('main');
    
    // Mostrar confirmación
    alert(`✅ Remito del día finalizado con éxito!\n\n📊 Total: ${updatedBiopsies.length} biopsia${updatedBiopsies.length !== 1 ? 's' : ''}\n📅 Fecha: ${new Date().toLocaleDateString('es-AR')}\n\n💾 Los datos se guardaron en el historial.\n🔄 La última biopsia se incluyó automáticamente.`);
  }, [todayBiopsies, doctorInfo, addToSyncQueue, updateFrequentTissues, saveRemitosToAdmin, generateDoctorKey]);

  // Función para acceder al panel de administrador
  const goToAdmin = useCallback(() => {
    setCurrentScreen('admin');
  }, []);

  // Función para volver del panel de administrador
  const goBackFromAdmin = useCallback(() => {
    if (doctorInfo) {
      setCurrentScreen('main');
    } else {
      setCurrentScreen('login');
    }
  }, [doctorInfo]);

  // Función adicional para debug - CORREGIDA
  const debugHistoryData = useCallback(() => {
    if (!doctorInfo || !doctorInfo.email) return;
    
    const doctorKey = generateDoctorKey(doctorInfo.email);
    const historyKey = `${doctorKey}_history`;
    const savedHistory = localStorage.getItem(historyKey);
    console.log('Debug - Doctor Key:', doctorKey);
    console.log('Debug - History Key:', historyKey);
    console.log('Debug - Saved History:', savedHistory);
    console.log('Debug - Parsed History:', JSON.parse(savedHistory || '{}'));
    console.log('Debug - History Data State:', historyData);
  }, [doctorInfo, historyData, generateDoctorKey]);

  // Agregar este useEffect para debug
  useEffect(() => {
    debugHistoryData();
  }, [historyData, debugHistoryData]);

  // Renderizado condicional de pantallas
  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} onGoToAdmin={goToAdmin} />;
  }

  if (currentScreen === 'admin') {
    return <AdminPanel onGoBack={goBackFromAdmin} />;
  }

  if (currentScreen === 'main') {
    return (
      <MainScreen
        doctorInfo={doctorInfo!}
        todayBiopsies={todayBiopsies}
        isOnline={isOnline}
        backupStatus={backupStatus}
        syncQueueLength={syncQueue.length}
        onStartNewBiopsy={() => {
          console.log('App - Iniciando nueva biopsia');
          setCurrentScreen('newBiopsy');
        }}
        onViewToday={() => {
          console.log('App - Viendo remito del día');
          setCurrentScreen('todayList');
        }}
        onViewHistory={() => {
          console.log('App - Viendo historial');
          setCurrentScreen('history');
        }}
        onLogout={() => {
          console.log('App - Cerrando sesión');
          // Limpiar datos y volver al login
          setDoctorInfo(null);
          setTodayBiopsies([]);
          localStorage.removeItem('currentDoctorInfo');
          setCurrentScreen('login');
        }}
      />
    );
  }

  if (currentScreen === 'newBiopsy') {
    return (
      <NewBiopsyScreen
        doctorInfo={doctorInfo!}
        todayBiopsies={todayBiopsies}
        frequentTissues={frequentTissues}
        isOnline={isOnline}
        backupStatus={backupStatus}
        syncQueueLength={syncQueue.length}
        onSaveBiopsy={saveBiopsy}
        onFinishDailyReport={finishDailyReport}
        onFinishDailyReportFromStep7={finishDailyReportFromStep7}
        onGoToMain={() => setCurrentScreen('main')}
        onUpdateFrequentTissues={updateFrequentTissues}
      />
    );
  }

  if (currentScreen === 'todayList') {
    return (
      <TodayListScreen
        doctorInfo={doctorInfo!}
        todayBiopsies={todayBiopsies}
        isOnline={isOnline}
        backupStatus={backupStatus}
        syncQueueLength={syncQueue.length}
        onGoBack={() => setCurrentScreen('main')}
        onStartNewBiopsy={() => setCurrentScreen('newBiopsy')}
        onFinishDailyReport={finishDailyReport}
      />
    );
  }

  if (currentScreen === 'history') {
    // Convertir historyData (objeto) a array para HistoryScreen
    const historyEntries = Object.values(historyData).map(entry => ({
      ...entry,
      id: entry.id || `${entry.date}_${entry.timestamp}` // Asegurar que tenga ID
    }));

    return (
      <HistoryScreen
        doctorInfo={doctorInfo!}
        historyEntries={historyEntries}
        isOnline={isOnline}
        backupStatus={backupStatus}
        syncQueueLength={syncQueue.length}
        onGoBack={() => setCurrentScreen('main')}
        onDeleteEntry={(entryId: string) => {
          if (!doctorInfo || !doctorInfo.email) return;
          
          const confirmed = window.confirm('¿Está seguro que desea eliminar este remito del historial?');
          if (confirmed) {
            const doctorKey = generateDoctorKey(doctorInfo.email);
            const historyKey = `${doctorKey}_history`;
            const currentHistory = { ...historyData };
            
            // Buscar y eliminar por ID
            Object.keys(currentHistory).forEach(key => {
              if (currentHistory[key].id === entryId || key === entryId) {
                delete currentHistory[key];
              }
            });
            
            localStorage.setItem(historyKey, JSON.stringify(currentHistory));
            setHistoryData(currentHistory);
            
            alert('✅ Remito eliminado del historial.');
          }
        }}
      />
    );
  }

  return null;
}

export default App;