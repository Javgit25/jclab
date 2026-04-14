import React, { useState } from 'react';
import { ArrowRight, Check, TestTube, Plus, Minus, Beaker } from 'lucide-react';
import { BiopsyServices, GiemsaServices, CassetteNumber } from '../../types';
import { serviciosAdicionales } from '../../constants/services';

interface Step6Props {
  servicios: BiopsyServices;
  cassettesCount?: number;
  cassettesNumbers?: CassetteNumber[];
  onServicioChange: (servicioKey: keyof BiopsyServices) => void;
  onGiemsaOptionChange: (giemsaKey: keyof GiemsaServices) => void;
  onGiemsaTotalChange: (total: number) => void;
  onCorteBlancoQuantityChange: (type: 'ihq' | 'comun', quantity: number) => void;
  onCassetteSelectionChange?: (service: string, cassettes: number[]) => void;
  onServicioFieldChange?: (field: string, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  tissueType?: string;
  onFinishRemito?: () => void;
  todayBiopsiesCount?: number;
}

export const Step6: React.FC<Step6Props> = ({
  servicios,
  cassettesCount = 0,
  cassettesNumbers = [],
  onServicioChange,
  onGiemsaOptionChange,
  onGiemsaTotalChange,
  onCorteBlancoQuantityChange,
  onCassetteSelectionChange,
  onServicioFieldChange,
  onNext,
  onPrev,
  onFinishRemito,
  todayBiopsiesCount
}) => {
  // Estado para cassettes seleccionados por servicio
  const [selectedCassettesIHQ, setSelectedCassettesIHQ] = useState<number[]>([]);
  const [selectedCassettesComun, setSelectedCassettesComun] = useState<number[]>([]);
  const [selectedCassettesGiemsa, setSelectedCassettesGiemsa] = useState<number[]>([]);

  const showCassetteSelector = cassettesCount >= 2;

  // Componente selector de cassettes
  const CassetteSelector = ({ selected, onChange, label, serviceKey }: { selected: number[]; onChange: (sel: number[]) => void; label: string; serviceKey?: string }) => {
    if (!showCassetteSelector) return null;
    return (
      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
          Seleccionar cassettes para {label}:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {Array.from({ length: cassettesCount }, (_, i) => {
            const isFirst = i === 0;
            const base = cassettesNumbers[i]?.base || 'C';
            const suffix = cassettesNumbers[i]?.suffix || `${i + 1}`;
            const cassetteLabel = isFirst ? `${base}${suffix}` : `${base}-${suffix}`;
            const isSelected = selected.includes(i);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '8px', fontWeight: '700', color: isFirst ? 'transparent' : '#1e40af', letterSpacing: '0.5px' }}>{isFirst ? '\u00A0' : 'SUB'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newSel = isSelected ? selected.filter(s => s !== i) : [...selected, i];
                    onChange(newSel); if (onCassetteSelectionChange && serviceKey) onCassetteSelectionChange(serviceKey, newSel);
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                    border: `2px solid ${isSelected ? '#1e40af' : '#d1d5db'}`,
                    backgroundColor: isSelected ? '#1e40af' : 'white',
                    color: isSelected ? 'white' : '#374151',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {cassetteLabel}
                </button>
              </div>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div style={{ fontSize: '10px', color: '#1e40af', marginTop: '6px', fontWeight: '500' }}>
            {selected.length} cassette{selected.length > 1 ? 's' : ''} seleccionado{selected.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  };
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

  // ✅ FUNCIÓN CORREGIDA para manejar cambios en técnicas GIEMSA/PAS/MASSON
  const handleGiemsaOptionToggle = (giemsaKey: keyof GiemsaServices) => {
    // 1. Cambiar el estado individual de la técnica
    onGiemsaOptionChange(giemsaKey);
    
    // 2. Calcular nueva cantidad total de técnicas seleccionadas
    const currentOptions = servicios.giemsaOptions || {};
    const newState = !currentOptions[giemsaKey];
    const newOptions = { ...currentOptions, [giemsaKey]: newState };
    const totalSelected = Object.values(newOptions).filter(Boolean).length;
    
    // 3. Actualizar el total en servicios para facturación
    onGiemsaTotalChange(totalSelected);
    
    console.log('🧪 GIEMSA Debug:', {
      giemsaKey,
      newState,
      newOptions,
      totalSelected
    });
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseColors = {
      red: isSelected 
        ? { bg: '#FEF2F2', border: '#DC2626', text: '#991B1B' }
        : { bg: colors.white, border: '#E5E7EB', text: '#374151' },
      purple: isSelected 
        ? { bg: '#FAF5FF', border: '#7C3AED', text: '#581C87' }
        : { bg: colors.white, border: '#E5E7EB', text: '#374151' },
      green: isSelected 
        ? { bg: '#F0FDF4', border: '#059669', text: '#064E3B' }
        : { bg: colors.white, border: '#E5E7EB', text: '#374151' },
      orange: isSelected 
        ? { bg: '#FFF7ED', border: '#EA580C', text: '#9A3412' }
        : { bg: colors.white, border: '#E5E7EB', text: '#374151' },
      gray: isSelected 
        ? { bg: '#F9FAFB', border: '#6B7280', text: '#374151' }
        : { bg: colors.white, border: '#E5E7EB', text: '#374151' },
      blue: isSelected 
        ? { bg: '#EBF8FF', border: colors.primaryBlue, text: '#1E3A8A' }
        : { bg: colors.white, border: '#E5E7EB', text: '#374151' },
      indigo: isSelected 
        ? { bg: '#EEF2FF', border: '#6366F1', text: '#312E81' }
        : { bg: colors.white, border: '#E5E7EB', text: '#374151' }
    };
    return baseColors[color as keyof typeof baseColors] || baseColors.gray;
  };

  // Contador para servicios seleccionados (excluyendo cantidades y sub-opciones)
  const serviciosSeleccionados = Object.entries(servicios).filter(([key, value]) => 
    key !== 'giemsaOptions' && 
    key !== 'corteBlancoIHQQuantity' && 
    key !== 'corteBlancoComunQuantity' && 
    value === true
  ).length;

  // Componente para contador de cantidad
  const QuantityCounter = ({ 
    value, 
    onChange, 
    min = 1, 
    max = 20,
    label,
    unit = "vidrio"
  }: { 
    value: number; 
    onChange: (value: number) => void; 
    min?: number; 
    max?: number;
    label: string;
    unit?: string;
  }) => (
    <div style={{
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '1px solid rgba(59, 91, 219, 0.2)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151'
        }}>
          {label}:
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (value > min) onChange(value - 1);
            }}
            disabled={value <= min}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: value > min ? '#F3F4F6' : '#E5E7EB',
              border: '2px solid #D1D5DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: value > min ? 'pointer' : 'not-allowed',
              opacity: value <= min ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <Minus size={20} color="#6B7280" />
          </button>
          
          <div style={{
            backgroundColor: '#F8FAFC',
            padding: '12px 20px',
            borderRadius: '8px',
            minWidth: '90px',
            textAlign: 'center',
            border: '2px solid #E5E7EB'
          }}>
            <span style={{
              fontWeight: 'bold',
              fontSize: '16px',
              color: '#1F2937'
            }}>
              {value}
            </span>
            <span style={{
              fontSize: '12px',
              marginLeft: '4px',
              color: '#6B7280'
            }}>
              {unit}{value !== 1 ? 's' : ''}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (value < max) onChange(value + 1);
            }}
            disabled={value >= max}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: value < max ? '#F3F4F6' : '#E5E7EB',
              border: '2px solid #D1D5DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: value < max ? 'pointer' : 'not-allowed',
              opacity: value >= max ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={20} color="#6B7280" />
          </button>
        </div>
      </div>
      <div style={{
        fontSize: '11px',
        color: '#6B7280',
        marginTop: '8px',
        textAlign: 'center'
      }}>
        Se cobra por unidad • Min: {min}, Max: {max}
      </div>
    </div>
  );

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
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
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
              <TestTube style={{ height: '20px', width: '20px', color: 'white' }} />
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
                6
              </div>
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Servicios Adicionales</h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>Seleccione los servicios requeridos</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onFinishRemito && todayBiopsiesCount && todayBiopsiesCount > 0 && (
              <button onClick={onFinishRemito} style={{
                background: '#dc2626', color: 'white', border: 'none',
                borderRadius: '8px', padding: '6px 12px', fontSize: '10px',
                fontWeight: '700', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '3px', whiteSpace: 'nowrap'
              }}>
                📋 Finalizar ({todayBiopsiesCount})
              </button>
            )}
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
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
            padding: '6px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}>
            <TestTube style={{ height: '16px', width: '16px', color: 'white' }} />
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>🧪 Servicios Adicionales</h2>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e5e7eb',
          margin: '0 8px'
        }}>
          
          {/* Contador de servicios */}
          {serviciosSeleccionados > 0 && (
            <div style={{
              backgroundColor: '#EBF4FF',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              textAlign: 'center',
              border: `2px solid ${colors.lightBlue}`
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colors.primaryBlue
              }}>
                ✅ {serviciosSeleccionados} servicio{serviciosSeleccionados !== 1 ? 's' : ''} seleccionado{serviciosSeleccionados !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: (servicios.corteBlancoIHQ || servicios.corteBlancoComun || servicios.giemsaPASMasson) ? '6px' : '10px' }}>

            {/* SERVICIOS BÁSICOS - EXCLUYENDO giemsaPASMasson, corteBlancoIHQ, corteBlancoComun */}
            {(() => {
              const hayExpandido = servicios.corteBlancoIHQ || servicios.corteBlancoComun || servicios.giemsaPASMasson;
              return serviciosAdicionales
                .filter(servicio => !['giemsaPASMasson', 'corteBlancoIHQ', 'corteBlancoComun'].includes(servicio.key))
                .map((servicio) => {
                const IconComponent = servicio.icon;
                const isSelected = Boolean(servicios[servicio.key as keyof BiopsyServices]);
                const colorStyles = getColorClasses(servicio.color, isSelected);
                const compacto = hayExpandido && !isSelected;

                return (
                  <button
                    key={servicio.key}
                    onClick={() => onServicioChange(servicio.key as keyof BiopsyServices)}
                    style={{
                      width: '100%',
                      padding: compacto ? '8px 14px' : '14px',
                      borderRadius: compacto ? '8px' : '12px',
                      border: `2px solid ${colorStyles.border}`,
                      backgroundColor: colorStyles.bg,
                      color: colorStyles.text,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                      boxShadow: isSelected ? '0 3px 12px rgba(79, 118, 246, 0.15)' : 'none'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: `2px solid ${isSelected ? colorStyles.border : '#D1D5DB'}`,
                        backgroundColor: isSelected ? colors.white : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isSelected && <Check size={18} color={colorStyles.border} />}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: '1'
                      }}>
                        <IconComponent size={compacto ? 18 : 24} color={colorStyles.text} />
                        <div>
                          <div style={{
                            fontWeight: '600',
                            fontSize: compacto ? '13px' : '15px',
                            marginBottom: compacto ? '0' : '3px'
                          }}>
                            {servicio.label}
                          </div>
                          {!compacto && (
                            <div style={{
                              fontSize: '12px',
                              opacity: 0.8
                            }}>
                              {servicio.description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {(servicio.key.includes('urgente') || servicio.key === 'cassetteUrgente') && (
                        <div style={{
                          fontSize: '10px',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          padding: '6px 10px',
                          borderRadius: '12px',
                          fontWeight: '600'
                        }}>
                          24HS
                        </div>
                      )}
                    </div>
                  </button>
                );
              });
            })()}

            {/* CORTE EN BLANCO PARA IHQ - CON CONTADOR */}
            <div style={{
              padding: (!servicios.corteBlancoIHQ && (servicios.corteBlancoComun || servicios.giemsaPASMasson)) ? '8px 14px' : '14px',
              borderRadius: '10px',
              border: `2px solid ${servicios.corteBlancoIHQ ? '#6366F1' : '#E5E7EB'}`,
              backgroundColor: servicios.corteBlancoIHQ ? '#EEF2FF' : colors.white,
              transition: 'all 0.2s ease',
              transform: servicios.corteBlancoIHQ ? 'scale(1.01)' : 'scale(1)',
              boxShadow: servicios.corteBlancoIHQ ? '0 3px 12px rgba(99, 102, 241, 0.15)' : 'none'
            }}>
              <button
                onClick={() => onServicioChange('corteBlancoIHQ')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: `2px solid ${servicios.corteBlancoIHQ ? '#6366F1' : '#D1D5DB'}`,
                    backgroundColor: servicios.corteBlancoIHQ ? colors.white : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {servicios.corteBlancoIHQ && <Check size={18} color="#6366F1" />}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: '1'
                  }}>
                    <TestTube size={24} color={servicios.corteBlancoIHQ ? '#312E81' : '#374151'} />
                    <div>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '15px',
                        marginBottom: '3px',
                        color: servicios.corteBlancoIHQ ? '#312E81' : '#374151'
                      }}>
                        CORTE EN BLANCO PARA IHQ
                      </div>
                      {(servicios.corteBlancoIHQ || (!servicios.corteBlancoComun && !servicios.giemsaPASMasson)) && (
                        <div style={{
                          fontSize: '12px',
                          opacity: 0.8,
                          color: servicios.corteBlancoIHQ ? '#312E81' : '#374151'
                        }}>
                          Vidrios en blanco para inmunohistoquímica
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '10px',
                    backgroundColor: '#EEF2FF',
                    color: '#6366F1',
                    padding: '6px 10px',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    POR UNIDAD
                  </div>
                </div>
              </button>

              {servicios.corteBlancoIHQ && (
                <>
                  <QuantityCounter
                    value={servicios.corteBlancoIHQQuantity || 1}
                    onChange={(quantity) => onCorteBlancoQuantityChange('ihq', quantity)}
                    min={1}
                    max={20}
                    label="Cantidad de vidrios en blanco para IHQ"
                  />
                  <CassetteSelector selected={selectedCassettesIHQ} onChange={setSelectedCassettesIHQ} label="Corte IHQ" serviceKey="corteBlancoIHQCassettes" />
                </>
              )}
            </div>

            {/* CORTE EN BLANCO COMÚN - CON CONTADOR */}
            <div style={{
              padding: (!servicios.corteBlancoComun && (servicios.corteBlancoIHQ || servicios.giemsaPASMasson)) ? '8px 14px' : '14px',
              borderRadius: '10px',
              border: `2px solid ${servicios.corteBlancoComun ? '#7C3AED' : '#E5E7EB'}`,
              backgroundColor: servicios.corteBlancoComun ? '#FAF5FF' : colors.white,
              transition: 'all 0.2s ease',
              transform: servicios.corteBlancoComun ? 'scale(1.01)' : 'scale(1)',
              boxShadow: servicios.corteBlancoComun ? '0 3px 12px rgba(124, 58, 237, 0.15)' : 'none'
            }}>
              <button
                onClick={() => onServicioChange('corteBlancoComun')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: `2px solid ${servicios.corteBlancoComun ? '#7C3AED' : '#D1D5DB'}`,
                    backgroundColor: servicios.corteBlancoComun ? colors.white : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {servicios.corteBlancoComun && <Check size={18} color="#7C3AED" />}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: '1'
                  }}>
                    <TestTube size={24} color={servicios.corteBlancoComun ? '#581C87' : '#374151'} />
                    <div>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '15px',
                        marginBottom: '3px',
                        color: servicios.corteBlancoComun ? '#581C87' : '#374151'
                      }}>
                        CORTE EN BLANCO COMÚN
                      </div>
                      {(servicios.corteBlancoComun || (!servicios.corteBlancoIHQ && !servicios.giemsaPASMasson)) && (
                        <div style={{
                          fontSize: '12px',
                          opacity: 0.8,
                          color: servicios.corteBlancoComun ? '#581C87' : '#374151'
                        }}>
                          Vidrios en blanco estándar
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '10px',
                    backgroundColor: '#FAF5FF',
                    color: '#7C3AED',
                    padding: '6px 10px',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    POR UNIDAD
                  </div>
                </div>
              </button>

              {servicios.corteBlancoComun && (
                <>
                  <QuantityCounter
                    value={servicios.corteBlancoComunQuantity || 1}
                    onChange={(quantity) => onCorteBlancoQuantityChange('comun', quantity)}
                    min={1}
                    max={20}
                    label="Cantidad de vidrios en blanco comunes"
                  />
                  <CassetteSelector selected={selectedCassettesComun} onChange={setSelectedCassettesComun} label="Corte Blanco" serviceKey="corteBlancoComunCassettes" />
                </>
              )}
            </div>

            {/* ✅ GIEMSA/PAS/MASSON - VERSION CORREGIDA CON CONTADOR AUTOMÁTICO */}
            <div style={{
              padding: (!servicios.giemsaPASMasson && (servicios.corteBlancoIHQ || servicios.corteBlancoComun)) ? '8px 14px' : '14px',
              borderRadius: '10px',
              border: `2px solid ${servicios.giemsaPASMasson ? colors.primaryBlue : '#E5E7EB'}`,
              backgroundColor: servicios.giemsaPASMasson ? '#EBF8FF' : colors.white,
              transition: 'all 0.2s ease',
              transform: servicios.giemsaPASMasson ? 'scale(1.01)' : 'scale(1)',
              boxShadow: servicios.giemsaPASMasson ? '0 3px 12px rgba(79, 118, 246, 0.15)' : 'none'
            }}>
              <button
                onClick={() => onServicioChange('giemsaPASMasson')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: `2px solid ${servicios.giemsaPASMasson ? colors.primaryBlue : '#D1D5DB'}`,
                    backgroundColor: servicios.giemsaPASMasson ? colors.white : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {servicios.giemsaPASMasson && <Check size={18} color={colors.primaryBlue} />}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: '1'
                  }}>
                    <Beaker size={24} color={servicios.giemsaPASMasson ? '#1E3A8A' : '#374151'} />
                    <div>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '15px',
                        marginBottom: '3px',
                        color: servicios.giemsaPASMasson ? '#1E3A8A' : '#374151'
                      }}>
                        GIEMSA / PAS / MASSON
                      </div>
                      {(servicios.giemsaPASMasson || (!servicios.corteBlancoIHQ && !servicios.corteBlancoComun)) && (
                        <div style={{
                          fontSize: '12px',
                          opacity: 0.8,
                          color: servicios.giemsaPASMasson ? '#1E3A8A' : '#374151'
                        }}>
                          Técnicas de tinción especiales
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {servicios.giemsaPASMasson && (
                    <div style={{
                      fontSize: '10px',
                      backgroundColor: '#EBF8FF',
                      color: colors.primaryBlue,
                      padding: '6px 10px',
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}>
                      {[
                        servicios.giemsaOptions?.giemsa && 'GIEMSA',
                        servicios.giemsaOptions?.pas && 'PAS', 
                        servicios.giemsaOptions?.masson && 'MASSON'
                      ].filter(Boolean).join(' + ') || 'SELECCIONAR'}
                    </div>
                  )}
                </div>
              </button>

              {servicios.giemsaPASMasson && (
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(79, 118, 246, 0.2)'
                }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    textAlign: 'center',
                    color: '#1E3A8A'
                  }}>
                    Seleccione las técnicas específicas:
                  </p>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {[
                      { 
                        key: 'giemsa' as keyof GiemsaServices, 
                        label: 'GIEMSA',
                        description: 'Tinción para células sanguíneas'
                      },
                      { 
                        key: 'pas' as keyof GiemsaServices, 
                        label: 'PAS',
                        description: 'Ácido peryódico de Schiff'
                      },
                      { 
                        key: 'masson' as keyof GiemsaServices, 
                        label: 'MASSON',
                        description: 'Tricrómica de Masson'
                      }
                    ].map((option) => (
                      <label 
                        key={option.key} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: servicios.giemsaOptions?.[option.key] 
                            ? 'rgba(79, 118, 246, 0.1)' 
                            : 'transparent',
                          border: servicios.giemsaOptions?.[option.key]
                            ? '1px solid rgba(79, 118, 246, 0.3)'
                            : '1px solid transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={servicios.giemsaOptions?.[option.key] || false}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleGiemsaOptionToggle(option.key);
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        />
                        <div style={{ flex: '1' }}>
                          <div style={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: '#1F2937',
                            marginBottom: '2px'
                          }}>
                            {option.label}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#6B7280'
                          }}>
                            {option.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {/* Indicador de cantidad */}
                  <div style={{
                    marginTop: '12px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <p style={{
                      color: '#059669', fontWeight: '600', textAlign: 'center', margin: '0', fontSize: '12px'
                    }}>
                      {Object.values(servicios.giemsaOptions || {}).filter(Boolean).length} técnica{Object.values(servicios.giemsaOptions || {}).filter(Boolean).length !== 1 ? 's' : ''} × $75 = ${Object.values(servicios.giemsaOptions || {}).filter(Boolean).length * 75}
                    </p>
                  </div>
                  <CassetteSelector selected={selectedCassettesGiemsa} onChange={setSelectedCassettesGiemsa} label="Giemsa/PAS/Masson" serviceKey="giemsaCassettes" />
                </div>
              )}
            </div>
          </div>


          {/* INCLUYE CITOLOGÍA */}
          <div style={{
            background: servicios.incluyeCitologia ? '#f5f3ff' : 'white',
            border: `2px solid ${servicios.incluyeCitologia ? '#7c3aed' : '#e5e7eb'}`,
            borderRadius: '12px', padding: '14px', marginTop: '12px',
            transition: 'all 0.2s'
          }}>
            <div
              onClick={() => {
                if (onServicioFieldChange) {
                  const newVal = !servicios.incluyeCitologia;
                  onServicioFieldChange('incluyeCitologia', newVal);
                  if (newVal && !servicios.citologiaFormato) onServicioFieldChange('citologiaFormato', 'vidrios');
                  if (newVal && !servicios.citologiaVidriosQty) onServicioFieldChange('citologiaVidriosQty', 1);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px',
                border: `2px solid ${servicios.incluyeCitologia ? '#7c3aed' : '#d1d5db'}`,
                background: servicios.incluyeCitologia ? '#7c3aed' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}>
                {servicios.incluyeCitologia && <Check size={14} color="white" />}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: servicios.incluyeCitologia ? '#5b21b6' : '#374151' }}>
                  🧪 Incluye Citología
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Este paciente tiene biopsia + citología</div>
              </div>
            </div>

            {servicios.incluyeCitologia && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Formato de la citología:</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {[
                    { key: 'vidrios', label: '🔬 Vidrios' },
                    { key: 'jeringa', label: '💉 Jeringa' },
                    { key: 'frasco', label: '🧴 Frasco' },
                  ].map(fmt => {
                    const isSelected = servicios.citologiaFormato === fmt.key;
                    return (
                      <button key={fmt.key}
                        onClick={() => onServicioFieldChange && onServicioFieldChange('citologiaFormato', fmt.key)}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: '8px', border: `2px solid ${isSelected ? '#7c3aed' : '#e5e7eb'}`,
                          background: isSelected ? '#f5f3ff' : 'white', cursor: 'pointer', textAlign: 'center',
                          fontSize: '12px', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#5b21b6' : '#374151'
                        }}
                      >
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>

                {servicios.citologiaFormato === 'vidrios' && (
                  <QuantityCounter
                    value={servicios.citologiaVidriosQty || 1}
                    onChange={(val) => onServicioFieldChange && onServicioFieldChange('citologiaVidriosQty', val)}
                    label="Cantidad de vidrios"
                    unit="vidrio"
                  />
                )}
              </div>
            )}
          </div>

          {/* Validación: si hay servicios con 2+ cassettes, deben seleccionar a cuáles */}
          {(() => {
            if (!showCassetteSelector) return null;
            const missing: string[] = [];
            if (servicios.corteBlancoIHQ && selectedCassettesIHQ.length === 0) missing.push('Corte IHQ');
            if (servicios.corteBlancoComun && selectedCassettesComun.length === 0) missing.push('Corte Blanco');
            if (servicios.giemsaPASMasson && selectedCassettesGiemsa.length === 0) missing.push('Giemsa/PAS/Masson');
            if (missing.length === 0) return null;
            return (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
                padding: '10px 12px', marginTop: '12px',
                fontSize: '12px', color: '#991b1b', fontWeight: '500'
              }}>
                Seleccioná a qué cassette/s aplicar: <strong>{missing.join(', ')}</strong>
              </div>
            );
          })()}

          {/* Botón continuar */}
          {(() => {
            let canContinue = true;
            if (showCassetteSelector) {
              if (servicios.corteBlancoIHQ && selectedCassettesIHQ.length === 0) canContinue = false;
              if (servicios.corteBlancoComun && selectedCassettesComun.length === 0) canContinue = false;
              if (servicios.giemsaPASMasson && selectedCassettesGiemsa.length === 0) canContinue = false;
            }
            return (
              <button
                onClick={canContinue ? onNext : undefined}
                disabled={!canContinue}
                style={{
                  width: '100%',
                  fontWeight: 'bold',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  border: 'none',
                  cursor: canContinue ? 'pointer' : 'not-allowed',
                  background: canContinue ? 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)' : '#d1d5db',
                  color: 'white',
                  boxShadow: canContinue ? '0 4px 16px rgba(102, 126, 234, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  marginTop: '12px',
                  opacity: canContinue ? 1 : 0.7
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}>
                  <span>Continuar a Confirmación</span>
                  <ArrowRight style={{ width: '18px', height: '18px' }} />
                </div>
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Step6;
