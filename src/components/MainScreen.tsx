import React, { useState } from 'react';
import { Plus, FileText, History, LogOut, TrendingUp, Star, Activity, BarChart3, PieChart, Calendar, Clock, DollarSign, CheckCircle, Target, QrCode, Share, Download, Copy, Search, Filter, X, Wifi, Printer, Cloud } from 'lucide-react';
import { BiopsyForm, DoctorInfo } from '../types';
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
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (doctorInfo.email) {
        // Usar nuevo sistema basado en email
        const normalizedEmail = doctorInfo.email.toLowerCase().trim().replace(/\s+/g, '');
        const doctorKey = `doctor_${normalizedEmail}`;
        const historyKey = `${doctorKey}_history`;
        
        const historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
        const entries = Object.values(historyData) as any[];
        
        // Buscar biopsias del día de hoy
        entries.forEach((entry: any) => {
          if (entry.biopsies && entry.date) {
            const entryDate = new Date(entry.date).toISOString().split('T')[0];
            if (entryDate === today) {
              todayBiopsiesFromHistory.push(...entry.biopsies);
            }
          }
        });
      } else {
        // Fallback: usar sistema anterior por nombre
        const historyKey = `${doctorInfo.name}_history`;
        const historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
        const entries = Object.values(historyData) as any[];
        
        entries.forEach((entry: any) => {
          if (entry.biopsies && entry.date) {
            const entryDate = new Date(entry.date).toISOString().split('T')[0];
            if (entryDate === today) {
              todayBiopsiesFromHistory.push(...entry.biopsies);
            }
          }
        });
      }
      
      // También incluir las biopsias actuales (todayBiopsies prop)
      const allTodayBiopsies = [...todayBiopsiesFromHistory, ...todayBiopsies];
      
      return {
        count: allTodayBiopsies.length,
        withServices: allTodayBiopsies.filter(b => {
          const servicios = b.servicios || {};
          // Solo contar los servicios específicos del Step 7
          const specificServices = [
            'cassetteUrgente',      // URGENTE 24HS
            'corteBlancoIHQ',       // CORTE EN BLANCO PARA IHQ
            'corteBlancoComun',     // CORTE EN BLANCO COMÚN
            'giemsaPASMasson'       // GIEMSA/PAS/MASSON
          ];
          
          return specificServices.some(serviceKey => {
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
      
      const precios = {
        cassette: 300,
        cassetteUrgente: 400,
        profundizacion: 120,
        pap: 90,
        papUrgente: 110,
        citologia: 90,
        citologiaUrgente: 120,
        corteBlanco: 60,
        corteBlancoIHQ: 85,
        giemsaPASMasson: 75
      };

      let totalFacturado = 0;
      let totalBiopsias = 0;
      let totalPAP = 0;
      let totalCitologia = 0;
      let totalBX = 0; // Biopsias histológicas (BX)
      let totalUrgentes = 0;
      let costoPromedio = 0;

      savedBiopsies.forEach((biopsy) => {
        totalBiopsias++;
        let costoBiopsia = 0;

        // Determinar tipo de biopsia y contar apropiadamente
        const esPAP = biopsy.papQuantity && biopsy.papQuantity > 0;
        const esCitologia = biopsy.citologiaQuantity && biopsy.citologiaQuantity > 0;
        const esBX = !esPAP && !esCitologia; // Es BX si no es PAP ni Citología

        if (esBX) {
          totalBX++;
        }

        // Cassettes (solo para BX)
        const cassettes = biopsy.cassettes || 0;
        if (cassettes > 0) {
          if (biopsy.serviciosEspeciales?.cassetteUrgente) {
            costoBiopsia += cassettes * precios.cassetteUrgente;
            totalUrgentes++;
          } else {
            costoBiopsia += precios.cassette;
            if (cassettes > 1) {
              costoBiopsia += (cassettes - 1) * precios.profundizacion;
            }
          }
        }

        // PAP
        if (esPAP) {
          totalPAP += biopsy.papQuantity;
          if (biopsy.serviciosEspeciales?.papUrgente) {
            costoBiopsia += biopsy.papQuantity * precios.papUrgente;
            totalUrgentes++;
          } else {
            costoBiopsia += biopsy.papQuantity * precios.pap;
          }
        }

        // Citología
        if (esCitologia) {
          totalCitologia += biopsy.citologiaQuantity;
          if (biopsy.serviciosEspeciales?.citologiaUrgente) {
            costoBiopsia += biopsy.citologiaQuantity * precios.citologiaUrgente;
            totalUrgentes++;
          } else {
            costoBiopsia += biopsy.citologiaQuantity * precios.citologia;
          }
        }

        // Servicios especiales
        if (biopsy.serviciosEspeciales?.corteBlanco) {
          costoBiopsia += precios.corteBlanco;
        }
        if (biopsy.serviciosEspeciales?.corteBlancoIHQ) {
          costoBiopsia += precios.corteBlancoIHQ;
        }
        if (biopsy.serviciosEspeciales?.giemsaPASMasson) {
          costoBiopsia += precios.giemsaPASMasson;
        }

        totalFacturado += costoBiopsia;
      });

      costoPromedio = totalBiopsias > 0 ? Math.round(totalFacturado / totalBiopsias) : 0;

      // Calcular datos del mes anterior
      let totalFacturadoPrevious = 0;
      let totalBiopsiasPrevious = 0;
      
      previousMonthBiopsies.forEach((biopsy) => {
        totalBiopsiasPrevious++;
        let costoBiopsia = 0;

        // Mismo cálculo que para el mes actual
        const cassettes = biopsy.cassettes || 0;
        if (cassettes > 0) {
          if (biopsy.serviciosEspeciales?.cassetteUrgente) {
            costoBiopsia += cassettes * precios.cassetteUrgente;
          } else {
            costoBiopsia += precios.cassette;
          }
        }

        if (biopsy.profundizacion > 0) {
          costoBiopsia += biopsy.profundizacion * precios.profundizacion;
        }

        if (biopsy.papQuantity > 0) {
          if (biopsy.serviciosEspeciales?.papUrgente) {
            costoBiopsia += biopsy.papQuantity * precios.papUrgente;
          } else {
            costoBiopsia += biopsy.papQuantity * precios.pap;
          }
        }

        if (biopsy.citologiaQuantity > 0) {
          if (biopsy.serviciosEspeciales?.citologiaUrgente) {
            costoBiopsia += biopsy.citologiaQuantity * precios.citologiaUrgente;
          } else {
            costoBiopsia += biopsy.citologiaQuantity * precios.citologia;
          }
        }

        if (biopsy.serviciosEspeciales?.corteBlanco) {
          costoBiopsia += precios.corteBlanco;
        }
        if (biopsy.serviciosEspeciales?.corteBlancoIHQ) {
          costoBiopsia += precios.corteBlancoIHQ;
        }
        if (biopsy.serviciosEspeciales?.giemsaPASMasson) {
          costoBiopsia += precios.giemsaPASMasson;
        }

        totalFacturadoPrevious += costoBiopsia;
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
        totalRemitos: stats.totalRemitos,
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
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 25%, #8b5cf6 75%, #a855f7 100%)',
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
                Dr/a. {doctorInfo.name} - {doctorInfo.hospital}
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
            
            {/* Fila 1: Métricas Financieras Principales */}
            <div style={{
              gridColumn: '1 / -1',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {/* Total Facturado */}
              <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 6px 20px -5px rgba(16, 185, 129, 0.3)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>
                  Total Facturado
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
                  ${financialData.totalFacturado.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Acumulado
                </div>
              </div>

              {/* Costo Promedio */}
              <div style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 6px 20px -5px rgba(59, 130, 246, 0.3)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>
                  Promedio/Biopsia
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
                  ${financialData.costoPromedio}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Por estudio
                </div>
              </div>

              {/* Total Remitos */}
              <div style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 6px 20px -5px rgba(139, 92, 246, 0.3)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>
                  Total Remitos
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
                  {financialData.totalRemitos}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Enviados
                </div>
              </div>

              {/* Total Biopsias */}
              <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 6px 20px -5px rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>
                  Total Biopsias
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
                  {financialData.totalBiopsias}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Procesadas
                </div>
              </div>
            </div>

            {/* Selector de Mes */}
            <div style={{
              gridColumn: '1 / -1',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar style={{ height: '20px', width: '20px', color: '#3b82f6' }} />
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                  Período de Consulta:
                </span>
              </div>
              <select
                value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setSelectedYear(parseInt(year));
                  setSelectedMonth(parseInt(month));
                }}
                style={{
                  backgroundColor: '#f8fafc',
                  color: '#374151',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '150px'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const currentDate = new Date();
                  currentDate.setMonth(currentDate.getMonth() - i);
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const monthNames = [
                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                  ];
                  return (
                    <option 
                      key={`${year}-${month}`} 
                      value={`${year}-${month.toString().padStart(2, '0')}`}
                    >
                      {monthNames[month]} {year}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Fila 2: Detalle de Estudios */}
            <div style={{
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 6px 20px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#374151',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Activity style={{ height: '20px', width: '20px', color: '#3b82f6' }} />
                Detalle de Estudios
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* PAP */}
                <div style={{
                  backgroundColor: '#fdf2f8',
                  border: '1px solid #fce7f3',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#be185d', marginBottom: '4px' }}>
                      Papanicolaou (PAP)
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Citología cervical
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#ec4899',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}>
                    {financialData.totalPAP}
                  </div>
                </div>

                {/* Citología */}
                <div style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#7c3aed', marginBottom: '4px' }}>
                      Citología
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Estudios citológicos
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}>
                    {financialData.totalCitologia}
                  </div>
                </div>

                {/* Biopsias BX */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #dcfce7',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>
                      Biopsias (BX)
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Estudios histológicos
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}>
                    {financialData.totalBX}
                  </div>
                </div>
              </div>
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
        content += `🧬 Tipo de Tejido: ${biopsy.tissueType || 'No especificado'}\n`;
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
        
        // Filtro por tipo de tejido
        if (searchFilters.tissueType && biopsy.tissueType !== searchFilters.tissueType) {
          return false;
        }
        
        // Filtro por fecha
        if (searchFilters.dateFrom && biopsy.date < searchFilters.dateFrom) {
          return false;
        }
        if (searchFilters.dateTo && biopsy.date > searchFilters.dateTo) {
          return false;
        }
        
        // Filtro por servicios especiales
        if (searchFilters.hasServices) {
          const hasSpecialServices = Object.keys(biopsy.servicios || {}).some(key => 
            ['cassetteUrgente', 'corteBlancoIHQ', 'corteBlancoComun', 'giemsaPASMasson'].includes(key) &&
            biopsy.servicios[key]
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
      if (key === 'BACKSPACE') {
        setSearchFilters(prev => ({ ...prev, query: prev.query.slice(0, -1) }));
      } else if (key === 'SPACE') {
        setSearchFilters(prev => ({ ...prev, query: prev.query + ' ' }));
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      {/* Header Ultra Compacto para Tablet */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '8px 16px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0,
              lineHeight: '1.2'
            }}>
              Dr. {doctorInfo.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
              {doctorInfo.email && (
                <p style={{
                  fontSize: '11px',
                  color: '#2563eb',
                  margin: 0
                }}>📧 {doctorInfo.email}</p>
              )}
              <p style={{
                fontSize: '11px',
                color: '#6b7280',
                margin: 0
              }}>{new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ConnectionStatus 
              isOnline={isOnline}
              backupStatus={backupStatus}
              syncQueueLength={syncQueueLength}
            />
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
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Cerrar sesión"
            >
              <LogOut style={{ height: '16px', width: '16px', color: '#6b7280' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal Ultra Optimizado para Tablet 22cm x 13cm */}
      <div style={{
        padding: '16px',
        height: 'calc(100vh - 64px)', // Restar altura del header
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100%'
      }}>
        
        {/* Dashboard Expandido - Ocupa más espacio */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 25%, #8b5cf6 75%, #a855f7 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Patrón de fondo decorativo */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-5%',
            width: '150px',
            height: '150px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
            filter: 'blur(30px)'
          }}></div>
          
          <div style={{
            position: 'relative',
            zIndex: 1
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              marginBottom: '20px',
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              📊 Resumen del Día - {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '16px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1', marginBottom: '8px' }}>{todayBiopsiesCount}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>PACIENTES HOY</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '16px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1', marginBottom: '8px' }}>{biopsiesWithServices}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>CON SERVICIOS</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '16px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1', marginBottom: '8px' }}>{efficiency}%</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>EFICIENCIA</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '16px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1', marginBottom: '8px' }}>{stats.totalRemitos}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>TOTAL REMITOS</div>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>Progreso Diario</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{todayBiopsiesCount}/12 objetivo</span>
              </div>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                height: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  height: '100%',
                  borderRadius: '10px',
                  width: `${Math.min(100, (todayBiopsiesCount / 12) * 100)}%`,
                  transition: 'width 1s ease-in-out',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones Principales Expandidos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* Nuevo Paciente */}
          <button
            onClick={() => {
              console.log('MainScreen - Clic en Nuevo Paciente');
              onStartNewBiopsy();
            }}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              fontWeight: '600',
              padding: '28px 24px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 25px -5px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px -5px rgba(59, 130, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(59, 130, 246, 0.3)';
            }}
          >
            <Plus style={{ height: '28px', width: '28px' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.2' }}>Nuevo Paciente</div>
              <div style={{ color: '#dbeafe', fontSize: '14px' }}>Registro #{todayBiopsiesCount + 1}</div>
            </div>
          </button>

          {/* Búsqueda Avanzada */}
          <button
            onClick={() => setShowSearchModal(true)}
            style={{
              backgroundColor: 'white',
              color: '#374151',
              fontWeight: '600',
              padding: '28px 24px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
              boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px -5px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(0, 0, 0, 0.1)';
            }}
          >
            <Search style={{ height: '28px', width: '28px', color: '#3b82f6' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.2' }}>Búsqueda Avanzada</div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>Filtrar y buscar</div>
            </div>
          </button>
        </div>

        {/* Botones Secundarios - Solo Historial y Facturación */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <button
            onClick={onViewHistory}
            style={{
              backgroundColor: 'white',
              color: '#374151',
              fontWeight: '500',
              padding: '20px 16px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <History style={{ height: '24px', width: '24px', color: '#10b981' }} />
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Historial</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{stats.totalRemitos} remitos</div>
          </button>

          <button
            onClick={() => setShowStatistics(true)}
            style={{
              backgroundColor: 'white',
              color: '#374151',
              fontWeight: '500',
              padding: '20px 16px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <TrendingUp style={{ height: '24px', width: '24px', color: '#3b82f6' }} />
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Facturación</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Estadísticas</div>
          </button>
        </div>

        {/* Estado del Sistema Compacto y Esencial */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e5e7eb',
          marginTop: 'auto',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#374151',
            margin: '0 0 12px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Activity style={{ height: '18px', width: '18px', color: '#10b981' }} />
            Estado del Sistema
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            {/* Conexión WiFi */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                <Wifi style={{
                  width: '16px',
                  height: '16px',
                  color: isOnline && localStorage.getItem('wifi_ssid') ? '#10b981' : 
                         localStorage.getItem('wifi_ssid') ? '#f59e0b' : '#ef4444',
                  marginRight: '6px'
                }} />
                <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '500' }}>CONEXIÓN WIFI</span>
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: isOnline && localStorage.getItem('wifi_ssid') ? '#10b981' : 
                       localStorage.getItem('wifi_ssid') ? '#f59e0b' : '#ef4444'
              }}>
                {isOnline && localStorage.getItem('wifi_ssid') ? 'Conectado' : 
                 localStorage.getItem('wifi_ssid') ? 'Configurado' : 'Desconectado'}
              </div>
            </div>

            {/* Conexión Impresora */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                <Printer style={{
                  width: '16px',
                  height: '16px',
                  color: localStorage.getItem('printer_ip') ? '#10b981' : '#ef4444',
                  marginRight: '6px'
                }} />
                <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '500' }}>IMPRESORA</span>
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: localStorage.getItem('printer_ip') ? '#10b981' : '#ef4444'
              }}>
                {localStorage.getItem('printer_ip') ? 'Configurada' : 'No configurada'}
              </div>
            </div>

            {/* Backup */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                <Cloud style={{
                  width: '16px',
                  height: '16px',
                  color: backupStatus === 'success' ? '#10b981' : 
                         backupStatus === 'syncing' ? '#f59e0b' : 
                         backupStatus === 'error' ? '#ef4444' : '#6b7280',
                  marginRight: '6px'
                }} />
                <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '500' }}>BACKUP</span>
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: backupStatus === 'success' ? '#10b981' : 
                       backupStatus === 'syncing' ? '#f59e0b' : 
                       backupStatus === 'error' ? '#ef4444' : '#6b7280'
              }}>
                {backupStatus === 'success' ? 'OK' : 
                 backupStatus === 'syncing' ? 'Sync...' :
                 backupStatus === 'error' ? 'Error' : 'Pendiente'}
              </div>
            </div>
          </div>
        </div>
      </div>

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
                  { type: 'estadisticas', label: 'Estadísticas', icon: BarChart3, color: '#8b5cf6' },
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
                  backgroundColor: '#8b5cf6',
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
                  e.currentTarget.style.backgroundColor = '#7c3aed';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#8b5cf6';
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
            // Altura dinámica: grande sin resultados, compacto con resultados
            height: searchResults.length > 0 ? '90vh' : '60vh',
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
                <Search style={{ height: '18px', width: '18px', color: '#8b5cf6' }} />
                Búsqueda Avanzada
              </h2>
              <button
                onClick={closeSearchModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '4px',
                  color: '#6b7280'
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
                  <option value="Biopsia">Biopsia</option>
                  <option value="Pieza Quirúrgica">Pieza Quirúrgica</option>
                  <option value="PAP">PAP</option>
                  <option value="Citología">Citología</option>
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
                    backgroundColor: '#8b5cf6',
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
                    const specialServices = getSpecialServices(result);
                    const hasServices = specialServices.length > 0;
                    
                    // Solo 2 colores alternados para diferenciación visual
                    const isEven = index % 2 === 0;
                    const backgroundColor = isEven ? '#f8fafc' : '#f0f9ff';
                    const borderColor = isEven ? '#3b82f6' : '#10b981';
                    const titleColor = isEven ? '#1e40af' : '#059669';
                    
                    return (
                      <div
                        key={index}
                        style={{
                          padding: '10px',
                          borderBottom: index < searchResults.length - 1 ? '1px solid #e5e7eb' : 'none',
                          backgroundColor: backgroundColor,
                          borderLeft: `4px solid ${borderColor}`
                        }}
                      >
                        {/* Línea principal con información clave */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: '15px', 
                              fontWeight: '700', 
                              color: titleColor,
                              marginBottom: '4px'
                            }}>
                              Biopsia #{result.number || 'S/N'} - {result.tissueType || 'Sin tipo'}
                            </div>
                            
                            {/* Solo mostrar órgano si existe */}
                            {result.organ && result.organ.trim() && (
                              <div style={{ 
                                fontSize: '13px', 
                                color: '#374151',
                                marginBottom: '4px'
                              }}>
                                📍 {result.organ}
                              </div>
                            )}
                            
                            {/* Detalles de la biopsia */}
                            {getBiopsyDetails(result) && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#6366f1',
                                fontWeight: '500',
                                marginBottom: '4px'
                              }}>
                                📋 {getBiopsyDetails(result)}
                              </div>
                            )}
                          </div>
                          
                          {/* Servicios especiales con detalle */}
                          {hasServices && (
                            <div style={{ marginLeft: '12px', maxWidth: '200px' }}>
                              <span style={{
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                display: 'block',
                                marginBottom: '4px'
                              }}>
                                ⭐ Con servicios
                              </span>
                              <div style={{
                                fontSize: '10px',
                                color: '#92400e',
                                fontWeight: '500'
                              }}>
                                {specialServices.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Información de fecha (solo una vez) */}
                        <div style={{
                          paddingTop: '8px',
                          borderTop: '1px solid #f3f4f6'
                        }}>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#6b7280', 
                            fontWeight: '500',
                            marginBottom: '2px'
                          }}>
                            � FECHA
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#1f2937',
                            fontWeight: '500'
                          }}>
                            {formatDateSpanish(result.date)}
                          </div>
                        </div>

                        {/* Observaciones si existen */}
                        {result.observations && result.observations.trim() && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#6b7280', 
                              fontWeight: '500',
                              marginBottom: '2px'
                            }}>
                              💬 OBSERVACIONES
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#4b5563',
                              fontStyle: 'italic'
                            }}>
                              {result.observations.length > 100 
                                ? `${result.observations.substring(0, 100)}...` 
                                : result.observations
                              }
                            </div>
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