import React, { useState } from 'react';
import { Plus, FileText, History, LogOut, TrendingUp, Star, Activity, BarChart3, PieChart, Calendar, Clock } from 'lucide-react';
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

  const StatisticsModal = () => (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px'
    }}>
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        padding: '0',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '95vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header con Gradiente - Más Compacto */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '16px 16px 0 0',
          flexShrink: 0
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <BarChart3 style={{ height: '24px', width: '24px' }} />
            📊 Estadísticas Médicas
          </h2>
          <button
            onClick={() => setShowStatistics(false)}
            style={{
              color: 'white',
              fontSize: '28px',
              fontWeight: 'bold',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>

        {/* Contenido Principal con Scroll Optimizado */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          
          {/* Métricas Principales - Cards en Grid Responsivo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {/* Card 1 - Total Remitos */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 6px 20px -6px rgba(102, 126, 234, 0.4)',
              height: '110px',
              textAlign: 'center'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(25px)'
              }}></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <FileText style={{ height: '24px', width: '24px', marginBottom: '8px' }} />
                <div style={{ fontSize: '28px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2px' }}>{stats.totalRemitos}</div>
                <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Remitos</div>
              </div>
            </div>

            {/* Card 2 - Total Biopsias */}
            <div style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 6px 20px -6px rgba(17, 153, 142, 0.4)',
              height: '110px',
              textAlign: 'center'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(25px)'
              }}></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Activity style={{ height: '24px', width: '24px', marginBottom: '8px' }} />
                <div style={{ fontSize: '28px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2px' }}>{stats.totalBiopsias}</div>
                <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Biopsias</div>
              </div>
            </div>

            {/* Card 3 - Promedio */}
            <div style={{
              background: 'linear-gradient(135deg, #9d50bb 0%, #6e48aa 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 6px 20px -6px rgba(157, 80, 187, 0.4)',
              height: '110px',
              textAlign: 'center'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(25px)'
              }}></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <TrendingUp style={{ height: '24px', width: '24px', marginBottom: '8px' }} />
                <div style={{ fontSize: '28px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2px' }}>{stats.promedioPorRemito}</div>
                <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Promedio/Remito</div>
              </div>
            </div>

            {/* Card 4 - Biopsias Hoy */}
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 6px 20px -6px rgba(240, 147, 251, 0.4)',
              height: '110px',
              textAlign: 'center'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(25px)'
              }}></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Calendar style={{ height: '24px', width: '24px', marginBottom: '8px' }} />
                <div style={{ fontSize: '28px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2px' }}>{todayBiopsiesCount}</div>
                <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Biopsias Hoy</div>
              </div>
            </div>

            {/* Card 5 - Eficiencia */}
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 6px 20px -6px rgba(79, 172, 254, 0.4)',
              height: '110px',
              textAlign: 'center'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(25px)'
              }}></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Clock style={{ height: '24px', width: '24px', marginBottom: '8px' }} />
                <div style={{ fontSize: '28px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2px' }}>{efficiency}%</div>
                <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Eficiencia</div>
              </div>
            </div>
          </div>

          {/* Servicios Especiales - Card Compacto */}
          <div style={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 6px 20px -6px rgba(250, 112, 154, 0.4)',
            height: '70px',
            marginBottom: '16px'
          }}>
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '150px',
              height: '150px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              filter: 'blur(40px)'
            }}></div>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Star style={{ height: '28px', width: '28px' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Servicios Especiales</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{biopsiesWithServices} biopsias con servicios extra</div>
              </div>
            </div>
          </div>

          {/* Tipos de Tejido - Sección Compacta y Responsive */}
          {stats.topTissues.length > 0 && (
            <div style={{ minHeight: '200px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <PieChart style={{ color: '#667eea', height: '20px', width: '20px' }} />
                Tipos de Tejido Analizados
              </h3>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '200px',
                  height: '200px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  filter: 'blur(40px)'
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {stats.topTissues.slice(0, 4).map(([tissue, count]) => {
                      const percentage = stats.totalBiopsias > 0 ? Math.round((count / stats.totalBiopsias) * 100) : 0;
                      
                      return (
                        <div key={tissue} style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          height: '50px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: 'white',
                              flexShrink: 0
                            }}></div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '1px' }}>{tissue}</div>
                              <div style={{ fontSize: '11px', opacity: 0.9 }}>{count} casos</div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '80px',
                              height: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                backgroundColor: 'white',
                                width: `${percentage}%`,
                                borderRadius: '3px',
                                transition: 'width 2s ease-in-out',
                                boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
                              }}></div>
                            </div>
                            <div style={{ 
                              fontSize: '16px', 
                              fontWeight: 'bold', 
                              minWidth: '40px',
                              textAlign: 'right'
                            }}>
                              {percentage}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Compacto */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: 'white',
          borderRadius: '0 0 16px 16px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Actualizado: {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              onClick={() => setShowStatistics(false)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '10px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.3s',
                boxShadow: '0 3px 12px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 3px 12px rgba(102, 126, 234, 0.4)';
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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