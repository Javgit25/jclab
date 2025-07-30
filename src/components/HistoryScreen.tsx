import React, { useState } from 'react';
import { ArrowLeft, Printer, Mail, Calendar, FileText, Trash2 } from 'lucide-react';
import { BiopsyForm, DoctorInfo } from '../types';
import { ConnectionStatus } from './ConnectionStatus';
import { serviciosAdicionales, giemsaOptions } from '../constants/services';

// Tipo temporal para HistoryEntry (simplificado)
interface HistoryEntry {
  id: string;
  date: string;
  timestamp: string;
  biopsies: BiopsyForm[];
}

interface HistoryScreenProps {
  doctorInfo: DoctorInfo;
  historyEntries: HistoryEntry[];
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
  onGoBack: () => void;
  onDeleteEntry: (entryId: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  doctorInfo,
  historyEntries,
  isOnline,
  backupStatus,
  syncQueueLength,
  onGoBack,
  onDeleteEntry
}) => {
  // Colores del diseño (siguiendo metodología de otros pasos)
  const colors = {
    primaryBlue: '#4F76F6',
    darkBlue: '#3B5BDB',
    lightBlue: '#7C9BFF',
    yellow: '#FFE066',
    green: '#51CF66',
    white: '#FFFFFF',
    lightGray: '#F8FAFC',
    darkGray: '#64748B'
  };

  const [emailPopup, setEmailPopup] = useState<{isOpen: boolean, entry: HistoryEntry | null}>({
    isOpen: false,
    entry: null
  });
  const [emailAddress, setEmailAddress] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, entryId: string | null}>({
    isOpen: false,
    entryId: null
  });

  // Función para obtener servicios activos
  const getServiciosActivos = (biopsy: BiopsyForm): string[] => {
    const serviciosActivos: string[] = [];
    
    if (biopsy.servicios) {
      Object.entries(biopsy.servicios).forEach(([key, value]) => {
        if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
          const servicio = serviciosAdicionales.find(s => s.key === key);
          if (servicio) {
            let servicioLabel = servicio.label;
            
            // Manejo especial para Giemsa/PAS/Masson
            if (key === 'giemsaPASMasson' && biopsy.servicios.giemsaOptions) {
              const giemsaSelected = Object.entries(biopsy.servicios.giemsaOptions)
                .filter(([_, selected]) => selected)
                .map(([optionKey, _]) => {
                  const option = giemsaOptions.find(opt => opt.key === optionKey);
                  return option ? option.label : optionKey;
                });
              
              if (giemsaSelected.length > 0) {
                servicioLabel = giemsaSelected.join(', ');
              } else {
                return;
              }
            }
            // Agregar cantidad para cortes en blanco
            else if (key === 'corteBlancoIHQ') {
              const quantity = biopsy.servicios.corteBlancoIHQQuantity || 1;
              servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
            } else if (key === 'corteBlancoComun') {
              const quantity = biopsy.servicios.corteBlancoComunQuantity || 1;
              servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
            }
            
            serviciosActivos.push(servicioLabel);
          }
        }
      });
    }
    
    return serviciosActivos;
  };

  const handlePrint = (entry: HistoryEntry) => {
    console.log('🖨️ Función de impresión para entry:', entry.id);
    // Implementación de impresión simplificada
    window.print();
  };

  const handleEmail = (entry: HistoryEntry) => {
    setEmailPopup({ isOpen: true, entry });
  };

  const handleDelete = (entryId: string) => {
    setDeleteConfirm({ isOpen: true, entryId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.entryId) {
      onDeleteEntry(deleteConfirm.entryId);
      setDeleteConfirm({ isOpen: false, entryId: null });
    }
  };

  const entries = historyEntries || [];
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header Compacto y Limpio - MISMA METODOLOGÍA */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 16px',
        flexShrink: 0,
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
        margin: '16px 16px 8px 16px',
        maxWidth: 'none',
        width: 'calc(100% - 32px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px',
              borderRadius: '12px',
              position: 'relative',
              backdropFilter: 'blur(10px)'
            }}>
              <Calendar style={{ height: '20px', width: '20px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Historial de Remitos</h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>
                {entries.length} remito{entries.length !== 1 ? 's' : ''} guardado{entries.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Navegación integrada en el header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ConnectionStatus 
              isOnline={isOnline}
              backupStatus={backupStatus}
              syncQueueLength={syncQueueLength}
            />
            <button
              onClick={onGoBack}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ArrowLeft size={16} />
              Volver
            </button>
          </div>
        </div>
      </div>

      {/* Título principal fuera del box - MISMA METODOLOGÍA */}
      <div style={{ 
        padding: '8px 24px 8px 24px',
        flexShrink: 0
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: 0,
          textAlign: 'left'
        }}>
          Remitos Guardados
        </h2>
      </div>

      {/* Contenido principal con scroll */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 24px 24px 24px'
      }}>
        {entries.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            padding: '48px 24px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <Calendar style={{ 
                height: '48px', 
                width: '48px', 
                color: '#9CA3AF',
                margin: '0 auto'
              }} />
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#4B5563',
              margin: '0 0 12px 0'
            }}>
              No hay remitos en el historial
            </h3>
            <p style={{
              color: '#6B7280',
              margin: '0 0 24px 0',
              fontSize: '16px'
            }}>
              Los remitos finalizados aparecerán aquí
            </p>
            <button 
              onClick={onGoBack}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
            >
              Volver al Inicio
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '20px'
          }}>
            {sortedEntries.map((entry) => (
              <div key={entry.id} style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                {/* Header del remito */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0f4ff 0%, #e0edff 100%)',
                  padding: '20px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText style={{ height: '24px', width: '24px', color: 'white' }} />
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0 0 4px 0'
                        }}>
                          Remito del {new Date(entry.date).toLocaleDateString('es-AR')}
                        </h4>
                        <p style={{
                          fontSize: '14px',
                          color: '#6B7280',
                          margin: 0
                        }}>
                          {entry.biopsies.length} biopsia{entry.biopsies.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        fontSize: '12px',
                        color: '#9CA3AF',
                        margin: 0
                      }}>
                        {new Date(entry.timestamp).toLocaleTimeString('es-AR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contenido del remito */}
                <div style={{ padding: '20px' }}>
                  {/* Estadísticas */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      fontSize: '14px'
                    }}>
                      <div>
                        <p style={{ color: '#6B7280', margin: '0 0 4px 0' }}>Total Biopsias</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                          {entry.biopsies.length}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#6B7280', margin: '0 0 4px 0' }}>Con Servicios</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                          {entry.biopsies.filter(b => getServiciosActivos(b).length > 0).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview de biopsias */}
                  {entry.biopsies.length > 0 && (
                    <div style={{
                      background: '#f0f9ff',
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '16px'
                    }}>
                      <p style={{
                        fontSize: '12px',
                        color: '#1e40af',
                        fontWeight: '600',
                        margin: '0 0 12px 0'
                      }}>📋 Biopsias incluidas:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {entry.biopsies.slice(0, 3).map((biopsy, index) => {
                          const serviciosActivos = getServiciosActivos(biopsy);
                          return (
                            <div key={index} style={{
                              background: 'white',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #e0f2fe'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                fontSize: '12px',
                                marginBottom: '4px'
                              }}>
                                <span style={{ color: '#1e40af', fontWeight: '600' }}>#{biopsy.number}</span>
                                <span style={{ color: '#0ea5e9' }}>{biopsy.type || '-'}</span>
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#0369a1',
                                marginBottom: '4px'
                              }}>
                                <span style={{ fontWeight: '600' }}>{biopsy.tissueType}</span>
                                {biopsy.tissueType === 'Endoscopia' && biopsy.endoscopiaSubTypes && biopsy.endoscopiaSubTypes.length > 0 && (
                                  <span style={{ color: '#0ea5e9' }}> ({biopsy.endoscopiaSubTypes.join(', ')})</span>
                                )}
                              </div>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px'
                              }}>
                                <span style={{ color: '#0369a1' }}>
                                  {biopsy.tissueType === 'PAP' || biopsy.tissueType === 'Citología' ? 'Vidrios' : 'Cassettes'}: 
                                  <strong>
                                    {biopsy.tissueType === 'PAP' 
                                      ? biopsy.papQuantity 
                                      : biopsy.tissueType === 'Citología' 
                                        ? biopsy.citologiaQuantity 
                                        : biopsy.cassettes
                                    }
                                  </strong>
                                </span>
                                {serviciosActivos.length > 0 && (
                                  <span style={{ color: '#7c3aed' }}>
                                    🔧 {serviciosActivos.length} servicio{serviciosActivos.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              {serviciosActivos.length > 0 && (
                                <div style={{
                                  marginTop: '8px',
                                  paddingTop: '8px',
                                  borderTop: '1px solid #e0f2fe'
                                }}>
                                  <p style={{
                                    fontSize: '12px',
                                    color: '#7c3aed',
                                    margin: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }} title={serviciosActivos.join(', ')}>
                                    {serviciosActivos.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {entry.biopsies.length > 3 && (
                          <p style={{
                            fontSize: '12px',
                            color: '#0369a1',
                            textAlign: 'center',
                            margin: '8px 0 0 0'
                          }}>
                            ... y {entry.biopsies.length - 3} más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción optimizados para tablet */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handlePrint(entry)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <Printer size={16} />
                      Imprimir
                    </button>
                    
                    <button
                      onClick={() => handleEmail(entry)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Mail size={16} />
                      Email
                    </button>
                    
                    <button
                      onClick={() => handleDelete(entry.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 12px 0'
            }}>
              Confirmar Eliminación
            </h3>
            <p style={{
              color: '#6B7280',
              margin: '0 0 24px 0'
            }}>
              ¿Estás seguro de que quieres eliminar este remito? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, entryId: null })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de email */}
      {emailPopup.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 12px 0'
            }}>
              Enviar por Email
            </h3>
            <p style={{
              color: '#6B7280',
              margin: '0 0 16px 0'
            }}>
              Ingresa la dirección de email para enviar el remito:
            </p>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="correo@ejemplo.com"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                marginBottom: '24px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEmailPopup({ isOpen: false, entry: null })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  console.log('Enviando email a:', emailAddress);
                  setEmailPopup({ isOpen: false, entry: null });
                  setEmailAddress('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
