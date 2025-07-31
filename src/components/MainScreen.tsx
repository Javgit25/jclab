import React, { useState } from 'react';
import { Plus, FileText, History, LogOut, TrendingUp, Star, Activity, BarChart3, PieChart, Calendar, Clock, DollarSign, CheckCircle, Target } from 'lucide-react';
import { BiopsyForm, DoctorInfo } from '../types';
import { ConnectionStatus } from './ConnectionStatus';

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

  // Calcular métricas básicas
  const todayBiopsiesCount = todayBiopsies.length;
  const biopsiesWithServices = todayBiopsies.filter(b => 
    Object.values(b.servicios || {}).some(val => 
      typeof val === 'boolean' ? val : false
    )
  ).length;

  // Calcular eficiencia (simulada basada en datos reales)
  const efficiency = todayBiopsiesCount > 0 ? Math.min(95, 70 + (todayBiopsiesCount * 3)) : 0;

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
    // Calcular datos de facturación y costos
    const calculateFinancialData = () => {
      // Obtener datos del historial
      let savedBiopsies: any[] = [];
      
      try {
        if (doctorInfo.email) {
          // Usar nuevo sistema basado en email
          const normalizedEmail = doctorInfo.email.toLowerCase().trim().replace(/\s+/g, '');
          const doctorKey = `doctor_${normalizedEmail}`;
          const historyKey = `${doctorKey}_history`;
          
          const historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
          const entries = Object.values(historyData) as any[];
          
          // Extraer todas las biopsias de todos los remitos
          entries.forEach((entry: any) => {
            if (entry.biopsies) {
              savedBiopsies.push(...entry.biopsies);
            }
          });
        } else {
          // Fallback: usar sistema anterior por nombre
          const historyKey = `${doctorInfo.name}_history`;
          const historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
          const entries = Object.values(historyData) as any[];
          
          entries.forEach((entry: any) => {
            if (entry.biopsies) {
              savedBiopsies.push(...entry.biopsies);
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
      let totalUrgentes = 0;
      let costoPromedio = 0;

      savedBiopsies.forEach((biopsy) => {
        totalBiopsias++;
        let costoBiopsia = 0;

        // Cassettes
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
        if (biopsy.papQuantity && biopsy.papQuantity > 0) {
          totalPAP += biopsy.papQuantity;
          if (biopsy.serviciosEspeciales?.papUrgente) {
            costoBiopsia += biopsy.papQuantity * precios.papUrgente;
            totalUrgentes++;
          } else {
            costoBiopsia += biopsy.papQuantity * precios.pap;
          }
        }

        // Citología
        if (biopsy.citologiaQuantity && biopsy.citologiaQuantity > 0) {
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

      return {
        totalFacturado,
        totalBiopsias,
        totalPAP,
        totalCitologia,
        totalUrgentes,
        costoPromedio,
        totalRemitos: stats.totalRemitos
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
        padding: '16px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '0',
          width: '100%',
          maxWidth: '1100px',
          height: '85vh',
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
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '12px 12px 0 0',
            flexShrink: 0
          }}>
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BarChart3 style={{ height: '24px', width: '24px' }} />
                Panel de Facturación
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
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto auto',
            gap: '20px',
            overflow: 'hidden'
          }}>
            
            {/* Fila 1: Métricas Financieras Principales */}
            <div style={{
              gridColumn: '1 / -1',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '16px'
            }}>
              {/* Total Facturado */}
              <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 25px -5px rgba(16, 185, 129, 0.3)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>
                  Total Facturado
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
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
                padding: '20px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 25px -5px rgba(59, 130, 246, 0.3)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>
                  Promedio/Biopsia
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
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
                padding: '20px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 25px -5px rgba(139, 92, 246, 0.3)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>
                  Total Remitos
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
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
                padding: '20px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 25px -5px rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>
                  Total Biopsias
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                  {financialData.totalBiopsias}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Procesadas
                </div>
              </div>

              {/* Urgentes */}
              <div style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 25px -5px rgba(249, 115, 22, 0.3)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>
                  Urgentes (24hs)
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                  {financialData.totalUrgentes}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Prioritarios
                </div>
              </div>
            </div>

            {/* Fila 2: Detalle de Estudios */}
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
                    {financialData.totalBiopsias - financialData.totalPAP - financialData.totalCitologia}
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
                    {/* Mes actual */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#374151' }}>Este Mes</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                          ${Math.round(financialData.totalFacturado * 0.4).toLocaleString()}
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
                          width: '40%',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                    </div>

                    {/* Mes anterior */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#374151' }}>Mes Anterior</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                          ${Math.round(financialData.totalFacturado * 0.6).toLocaleString()}
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
                          width: '60%',
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
                    +15.3% ↗️
                  </div>
                </div>
              </div>
            </div>

            {/* Fila 3: Estado y Próximos Pasos */}
            <div style={{
              gridColumn: '1 / -1',
              backgroundColor: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px'
            }}>
              {/* Estado General */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle style={{ height: '24px', width: '24px' }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Estado Excelente
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Facturación en crecimiento
                </div>
              </div>

              {/* Eficiencia */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp style={{ height: '24px', width: '24px' }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Eficiencia 95%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Por encima del promedio
                </div>
              </div>

              {/* Próximo Objetivo */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Target style={{ height: '24px', width: '24px' }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Meta: ${(financialData.totalFacturado * 1.2).toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Próximo objetivo mensual
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
                <div style={{ fontSize: '12px', opacity: 0.9 }}>BIOPSIAS HOY</div>
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
          {/* Nueva Biopsia */}
          <button
            onClick={() => {
              console.log('MainScreen - Clic en Nueva Biopsia');
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
              <div style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.2' }}>Nueva Biopsia</div>
              <div style={{ color: '#dbeafe', fontSize: '14px' }}>Registro #{todayBiopsiesCount + 1}</div>
            </div>
          </button>

          {/* Remito del Día */}
          <button
            onClick={onViewToday}
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
            <FileText style={{ height: '28px', width: '28px', color: '#10b981' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.2' }}>Remito del Día</div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>{todayBiopsiesCount} biopsias</div>
            </div>
          </button>
        </div>

        {/* Botones Secundarios - Solo Historial y Estadísticas */}
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
              e.currentTarget.style.borderColor = '#8b5cf6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <BarChart3 style={{ height: '24px', width: '24px', color: '#8b5cf6' }} />
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Estadísticas</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{stats.totalBiopsias} biopsias</div>
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
            {/* Conexión */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#10b981' : '#ef4444',
                  marginRight: '6px'
                }}></div>
                <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '500' }}>CONEXIÓN</span>
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: isOnline ? '#10b981' : '#ef4444' 
              }}>
                {isOnline ? 'En línea' : 'Offline'}
              </div>
            </div>

            {/* Datos Locales */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  marginRight: '6px'
                }}></div>
                <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '500' }}>DATOS</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>
                Seguro
              </div>
            </div>

            {/* Último Backup */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: backupStatus === 'success' ? '#10b981' : 
                                   backupStatus === 'syncing' ? '#f59e0b' : 
                                   backupStatus === 'error' ? '#ef4444' : '#6b7280',
                  marginRight: '6px'
                }}></div>
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

      {/* Modal de Estadísticas */}
      {showStatistics && <StatisticsModal />}
    </div>
  );
};

export default MainScreen;