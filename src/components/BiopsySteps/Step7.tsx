import React from 'react';
import { Save, FileText, Eye, ChevronLeft } from 'lucide-react';
import { BiopsyForm } from '../../types';
import { serviciosAdicionales, giemsaOptions } from '../../constants/services';

interface Step7Props {
  biopsyForm: BiopsyForm;
  onObservationsChange: (value: string) => void;
  onSave: () => void;
  onPrev: () => void;
  onFinishDailyReport: () => void;
  onOpenVirtualKeyboard: (type: 'numeric' | 'full', field: string, currentValue?: string) => void;
}

export const Step7: React.FC<Step7Props> = ({
  biopsyForm,
  // onObservationsChange, // No se usa directamente, se maneja por el teclado virtual
  onSave,
  onPrev,
  onFinishDailyReport,
  onOpenVirtualKeyboard
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

  // Determinar si es PAP o Citología
  const isPAPSelected = biopsyForm.tissueType === 'PAP';
  const isCitologiaSelected = biopsyForm.tissueType === 'Citología';
  const isPapOrCitologia = isPAPSelected || isCitologiaSelected;

  // Textos dinámicos
  const getTitle = () => {
    if (isPAPSelected) return 'Vista Previa de los PAP';
    if (isCitologiaSelected) return 'Vista Previa de las Citologías';
    return 'Vista Previa de la Biopsia';
  };

  const getGiemsaText = () => {
    if (biopsyForm.servicios?.giemsaOptions) {
      const selected = Object.entries(biopsyForm.servicios.giemsaOptions)
        .filter(([_, isSelected]) => isSelected)
        .map(([key, _]) => {
          const option = giemsaOptions.find(opt => opt.key === key);
          return option ? option.label : key;
        });
      return selected.length > 0 ? selected.join(', ') : 'No especificado';
    }
    return 'No especificado';
  };

  const getMaterialText = () => {
    if (isPapOrCitologia) {
      if (isPAPSelected) {
        return `${biopsyForm.papQuantity} vidrio${biopsyForm.papQuantity > 1 ? 's' : ''} PAP`;
      } else {
        return `${biopsyForm.citologiaQuantity} vidrio${biopsyForm.citologiaQuantity > 1 ? 's' : ''} citología`;
      }
    } else {
      const cassettes = parseInt(biopsyForm.cassettes) || 0;
      const pieces = parseInt(biopsyForm.pieces) || 0;
      let text = `${cassettes} cassette${cassettes > 1 ? 's' : ''}`;
      if (pieces > 0) {
        text += ` • ${pieces} trozo${pieces > 1 ? 's' : ''}`;
      }
      return text;
    }
  };

  // Obtener servicios activos
  const getServiciosActivos = () => {
    const serviciosActivos: string[] = [];
    
    if (biopsyForm.servicios) {
      Object.entries(biopsyForm.servicios).forEach(([key, value]) => {
        if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
          const servicio = serviciosAdicionales.find(s => s.key === key);
          if (servicio) {
            let servicioLabel = servicio.label;
            
            // Manejo especial para Giemsa/PAS/Masson
            if (key === 'giemsaPASMasson' && biopsyForm.servicios.giemsaOptions) {
              const giemsaSelected = Object.entries(biopsyForm.servicios.giemsaOptions)
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
              const quantity = biopsyForm.servicios.corteBlancoIHQQuantity || 1;
              servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
            } else if (key === 'corteBlancoComun') {
              const quantity = biopsyForm.servicios.corteBlancoComunQuantity || 1;
              servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
            }
            
            serviciosActivos.push(servicioLabel);
          }
        }
      });
    }
    
    return serviciosActivos;
  };

  // Obtener números de cassettes
  const getCassettesNumbers = () => {
    if (isPapOrCitologia) {
      return [biopsyForm.number];
    }
    
    if (biopsyForm.cassettesNumbers && biopsyForm.cassettesNumbers.length > 0) {
      return biopsyForm.cassettesNumbers.map(cassette => `${cassette.base}${cassette.suffix}`);
    }
    
    return [biopsyForm.number];
  };

  const serviciosActivos = getServiciosActivos();
  const cassettesNumbers = getCassettesNumbers();

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
              <Eye style={{ height: '20px', width: '20px', color: 'white' }} />
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(34, 197, 94, 0.4)'
              }}>
                7
              </div>
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Resumen Final</h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>Confirma todos los datos</p>
            </div>
          </div>
          
          {/* Navegación integrada en el header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onPrev}
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
              <ChevronLeft size={16} />
              Anterior
            </button>
            <button
              onClick={onSave}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Save size={16} />
              Guardar
            </button>
            <button
              onClick={onFinishDailyReport}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FileText size={16} />
              Finalizar
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
          {getTitle()}
        </h2>
      </div>

      {/* Contenido principal con scroll */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 24px 24px 24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          border: '1px solid #e5e7eb'
        }}>
          {/* Vista previa de la biopsia */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            
            {/* Información básica */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  {isPAPSelected ? 'Número de PAP' : isCitologiaSelected ? 'Número de Citología' : 'Número de Biopsia'}
                </p>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: colors.primaryBlue,
                  margin: '0'
                }}>
                  #{biopsyForm.number}
                </p>
              </div>
              
              {/* Tipo de tejido */}
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  Tipo de Tejido
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0'
                }}>
                  {biopsyForm.tissueType === 'Endoscopia' && biopsyForm.endoscopiaSubTypes && biopsyForm.endoscopiaSubTypes.length > 0 
                    ? `${biopsyForm.tissueType} (${biopsyForm.endoscopiaSubTypes.join(', ')})` 
                    : biopsyForm.tissueType}
                </p>
              </div>
            </div>

            {/* Tipo de biopsia y material */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              {/* Tipo de biopsia - solo para biopsias normales */}
              {!isPapOrCitologia && (
                <div>
                  <p style={{
                    fontSize: '12px',
                    color: colors.darkGray,
                    fontWeight: '500',
                    margin: '0 0 4px 0'
                  }}>
                    Tipo
                  </p>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0'
                  }}>
                    {biopsyForm.type}
                  </p>
                </div>
              )}
              
              {/* Material */}
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  Material
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0'
                }}>
                  {getMaterialText()}
                </p>
              </div>
            </div>

            {/* Números de cassettes o vidrios */}
            {cassettesNumbers.length > 0 && (
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 8px 0'
                }}>
                  {isPapOrCitologia ? 'Números de Vidrios' : 'Números de Cassettes'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {cassettesNumbers.map((number, index) => (
                    <span key={index} style={{
                      background: colors.lightBlue,
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {number}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Desclasificar - solo para biopsias normales */}
            {!isPapOrCitologia && biopsyForm.declassify && biopsyForm.declassify !== 'No desclasificar' && (
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  Desclasificar
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#F59E0B',
                  margin: '0'
                }}>
                  {biopsyForm.declassify}
                </p>
              </div>
            )}

            {/* Servicios adicionales */}
            {serviciosActivos.length > 0 && (
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 8px 0'
                }}>
                  Servicios Adicionales
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {serviciosActivos.map((servicio, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: colors.green
                      }} />
                      <span style={{
                        fontSize: '14px',
                        color: '#1f2937',
                        fontWeight: '500'
                      }}>
                        {servicio}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tiempo Giemsa - solo para PAP/Citología */}
            {isPapOrCitologia && (
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  Tiempo Giemsa
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0'
                }}>
                  {getGiemsaText()}
                </p>
              </div>
            )}

            {/* Observaciones */}
            <div>
              <p style={{
                fontSize: '12px',
                color: colors.darkGray,
                fontWeight: '500',
                margin: '0 0 8px 0'
              }}>
                Observaciones
              </p>
              <div
                onClick={() => onOpenVirtualKeyboard('full', 'observations', biopsyForm.observations)}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  background: colors.lightGray,
                  border: `2px solid ${biopsyForm.observations ? colors.primaryBlue : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: biopsyForm.observations ? '#1f2937' : colors.darkGray,
                  fontStyle: biopsyForm.observations ? 'normal' : 'italic'
                }}
              >
                {biopsyForm.observations || 'Toque aquí para agregar observaciones...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step7;
