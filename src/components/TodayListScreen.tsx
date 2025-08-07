import React from 'react';
import { ArrowLeft, Plus, FileText, Download } from 'lucide-react';
import { BiopsyForm, DoctorInfo } from '../types';
import { ConnectionStatus } from './ConnectionStatus';
import { serviciosAdicionales, giemsaOptions } from '../constants/services';

interface TodayListScreenProps {
  doctorInfo: DoctorInfo;
  todayBiopsies: BiopsyForm[];
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
  onGoBack: () => void;
  onStartNewBiopsy: () => void;
  onFinishDailyReport: () => void;
}

export const TodayListScreen: React.FC<TodayListScreenProps> = ({
  doctorInfo,
  todayBiopsies,
  isOnline,
  backupStatus,
  syncQueueLength,
  onGoBack,
  onStartNewBiopsy,
  onFinishDailyReport
}) => {
  // Debug: Agregar logs para diagnosticar
  React.useEffect(() => {
    console.log('TodayListScreen - doctorInfo:', doctorInfo);
    console.log('TodayListScreen - todayBiopsies:', todayBiopsies);
    console.log('TodayListScreen - todayBiopsies.length:', todayBiopsies?.length);
  }, [doctorInfo, todayBiopsies]);

  // Verificación de seguridad
  if (!doctorInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onGoBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Error</h2>
          </div>
        </div>
        <div className="max-w-md mx-auto p-4 text-center py-12">
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Error: Información del doctor no disponible
          </h3>
          <button
            onClick={onGoBack}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Asegurar que todayBiopsies sea un array
  const biopsies = todayBiopsies || [];

  // ✅ FUNCIÓN CORREGIDA PARA EVITAR DUPLICADOS DE GIEMSA
  const getServiciosDisplay = (biopsy: BiopsyForm) => {
    const serviciosActivos: string[] = [];
    if (biopsy.servicios) {
      Object.entries(biopsy.servicios).forEach(([key, value]) => {
        if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
          const servicio = serviciosAdicionales.find(s => s.key === key);
          if (servicio) {
            let servicioLabel = servicio.label;
            
            // ✅ MANEJO ESPECIAL PARA GIEMSA/PAS/MASSON CON SUBMENÚ
            if (key === 'giemsaPASMasson' && biopsy.servicios.giemsaOptions) {
              const giemsaSelected = Object.entries(biopsy.servicios.giemsaOptions)
                .filter(([_, selected]) => selected)
                .map(([optionKey, _]) => {
                  const option = giemsaOptions.find(opt => opt.key === optionKey);
                  return option ? option.label : optionKey;
                });
              
              if (giemsaSelected.length > 0) {
                // ✅ MOSTRAR SOLO LAS OPCIONES ESPECÍFICAS SELECCIONADAS
                servicioLabel = giemsaSelected.join(', ');
              } else {
                // Si no hay sub-opciones seleccionadas, no mostrar nada
                return;
              }
            }
            // ✅ AGREGAR CANTIDAD PARA CORTES EN BLANCO
            else if (key === 'corteBlancoIHQ') {
              const quantity = biopsy.servicios.corteBlancoIHQQuantity || 1;
              servicioLabel += ` (${quantity})`;
            } else if (key === 'corteBlancoComun') {
              const quantity = biopsy.servicios.corteBlancoComunQuantity || 1;
              servicioLabel += ` (${quantity})`;
            }
            
            serviciosActivos.push(servicioLabel);
          }
        }
      });
    }
    return serviciosActivos;
  };

  const getTissueTypeDisplay = (biopsy: BiopsyForm) => {
    if (biopsy.tissueType === 'Endoscopia' && biopsy.endoscopiaSubTypes && biopsy.endoscopiaSubTypes.length > 0) {
      return `${biopsy.tissueType} (${biopsy.endoscopiaSubTypes.join(', ')})`;
    }
    return biopsy.tissueType;
  };

  // ✅ FUNCIÓN PARA DETECTAR SI ES PAP O CITOLOGÍA
  const isPAPOrCitologia = (biopsy: BiopsyForm) => {
    return biopsy.tissueType === 'PAP' || biopsy.tissueType === 'Citología';
  };

  // ✅ FUNCIÓN PARA OBTENER SERVICIOS ESPECÍFICOS DE PAP/CITOLOGÍA
  const getPAPCitologiaServices = (biopsy: BiopsyForm) => {
    const services: string[] = [];
    
    if (biopsy.tissueType === 'PAP' && biopsy.papUrgente) {
      services.push('PAP Urgente');
    }
    
    if (biopsy.tissueType === 'Citología' && biopsy.citologiaUrgente) {
      services.push('Citología Urgente');
    }
    
    return services;
  };

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header compacto para tablet 10" */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: 'white',
        padding: '4px 8px',
        flexShrink: 0,
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
        margin: '4px 8px 2px 8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onGoBack}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                padding: '3px 6px',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <ArrowLeft size={12} />
            </button>
            <div>
              <h2 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 1px 0',
                lineHeight: '1.2'
              }}>Remito del Día</h2>
              <p style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>
                {biopsies.length} {biopsies.length === 1 ? 'estudio cargado' : 'estudios cargados'}
              </p>
            </div>
          </div>
          <ConnectionStatus 
            isOnline={isOnline}
            backupStatus={backupStatus}
            syncQueueLength={syncQueueLength}
          />
        </div>
      </div>

      {/* Contenido compacto para tablet 10" */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '2px 8px 8px 8px'
      }}>
        {biopsies.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '20px 12px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ color: '#9CA3AF', marginBottom: '8px' }}>
              <FileText style={{ height: '24px', width: '24px', margin: '0 auto' }} />
            </div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#6B7280',
              margin: '0 0 4px 0'
            }}>
              No hay estudios cargados hoy
            </h3>
            <p style={{
              color: '#9CA3AF',
              margin: '0 0 12px 0',
              fontSize: '11px'
            }}>
              Comienza agregando tu primer estudio del día
            </p>
            <button
              onClick={onStartNewBiopsy}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Plus size={14} />
              Nuevo Estudio
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Botones de acción compactos */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <button
                onClick={onStartNewBiopsy}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Plus size={12} />
                Nuevo Estudio
              </button>
              
              <button
                onClick={onFinishDailyReport}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Download size={12} />
                Finalizar
              </button>
            </div>

            {/* Lista de estudios compacta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {biopsies.map((biopsy, index) => {
                const isPapCitologia = isPAPOrCitologia(biopsy);
                const serviciosActivos = isPapCitologia ? getPAPCitologiaServices(biopsy) : getServiciosDisplay(biopsy);
                
                return (
                  <div key={index} style={{
                    background: 'white',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}>
                    {/* Header compacto para cada estudio */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          background: '#dbeafe',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            color: '#1d4ed8',
                            fontWeight: 'bold',
                            fontSize: '10px'
                          }}>{index + 1}</span>
                        </div>
                        <div>
                          {isPapCitologia ? (
                            <>
                              <h4 style={{
                                fontWeight: '600',
                                color: '#1f2937',
                                fontSize: '11px',
                                margin: '0 0 1px 0',
                                lineHeight: '1.2'
                              }}>
                                #{biopsy.type}{biopsy.number} - {biopsy.tissueType}
                              </h4>
                              <p style={{
                                fontSize: '8px',
                                color: '#6B7280',
                                margin: 0
                              }}>
                                {biopsy.timestamp ? new Date(biopsy.timestamp).toLocaleTimeString('es-AR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) : 'Sin hora'}
                              </p>
                            </>
                          ) : (
                            <>
                              <h4 style={{
                                fontWeight: '600',
                                color: '#1f2937',
                                fontSize: '11px',
                                margin: '0 0 1px 0',
                                lineHeight: '1.2'
                              }}>
                                Biopsia #{biopsy.number}
                              </h4>
                              <p style={{
                                fontSize: '8px',
                                color: '#6B7280',
                                margin: 0
                              }}>
                                {biopsy.timestamp ? new Date(biopsy.timestamp).toLocaleTimeString('es-AR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) : 'Sin hora'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '8px',
                          fontWeight: '600',
                          ...(biopsy.type === 'BX' 
                            ? { background: '#dbeafe', color: '#1e40af' }
                            : { background: '#ede9fe', color: '#7c3aed' })
                        }}>
                          {biopsy.type}
                        </span>
                      </div>
                    </div>
                    
                    {/* Información principal compacta */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      fontSize: '10px',
                      marginBottom: '6px'
                    }}>
                      {isPapCitologia ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6B7280' }}>Vidrios:</span>
                            <span style={{ fontWeight: '600', color: '#1f2937' }}>
                              {biopsy.tissueType === 'PAP' ? biopsy.papQuantity : biopsy.citologiaQuantity}
                            </span>
                          </div>
                          
                          {((biopsy.tissueType === 'PAP' && biopsy.papUrgente) || 
                            (biopsy.tissueType === 'Citología' && biopsy.citologiaUrgente)) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6B7280' }}>Prioridad:</span>
                              <span style={{ fontWeight: '600', color: '#ea580c' }}>⚡ Urgente 24hs</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6B7280' }}>Tejido:</span>
                            <span style={{
                              fontWeight: '600',
                              color: '#1f2937',
                              textAlign: 'right',
                              maxWidth: '60%',
                              fontSize: '9px'
                            }}>
                              {getTissueTypeDisplay(biopsy)}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6B7280' }}>Cassettes:</span>
                            <span style={{ fontWeight: '600', color: '#1f2937' }}>{biopsy.cassettes}</span>
                          </div>
                          
                          {biopsy.pieces && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6B7280' }}>Trozos:</span>
                              <span style={{ fontWeight: '600', color: '#1f2937' }}>{biopsy.pieces}</span>
                            </div>
                          )}
                          
                          {biopsy.declassify && biopsy.declassify !== 'No' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6B7280' }}>Desclasificar:</span>
                              <span style={{ fontWeight: '600', color: '#ea580c' }}>{biopsy.declassify}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Números de cassettes compactos - solo para biopsias */}
                    {!isPapCitologia && biopsy.cassettesNumbers && biopsy.cassettesNumbers.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        <p style={{
                          fontSize: '8px',
                          color: '#6B7280',
                          margin: '0 0 3px 0'
                        }}>Números de cassettes:</p>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '2px'
                        }}>
                          {biopsy.cassettesNumbers.map((cassette, cassIndex) => (
                            <span
                              key={cassIndex}
                              style={{
                                padding: '2px 4px',
                                background: '#f3f4f6',
                                color: '#374151',
                                borderRadius: '3px',
                                fontSize: '8px',
                                fontFamily: 'monospace'
                              }}
                            >
                              {typeof cassette === 'string' ? cassette : 
                               cassIndex === 0 ? cassette.base : 
                               `${cassette.base}/${cassette.suffix || cassIndex}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Servicios adicionales compactos */}
                    {serviciosActivos.length > 0 && (
                      <div style={{
                        borderTop: '1px solid #f3f4f6',
                        paddingTop: '4px',
                        marginBottom: '4px'
                      }}>
                        <p style={{
                          fontSize: '8px',
                          color: '#6B7280',
                          margin: '0 0 3px 0'
                        }}>
                          🔧 {serviciosActivos.length} servicio{serviciosActivos.length !== 1 ? 's' : ''}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {serviciosActivos.map((servicio, servIndex) => (
                            <div key={servIndex} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <div style={{
                                width: '4px',
                                height: '4px',
                                background: '#7c3aed',
                                borderRadius: '50%'
                              }}></div>
                              <span style={{
                                fontSize: '8px',
                                color: '#7c3aed',
                                fontWeight: '600'
                              }}>{servicio}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observaciones compactas */}
                    {biopsy.observations && (
                      <div style={{
                        borderTop: '1px solid #f3f4f6',
                        paddingTop: '4px'
                      }}>
                        <p style={{
                          fontSize: '8px',
                          color: '#6B7280',
                          margin: '0 0 2px 0'
                        }}>Observaciones:</p>
                        <p style={{
                          fontSize: '8px',
                          color: '#374151',
                          fontStyle: 'italic',
                          margin: 0
                        }}>"{biopsy.observations}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Resumen final compacto */}
            <div style={{
              background: '#f0f9ff',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #c7d2fe',
              marginTop: '8px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{
                  fontWeight: '600',
                  color: '#1e40af',
                  fontSize: '11px',
                  margin: '0 0 6px 0'
                }}>📊 Resumen del Día</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '9px'
                }}>
                  <div>
                    <p style={{ color: '#1d4ed8', margin: '0 0 2px 0' }}>Total Estudios</p>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#1e40af',
                      margin: 0
                    }}>{biopsies.length}</p>
                  </div>
                  <div>
                    <p style={{ color: '#1d4ed8', margin: '0 0 2px 0' }}>Con Servicios</p>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#1e40af',
                      margin: 0
                    }}>
                      {biopsies.filter(b => {
                        const isPapCit = isPAPOrCitologia(b);
                        if (isPapCit) {
                          return (b.tissueType === 'PAP' && b.papUrgente) || 
                                 (b.tissueType === 'Citología' && b.citologiaUrgente);
                        }
                        return Object.values(b.servicios || {}).some(val => 
                          typeof val === 'boolean' ? val : false
                        );
                      }).length}
                    </p>
                  </div>
                </div>
                <p style={{
                  fontSize: '8px',
                  color: '#1d4ed8',
                  margin: '4px 0 0 0'
                }}>
                  📅 {new Date().toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>

            {/* Instrucciones compactas */}
            <div style={{
              background: '#f9fafb',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              marginTop: '6px'
            }}>
              <h4 style={{
                fontWeight: '600',
                color: '#1f2937',
                fontSize: '10px',
                margin: '0 0 4px 0'
              }}>ℹ️ Acciones disponibles:</h4>
              <ul style={{
                fontSize: '8px',
                color: '#6B7280',
                margin: 0,
                paddingLeft: '12px',
                lineHeight: '1.3'
              }}>
                <li><strong>Nuevo Estudio:</strong> Agregar otro estudio al remito</li>
                <li><strong>Finalizar:</strong> Guardar el remito en el historial</li>
                <li>Puedes agregar tantos estudios como necesites</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default TodayListScreen;
