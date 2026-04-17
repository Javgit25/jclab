// BiopsyTracker v2.0.4 - Optimizado para Tablet - Export Fix - Deployed 2025-07-29
import React, { useState, useEffect, useCallback } from 'react';
import type { DoctorInfo, BiopsyForm, SyncAction, HistoryEntry } from './types';
import { db } from './lib/database';
import LoginScreen from './components/LoginScreen';
import MainScreen from './components/MainScreen';
import NewBiopsyScreen from './components/NewBiopsyScreen';
import TodayListScreen from './components/TodayListScreen';
import HistoryScreen from './components/HistoryScreen';
import AdminPanel from './components/AdminPanel';
import SuperAdminPanel from './components/SuperAdminPanel';
import LabBoard from './components/LabBoard';

type ScreenType = 'login' | 'main' | 'newBiopsy' | 'todayList' | 'history' | 'admin' | 'superadmin' | 'labboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [openRemitoId, setOpenRemitoId] = useState<string | null>(null);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [todayBiopsies, setTodayBiopsies] = useState<BiopsyForm[]>([]);
  const [frequentTissues, setFrequentTissues] = useState<string[]>([]);
  const [historyData, setHistoryData] = useState<Record<string, HistoryEntry>>({});
  
  // Lab Board state
  const [labBoardCode, setLabBoardCode] = useState<string | null>(null);

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

  // Check for ?lab=LABCODE URL param to show LabBoard directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const labParam = params.get('lab');
    if (labParam) {
      setLabBoardCode(labParam);
      setCurrentScreen('labboard');
    }
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

  // Generar sufijo de centro para separar datos por hospital
  const getCentroSuffix = useCallback((hospital?: string) => {
    if (!hospital || !hospital.trim()) return '';
    return `_centro_${hospital.trim().toLowerCase().replace(/\s+/g, '_')}`;
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
          // Refrescar labConfig desde Supabase si no hay datos locales
          const labCfg = localStorage.getItem('labConfig');
          if (!labCfg || labCfg === '{}') {
            const docs = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
            const doc = docs.find((d: any) => d.email?.toLowerCase() === parsedDoctorInfo.email.toLowerCase());
            if (doc?.labCode) {
              db.getLabConfig(doc.labCode).catch(() => {});
            }
          }
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
          const centroSuffix = getCentroSuffix(parsedDoctorInfo.hospital);
          const todayKey = `${doctorKey}_today_${today}${centroSuffix}`;

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
  const loadHistoryData = useCallback(async () => {
    if (!doctorInfo || !doctorInfo.email) return;

    const doctorKey = generateDoctorKey(doctorInfo.email);
    const historyKey = `${doctorKey}_history`;

    // Cargar de Supabase primero (fuente de verdad)
    try {
      const remoteHistory = await db.getDoctorHistory(doctorInfo.email);
      if (remoteHistory && Object.keys(remoteHistory).length > 0) {
        setHistoryData(remoteHistory);
        return;
      }
    } catch {}

    // Fallback: localStorage
    try {
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        setHistoryData(JSON.parse(savedHistory));
      } else {
        setHistoryData({});
      }
    } catch {
      setHistoryData({});
    }
  }, [doctorInfo, generateDoctorKey]);

  // Función para guardar datos automáticamente
  const saveData = useCallback(() => {
    try {
      if (doctorInfo && doctorInfo.email) {
        // Guardar información del doctor
        localStorage.setItem('currentDoctorInfo', JSON.stringify(doctorInfo));

        // Guardar biopsias del día (separadas por centro médico)
        const today = new Date().toDateString();
        const doctorKey = generateDoctorKey(doctorInfo.email);
        const centroSuffix = getCentroSuffix(doctorInfo.hospital);
        const todayKey = `${doctorKey}_today_${today}${centroSuffix}`;
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

    // Cargar biopsias del día para este centro médico
    const today = new Date().toDateString();
    const doctorKey = generateDoctorKey(info.email);
    const centroSuffix = getCentroSuffix(info.hospital);
    const todayKey = `${doctorKey}_today_${today}${centroSuffix}`;
    try {
      const saved = localStorage.getItem(todayKey);
      setTodayBiopsies(saved ? JSON.parse(saved) : []);
    } catch {
      setTodayBiopsies([]);
    }

    // Cargar labConfig (logo, nombre, datos del lab) desde Supabase
    const loadLabConfig = async () => {
      try {
        const doctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
        const doc = doctors.find((d: any) => d.email?.toLowerCase() === info.email.toLowerCase());
        if (doc?.labCode) {
          // Traer lab_config (nombre, logo, dirección, etc.)
          await db.getLabConfig(doc.labCode);
          // Si lab_config no tiene logo, intentar traer de las columnas del lab
          const labCfg = JSON.parse(localStorage.getItem('labConfig') || '{}');
          if (!labCfg.logoUrl || !labCfg.nombre) {
            const labs = await db.getLabs();
            const lab = labs.find((l: any) => l.labCode === doc.labCode);
            if (lab) {
              const merged = {
                nombre: labCfg.nombre || lab.nombre || '',
                direccion: labCfg.direccion || lab.direccion || '',
                telefono: labCfg.telefono || lab.telefono || '',
                email: labCfg.email || lab.email || '',
                logoUrl: labCfg.logoUrl || lab.logoUrl || '',
                logoMarginTop: labCfg.logoMarginTop ?? lab.logoMarginTop ?? 0,
                infoMarginTop: labCfg.infoMarginTop ?? lab.infoMarginTop ?? 0,
              };
              localStorage.setItem('labConfig', JSON.stringify(merged));
            }
          }
        }
      } catch (e) { console.error('Error cargando labConfig:', e); }
    };
    loadLabConfig();

    console.log('App - Login completado para email:', info.email);
  }, []);

  // Función para guardar biopsia
  const saveBiopsy = useCallback((newBiopsy: BiopsyForm) => {
    console.log('App - Guardando nueva biopsia:', newBiopsy);
    console.log('App - Biopsias actuales antes de guardar:', todayBiopsies.length);
    
    const updatedBiopsies = [...todayBiopsies, newBiopsy];
    setTodayBiopsies(updatedBiopsies);

    // Guardar observaciones frecuentes
    if (newBiopsy.observations && newBiopsy.observations.trim()) {
      try {
        const frecuentes: string[] = JSON.parse(localStorage.getItem('observacionesFrecuentes') || '[]');
        const obs = newBiopsy.observations.trim();
        if (!frecuentes.includes(obs)) {
          frecuentes.unshift(obs);
          localStorage.setItem('observacionesFrecuentes', JSON.stringify(frecuentes.slice(0, 15)));
        }
      } catch {}
    }

    // Sincronizar tejido con admin (inline para evitar dependencia circular)
    try {
      const tissue = newBiopsy.tissueType;
      if (tissue && tissue.trim()) {
        const ac = JSON.parse(localStorage.getItem('adminConfig') || '{}');
        const defaultTissues = ['Gastrica', 'Vesicula biliar', 'Endometrio', 'Endoscopia', 'Endocervix', 'Vulva', 'Recto', 'Piel', 'Mucosa', 'Colon', 'Ganglio', 'Mama', 'Tiroides', 'Próstata', 'Útero', 'Ovario', 'PAP', 'Citología'];
        const tissues: string[] = ac.tiposTejido || defaultTissues;
        const norm = tissue.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        if (!tissues.some(t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === norm)) {
          const cap = tissue.trim().charAt(0).toUpperCase() + tissue.trim().slice(1).toLowerCase();
          tissues.push(cap);
          ac.tiposTejido = tissues;
          localStorage.setItem('adminConfig', JSON.stringify(ac));
          // Sync a Supabase
          try {
            let labCode = '';
            const docs = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
            const doc = docs.find((d: any) => d.email?.toLowerCase() === doctorInfo?.email?.toLowerCase());
            labCode = doc?.labCode || '';
            if (!labCode && doctorInfo) {
              db.getDoctors().then(freshDocs => {
                const fd = freshDocs.find((d: any) => d.email?.toLowerCase() === doctorInfo?.email?.toLowerCase());
                if (fd?.labCode) db.saveAdminConfig(fd.labCode, ac).catch(() => {});
              }).catch(() => {});
            } else if (labCode) {
              db.saveAdminConfig(labCode, ac).catch(() => {});
            }
          } catch {}
        }
      }
    } catch {}

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
  // Normalizar texto: sin tildes, lowercase
  const normalizeText = (text: string) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  };

  // Agregar tejido a la config del admin si no existe (autoaprendizaje)
  const syncTissueToAdmin = useCallback(async (tissue: string) => {
    if (!tissue || tissue.trim() === '') return;
    try {
      // Buscar labCode del doctor
      let labCode = (doctorInfo as any)?.labCode || '';
      if (!labCode) {
        try {
          const docs = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
          const doc = docs.find((d: any) => d.email?.toLowerCase() === doctorInfo?.email?.toLowerCase());
          labCode = doc?.labCode || '';
        } catch {}
      }
      if (!labCode) {
        try {
          const docs = await db.getDoctors();
          const doc = docs.find((d: any) => d.email?.toLowerCase() === doctorInfo?.email?.toLowerCase());
          labCode = doc?.labCode || '';
        } catch {}
      }

      // Cargar config actual desde Supabase primero, luego localStorage como fallback
      let adminConfig: any = {};
      if (labCode) {
        try {
          const cfg = await db.getAdminConfig(labCode);
          if (cfg && Object.keys(cfg).length > 0) adminConfig = cfg;
        } catch {}
      }
      if (!adminConfig.tiposTejido) {
        try { adminConfig = JSON.parse(localStorage.getItem('adminConfig') || '{}'); } catch {}
      }

      const existingTissues: string[] = adminConfig.tiposTejido || [
        'Gastrica', 'Vesicula biliar', 'Endometrio', 'Endoscopia',
        'Endocervix', 'Vulva', 'Recto', 'Piel', 'Mucosa', 'Colon', 'Ganglio',
        'Mama', 'Tiroides', 'Próstata', 'Útero', 'Ovario', 'PAP', 'Citología'
      ];

      const tissueNormalized = normalizeText(tissue);
      const alreadyExists = existingTissues.some(t => normalizeText(t) === tissueNormalized);

      if (!alreadyExists) {
        const cleaned = tissue.trim();
        const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
        existingTissues.push(capitalized);
        adminConfig.tiposTejido = existingTissues;
        localStorage.setItem('adminConfig', JSON.stringify(adminConfig));
        if (labCode) db.saveAdminConfig(labCode, adminConfig).catch(() => {});
      }
    } catch {}
  }, [doctorInfo]);

  const updateFrequentTissues = useCallback((tissue: string) => {
    if (!tissue || tissue.trim() === '') return;

    // Sincronizar con admin
    syncTissueToAdmin(tissue);

    setFrequentTissues(prev => {
      const cleaned = tissue.trim();
      const tissueToAdd = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
      const normalized = normalizeText(tissueToAdd);
      // Buscar si ya existe ignorando tildes y mayúsculas
      const existingIndex = prev.findIndex(t => normalizeText(t) === normalized);
      if (existingIndex >= 0) {
        // Mover al principio si ya existe
        const existing = prev[existingIndex];
        return [existing, ...prev.filter((_, i) => i !== existingIndex)];
      } else {
        // Agregar al principio
        return [tissueToAdd, ...prev].slice(0, 10);
      }
    });
  }, [syncTissueToAdmin]);

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
    
    // Generar número de remito único (6 dígitos)
    const remitoNumber = String(Date.now() % 1000000).padStart(6, '0');
    const uniqueId = `${doctorKey}_${today}_${remitoNumber}`;

    const newEntry = {
      id: uniqueId,
      remitoNumber,
      date: today,
      biopsies: [...todayBiopsies],
      doctorInfo: { ...doctorInfo },
      totalCount: todayBiopsies.length,
      timestamp: new Date().toISOString(),
      cargadoPor: doctorInfo.cargadoPor || `Dr/a. ${doctorInfo.firstName || ''} ${doctorInfo.lastName || ''}`.trim()
    };
    
    // Usar el ID único como key en lugar de solo la fecha
    currentHistory[uniqueId] = newEntry;
    
    localStorage.setItem(historyKey, JSON.stringify(currentHistory));
    setHistoryData(currentHistory);

    // Sync to Supabase
    db.saveDoctorHistoryEntry(doctorInfo.email, (doctorInfo as any).labCode || '', newEntry);

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
        id: `R_${(remito as any).remitoNumber}_${Date.now()}`,
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
            giemsaPASMasson: biopsy.servicios?.giemsaPASMasson
              ? (typeof biopsy.servicios.giemsaPASMasson === 'number'
                ? biopsy.servicios.giemsaPASMasson
                : (biopsy.servicios.giemsaPASMassonTotal || Object.values(biopsy.servicios.giemsaOptions || {}).filter(Boolean).length || 1))
              : 0,
            giemsaOptions: biopsy.servicios?.giemsaOptions || undefined,
            corteBlancoIHQCassettes: biopsy.servicios?.corteBlancoIHQCassettes || undefined,
            corteBlancoComunCassettes: biopsy.servicios?.corteBlancoComunCassettes || undefined,
            giemsaCassettes: biopsy.servicios?.giemsaCassettes || undefined,
            incluyeCitologia: biopsy.servicios?.incluyeCitologia || false,
            citologiaFormato: biopsy.servicios?.citologiaFormato || undefined,
            citologiaVidriosQty: biopsy.servicios?.citologiaVidriosQty || undefined
          };

          return {
            numero: biopsy.number,
            tejido: biopsy.tissueType ? biopsy.tissueType.charAt(0).toUpperCase() + biopsy.tissueType.slice(1) : '',
            tipo: biopsy.type,
            cassettes: parseInt(biopsy.cassettes) || 0,
            trozos: parseInt(biopsy.pieces) || 0,
            desclasificar: biopsy.declassify === 'Sí' ? 'Sí' : 'No',
            servicios: servicios,
            // ✅ NUEVOS CAMPOS AGREGADOS PARA MANEJAR CANTIDADES:
            papQuantity: biopsy.papQuantity || 0,
            citologiaQuantity: biopsy.citologiaQuantity || 0,
            citologiaSubType: biopsy.citologiaSubType || '',
            cassettesNumbers: biopsy.cassettesNumbers || [],
            trozoPorCassette: biopsy.trozoPorCassette || [],
            quedaMaterial: biopsy.quedaMaterial || false,
            entregarConTaco: biopsy.entregarConTaco || false,
            tacosSeleccionados: biopsy.tacosSeleccionados || [],
            numeroExterno: biopsy.numeroExterno || '',
            ihqTejido: biopsy.ihqTejido || '',
            ihqVidriosQty: biopsy.ihqVidriosQty || 0
          };
        }),
        estado: 'pendiente',
        remitoNumber: remito.remitoNumber,
        timestamp: remito.timestamp,
        doctorEmail: remito.doctorInfo.email,
        cargadoPor: (remito as any).cargadoPor || '',
        // Congelar precios al momento de crear el remito
        preciosSnapshot: (() => {
          try { return JSON.parse(localStorage.getItem('adminConfig') || '{}'); } catch { return null; }
        })()
      };
      
      // No verificar duplicados por médico/fecha, siempre agregar
      // Esto permite múltiples remitos del mismo médico en el mismo día
      adminRemitos.push(adminRemito);
      
      // Ordenar por timestamp (más reciente primero)
      adminRemitos.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      
      localStorage.setItem('adminRemitos', JSON.stringify(adminRemitos));

      // Sync to Supabase - resolve labCode from registered doctor
      const registeredDoctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
      const matchedDoctor = registeredDoctors.find((d: any) => d.email?.toLowerCase() === adminRemito.email?.toLowerCase());
      const adminRemitoWithLabCode = { ...adminRemito, labCode: matchedDoctor?.labCode || '' };
      db.saveRemito(adminRemitoWithLabCode);

      // Auto-generar solicitudes de taco para biopsias con "Entregar con Taco"
      adminRemito.biopsias.forEach((biopsia: any) => {
        if (biopsia.entregarConTaco) {
          const tacosSel = biopsia.tacosSeleccionados || [];
          const cns = biopsia.cassettesNumbers || [];
          let cassetteLabels: string[] = [];
          if (tacosSel.length > 0 && cns.length > 0) {
            cassetteLabels = tacosSel.map((idx: number) => {
              const cn = cns[idx];
              return idx === 0 ? (cn?.base || 'C1') : (cn?.suffix ? `${cn.base}/${cn.suffix}` : `S/${idx}`);
            });
          } else {
            cassetteLabels = cns.map((cn: any, idx: number) => idx === 0 ? (cn?.base || 'C1') : (cn?.suffix ? `${cn.base}/${cn.suffix}` : `S/${idx}`));
          }
          const sol = {
            id: `SOL_TACO_${Date.now()}_${biopsia.numero}`,
            tipo: 'taco',
            numeroPaciente: biopsia.numero,
            remitoNumber: adminRemito.remitoNumber,
            descripcion: `Devolver tacos: ${cassetteLabels.join(', ') || 'todos'}`,
            tejido: biopsia.tejido || '',
            cassetteLabels,
            solicitadoPor: adminRemito.cargadoPor || adminRemito.medico,
            solicitadoAt: new Date().toISOString(),
            estado: 'pendiente',
            doctorEmail: adminRemito.email,
            labCode: matchedDoctor?.labCode || '',
          };
          db.saveSolicitud(sol);
        }
      });

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

    // Guardar en historial (genera remitoNumber internamente)
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
    
    // Guardar observaciones frecuentes de la biopsia actual
    if (currentBiopsy.observations && currentBiopsy.observations.trim()) {
      try {
        const frecuentes: string[] = JSON.parse(localStorage.getItem('observacionesFrecuentes') || '[]');
        const obs = currentBiopsy.observations.trim();
        if (!frecuentes.includes(obs)) {
          frecuentes.unshift(obs);
          localStorage.setItem('observacionesFrecuentes', JSON.stringify(frecuentes.slice(0, 15)));
        }
      } catch {}
    }

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
    
    // Generar número de remito único (6 dígitos)
    const remitoNumber = String(Date.now() % 1000000).padStart(6, '0');
    const uniqueId = `${doctorKey}_${today}_${remitoNumber}`;

    const remito = {
      id: uniqueId,
      remitoNumber,
      date: today,
      biopsies: updatedBiopsies,
      doctorInfo: { ...doctorInfo },
      totalCount: updatedBiopsies.length,
      timestamp: new Date().toISOString(),
      cargadoPor: doctorInfo.cargadoPor || `Dr/a. ${doctorInfo.firstName || ''} ${doctorInfo.lastName || ''}`.trim()
    };

    // Usar ID único como key
    currentHistory[uniqueId] = remito;
    
    // Guardar en localStorage
    localStorage.setItem(historyKey, JSON.stringify(currentHistory));
    setHistoryData(currentHistory);

    // Sync to Supabase
    db.saveDoctorHistoryEntry(doctorInfo.email, (doctorInfo as any).labCode || '', remito);

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

  // Función para volver al inicio sin validaciones (desde Step1)
  const goBackToMainScreen = useCallback(() => {
    console.log('App - Volviendo al menú principal sin validaciones');
    setCurrentScreen('main');
  }, []);

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
  if (currentScreen === 'labboard' && labBoardCode) {
    return (
      <LabBoard
        labCode={labBoardCode}
        onGoBack={() => {
          setCurrentScreen('login');
          setLabBoardCode(null);
          // Remove ?lab param from URL
          const url = new URL(window.location.href);
          url.searchParams.delete('lab');
          window.history.replaceState({}, '', url.toString());
        }}
      />
    );
  }

  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} onGoToAdmin={goToAdmin} onGoToSuperAdmin={() => setCurrentScreen('superadmin')} />;
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
          loadHistoryData();
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
        onGoBackToMainScreen={goBackToMainScreen}
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
    // Recargar historial fresco, filtrado por centro médico actual
    const currentHospital = doctorInfo?.hospital || '';
    const historyEntries = Object.values(historyData)
      .map((entry: any) => ({
        ...entry,
        id: entry.id || `${entry.date}_${entry.timestamp}`
      }))
      .filter((entry: any) => {
        // Si no hay hospital actual o el remito no tiene hospital, mostrar todo
        if (!currentHospital) return true;
        const entryHospital = entry.doctorInfo?.hospital || '';
        if (!entryHospital) return true;
        return entryHospital === currentHospital;
      });

    return (
      <HistoryScreen
        doctorInfo={doctorInfo!}
        historyEntries={historyEntries}
        isOnline={isOnline}
        backupStatus={backupStatus === 'success' ? 'synced' : backupStatus === 'syncing' ? 'pending' : backupStatus === 'idle' ? 'synced' : 'error'}
        syncQueueLength={syncQueue.length}
        onGoBack={() => setCurrentScreen('main')}
        onUpdateEntry={(updatedEntry: HistoryEntry) => {
          if (!doctorInfo || !doctorInfo.email) return;
          const doctorKey = generateDoctorKey(doctorInfo.email);
          const historyKey = `${doctorKey}_history`;
          const currentHistory = { ...historyData };

          // Actualizar la entrada
          Object.keys(currentHistory).forEach(key => {
            if (currentHistory[key].id === updatedEntry.id || key === updatedEntry.id) {
              currentHistory[key] = updatedEntry;
            }
          });

          localStorage.setItem(historyKey, JSON.stringify(currentHistory));
          setHistoryData(currentHistory);
        }}
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

  if (currentScreen === 'superadmin') {
    return (
      <SuperAdminPanel onGoBack={() => setCurrentScreen('login')} />
    );
  }

  return null;
}

export { App };
export default App;