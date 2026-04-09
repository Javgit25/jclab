import React, { useState } from 'react';
import { Plus, FileText, History, LogOut, TrendingUp, Star, Activity, BarChart3, PieChart, Calendar, Clock, DollarSign, CheckCircle, Target, QrCode, Share, Download, Copy, Search, Filter, X, Wifi, Printer, Cloud, Bell, Mail } from 'lucide-react';
import { BiopsyForm, DoctorInfo } from '../types';
import { db } from '../lib/database';
import { ConnectionStatus } from './ConnectionStatus';
import { VirtualKeyboard } from './VirtualKeyboard';
import QRCodeLib from 'qrcode';

interface MainScreenProps {
  doctorInfo: DoctorInfo;
  todayBiopsies: BiopsyForm[];
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
  onStartNewBiopsy: () => void;
  onViewToday: () => void;
  onViewHistory: () => void;
  onLogout: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  doctorInfo,
  todayBiopsies,
  isOnline,
  backupStatus,
  syncQueueLength,
  onStartNewBiopsy,
  onViewToday,
  onViewHistory,
  onLogout
}) => {
  const [showStatistics, setShowStatistics] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [viewingRemitoFromSearch, setViewingRemitoFromSearch] = useState<any>(null);
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    dateFrom: '',
    dateTo: '',
    tissueType: '',
    hasServices: false,
    doctorName: ''
  });
  const [qrData, setQrData] = useState<{
    type: 'remito' | 'doctor' | 'estadisticas' | 'backup';
    data: any;
    title: string;
  } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsData, setNotificationsData] = useState<any[]>([]);

  // Cargar notificaciones del médico (todas, incluidas leídas recientes)
  const loadNotifications = () => {
    try {
      const all = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
      const mine = all.filter((n: any) => n.medicoEmail === doctorInfo.email);
      setNotificationsData(mine);
    } catch { setNotificationsData([]); }
    // Fire-and-forget: refresh from Supabase
    db.getNotifications(doctorInfo.email).then((remote: any[]) => {
      if (remote && remote.length > 0) setNotificationsData(remote);
    }).catch(() => {});
  };

  // Cargar al montar + polling cada 10 segundos
  useState(() => { loadNotifications(); });
  React.useEffect(() => {
    const fetchNotifs = () => {
      db.getNotifications(doctorInfo.email).then((remote: any[]) => {
        if (remote && remote.length > 0) setNotificationsData(prev => {
          // Solo actualizar si hay cambios (evitar re-renders innecesarios)
          if (JSON.stringify(prev.map(n => n.id + n.leida)) !== JSON.stringify(remote.map(n => n.id + n.leida))) {
            return remote;
          }
          return prev;
        });
      }).catch(() => {});
    };

    // Polling cada 10 segundos
    const interval = setInterval(fetchNotifs, 10000);

    // También recargar cuando la pantalla se activa (vuelve del sleep/background)
    const handleVisibility = () => {
      if (!document.hidden) fetchNotifs();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // También recargar en cualquier toque de pantalla (para Fully Kiosk)
    const handleTouch = () => fetchNotifs();
    document.addEventListener('touchstart', handleTouch, { passive: true });

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [doctorInfo.email]);

  const unreadCount = notificationsData.filter(n => !n.leida).length;

  // Detectar notificaciones de "listo para retirar" no leídas
  const [listoAlert, setListoAlert] = useState<any>(null);
  const [shownAlertIds] = useState<Set<string>>(() => new Set());
  React.useEffect(() => {
    const listoNotif = notificationsData.find(n => (n.tipo === 'listo' || n.tipo === 'parcial') && !n.leida && !shownAlertIds.has(n.id));
    if (listoNotif && !listoAlert) {
      shownAlertIds.add(listoNotif.id);
      setListoAlert(listoNotif);
      // Marcar TODAS las no leídas como leídas inmediatamente en Supabase
      notificationsData.filter(n => (n.tipo === 'listo' || n.tipo === 'parcial') && !n.leida).forEach(n => {
        shownAlertIds.add(n.id);
        db.markNotificationRead(n.id).catch(() => {});
      });
      // Reproducir sonido de notificación
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const playTone = (freq: number, start: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + dur);
        };
        playTone(523, 0, 0.15);    // Do
        playTone(659, 0.15, 0.15); // Mi
        playTone(784, 0.3, 0.3);   // Sol (más largo)
      } catch {}
    }
  }, [notificationsData]);

  const markNotificationsRead = () => {
    try {
      const all = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
      const updated = all.map((n: any) => {
        if (n.medicoEmail === doctorInfo.email) return { ...n, leida: true };
        return n;
      });
      localStorage.setItem('doctorNotifications', JSON.stringify(updated));
      loadNotifications();
      // Sync to Supabase
      const mine = all.filter((n: any) => n.medicoEmail === doctorInfo.email);
      mine.forEach((n: any) => { db.markNotificationRead(n.id).catch(() => {}); });
    } catch {}
  };

  const closeNotifications = () => {
    setShowNotifications(false);
    if (unreadCount > 0) markNotificationsRead();
  };
  const [qrImageSrc, setQrImageSrc] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  
  // Estados para el teclado virtual
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardType, setKeyboardType] = useState<'numeric' | 'full'>('full');
  const [activeField, setActiveField] = useState<string | null>(null);

  // Calcular métricas básicas del día actual
  const getTodayMetrics = () => {
    try {
      let todayBiopsiesFromHistory: any[] = [];
      const todayStr = new Date().toDateString(); // "Sun Apr 06 2026"

      // Buscar en historial del médico
      const normalizedEmail = (doctorInfo.email || '').toLowerCase().trim().replace(/\s+/g, '');
      const historyKey = normalizedEmail ? `doctor_${normalizedEmail}_history` : `${doctorInfo.name}_history`;

      try {
        const historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
        Object.values(historyData).forEach((entry: any) => {
          if (entry?.biopsies && entry.date) {
            // Comparar usando toDateString para evitar problemas de formato
            const entryDateStr = new Date(entry.date).toDateString();
            if (entryDateStr === todayStr) {
              todayBiopsiesFromHistory.push(...entry.biopsies);
            }
          }
        });
      } catch {}
      
      // También incluir las biopsias actuales (todayBiopsies prop)
      const allTodayBiopsies = [...todayBiopsiesFromHistory, ...todayBiopsies];
      
      return {
        count: allTodayBiopsies.length,
        withServices: allTodayBiopsies.filter(b => {
          const servicios = b.servicios || {};
          // Solo servicios especiales y urgentes (NO PAP/Citología comunes)
          const specialServices = [
            'cassetteUrgente',      // URGENTE 24HS
            'papUrgente',           // PAP URGENTE
            'citologiaUrgente',     // CITOLOGÍA URGENTE
            'corteBlancoIHQ',       // CORTE EN BLANCO PARA IHQ
            'corteBlancoComun',     // CORTE EN BLANCO COMÚN
            'giemsaPASMasson'       // GIEMSA/PAS/MASSON
          ];

          return specialServices.some(serviceKey => {
            const serviceValue = servicios[serviceKey];
            if (typeof serviceValue === 'boolean') return serviceValue;
            if (typeof serviceValue === 'number') return serviceValue > 0;
            return false;
          });
        }).length
      };
    } catch (error) {
      console.error('Error calculando métricas del día:', error);
      return { count: todayBiopsies.length, withServices: 0 };
    }
  };

  const todayMetrics = getTodayMetrics();
  const todayBiopsiesCount = todayMetrics.count;
  const biopsiesWithServices = todayMetrics.withServices;

  // Calcular eficiencia basada en datos reales
  const efficiency = todayBiopsiesCount > 0 ? Math.min(100, Math.round(70 + (todayBiopsiesCount * 2.5) + (biopsiesWithServices * 1.5))) : 0;

  // Calcular estadísticas del historial - CORREGIDA para usar EMAIL
  const getHistoryStats = () => {
    try {
      // NUEVA LÓGICA: Buscar datos por email si está disponible, sino por nombre
      let historyData = {};
      
      if (doctorInfo.email) {
        // Usar nuevo sistema basado en email
        const normalizedEmail = doctorInfo.email.toLowerCase().trim().replace(/\s+/g, '');
        const doctorKey = `doctor_${normalizedEmail}`;
        const historyKey = `${doctorKey}_history`;
        
        console.log('MainScreen - Buscando historial con email:', historyKey);
        historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
      } else {
        // Fallback: usar sistema anterior por nombre
        const historyKey = `${doctorInfo.name}_history`;
        console.log('MainScreen - Buscando historial con nombre:', historyKey);
        historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
      }
      
      console.log('MainScreen - Datos del historial encontrados:', historyData);
      console.log('MainScreen - Cantidad de entradas:', Object.keys(historyData).length);
      
      const entries = Object.values(historyData) as any[];
      const totalRemitos = entries.length;
      const totalBiopsias = entries.reduce((sum: number, entry: any) => sum + (entry.biopsies?.length || 0), 0);
      const promedioPorRemito = totalRemitos > 0 ? Math.round(totalBiopsias / totalRemitos) : 0;
      
      // Calcular distribución por tipo de tejido
      const tissueDistribution: {[key: string]: number} = {};
      entries.forEach((entry: any) => {
        entry.biopsies?.forEach((biopsy: any) => {
          const tissue = biopsy.tissueType || 'Sin especificar';
          tissueDistribution[tissue] = (tissueDistribution[tissue] || 0) + 1;
        });
      });

      const topTissues = Object.entries(tissueDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      const stats = {
        totalRemitos,
        totalBiopsias,
        promedioPorRemito,
        topTissues
      };
      
      console.log('MainScreen - Estadísticas calculadas:', stats);
      
      return stats;
    } catch (error) {
      console.error('MainScreen - Error calculando estadísticas:', error);
      return {
        totalRemitos: 0,
        totalBiopsias: 0,
        promedioPorRemito: 0,
        topTissues: []
      };
    }
  };

  const stats = getHistoryStats();

  const StatisticsModal = () => {
    // Calcular datos de facturación y costos filtrados por mes seleccionado
    const calculateFinancialData = () => {
      // Obtener datos del historial
      let savedBiopsies: any[] = [];
      let previousMonthBiopsies: any[] = [];
      
      try {
        if (doctorInfo.email) {
          // Usar nuevo sistema basado en email
          const normalizedEmail = doctorInfo.email.toLowerCase().trim().replace(/\s+/g, '');
          const doctorKey = `doctor_${normalizedEmail}`;
          const historyKey = `${doctorKey}_history`;
          
          const historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
          const entries = Object.values(historyData) as any[];
          
          // Calcular mes anterior
          const previousMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
          const previousYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
          
          // Filtrar por mes y año seleccionado
          entries.forEach((entry: any) => {
            if (entry.biopsies && entry.date) {
              const entryDate = new Date(entry.date);
              if (entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear) {
                savedBiopsies.push(...entry.biopsies);
              }
              // También obtener datos del mes anterior para tendencia
              if (entryDate.getMonth() === previousMonth && entryDate.getFullYear() === previousYear) {
                previousMonthBiopsies.push(...entry.biopsies);
              }
            }
          });
        } else {
          // Fallback: usar sistema anterior por nombre
          const historyKey = `${doctorInfo.name}_history`;
          const historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
          const entries = Object.values(historyData) as any[];
          
          // Calcular mes anterior
          const previousMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
          const previousYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
          
          // Filtrar por mes y año seleccionado
          entries.forEach((entry: any) => {
            if (entry.biopsies && entry.date) {
              const entryDate = new Date(entry.date);
              if (entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear) {
                savedBiopsies.push(...entry.biopsies);
              }
              // También obtener datos del mes anterior para tendencia
              if (entryDate.getMonth() === previousMonth && entryDate.getFullYear() === previousYear) {
                previousMonthBiopsies.push(...entry.biopsies);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error obteniendo biopsias guardadas:', error);
      }
      
      // Leer precios de configuración del admin (misma fuente)
      let adminConfig: any = null;
      try { adminConfig = JSON.parse(localStorage.getItem('adminConfig') || 'null'); } catch {}
      const precios = {
        cassette: adminConfig?.precioCassette || 300,
        cassetteUrgente: adminConfig?.precioCassetteUrgente || 400,
        profundizacion: adminConfig?.precioProfundizacion || 120,
        pap: adminConfig?.precioPAP || 90,
        papUrgente: adminConfig?.precioPAPUrgente || 110,
        citologia: adminConfig?.precioCitologia || 90,
        citologiaUrgente: adminConfig?.precioCitologiaUrgente || 120,
        corteBlanco: adminConfig?.precioCorteBlanco || 60,
        corteBlancoIHQ: adminConfig?.precioCorteBlancoIHQ || 85,
        giemsaPASMasson: 75
      };

      let totalFacturado = 0;
      let totalBiopsias = 0;
      let totalPAP = 0;
      let totalCitologia = 0;
      let totalBX = 0;
      let totalPQ = 0;
      let totalOtros = 0;
      let totalUrgentes = 0;
      let costoPromedio = 0;
      let totalRemitosDelMes = 0;

      // Contar remitos del mes (no solo biopsias)
      try {
        const normalizedEmail = doctorInfo.email?.toLowerCase().trim().replace(/\s+/g, '') || '';
        const doctorKey = `doctor_${normalizedEmail}`;
        const historyKey = `${doctorKey}_history`;
        const historyData2 = JSON.parse(localStorage.getItem(historyKey) || '{}');
        Object.values(historyData2).forEach((entry: any) => {
          if (entry.date) {
            const d = new Date(entry.date);
            if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
              totalRemitosDelMes++;
            }
          }
        });
      } catch {}

      // Función de cálculo IDÉNTICA al AdminPanel
      const calcularBiopsia = (biopsy: any) => {
        let total = 0;
        const svc = biopsy.servicios || {};
        const cassettes = parseInt(biopsy.cassettes) || 0;
        const papQty = biopsy.papQuantity || 0;
        const citoQty = biopsy.citologiaQuantity || 0;
        const esCassetteUrgente = svc.cassetteUrgente ? true : false;
        const esPapUrgente = svc.papUrgente ? true : false;
        const esCitoUrgente = svc.citologiaUrgente ? true : false;

        // Cassettes: primer cassette al precio base, resto profundización
        if (cassettes > 0) {
          total += esCassetteUrgente ? precios.cassetteUrgente : precios.cassette;
          if (cassettes > 1) {
            total += (cassettes - 1) * precios.profundizacion;
          }
        }

        // PAP
        if (papQty > 0) {
          total += papQty * (esPapUrgente ? precios.papUrgente : precios.pap);
        }

        // Citología
        if (citoQty > 0) {
          total += citoQty * (esCitoUrgente ? precios.citologiaUrgente : precios.citologia);
        }

        // Cortes en blanco
        const corteBlancoQty = svc.corteBlancoComun ? (svc.corteBlancoComunQuantity || 1) : (svc.corteBlanco || 0);
        total += corteBlancoQty * precios.corteBlanco;

        // Cortes IHQ
        const corteIHQQty = svc.corteBlancoIHQ ? (svc.corteBlancoIHQQuantity || 1) : 0;
        total += corteIHQQty * precios.corteBlancoIHQ;

        // Giemsa/PAS/Masson
        const giemsaCount = typeof svc.giemsaPASMasson === 'number' ? svc.giemsaPASMasson : (svc.giemsaPASMasson ? 1 : 0);
        total += giemsaCount * precios.giemsaPASMasson;

        return total;
      };

      savedBiopsies.forEach((biopsy) => {
        totalBiopsias++;

        const esPAP = biopsy.papQuantity && biopsy.papQuantity > 0;
        const esCitologia = biopsy.citologiaQuantity && biopsy.citologiaQuantity > 0;
        const esPQ = biopsy.type === 'PQ' || biopsy.tipo === 'PQ';
        const esBX = !esPAP && !esCitologia && !esPQ;

        if (esPQ) totalPQ++;
        else if (esBX) totalBX++;
        if (esPAP) totalPAP += biopsy.papQuantity;
        if (esCitologia) totalCitologia += biopsy.citologiaQuantity;

        const svc = biopsy.servicios || {};
        if (svc.cassetteUrgente || svc.papUrgente || svc.citologiaUrgente) totalUrgentes++;

        totalFacturado += calcularBiopsia(biopsy);
      });

      costoPromedio = totalBiopsias > 0 ? Math.round(totalFacturado / totalBiopsias) : 0;

      // Calcular datos del mes anterior
      let totalFacturadoPrevious = 0;
      let totalBiopsiasPrevious = 0;
      
      previousMonthBiopsies.forEach((biopsy) => {
        totalBiopsiasPrevious++;
        totalFacturadoPrevious += calcularBiopsia(biopsy);
      });

      // Calcular tendencia mensual
      let tendenciaPorcentaje = 0;
      let tendenciaSymbol = '';
      
      if (totalFacturadoPrevious > 0 && totalFacturado > 0) {
        tendenciaPorcentaje = ((totalFacturado - totalFacturadoPrevious) / totalFacturadoPrevious) * 100;
        tendenciaSymbol = tendenciaPorcentaje >= 0 ? '↗️' : '↘️';
      } else if (totalFacturado > 0 && totalFacturadoPrevious === 0) {
        // Si hay datos este mes pero no el anterior
        tendenciaPorcentaje = 100;
        tendenciaSymbol = '↗️';
      }

      return {
        totalFacturado,
        totalBiopsias,
        totalPAP,
        totalCitologia,
        totalBX,
        totalUrgentes,
        costoPromedio,
        totalRemitos: totalRemitosDelMes,
        totalPQ,
        totalOtros,
        // Nuevos datos
        totalFacturadoPrevious,
        tendenciaPorcentaje,
        tendenciaSymbol
      };
    };

    const financialData = calculateFinancialData();

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '0',
          width: '98vw',
          height: '96vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Header con Gradiente */}
          <div style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 25%, #1e40af 75%, #2563eb 100%)',
            color: 'white',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '8px 8px 0 0',
            flexShrink: 0
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BarChart3 style={{ height: '28px', width: '28px' }} />
                Estadísticas y Facturación
              </h2>
              <p style={{
                fontSize: '14px',
                opacity: 0.9,
                margin: '4px 0 0 0'
              }}>
                Dr/a. {doctorInfo.name}{doctorInfo.hospital && doctorInfo.hospital !== 'No especificado' && doctorInfo.hospital.trim() ? ` - ${doctorInfo.hospital}` : ''}
              </p>
            </div>
            
            <button
              onClick={() => setShowStatistics(false)}
              style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: 'normal',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => { 
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              ×
            </button>
          </div>

          {/* Contenido Principal - Diseño en Grid sin Scroll */}
          <div style={{
            flex: 1,
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto auto',
            gap: '12px',
            overflow: 'hidden'
          }}>
            
            {/* Fila 1: KPIs con íconos */}
            <div style={{
              gridColumn: '1 / -1',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {[
                { icon: <DollarSign size={32} strokeWidth={1.5} />, label: 'TOTAL FACTURADO', value: `$${financialData.totalFacturado.toLocaleString()}`, bg: '#0c4a6e', bg2: '#0369a1' },
                { icon: <BarChart3 size={32} strokeWidth={1.5} />, label: 'PROMEDIO/ESTUDIO', value: `$${financialData.costoPromedio}`, bg: '#1e40af', bg2: '#3b82f6' },
                { icon: <FileText size={32} strokeWidth={1.5} />, label: 'REMITOS DEL MES', value: financialData.totalRemitos, bg: '#1e3a5f', bg2: '#1e40af' },
                { icon: <Activity size={32} strokeWidth={1.5} />, label: 'TOTAL ESTUDIOS', value: financialData.totalBiopsias, bg: '#0f4c75', bg2: '#1b6ca8' }
              ].map((kpi, i) => (
                <div key={i} style={{
                  background: `linear-gradient(135deg, ${kpi.bg} 0%, ${kpi.bg2} 100%)`,
                  color: 'white', padding: '10px 6px', borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px'
                }}>
                  <div style={{ opacity: 0.4 }}>{kpi.icon}</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', lineHeight: 1 }}>{kpi.value}</div>
                  <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.3px' }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Selector de Mes - Inline */}
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <Calendar style={{ height: '12px', width: '12px', color: '#94a3b8', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', whiteSpace: 'nowrap' }}>Período:</span>
              <select
                value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setSelectedYear(parseInt(year));
                  setSelectedMonth(parseInt(month));
                }}
                style={{
                  backgroundColor: 'transparent', color: '#1e293b',
                  border: 'none', borderBottom: '1px solid #cbd5e1',
                  padding: '2px 4px', fontSize: '12px', fontWeight: '700',
                  cursor: 'pointer', outline: 'none'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date(); d.setMonth(d.getMonth() - i);
                  const y = d.getFullYear(), m = d.getMonth();
                  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
                  return <option key={`${y}-${m}`} value={`${y}-${m.toString().padStart(2, '0')}`}>{names[m]} {y}</option>;
                })}
              </select>
            </div>

            {/* Fila 2: Detalle de Estudios - ocupa todo el box */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Detalle de Estudios
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '6px', flex: 1 }}>
                {[
                  { label: 'BX', val: financialData.totalBX, badge: '#1e40af' },
                  { label: 'PQ', val: financialData.totalPQ || 0, badge: '#0369a1' },
                  { label: 'PAP', val: financialData.totalPAP, badge: '#4338ca' },
                  { label: 'Cito', val: financialData.totalCitologia, badge: '#475569' }
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: item.badge, border: 'none',
                    borderRadius: '10px', padding: '8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxSizing: 'border-box', textAlign: 'center', aspectRatio: '1'
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '6px',
                      padding: '3px 12px', fontSize: '16px', fontWeight: '700', color: 'white'
                    }}>{item.val}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => alert(`Reporte preparado para enviar a ${doctorInfo.email}.`)}
                style={{
                  width: '100%', marginTop: '10px', padding: '10px',
                  background: '#1e40af', color: 'white', border: 'none',
                  borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px'
                }}
              >
                <Mail size={14} /> Enviar detalle a mi email
              </button>
            </div>

            {/* Fila 2: Resumen Financiero */}
            <div style={{
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#374151',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <DollarSign style={{ height: '20px', width: '20px', color: '#10b981' }} />
                Resumen Financiero
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Gráfico de barras simple */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '12px' }}>
                    Distribución de Facturación
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Este Mes */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#374151' }}>Este Mes</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                          ${financialData.totalFacturado.toLocaleString()}
                        </span>
                      </div>
                      <div style={{
                        height: '8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          backgroundColor: '#3b82f6',
                          width: financialData.totalFacturado > 0 || financialData.totalFacturadoPrevious > 0 
                            ? `${Math.min(100, (financialData.totalFacturado / Math.max(financialData.totalFacturado, financialData.totalFacturadoPrevious, 1)) * 100)}%` 
                            : '0%',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                    </div>

                    {/* Mes anterior */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#374151' }}>Mes Anterior</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                          ${financialData.totalFacturadoPrevious.toLocaleString()}
                        </span>
                      </div>
                      <div style={{
                        height: '8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          backgroundColor: '#10b981',
                          width: financialData.totalFacturado > 0 || financialData.totalFacturadoPrevious > 0 
                            ? `${Math.min(100, (financialData.totalFacturadoPrevious / Math.max(financialData.totalFacturado, financialData.totalFacturadoPrevious, 1)) * 100)}%` 
                            : '0%',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tendencia */}
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#0369a1', marginBottom: '4px' }}>
                    Tendencia Mensual
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#0369a1' }}>
                    {financialData.tendenciaPorcentaje === 0 
                      ? '0%' 
                      : `${financialData.tendenciaPorcentaje > 0 ? '+' : ''}${financialData.tendenciaPorcentaje.toFixed(1)}% ${financialData.tendenciaSymbol}`
                    }
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            borderRadius: '0 0 12px 12px',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Última actualización: {new Date().toLocaleString('es-AR')}
            </div>
            <button
              onClick={() => setShowStatistics(false)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 4px 12px -2px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(59, 130, 246, 0.3)';
              }}
            >
              Cerrar Panel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Funciones para generar códigos QR
  const generateQRCode = async (data: string): Promise<string> => {
    try {
      console.log('🎯 Generando QR para datos de longitud:', data.length);
      console.log('🎯 Primeros 100 caracteres:', data.substring(0, 100));
      
      // Verificar si los datos son demasiado largos para QR
      if (data.length > 2000) {
        console.warn('⚠️ Datos muy largos para QR, longitud:', data.length);
        throw new Error(`Datos demasiado largos para QR: ${data.length} caracteres`);
      }
      
      // Usar la librería qrcode para generar un QR real
      const qrDataURL = await QRCodeLib.toDataURL(data, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'L', // Nivel más bajo para permitir más datos
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log('✅ QR generado correctamente, tamaño final:', qrDataURL.length);
      return qrDataURL;
    } catch (error) {
      console.error('❌ Error generando QR:', error);
      
      // Crear imagen de error más informativa
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 300;
      canvas.height = 300;
      
      if (ctx) {
        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 300);
        
        // Borde rojo
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 280, 280);
        
        // Texto de error
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('❌ ERROR QR', 150, 60);
        
        ctx.font = '12px Arial';
        ctx.fillText('No se pudo generar', 150, 100);
        ctx.fillText('el código QR', 150, 120);
        
        if (error instanceof Error) {
          ctx.font = '10px Arial';
          ctx.fillStyle = '#666666';
          const errorLines = error.message.match(/.{1,30}/g) || ['Error desconocido'];
          errorLines.forEach((line, index) => {
            ctx.fillText(line, 150, 160 + (index * 15));
          });
        }
        
        // Instrucciones
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('💡 Solución:', 150, 220);
        ctx.font = '10px Arial';
        ctx.fillText('Usa el botón "📄 Remito"', 150, 240);
        ctx.fillText('para descargar el archivo', 150, 255);
      }
      
      return canvas.toDataURL();
    }
  };

  const handleQRGeneration = async (type: 'remito' | 'doctor' | 'estadisticas' | 'backup') => {
    console.log('🔄 Iniciando generación QR tipo:', type);
    let data: any;
    let title: string;

    switch (type) {
      case 'remito':
        // Generar QR con link simple para WhatsApp y datos del remito
        const lastRemito = getLastRemito();
        console.log('📄 Último remito encontrado:', lastRemito);
        
        // Generar el contenido del remito para descarga
        const remitoContent = generateRemitoContent(lastRemito);
        console.log('📄 Longitud del remito:', remitoContent.length);
        
        // Mensaje CORTO para WhatsApp (sin el remito completo para evitar límites)
        const whatsappMessage = `🏥 *REMITO ANATOMÍA PATOLÓGICA*\n\n` +
          `👨‍⚕️ *Doctor:* ${doctorInfo.name}\n` +
          `🏥 *Hospital:* ${doctorInfo.hospital}\n` +
          `📅 *Fecha:* ${lastRemito?.date || new Date().toLocaleDateString('es-AR')}\n` +
          `🔬 *Total Biopsias:* ${lastRemito?.biopsies?.length || 0}\n` +
          `📋 *ID Remito:* ${lastRemito?.id || 'SIN_ID'}\n\n` +
          `� *Enviado desde BiopsyTracker*`;
        
        console.log('📱 Longitud del mensaje WhatsApp:', whatsappMessage.length);
        
        // URL simple para WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
        console.log('🔗 Longitud URL WhatsApp:', whatsappUrl.length);
        
        // Crear datos simples para el QR
        data = {
          tipo: 'REMITO_DESCARGA',
          whatsapp: whatsappUrl,
          remito: {
            doctor: doctorInfo.name,
            hospital: doctorInfo.hospital,
            fecha: lastRemito?.date || new Date().toLocaleDateString('es-AR'),
            total_biopsias: lastRemito?.biopsies?.length || 0,
            id: lastRemito?.id || 'SIN_ID'
          },
          instrucciones: [
            '📱 Escanea este QR con tu teléfono',
            '💬 Se abrirá WhatsApp con el remito completo',
            '� Todo el contenido está en el mensaje',
            '✅ Solo tienes que enviarlo'
          ]
        };
        title = 'QR - Enviar Remito por WhatsApp';
        break;

      case 'doctor':
        // Generar QR con datos del doctor (tarjeta de contacto)
        data = {
          tipo: 'CONTACTO_DOCTOR',
          nombre: doctorInfo.name,
          email: doctorInfo.email,
          hospital: doctorInfo.hospital,
          especialidad: 'Anatomía Patológica',
          sistema: 'BiopsyTracker',
          fecha_registro: doctorInfo.loginDate || new Date().toLocaleDateString('es-AR'),
          vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${doctorInfo.name}\nORG:${doctorInfo.hospital}\nEMAIL:${doctorInfo.email}\nTITLE:Anatomía Patológica\nEND:VCARD`
        };
        title = 'QR - Datos del Doctor';
        break;

      case 'estadisticas':
        // Generar QR con estadísticas del día (resumen completo)
        data = {
          tipo: 'ESTADISTICAS_DIARIAS',
          doctor: doctorInfo.name,
          hospital: doctorInfo.hospital,
          fecha: new Date().toLocaleDateString('es-AR'),
          resumen_hoy: {
            total_biopsias: todayBiopsiesCount,
            con_servicios_especiales: biopsiesWithServices,
            eficiencia_estimada: `${efficiency}%`
          },
          resumen_historico: {
            total_remitos: stats.totalRemitos,
            total_biopsias: stats.totalBiopsias,
            promedio_por_remito: stats.promedioPorRemito,
            tejidos_mas_frecuentes: stats.topTissues.slice(0, 3).map(([tejido, cantidad]) => `${tejido}: ${cantidad}`)
          },
          generado: new Date().toLocaleString('es-AR')
        };
        title = 'QR - Estadísticas';
        break;

      case 'backup':
        // Generar QR con información de backup (metadatos y instrucciones)
        const backupData = exportAllData();
        const backupSize = JSON.stringify(backupData).length;
        data = {
          tipo: 'BACKUP_DATOS',
          doctor: doctorInfo.name,
          hospital: doctorInfo.hospital,
          fecha_backup: new Date().toLocaleString('es-AR'),
          informacion: {
            tamano_datos: `${Math.round(backupSize / 1024)} KB`,
            checksum: generateChecksum(backupData),
            incluye: [
              'Datos del doctor',
              'Historial de remitos',
              'Configuraciones',
              `${stats.totalRemitos} remitos guardados`,
              `${stats.totalBiopsias} biopsias registradas`
            ]
          },
          instrucciones: 'Para restaurar: contactar con soporte técnico con este código QR',
          codigo_restauracion: generateChecksum(backupData).substring(0, 8).toUpperCase()
        };
        title = 'QR - Backup de Datos';
        break;
    }

    // Generar el QR y actualizar estados
    console.log('📊 Datos preparados para QR:', data);
    setIsGeneratingQR(true);
    try {
      // Para remito, usar solo la URL de WhatsApp (más simple y funcional)
      let qrContent;
      if (data.tipo === 'REMITO_DESCARGA') {
        qrContent = data.whatsapp; // Solo la URL de WhatsApp
        console.log('📱 Generando QR para URL WhatsApp');
        console.log('🔗 URL longitud:', qrContent.length);
        console.log('🔗 URL:', qrContent.substring(0, 100) + '...');
      } else {
        qrContent = JSON.stringify(data, null, 2);
        console.log('📊 Generando QR para datos JSON');
      }
      
      const qrImage = await generateQRCode(qrContent);
      console.log('✅ QR generado exitosamente');
      setQrImageSrc(qrImage);
      setQrData({ type, data, title });
      setShowQRModal(true);
    } catch (error) {
      console.error('❌ Error generando QR:', error);
      alert(`Error generando el código QR: ${error.message}`);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const getLastRemito = () => {
    try {
      let historyData = {};
      
      if (doctorInfo.email) {
        const normalizedEmail = doctorInfo.email.toLowerCase().trim().replace(/\s+/g, '');
        const doctorKey = `doctor_${normalizedEmail}`;
        const historyKey = `${doctorKey}_history`;
        historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
      } else {
        const historyKey = `${doctorInfo.name}_history`;
        historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
      }

      const entries = Object.values(historyData) as any[];
      return entries.length > 0 ? entries[entries.length - 1] : null;
    } catch {
      return null;
    }
  };

  const exportAllData = () => {
    try {
      let allData = {};
      
      if (doctorInfo.email) {
        const normalizedEmail = doctorInfo.email.toLowerCase().trim().replace(/\s+/g, '');
        const doctorKey = `doctor_${normalizedEmail}`;
        allData = {
          doctor: localStorage.getItem(doctorKey),
          history: localStorage.getItem(`${doctorKey}_history`),
          settings: localStorage.getItem(`${doctorKey}_settings`)
        };
      } else {
        allData = {
          doctor: JSON.stringify(doctorInfo),
          history: localStorage.getItem(`${doctorInfo.name}_history`),
          settings: localStorage.getItem(`${doctorInfo.name}_settings`)
        };
      }

      return allData;
    } catch {
      return {};
    }
  };

  const generateChecksum = (data: any): string => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  };

  const generateRemitoContent = (remito: any): string => {
    const fecha = remito?.date || new Date().toLocaleDateString('es-AR');
    const biopsies = remito?.biopsies || [];
    
    let content = `🏥 REMITO DE ANATOMÍA PATOLÓGICA\n`;
    content += `═══════════════════════════════════\n\n`;
    
    content += `📋 DATOS GENERALES\n`;
    content += `───────────────────\n`;
    content += `👨‍⚕️ Médico: ${doctorInfo.name}\n`;
    content += `🏥 Hospital: ${doctorInfo.hospital}\n`;
    content += `📧 Email: ${doctorInfo.email}\n`;
    content += `📅 Fecha: ${fecha}\n`;
    content += `🔢 ID Remito: ${remito?.id || 'SIN_ID'}\n`;
    content += `🔬 Total Biopsias: ${biopsies.length}\n\n`;
    
    if (biopsies.length > 0) {
      content += `📊 DETALLE DE BIOPSIAS\n`;
      content += `═══════════════════════\n\n`;
      
      biopsies.forEach((biopsy: any, index: number) => {
        content += `🔬 BIOPSIA #${index + 1}\n`;
        content += `──────────────────\n`;
        content += `🆔 Número: ${biopsy.number || `BX-${index + 1}`}\n`;
        content += `🧬 Tipo de Tejido: ${biopsy.tissueType || '-'}\n`;
        content += `📦 Cassettes: ${biopsy.cassettes || 0}\n`;
        content += `🔍 Procedimiento: ${biopsy.procedureType || 'Biopsia'}\n`;
        
        if (biopsy.organ) {
          content += `🫀 Órgano: ${biopsy.organ}\n`;
        }
        
        // Servicios adicionales
        const servicios = Object.keys(biopsy.servicios || {}).filter(key => biopsy.servicios[key]);
        if (servicios.length > 0) {
          content += `⚡ Servicios: ${servicios.join(', ')}\n`;
        } else {
          content += `⚡ Servicios: Rutina\n`;
        }
        
        if (biopsy.observations) {
          content += `📝 Observaciones: ${biopsy.observations}\n`;
        }
        
        content += `\n`;
      });
      
      // Resumen
      const totalCassettes = biopsies.reduce((sum: number, b: any) => sum + (b.cassettes || 0), 0);
      const serviciosEspeciales = biopsies.filter((b: any) => 
        Object.keys(b.servicios || {}).some(key => b.servicios[key])
      ).length;
      
      content += `📈 RESUMEN\n`;
      content += `──────────\n`;
      content += `📦 Total Cassettes: ${totalCassettes}\n`;
      content += `⚡ Con Servicios Especiales: ${serviciosEspeciales}\n`;
      content += `🔬 Biopsias de Rutina: ${biopsies.length - serviciosEspeciales}\n\n`;
    }
    
    content += `═══════════════════════════════════\n`;
    content += `⏰ Generado: ${new Date().toLocaleString('es-AR')}\n`;
    content += `🔧 Sistema: BiopsyTracker v2.3.0\n`;
    content += `═══════════════════════════════════`;
    
    return content;
  };

  const copyQRData = () => {
    if (qrData) {
      const textData = JSON.stringify(qrData.data, null, 2);
      navigator.clipboard.writeText(textData).then(() => {
        alert('Datos copiados al portapapeles');
      });
    }
  };

  // Función de búsqueda avanzada
  // Auto-buscar cuando cambian tissueType o hasServices
  const prevTissueRef = React.useRef(searchFilters.tissueType);
  const prevServicesRef = React.useRef(searchFilters.hasServices);
  React.useEffect(() => {
    if (showSearchModal && (searchFilters.tissueType !== prevTissueRef.current || searchFilters.hasServices !== prevServicesRef.current)) {
      prevTissueRef.current = searchFilters.tissueType;
      prevServicesRef.current = searchFilters.hasServices;
      performAdvancedSearch();
    }
  }, [searchFilters.tissueType, searchFilters.hasServices, showSearchModal]);

  const performAdvancedSearch = () => {
    try {
      let allBiopsies: any[] = [];
      
      // Obtener todos los datos del historial
      if (doctorInfo.email) {
        const normalizedEmail = doctorInfo.email.toLowerCase().trim().replace(/\s+/g, '');
        const doctorKey = `doctor_${normalizedEmail}`;
        const historyKey = `${doctorKey}_history`;
        const historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
        
        Object.values(historyData).forEach((entry: any) => {
          if (entry.biopsies) {
            entry.biopsies.forEach((biopsy: any) => {
              allBiopsies.push({
                ...biopsy,
                date: entry.date,
                timestamp: entry.timestamp || biopsy.timestamp,
                remitoId: entry.id
              });
            });
          }
        });
      } else {
        const historyKey = `${doctorInfo.name}_history`;
        const historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
        
        Object.values(historyData).forEach((entry: any) => {
          if (entry.biopsies) {
            entry.biopsies.forEach((biopsy: any) => {
              allBiopsies.push({
                ...biopsy,
                date: entry.date,
                timestamp: entry.timestamp || biopsy.timestamp,
                remitoId: entry.id
              });
            });
          }
        });
      }
      
      // Incluir biopsias actuales
      todayBiopsies.forEach(biopsy => {
        allBiopsies.push({
          ...biopsy,
          date: new Date().toISOString().split('T')[0],
          remitoId: 'ACTUAL'
        });
      });
      
      // Aplicar filtros
      let filteredResults = allBiopsies.filter(biopsy => {
        // Filtro por texto general
        if (searchFilters.query) {
          const query = searchFilters.query.toLowerCase();
          const matchesQuery = 
            (biopsy.number || '').toLowerCase().includes(query) ||
            (biopsy.tissueType || '').toLowerCase().includes(query) ||
            (biopsy.organ || '').toLowerCase().includes(query) ||
            (biopsy.observations || '').toLowerCase().includes(query);
          if (!matchesQuery) return false;
        }
        
        // Filtro por tipo de tejido o tipo de estudio
        if (searchFilters.tissueType) {
          if (searchFilters.tissueType === '__BX') {
            if (biopsy.type === 'PQ' || biopsy.tissueType === 'PAP' || biopsy.tissueType === 'Citología') return false;
          } else if (searchFilters.tissueType === '__PQ') {
            if (biopsy.type !== 'PQ') return false;
          } else if (searchFilters.tissueType === '__PAP') {
            if (biopsy.tissueType !== 'PAP' && !(biopsy.papQuantity > 0)) return false;
          } else if (searchFilters.tissueType === '__CITO') {
            if (biopsy.tissueType !== 'Citología' && !(biopsy.citologiaQuantity > 0)) return false;
          } else {
            // Filtro por tejido específico (ignorando tildes y mayúsculas)
            const filterNorm = searchFilters.tissueType.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const biopsyNorm = (biopsy.tissueType || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            if (!biopsyNorm.includes(filterNorm)) return false;
          }
        }
        
        // Filtro por fecha
        if (searchFilters.dateFrom || searchFilters.dateTo) {
          // entry.date puede ser "Tue Apr 08 2026" (toDateString) o ISO, normalizar
          let biopsyDate = '';
          if (biopsy.timestamp) {
            biopsyDate = biopsy.timestamp.substring(0, 10);
          } else if (biopsy.date) {
            const d = new Date(biopsy.date);
            if (!isNaN(d.getTime())) {
              biopsyDate = d.toISOString().substring(0, 10);
            }
          }
          if (!biopsyDate) return false;
          if (searchFilters.dateFrom && biopsyDate < searchFilters.dateFrom) return false;
          if (searchFilters.dateTo && biopsyDate > searchFilters.dateTo) return false;
        }
        
        // Filtro por servicios especiales (solo urgentes y servicios adicionales, NO PAP/Citología comunes)
        if (searchFilters.hasServices) {
          const specialServiceKeys = ['cassetteUrgente', 'papUrgente', 'citologiaUrgente', 'corteBlancoIHQ', 'corteBlancoComun', 'giemsaPASMasson'];
          const hasSpecialServices = Object.keys(biopsy.servicios || {}).some(key =>
            specialServiceKeys.includes(key) && biopsy.servicios[key]
          );
          if (!hasSpecialServices) return false;
        }
        
        return true;
      });
      
      // Ordenar por fecha (más recientes primero)
      filteredResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSearchResults([]);
    }
  };

  const clearSearchFilters = () => {
    setSearchFilters({
      query: '',
      dateFrom: '',
      dateTo: '',
      tissueType: '',
      hasServices: false,
      doctorName: ''
    });
    setSearchResults([]);
  };

  // Función para reiniciar todo al cerrar el modal
  const closeSearchModal = () => {
    setShowSearchModal(false);
    clearSearchFilters();
    setShowKeyboard(false);
    setActiveField(null);
  };

  // Funciones para el teclado virtual
  const handleKeyPress = (key: string) => {
    if (activeField === 'search-query') {
      const k = key.toLowerCase();
      if (k === 'backspace') {
        setSearchFilters(prev => ({ ...prev, query: prev.query.slice(0, -1) }));
      } else if (k === 'space') {
        setSearchFilters(prev => ({ ...prev, query: prev.query + ' ' }));
      } else if (k === 'clear') {
        setSearchFilters(prev => ({ ...prev, query: '' }));
      } else if (k === 'shift') {
        // ignorar
      } else {
        setSearchFilters(prev => ({ ...prev, query: prev.query + key }));
      }
    }
  };

  const handleKeyboardConfirm = () => {
    setShowKeyboard(false);
    setActiveField(null);
  };

  const handleFieldFocus = (fieldName: string) => {
    setActiveField(fieldName);
    setKeyboardType('full');
    setShowKeyboard(true);
  };

  // Función para formatear fechas en español
  const formatDateSpanish = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName} ${day} de ${month} ${year}`;
  };

  // Función para extraer información detallada del remito
  const getDetailedRemitoInfo = (remitoId: string) => {
    if (remitoId === 'ACTUAL') {
      return 'En curso';
    }
    
    // Extraer fecha del ID del remito
    const parts = remitoId.split('_');
    if (parts.length >= 3) {
      const datePart = parts.slice(2, -1).join('_'); // Tomar la parte de fecha
      try {
        const date = new Date(datePart);
        if (!isNaN(date.getTime())) {
          return formatDateSpanish(date.toISOString());
        }
      } catch (e) {
        // Si falla, extraer al menos el día
        if (datePart.includes('Aug')) return datePart.replace('Aug', 'Agosto');
        if (datePart.includes('Sep')) return datePart.replace('Sep', 'Septiembre');
        if (datePart.includes('Oct')) return datePart.replace('Oct', 'Octubre');
        if (datePart.includes('Nov')) return datePart.replace('Nov', 'Noviembre');
        if (datePart.includes('Dec')) return datePart.replace('Dec', 'Diciembre');
        if (datePart.includes('Jan')) return datePart.replace('Jan', 'Enero');
        if (datePart.includes('Feb')) return datePart.replace('Feb', 'Febrero');
        if (datePart.includes('Mar')) return datePart.replace('Mar', 'Marzo');
        if (datePart.includes('Apr')) return datePart.replace('Apr', 'Abril');
        if (datePart.includes('May')) return datePart.replace('May', 'Mayo');
        if (datePart.includes('Jun')) return datePart.replace('Jun', 'Junio');
        if (datePart.includes('Jul')) return datePart.replace('Jul', 'Julio');
      }
    }
    
    return remitoId;
  };

  // Función para obtener detalles completos de la biopsia
  const getBiopsyDetails = (result: any) => {
    const details: string[] = [];
    
    // Cantidad de cassettes
    if (result.cassettes && result.cassettes > 0) {
      details.push(`${result.cassettes} cassette${result.cassettes > 1 ? 's' : ''}`);
    }
    
    // Cantidad de trozos
    if (result.pieces && result.pieces > 0) {
      details.push(`${result.pieces} trozo${result.pieces > 1 ? 's' : ''}`);
    }
    
    // Tipo abreviado (BX o PQ)
    if (result.tissueType) {
      if (result.tissueType.toLowerCase().includes('biopsia')) {
        details.push('BX');
      } else if (result.tissueType.toLowerCase().includes('pieza') || result.tissueType.toLowerCase().includes('quirúrgic')) {
        details.push('PQ');
      } else if (result.tissueType.toLowerCase().includes('pap')) {
        details.push('PAP');
      } else if (result.tissueType.toLowerCase().includes('citolog')) {
        details.push('CIT');
      }
    }
    
    return details.join(' • ');
  };

  // Función para obtener servicios especiales detallados
  const getSpecialServices = (result: any) => {
    const services: string[] = [];
    const servicios = result.servicios || {};

    if (servicios.cassetteUrgente) services.push('Cassette Urgente');
    if (servicios.corteBlancoIHQ) services.push('Corte Blanco IHQ');
    if (servicios.corteBlancoComun) services.push('Corte Blanco Común');
    if (servicios.giemsaPASMasson) services.push('Giemsa/PAS/Masson');
    if (servicios.pap) services.push('PAP');
    if (servicios.papUrgente) services.push('PAP Urgente');
    if (servicios.citologia) services.push('Citología');
    if (servicios.citologiaUrgente) services.push('Citología Urgente');

    return services;
  };

  const downloadQRData = () => {
    if (qrData) {
      const textData = JSON.stringify(qrData.data, null, 2);
      const blob = new Blob([textData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${qrData.type}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={{ height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header Optimizado para Tablet */}
      {(() => {
        let labCfg = { nombre: '', logoUrl: '' };
        try { labCfg = JSON.parse(localStorage.getItem('labConfig') || '{}'); } catch {}
        return null;
      })()}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
        padding: '10px 16px',
        flexShrink: 0
      }}>
        {/* Fila superior: logo centrado + controles a la derecha */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', minHeight: '50px' }}>
          {/* Logo centrado - absolute */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            {(() => {
              let labCfg: any = { nombre: '', logoUrl: '', logoMarginTop: 0 };
              try { labCfg = JSON.parse(localStorage.getItem('labConfig') || '{}'); } catch {}
              return (
                <div style={{ marginTop: (labCfg.logoMarginTop || 0) + 'px' }}>
                  {labCfg.logoUrl ? (
                    <img
                      src={labCfg.logoUrl}
                      alt={labCfg.nombre || 'Laboratorio'}
                      style={{ height: '70px', maxWidth: '400px', objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      {labCfg.nombre || 'Laboratorio de Anatomía Patológica'}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          {/* Controles - derecha */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', zIndex: 1 }}>
            <button
              onClick={() => { if (showNotifications) { closeNotifications(); } else { loadNotifications(); setShowNotifications(true); } }}
              style={{
                padding: '6px', backgroundColor: 'transparent', border: 'none',
                borderRadius: '6px', cursor: 'pointer', position: 'relative'
              }}
            >
              <Bell style={{ height: '16px', width: '16px', color: 'rgba(255,255,255,0.8)' }} />
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: '0', right: '0',
                  width: '14px', height: '14px', borderRadius: '50%',
                  backgroundColor: '#ef4444', color: 'white', fontSize: '8px',
                  fontWeight: 'bold', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '2px solid #1e3a5f'
                }}>
                  {unreadCount}
                </div>
              )}
            </button>
            <button
              onClick={onLogout}
              style={{
                padding: '6px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Cerrar sesión"
            >
              <LogOut style={{ height: '16px', width: '16px', color: 'rgba(255,255,255,0.8)' }} />
            </button>
          </div>
        </div>
        {/* Datos de contacto del laboratorio */}
        {(() => {
          let labCfg: any = {};
          try { labCfg = JSON.parse(localStorage.getItem('labConfig') || '{}'); } catch {}
          const contacto = [labCfg.direccion, labCfg.telefono, labCfg.email].filter(Boolean);
          return contacto.length > 0 ? (
            <div style={{ textAlign: 'center', fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: (2 + (labCfg.infoMarginTop || 0)) + 'px', fontWeight: '400' }}>
              {contacto.join(' | ')}
            </div>
          ) : null;
        })()}
        {/* Info del doctor - ABAJO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '6px' }}>
          <div>
            <h1 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.95)',
              margin: 0,
              lineHeight: '1.2'
            }}>
              Dr. {(doctorInfo.name || '').replace(/\s*-?\s*No especificado/gi, '').trim()}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
              {doctorInfo.hospital && doctorInfo.hospital !== 'No especificado' && (
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', margin: 0, fontWeight: '500' }}>{doctorInfo.hospital}</p>
              )}
              {doctorInfo.email && (
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{doctorInfo.email}</p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ConnectionStatus isOnline={isOnline} backupStatus={backupStatus} syncQueueLength={syncQueueLength} />
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido Principal - Sin scroll, ajustado 100% a tablet */}
      <div style={{
        padding: '10px 12px',
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Métricas del día - Compacto */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
          color: 'white',
          padding: '14px 16px',
          borderRadius: '14px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '13px', fontWeight: '600', marginBottom: '10px', textAlign: 'center', opacity: 0.9
            }}>
              Resumen del Día — {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              {[
                { val: todayBiopsiesCount, label: 'Pacientes' },
                { val: biopsiesWithServices, label: 'Con Servicios' },
                { val: `${efficiency}%`, label: 'Eficiencia' },
                { val: stats.totalRemitos, label: 'Remitos' }
              ].map((m, i) => (
                <div key={i} style={{
                  backgroundColor: 'rgba(255,255,255,0.12)', padding: '10px 6px',
                  borderRadius: '10px', backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: '1' }}>{m.val}</div>
                  <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '4px' }}>{m.label}</div>
                </div>
              ))}
            </div>
            {/* Barra progreso inline */}
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', opacity: 0.8, whiteSpace: 'nowrap' }}>{todayBiopsiesCount}/12</span>
              <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  backgroundColor: 'white', height: '100%', borderRadius: '6px',
                  width: `${Math.min(100, (todayBiopsiesCount / 12) * 100)}%`, transition: 'width 0.8s'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Botón principal: Nuevo Paciente */}
        <button
          onClick={() => { onStartNewBiopsy(); }}
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            color: 'white', fontWeight: '700', padding: '22px',
            borderRadius: '16px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '14px', border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(30,64,175,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            fontSize: '20px', touchAction: 'manipulation', transition: 'all 0.2s'
          }}
        >
          <Plus style={{ height: '28px', width: '28px' }} />
          Nuevo Paciente
          <span style={{ fontSize: '14px', opacity: 0.7, fontWeight: '500' }}>#{todayBiopsiesCount + 1}</span>
        </button>

        {/* Grid 3 botones secundarios - más grandes con glass effect */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', flex: 1 }}>
          {[
            { onClick: () => setShowSearchModal(true), icon: <Search style={{ height: '28px', width: '28px', color: '#1e40af' }} />, label: 'Búsqueda', sub: 'Filtrar' },
            { onClick: onViewHistory, icon: <History style={{ height: '28px', width: '28px', color: '#1e40af' }} />, label: 'Historial', sub: `${stats.totalRemitos} remitos` },
            { onClick: () => setShowStatistics(true), icon: <TrendingUp style={{ height: '28px', width: '28px', color: '#1e40af' }} />, label: 'Facturación', sub: 'Estadísticas' }
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#1e293b', fontWeight: '600',
                borderRadius: '16px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '8px',
                border: '1px solid rgba(30,64,175,0.12)', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                transition: 'all 0.2s', touchAction: 'manipulation'
              }}
            >
              {btn.icon}
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{btn.label}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{btn.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Branding BiopsyTracker - Footer discreto */}
      <div style={{
        textAlign: 'center',
        padding: '4px 0',
        background: '#f1f5f9',
        borderTop: '1px solid #e2e8f0',
        flexShrink: 0
      }}>
        <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '500' }}>
          Powered by BiopsyTracker
        </span>
      </div>

      {/* Alerta verde: Remito listo para retirar */}
      {listoAlert && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            borderRadius: '20px', padding: '32px', maxWidth: '380px', width: '100%',
            textAlign: 'center', color: 'white',
            boxShadow: '0 25px 60px rgba(5, 150, 105, 0.4)',
            animation: 'pulse 2s infinite'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
              Material Listo
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5', marginBottom: '20px', whiteSpace: 'pre-line' }}>
              {listoAlert.mensaje}
            </div>
            <button
              onClick={() => {
                // Marcar TODAS las de listo/parcial como leídas
                try {
                  const all = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
                  const updated = all.map((n: any) => (n.tipo === 'listo' || n.tipo === 'parcial') && !n.leida ? { ...n, leida: true } : n);
                  localStorage.setItem('doctorNotifications', JSON.stringify(updated));
                  // Sync todas a Supabase
                  all.filter((n: any) => (n.tipo === 'listo' || n.tipo === 'parcial') && !n.leida).forEach((n: any) => {
                    db.markNotificationRead(n.id).catch(() => {});
                  });
                  setNotificationsData(updated.filter((n: any) => n.medicoEmail === doctorInfo.email));
                } catch {}
                setListoAlert(null);
              }}
              style={{
                background: 'white', color: '#059669', border: 'none',
                padding: '14px 40px', borderRadius: '12px', fontSize: '16px',
                fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>

      {/* Panel de notificaciones del médico */}
      {showNotifications && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div
            onClick={closeNotifications}
            style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'transparent' }}
          />
          <div style={{
            position: 'fixed', top: '70px', right: '12px', zIndex: 1000,
            backgroundColor: 'white', borderRadius: '12px', width: '320px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0',
            maxHeight: '350px', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
            }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                Notificaciones {unreadCount > 0 && <span style={{ fontSize: '11px', color: '#1e40af' }}>({unreadCount} nuevas)</span>}
              </span>
              <button onClick={closeNotifications} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', padding: '0 4px', lineHeight: 1
              }}>×</button>
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
              {notificationsData.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Sin notificaciones
                </div>
              ) : (
                notificationsData.slice().sort((a: any, b: any) => new Date(b.fecha || b.date || 0).getTime() - new Date(a.fecha || a.date || 0).getTime()).map((n: any, i: number) => (
                  <div key={n.id || i} style={{
                    padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
                    fontSize: '12px', color: '#374151',
                    backgroundColor: n.leida ? 'white' : '#eff6ff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      {!n.leida && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1e40af', flexShrink: 0 }} />}
                      <span style={{ fontWeight: '600', color: n.tipo === 'listo' || n.tipo === 'parcial' ? '#059669' : '#1e40af', fontSize: '12px' }}>{n.tipo === 'listo' ? '✅ Listo para retirar' : n.tipo === 'parcial' ? '🟢 Material listo (parcial)' : 'Remito modificado'}</span>
                    </div>
                    <div style={{ color: '#475569', lineHeight: '1.5', whiteSpace: 'pre-line', fontSize: '11px' }}>{n.mensaje || n.message || 'Se realizaron cambios en un remito'}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                      {new Date(n.fecha || n.date || Date.now()).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de Código QR */}
      {showQRModal && qrData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Header del Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: 0
              }}>
                {qrData.title}
              </h2>
              <button
                onClick={() => setShowQRModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ×
              </button>
            </div>

            {/* Opciones de Tipo de QR */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                Seleccionar tipo de QR:
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                {[
                  { type: 'remito', label: 'Último Remito', icon: FileText, color: '#3b82f6' },
                  { type: 'doctor', label: 'Datos Doctor', icon: Activity, color: '#10b981' },
                  { type: 'estadisticas', label: 'Estadísticas', icon: BarChart3, color: '#1e40af' },
                  { type: 'backup', label: 'Backup', icon: Share, color: '#f59e0b' }
                ].map(({ type, label, icon: Icon, color }) => (
                  <button
                    key={type}
                    onClick={() => handleQRGeneration(type as any)}
                    style={{
                      backgroundColor: qrData.type === type ? color : 'white',
                      color: qrData.type === type ? 'white' : '#374151',
                      border: `2px solid ${qrData.type === type ? color : '#e5e7eb'}`,
                      padding: '12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (qrData.type !== type) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = color;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (qrData.type !== type) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}
                  >
                    <Icon style={{ height: '16px', width: '16px' }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Código QR Generado */}
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '2px solid #e2e8f0'
              }}>
                {isGeneratingQR ? (
                  <div style={{
                    width: '200px',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: '#64748b'
                  }}>
                    Generando QR...
                  </div>
                ) : qrImageSrc ? (
                  <img
                    src={qrImageSrc}
                    alt="Código QR"
                    style={{
                      width: '200px',
                      height: '200px',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '200px',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: '#64748b'
                  }}>
                    Selecciona un tipo de QR
                  </div>
                )}
              </div>
            </div>

            {/* Información del QR */}
            {qrData.type === 'remito' && qrData.data.tipo === 'REMITO_DESCARGA' ? (
              // Instrucciones especiales para remito con WhatsApp
              <div style={{
                backgroundColor: '#f0f9ff',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '2px solid #10b981'
              }}>
                <h4 style={{ 
                  margin: '0 0 16px 0', 
                  fontWeight: '700', 
                  color: '#059669',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  � WhatsApp Directo
                </h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {qrData.data.instrucciones.map((instruccion: string, index: number) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      marginBottom: '8px',
                      color: '#059669'
                    }}>
                      <span style={{ 
                        fontWeight: 'bold', 
                        marginRight: '8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </span>
                      {instruccion}
                    </div>
                  ))}
                </div>
                
                {/* Información del remito */}
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #6ee7b7'
                }}>
                  <h5 style={{ margin: '0 0 8px 0', color: '#059669', fontSize: '14px', fontWeight: '600' }}>
                    📋 Contenido del mensaje:
                  </h5>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    <div>👨‍⚕️ <strong>Doctor:</strong> {qrData.data.remito.doctor}</div>
                    <div>🏥 <strong>Hospital:</strong> {qrData.data.remito.hospital}</div>
                    <div>📅 <strong>Fecha:</strong> {qrData.data.remito.fecha}</div>
                    <div>🔬 <strong>Biopsias:</strong> {qrData.data.remito.total_biopsias} casos</div>
                    <div>🆔 <strong>ID:</strong> {qrData.data.remito.id}</div>
                  </div>
                  
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#16a34a'
                  }}>
                    💡 <strong>Para adjuntar archivo:</strong> 
                    <br/>1. Haz clic en "📄 Remito" arriba para descargar el archivo
                    <br/>2. Escanea el QR para abrir WhatsApp
                    <br/>3. Adjunta manualmente el archivo descargado
                    <br/>
                    <br/>💬 <strong>Opción rápida:</strong> El mensaje ya incluye todo el remito, no necesitas adjuntar nada
                  </div>
                </div>
              </div>
            ) : (
              // Información normal para otros tipos de QR
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '14px',
                color: '#475569'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#334155' }}>
                  Datos incluidos:
                </h4>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(qrData.data, null, 2)}
                </pre>
              </div>
            )}

            {/* Botones de Acción */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: qrData.type === 'remito' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              {/* Botón especial para descargar remito */}
              {qrData.type === 'remito' && (
                <button
                  onClick={() => {
                    const lastRemito = getLastRemito();
                    const remitoContent = generateRemitoContent(lastRemito);
                    const blob = new Blob([remitoContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Remito_${lastRemito?.id || 'SIN_ID'}_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                  }}
                >
                  📄 Remito
                </button>
              )}
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(qrData.data, null, 2));
                  alert('Datos copiados al portapapeles');
                }}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                <Copy style={{ height: '16px', width: '16px' }} />
                Copiar
              </button>

              <button
                onClick={() => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);
                    
                    canvas.toBlob((blob) => {
                      if (blob) {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `QR_${qrData.type}_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    });
                  };
                  img.src = qrImageSrc;
                }}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                <Download style={{ height: '16px', width: '16px' }} />
                Descargar
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: qrData.title,
                      text: JSON.stringify(qrData.data, null, 2)
                    }).catch(console.error);
                  } else {
                    // Fallback para navegadores que no soportan Web Share API
                    const text = `${qrData.title}\n\n${JSON.stringify(qrData.data, null, 2)}`;
                    navigator.clipboard.writeText(text);
                    alert('Datos copiados al portapapeles para compartir');
                  }
                }}
                style={{
                  backgroundColor: '#1e40af',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e3a5f';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e40af';
                }}
              >
                <Share style={{ height: '16px', width: '16px' }} />
                Compartir
              </button>
            </div>

            {/* Botón Cerrar */}
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '2px solid #e2e8f0',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                width: '100%',
                marginTop: '16px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e2e8f0';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Búsqueda Avanzada */}
      {showSearchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '10px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            transition: 'height 0.3s ease-in-out'
          }}>
            {/* Header del Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '8px',
              flexShrink: 0
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Search style={{ height: '18px', width: '18px', color: '#1e40af' }} />
                Búsqueda Avanzada
              </h2>
              <button
                onClick={closeSearchModal}
                style={{
                  background: 'rgba(107, 114, 128, 0.1)',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.1)';
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <X style={{ height: '18px', width: '18px' }} />
              </button>
            </div>

            {/* Filtros de Búsqueda - Layout Compacto */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '12px',
              padding: '10px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              flexShrink: 0
            }}>
              {/* Búsqueda por texto */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: '#374151', marginBottom: '3px', display: 'block' }}>
                  Búsqueda general
                </label>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchFilters.query}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
                  onFocus={() => handleFieldFocus('search-query')}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
                <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                  Número, tejido, órgano, médico...
                </div>
              </div>

              {/* Fecha desde */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: '#374151', marginBottom: '3px', display: 'block' }}>
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={searchFilters.dateFrom}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Fecha hasta */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: '#374151', marginBottom: '3px', display: 'block' }}>
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={searchFilters.dateTo}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Tipo de tejido */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: '#374151', marginBottom: '3px', display: 'block' }}>
                  Tipo de tejido
                </label>
                <select
                  value={searchFilters.tissueType}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, tissueType: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '13px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Todos</option>
                  <option value="__BX">BX (Biopsias)</option>
                  <option value="__PQ">PQ (Piezas Quirúrgicas)</option>
                  <option value="__PAP">PAP</option>
                  <option value="__CITO">Citología</option>
                </select>
              </div>

              {/* Filtro por servicios especiales */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: '#374151', marginBottom: '3px', display: 'block' }}>
                  Servicios especiales
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: 'pointer',
                  marginTop: '8px'
                }}>
                  <input
                    type="checkbox"
                    checked={searchFilters.hasServices}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, hasServices: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', color: '#374151' }}>Solo con servicios</span>
                </label>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                <button
                  onClick={performAdvancedSearch}
                  style={{
                    backgroundColor: '#1e40af',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: 1
                  }}
                >
                  <Search style={{ height: '14px', width: '14px' }} />
                  Buscar
                </button>
                <button
                  onClick={clearSearchFilters}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: 1
                  }}
                >
                  <Filter style={{ height: '14px', width: '14px' }} />
                  Limpiar
                </button>
              </div>
            </div>

            {/* Resultados de búsqueda */}
            {searchResults.length > 0 && (
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '8px 12px',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  flexShrink: 0
                }}>
                  Resultados encontrados: {searchResults.length}
                </div>
                <div style={{
                  flex: 1,
                  overflow: 'auto'
                }}>
                  {searchResults.map((result, index) => {
                    const svc = result.servicios || {};
                    const tipo = result.type === 'PQ' ? 'PQ' : result.tissueType === 'PAP' ? 'PAP' : result.tissueType === 'Citología' ? 'CITO' : 'BX';
                    const cassettes = parseInt(result.cassettes) || 0;
                    const cn = result.cassettesNumbers || [];
                    const isUrgent = svc.cassetteUrgente || svc.papUrgente || svc.citologiaUrgente;

                    // Calcular costo
                    let costo = 0;
                    if (cassettes > 0) {
                      costo += svc.cassetteUrgente ? 400 : 300;
                      if (cassettes > 1) costo += (cassettes - 1) * 120;
                    }
                    if (result.papQuantity > 0) costo += result.papQuantity * (svc.papUrgente ? 110 : 90);
                    if (result.citologiaQuantity > 0) costo += result.citologiaQuantity * (svc.citologiaUrgente ? 120 : 90);
                    if (svc.corteBlancoComun) costo += (svc.corteBlancoComunQuantity || 1) * 60;
                    if (svc.corteBlancoIHQ) costo += (svc.corteBlancoIHQQuantity || 1) * 85;
                    if (svc.giemsaPASMasson) {
                      const gc = typeof svc.giemsaPASMasson === 'number' ? svc.giemsaPASMasson : 1;
                      costo += gc * 75;
                    }

                    // Servicios detallados
                    const serviciosDetail: string[] = [];
                    if (svc.cassetteUrgente) serviciosDetail.push('URGENTE 24hs');
                    if (svc.corteBlancoIHQ) {
                      const cassLabel = (svc.corteBlancoIHQCassettes || []).map((c: number) => c === 0 ? (cn[0]?.base || 'C') : 'S-' + (cn[c]?.suffix || c)).join(', ');
                      serviciosDetail.push('Corte IHQ ×' + (svc.corteBlancoIHQQuantity || 1) + (cassLabel ? ' [' + cassLabel + ']' : ''));
                    }
                    if (svc.corteBlancoComun) {
                      const cassLabel = (svc.corteBlancoComunCassettes || []).map((c: number) => c === 0 ? (cn[0]?.base || 'C') : 'S-' + (cn[c]?.suffix || c)).join(', ');
                      serviciosDetail.push('Corte Blanco ×' + (svc.corteBlancoComunQuantity || 1) + (cassLabel ? ' [' + cassLabel + ']' : ''));
                    }
                    if (svc.giemsaPASMasson) {
                      const opts = svc.giemsaOptions || {};
                      const t: string[] = [];
                      if (opts.giemsa) t.push('Giemsa');
                      if (opts.pas) t.push('PAS');
                      if (opts.masson) t.push('Masson');
                      const cassLabel = (svc.giemsaCassettes || []).map((c: number) => c === 0 ? (cn[0]?.base || 'C') : 'S-' + (cn[c]?.suffix || c)).join(', ');
                      serviciosDetail.push((t.length > 0 ? t.join(', ') : 'Tinciones') + (cassLabel ? ' [' + cassLabel + ']' : ''));
                    }

                    return (
                      <div key={index} style={{
                        padding: '12px', borderBottom: '1px solid #f1f5f9',
                        backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc'
                      }}>
                        {/* Header: número + tipo + tejido + costo */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>#{result.number && result.number !== '0' ? result.number : 'S/N'}</span>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                              background: tipo === 'PQ' ? '#fed7aa' : tipo === 'PAP' ? '#fce7f3' : tipo === 'CITO' ? '#ede9fe' : '#dcfce7',
                              color: tipo === 'PQ' ? '#c2410c' : tipo === 'PAP' ? '#be185d' : tipo === 'CITO' ? '#7c3aed' : '#166534'
                            }}>{tipo}</span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{result.tissueType}</span>
                            {isUrgent && <span style={{ fontSize: '9px', fontWeight: '700', color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>URGENTE</span>}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>${costo.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Detalles: cassettes, descalcificación, remito */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                          {cassettes > 0 && tipo !== 'PAP' && tipo !== 'CITO' && <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>Cassettes: {cassettes}</span>}
                          {(result.pieces && parseInt(result.pieces) > 0) && <span style={{ fontSize: '11px', background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>Trozos: {result.pieces}</span>}
                          {cassettes > 1 && cn.length > 1 && (
                            <span style={{ fontSize: '11px', background: '#f0f9ff', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                              SUBs: {cn.slice(1).map((c: any, i: number) => typeof c === 'object' ? (c.suffix || 'S' + (i+1)) : (c && c !== '0' ? c : 'S' + (i+1))).join(', ')}
                            </span>
                          )}
                          {(result.papQuantity || 0) > 0 && <span style={{ fontSize: '11px', background: '#fce7f3', color: '#be185d', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>PAP: {result.papQuantity}</span>}
                          {(result.citologiaQuantity || 0) > 0 && <span style={{ fontSize: '11px', background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>Cito: {result.citologiaQuantity}</span>}
                          <span style={{ fontSize: '11px', background: result.declassify === 'Sí' ? '#fef3c7' : '#f1f5f9', color: result.declassify === 'Sí' ? '#92400e' : '#64748b', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                            Descalcif: {result.declassify || 'No'}
                          </span>
                        </div>

                        {/* Servicios especiales detallados */}
                        {serviciosDetail.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                            {serviciosDetail.map((s, si) => (
                              <span key={si} style={{
                                fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
                                background: s.includes('URGENTE') ? '#fee2e2' : '#eff6ff',
                                color: s.includes('URGENTE') ? '#dc2626' : '#1e40af'
                              }}>{s}</span>
                            ))}
                          </div>
                        )}

                        {/* Footer: fecha + remito clickeable */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f3f4f6' }}>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {formatDateSpanish(result.date)}
                          </span>
                          <button
                            onClick={() => {
                              try {
                                const email = doctorInfo.email?.toLowerCase().trim().replace(/\s+/g, '') || '';
                                const hk = `doctor_${email}_history`;
                                const history = JSON.parse(localStorage.getItem(hk) || '{}');
                                const entry: any = Object.values(history).find((e: any) => e.id === result.remitoId);
                                if (entry) setViewingRemitoFromSearch(entry);
                              } catch {}
                            }}
                            style={{
                              fontSize: '11px', fontWeight: '600', color: '#1e40af',
                              background: '#eff6ff', border: '1px solid #bfdbfe',
                              padding: '3px 10px', borderRadius: '6px', cursor: 'pointer'
                            }}
                          >
                            Ver remito #{(result.remitoId || '').slice(-5).toUpperCase()}
                          </button>
                        </div>

                        {/* Observaciones */}
                        {result.observations?.trim() && (
                          <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                            {result.observations.length > 80 ? result.observations.substring(0, 80) + '...' : result.observations}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mensaje cuando no hay resultados */}
            {searchResults.length === 0 && searchFilters.query && (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6b7280',
                fontSize: '14px',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '16px',
                  opacity: 0.3 
                }}>
                  🔍
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '500',
                  marginBottom: '8px' 
                }}>
                  No se encontraron resultados
                </div>
                <div>
                  Intenta con otros filtros o términos de búsqueda
                </div>
              </div>
            )}

            {/* Mensaje inicial cuando no se ha buscado nada */}
            {searchResults.length === 0 && !searchFilters.query && (
              <div style={{
                textAlign: 'center',
                padding: '30px 20px',
                color: '#6b7280',
                fontSize: '14px',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '16px',
                  opacity: 0.3 
                }}>
                  📋
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Búsqueda Avanzada de Biopsias
                </div>
                <div style={{ 
                  fontSize: '14px',
                  lineHeight: '1.4',
                  maxWidth: '350px',
                  marginBottom: '12px'
                }}>
                  Utiliza los filtros para buscar biopsias por número, tipo de tejido, órgano, fechas o servicios especiales.
                </div>
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#1e40af',
                  maxWidth: '320px'
                }}>
                  💡 Tip: Combina múltiples filtros para búsquedas precisas
                </div>
              </div>
            )}

            {/* Botón Cerrar */}
            <div style={{ marginTop: '8px', textAlign: 'right', flexShrink: 0 }}>
              <button
                onClick={closeSearchModal}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista de remito completo desde búsqueda */}
      {viewingRemitoFromSearch && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)', padding: '14px 18px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>Remito #{(viewingRemitoFromSearch.id || '').slice(-6).toUpperCase()}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {new Date(viewingRemitoFromSearch.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  {' · '}{(viewingRemitoFromSearch.biopsies || []).length} pacientes
                </div>
              </div>
              <button onClick={() => setViewingRemitoFromSearch(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Cerrar</button>
            </div>
            {/* Tabla */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>N°</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Tejido</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Tipo</th>
                    <th style={{ textAlign: 'center', padding: '8px', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Cass.</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Descalcif.</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Servicios</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewingRemitoFromSearch.biopsies || []).map((b: any, i: number) => {
                    const t = b.type === 'PQ' ? 'PQ' : b.tissueType === 'PAP' ? 'PAP' : b.tissueType === 'Citología' ? 'CITO' : 'BX';
                    const s = b.servicios || {};
                    const svcs: string[] = [];
                    if (s.cassetteUrgente) svcs.push('URGENTE 24hs');
                    if (s.papUrgente) svcs.push('PAP Urgente');
                    if (s.citologiaUrgente) svcs.push('Cito Urgente');
                    if (s.corteBlancoIHQ) svcs.push('Corte IHQ ×' + (s.corteBlancoIHQQuantity || 1));
                    if (s.corteBlancoComun) svcs.push('Corte Blanco ×' + (s.corteBlancoComunQuantity || 1));
                    if (s.giemsaPASMasson) {
                      const o = s.giemsaOptions || {};
                      const ts: string[] = [];
                      if (o.giemsa) ts.push('Giemsa');
                      if (o.pas) ts.push('PAS');
                      if (o.masson) ts.push('Masson');
                      svcs.push(ts.length > 0 ? ts.join(', ') : 'Tinciones');
                    }
                    if ((b.papQuantity || 0) > 0) svcs.push('PAP ×' + b.papQuantity);
                    if ((b.citologiaQuantity || 0) > 0) svcs.push('Cito ×' + b.citologiaQuantity);
                    const cassNum = parseInt(b.cassettes) || 0;
                    const cnArr = b.cassettesNumbers || [];

                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: '700', color: '#1e40af' }}>{b.number || '-'}</td>
                        <td style={{ padding: '8px' }}>{b.tissueType}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
                            background: t === 'PQ' ? '#fed7aa' : t === 'PAP' ? '#fce7f3' : t === 'CITO' ? '#ede9fe' : '#dcfce7',
                            color: t === 'PQ' ? '#c2410c' : t === 'PAP' ? '#be185d' : t === 'CITO' ? '#7c3aed' : '#166534'
                          }}>{t}</span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600' }}>
                          {cassNum > 0 ? cassNum : '-'}
                          {cassNum > 1 && cnArr.length > 1 && (
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                              {cnArr.slice(1).map((c: any, si: number) => 'S-' + (typeof c === 'object' ? (c.suffix || (si+1)) : (c && c !== '0' ? c : (si+1)))).join(', ')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px', fontSize: '11px', color: b.declassify === 'Sí' ? '#92400e' : '#94a3b8' }}>{b.declassify || 'No'}</td>
                        <td style={{ padding: '8px' }}>
                          {svcs.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                              {svcs.map((sv, si) => (
                                <span key={si} style={{ fontSize: '9px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px',
                                  background: sv.includes('URGENTE') || sv.includes('Urgente') ? '#fee2e2' : '#eff6ff',
                                  color: sv.includes('URGENTE') || sv.includes('Urgente') ? '#dc2626' : '#1e40af'
                                }}>{sv}</span>
                              ))}
                            </div>
                          ) : <span style={{ fontSize: '11px', color: '#94a3b8' }}>Estándar</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Teclado Virtual para Búsqueda */}
      {showKeyboard && showSearchModal && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <VirtualKeyboard
            keyboard={{ 
              isOpen: showKeyboard, 
              type: keyboardType, 
              targetField: activeField || '',
              targetValue: searchFilters.query 
            }}
            onKeyPress={handleKeyPress}
            onConfirm={handleKeyboardConfirm}
            onSwitchType={setKeyboardType}
          />
        </div>
      )}

      {/* Modal de Facturación */}
      {showStatistics && <StatisticsModal />}
    </div>
  );
};

export default MainScreen;