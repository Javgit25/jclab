import React from 'react';
import { Save, FileText, Eye, Check, Package, Hash, Shield, TestTube } from 'lucide-react';
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
  onObservationsChange,
  onSave,
  onPrev,
  onFinishDailyReport,
  onOpenVirtualKeyboard
}) => {
  // Colores del diseño
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

  // ✅ DETERMINAR SI ES PAP O CITOLOGÍA
  const isPAPSelected = biopsyForm.tissueType === 'PAP';
  const isCitologiaSelected = biopsyForm.tissueType === 'Citología';
  const isPapOrCitologia = isPAPSelected || isCitologiaSelected;

  // ✅ FUNCIONES PARA OBTENER TEXTOS DINÁMICOS
  const getTitle = () => {
    if (isPAPSelected) return 'Vista Previa de los PAP';
    if (isCitologiaSelected) return 'Vista Previa de las Citologías';
    return 'Vista Previa de la Biopsia';
  };

  const getSubtitle = () => {
    if (isPAPSelected) return 'Revisa todos los datos de los PAP ingresados';
    if (isCitologiaSelected) return 'Revisa todos los datos de las Citologías ingresados';
    return 'Revisa todos los datos ingresados';
  };

  const getNumberLabel = () => {
    if (isPAPSelected) return 'Número de PAP';
    if (isCitologiaSelected) return 'Número de Citología';
    return 'Número de Biopsia';
  };

  const getTissueLabel = () => {
    if (isPAPSelected || isCitologiaSelected) return 'Tipo de Estudio';
    return 'Tipo de Tejido';
  };

  const getCassettesLabel = () => {
    if (isPAPSelected) return 'Cantidad de Vidrios';
    if (isCitologiaSelected) return 'Cantidad de Vidrios';
    return 'Cassettes';
  };

  // Debug logs
  React.useEffect(() => {
    console.log('Step7 - Props recibidas:');
    console.log('- biopsyForm:', biopsyForm);
    console.log('- onSave:', typeof onSave);
    console.log('- onFinishDailyReport:', typeof onFinishDailyReport);
  }, [biopsyForm, onSave, onFinishDailyReport]);

  const handleSave = () => {
    console.log('Step7 - Botón Guardar Biopsia presionado');
    console.log('Step7 - Biopsia a guardar:', biopsyForm);
    onSave();
  };

  const handleFinishDaily = () => {
    console.log('Step7 - Botón Finalizar Remito presionado');
    console.log('Step7 - Biopsia actual que se incluirá:', biopsyForm);
    onFinishDailyReport();
  };

  const handleObservationsClick = () => {
    console.log('Step7 - Abriendo teclado para observaciones');
    onOpenVirtualKeyboard('full', 'observations', biopsyForm.observations);
  };

  // ✅ FUNCIÓN CORREGIDA PARA EVITAR DUPLICADOS DE GIEMSA
  const getServiciosActivos = () => {
    const serviciosActivos: string[] = [];
    if (biopsyForm.servicios) {
      Object.entries(biopsyForm.servicios).forEach(([key, value]) => {
        if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
          const servicio = serviciosAdicionales.find(s => s.key === key);
          if (servicio) {
            let servicioLabel = servicio.label;
            
            // ✅ MANEJO ESPECIAL PARA GIEMSA/PAS/MASSON CON SUBMENÚ
            if (key === 'giemsaPASMasson' && biopsyForm.servicios.giemsaOptions) {
              console.log('🔍 Procesando Giemsa con opciones:', biopsyForm.servicios.giemsaOptions);
              
              const giemsaSelected = Object.entries(biopsyForm.servicios.giemsaOptions)
                .filter(([_, selected]) => selected)
                .map(([optionKey, _]) => {
                  const option = giemsaOptions.find(opt => opt.key === optionKey);
                  return option ? option.label : optionKey;
                });
              
              console.log('🎨 Opciones Giemsa seleccionadas:', giemsaSelected);
              
              if (giemsaSelected.length > 0) {
                // ✅ MOSTRAR SOLO LAS OPCIONES ESPECÍFICAS SELECCIONADAS
                servicioLabel = giemsaSelected.join(', ');
                console.log('✅ Etiqueta final de Giemsa:', servicioLabel);
              } else {
                // Si no hay sub-opciones seleccionadas, no mostrar nada
                console.log('⚠️ Giemsa sin sub-opciones seleccionadas, omitiendo...');
                return;
              }
            }
            // ✅ AGREGAR CANTIDAD PARA CORTES EN BLANCO
            else if (key === 'corteBlancoIHQ') {
              const quantity = biopsyForm.servicios.corteBlancoIHQQuantity || 1;
              servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
            } else if (key === 'corteBlancoComun') {
              const quantity = biopsyForm.servicios.corteBlancoComunQuantity || 1;
              servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
            }
            
            serviciosActivos.push(servicioLabel);
            console.log('✅ Servicio agregado:', servicioLabel);
          }
        }
      });
    }
    
    console.log('📋 Servicios activos finales:', serviciosActivos);
    return serviciosActivos;
  };

  // ✅ FUNCIÓN PARA OBTENER NÚMEROS DE CASSETTES O VIDRIOS
  const getCassettesNumbers = () => {
    // ✅ PARA PAP/CITOLOGÍA MOSTRAR CANTIDAD DE VIDRIOS
    if (isPAPSelected) {
      return [biopsyForm.papQuantity?.toString() || '0'];
    }
    if (isCitologiaSelected) {
      return [biopsyForm.citologiaQuantity?.toString() || '0'];
    }
    
    // Para biopsias normales, mostrar números de cassettes
    if (!biopsyForm.cassettesNumbers || biopsyForm.cassettesNumbers.length === 0) {
      return [biopsyForm.number];
    }
    
    return biopsyForm.cassettesNumbers.map((cassette, index) => {
      if (typeof cassette === 'string') {
        return cassette;
      }
      if (index === 0) {
        return cassette.base;
      } else {
        return `${cassette.base}/${cassette.suffix || index}`;
      }
    });
  };

  // Función para obtener el tipo de tejido completo
  const getTissueTypeDisplay = () => {
    if (biopsyForm.tissueType === 'Endoscopia' && biopsyForm.endoscopiaSubTypes && biopsyForm.endoscopiaSubTypes.length > 0) {
      return `${biopsyForm.tissueType} (${biopsyForm.endoscopiaSubTypes.join(', ')})`;
    }
    return biopsyForm.tissueType;
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
      {/* Header Compacto y Limpio */}
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
          <button
            onClick={onPrev}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            ← Anterior
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div style={{ flex: 1, padding: '4px 8px 12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Título Principal - Fuera del box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '16px',
          padding: '0 16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '6px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}>
            <Eye style={{ height: '16px', width: '16px', color: 'white' }} />
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>📋 {getTitle()}</h2>
        </div>
            margin: '0',
            lineHeight: '1.3'
          }}>
            Revise y confirme los datos antes de guardar
          </p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div style={{
        flex: '1',
        padding: '15px',
        overflowY: 'auto'
      }}>
        
        {/* Header del resumen */}
        <div style={{
          backgroundColor: colors.white,
          padding: '20px',
          borderRadius: '16px',
          border: '2px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#EBF4FF',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Eye style={{ width: '20px', height: '20px', color: colors.primaryBlue }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1F2937',
                margin: '0'
              }}>
                {getTitle()}
              </h3>
              <p style={{
                fontSize: '14px',
                color: colors.darkGray,
                margin: '0'
              }}>
                {getSubtitle()}
              </p>
            </div>
          </div>

          {/* Vista previa de la biopsia */}
          <div style={{
            background: '#F8FAFC',
            padding: '20px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            
            {/* Información básica */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  {getNumberLabel()}
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
              {/* ✅ MOSTRAR TIPO SOLO PARA BIOPSIAS NORMALES */}
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
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#8B5CF6',
                    margin: '0'
                  }}>
                    {biopsyForm.type}
                  </p>
                </div>
              )}
            </div>

            {/* Tejido */}
            <div>
              <p style={{
                fontSize: '12px',
                color: colors.darkGray,
                fontWeight: '500',
                margin: '0 0 4px 0'
              }}>
                {getTissueLabel()}
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#374151',
                margin: '0'
              }}>
                {getTissueTypeDisplay()}
              </p>
            </div>

            {/* ✅ CASSETTES/VIDRIOS Y TROZOS - SOLO PARA BIOPSIAS NORMALES */}
            {!isPapOrCitologia && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <p style={{
                    fontSize: '12px',
                    color: colors.darkGray,
                    fontWeight: '500',
                    margin: '0 0 4px 0'
                  }}>
                    Cassettes
                  </p>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#374151',
                    margin: '0'
                  }}>
                    {biopsyForm.cassettes}
                  </p>
                </div>
                {biopsyForm.pieces && (
                  <div>
                    <p style={{
                      fontSize: '12px',
                      color: colors.darkGray,
                      fontWeight: '500',
                      margin: '0 0 4px 0'
                    }}>
                      Trozos
                    </p>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      margin: '0'
                    }}>
                      {biopsyForm.pieces}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ✅ MOSTRAR CANTIDAD DE VIDRIOS PARA PAP/CITOLOGÍA */}
            {isPapOrCitologia && (
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  {getCassettesLabel()}
                </p>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: colors.primaryBlue,
                  margin: '0'
                }}>
                  {isPAPSelected ? biopsyForm.papQuantity : biopsyForm.citologiaQuantity}
                </p>
              </div>
            )}

            {/* ✅ MOSTRAR URGENCIA PARA PAP/CITOLOGÍA */}
            {isPapOrCitologia && ((isPAPSelected && biopsyForm.papUrgente) || (isCitologiaSelected && biopsyForm.citologiaUrgente)) && (
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  Prioridad
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#F59E0B',
                  margin: '0'
                }}>
                  ⚡ Urgente 24hs
                </p>
              </div>
            )}

            {/* ✅ NÚMEROS DE CASSETTES - SOLO PARA BIOPSIAS NORMALES */}
            {!isPapOrCitologia && cassettesNumbers.length > 0 && (
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.darkGray,
                  fontWeight: '500',
                  margin: '0 0 8px 0'
                }}>
                  Números de Cassettes
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {cassettesNumbers.map((number, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#EBF4FF',
                        color: colors.primaryBlue,
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {number}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ DESCLASIFICAR - SOLO PARA BIOPSIAS NORMALES */}
            {!isPapOrCitologia && biopsyForm.declassify && biopsyForm.declassify !== 'No' && (
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

            {/* ✅ SERVICIOS ADICIONALES - SOLO PARA BIOPSIAS NORMALES Y SIN DUPLICADOS */}
            {!isPapOrCitologia && serviciosActivos.length > 0 && (
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
                        backgroundColor: '#8B5CF6',
                        borderRadius: '50%'
                      }}></div>
                      <span style={{
                        fontSize: '14px',
                        color: '#8B5CF6',
                        fontWeight: '500'
                      }}>
                        {servicio}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Observaciones */}
        <div style={{
          backgroundColor: colors.white,
          padding: '20px',
          borderRadius: '16px',
          border: '2px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: '15px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Observaciones (Opcional)
            </label>
            <div 
              onClick={handleObservationsClick}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: `2px solid ${biopsyForm.observations ? colors.primaryBlue : '#E5E7EB'}`,
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!biopsyForm.observations) {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }
              }}
              onMouseOut={(e) => {
                if (!biopsyForm.observations) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }
              }}
            >
              {biopsyForm.observations ? (
                <p style={{
                  color: '#374151',
                  fontSize: '14px',
                  margin: '0'
                }}>
                  {biopsyForm.observations}
                </p>
              ) : (
                <p style={{
                  color: '#9CA3AF',
                  fontSize: '14px',
                  fontStyle: 'italic',
                  margin: '0'
                }}>
                  Toca aquí para agregar observaciones...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Información importante */}
        <div style={{
          backgroundColor: '#F0F9FF',
          padding: '16px',
          borderRadius: '12px',
          border: '2px solid #BAE6FD',
          marginBottom: '15px'
        }}>
          <h4 style={{
            fontWeight: '600',
            color: '#0369A1',
            marginBottom: '8px',
            fontSize: '16px'
          }}>
            ℹ️ Información importante:
          </h4>
          <div style={{
            fontSize: '14px',
            color: '#0C4A6E',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div>• <strong>Guardar {isPapOrCitologia ? (isPAPSelected ? 'PAP' : 'Citología') : 'Biopsia'}:</strong> Guarda este {isPapOrCitologia ? (isPAPSelected ? 'PAP' : 'estudio') : 'estudio'} y continúa agregando más</div>
            <div>• <strong>Finalizar Remito:</strong> Guarda este {isPapOrCitologia ? (isPAPSelected ? 'PAP' : 'estudio') : 'estudio'} y completa el remito del día</div>
            <div>• Puedes modificar cualquier dato volviendo a los pasos anteriores</div>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Botón para guardar solo esta biopsia */}
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.darkBlue} 100%)`,
              color: colors.white,
              fontWeight: '600',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 118, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Save style={{ width: '18px', height: '18px' }} />
            <span>💾 Guardar {isPapOrCitologia ? (isPAPSelected ? 'PAP' : 'Citología') : 'Biopsia'}</span>
          </button>

          {/* Botón para finalizar remito del día */}
          <button
            onClick={handleFinishDaily}
            style={{
              width: '100%',
              background: `linear-gradient(135deg, ${colors.green} 0%, #059669 100%)`,
              color: colors.white,
              fontWeight: '600',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(81, 207, 102, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FileText style={{ width: '18px', height: '18px' }} />
            <span>📋 Guardar {isPapOrCitologia ? (isPAPSelected ? 'PAP' : 'Citología') : 'Biopsia'} y Finalizar Remito del Día</span>
          </button>
        </div>
      </div>

      {/* Botón de navegación hacia atrás */}
      <div style={{
        padding: '15px',
        backgroundColor: colors.white,
        borderTop: '1px solid #E2E8F0'
      }}>
        <button
          onClick={onPrev}
          style={{
            backgroundColor: '#6B7280',
            color: colors.white,
            fontWeight: '600',
            padding: '12px 20px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#4B5563';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#6B7280';
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          <span>{isPapOrCitologia ? 'Volver a Tipo de Tejido' : 'Volver a Servicios'}</span>
        </button>
      </div>
    </div>
  );
};
export default Step7_old;
