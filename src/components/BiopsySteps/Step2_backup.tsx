import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Microscope } from 'lucide-react';

interface Step2Props {
  tissueType: string;
  endoscopiaSubTypes: string[];
  frequentTissues: string[];
  papQuantity?: number;
  papUrgente?: boolean;
  citologiaQuantity?: number;
  citologiaUrgente?: boolean;
  onTissueTypeChange: (value: string) => void;
  onEndoscopiaSubTypesChange: (subTypes: string[]) => void;
  onPapQuantityChange?: (quantity: number) => void;
  onPapUrgenteChange?: (urgente: boolean) => void;
  onCitologiaQuantityChange?: (quantity: number) => void;
  onCitologiaUrgenteChange?: (urgente: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onUpdateFrequentTissues: (tissue: string) => void;
  onOpenVirtualKeyboard: (type: 'numeric' | 'full', field: string, currentValue: string) => void;
  onCloseVirtualKeyboard: () => void;
  autoCompleteOptions: string[];
  onSelectAutoComplete: (suggestion: string) => void;
  keyboardValue: string;
}

export const Step2: React.FC<Step2Props> = ({
  tissueType,
  endoscopiaSubTypes,
  frequentTissues,
  papQuantity = 0,
  papUrgente = false,
  citologiaQuantity = 0,
  citologiaUrgente = false,
  onTissueTypeChange,
  onEndoscopiaSubTypesChange,
  onPapQuantityChange,
  onPapUrgenteChange,
  onCitologiaQuantityChange,
  onCitologiaUrgenteChange,
  onNext,
  onPrev,
  onUpdateFrequentTissues,
  onOpenVirtualKeyboard,
  onCloseVirtualKeyboard,
  autoCompleteOptions,
  onSelectAutoComplete,
  keyboardValue
}) => {
  const [showEndoscopiaMenu, setShowEndoscopiaMenu] = useState(false);

  const organizedTissues = {
    'Más Frecuentes': frequentTissues.length > 0 ? frequentTissues.slice(0, 6) : ['Gastrica', 'Endometrio', 'Endoscopia', 'Piel', 'PAP', 'Citología']
  };

  const endoscopiaCategories = {
    'Digestivo': [
      { value: 'Esófago', icon: '🔴' },
      { value: 'Estómago', icon: '🟠' },
      { value: 'Duodeno', icon: '🟡' },
      { value: 'Íleon', icon: '🟢' },
      { value: 'Colon', icon: '🔵' },
      { value: 'Recto', icon: '🟣' }
    ],
    'Respiratorio': [
      { value: 'Bronquio', icon: '🫁' },
      { value: 'Laringe', icon: '🗣️' }
    ],
    'Ginecológico': [
      { value: 'Cuello uterino', icon: '🌸' },
      { value: 'Vagina', icon: '🌺' },
      { value: 'Vulva', icon: '🌷' }
    ]
  };

  // Función para validar si el paso está completo
  const isStepValid = () => {
    if (!tissueType) return false;
    
    // Para PAP y Citología, verificar que tengan cantidad
    if (tissueType === 'PAP') {
      return papQuantity > 0;
    }
    if (tissueType === 'Citología') {
      return citologiaQuantity > 0;
    }
    
    return true;
  };

  const handleEndoscopiaSubTypeToggle = (subType: string) => {
    const currentSubTypes = endoscopiaSubTypes || [];
    if (currentSubTypes.includes(subType)) {
      onEndoscopiaSubTypesChange(currentSubTypes.filter(type => type !== subType));
    } else {
      onEndoscopiaSubTypesChange([...currentSubTypes, subType]);
    }
  };

  const handleTissueSelect = (tissue: string) => {
    console.log('🎯 Tejido seleccionado:', tissue);
    onTissueTypeChange(tissue);
    onUpdateFrequentTissues(tissue);
    onCloseVirtualKeyboard();
    
    // Reset endoscopia submenu si no es endoscopia
    if (tissue !== 'Endoscopia') {
      setShowEndoscopiaMenu(false);
      onEndoscopiaSubTypesChange([]);
    }

    // Reset valores cuando cambia el tipo de tejido
    if (tissue !== 'PAP' && onPapQuantityChange && onPapUrgenteChange) {
      onPapQuantityChange(0);
      onPapUrgenteChange(false);
    }
    if (tissue !== 'Citología' && onCitologiaQuantityChange && onCitologiaUrgenteChange) {
      onCitologiaQuantityChange(0);
      onCitologiaUrgenteChange(false);
    }
    
    console.log('✅ Tejido seleccionado y teclado cerrado');
  };

  useEffect(() => {
    if (tissueType === 'Endoscopia') {
      setShowEndoscopiaMenu(true);
    }
  }, [tissueType]);

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header Ultra Compacto */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '8px 16px',
        flexShrink: 0,
        borderRadius: '0 0 16px 16px',
        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
        margin: '0 0 8px 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '6px',
              borderRadius: '10px',
              position: 'relative',
              backdropFilter: 'blur(10px)'
            }}>
              <Microscope style={{ height: '16px', width: '16px', color: 'white' }} />
              <div style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '14px',
                height: '14px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '8px',
                fontWeight: 'bold'
              }}>
                2
              </div>
            </div>
            <div>
              <h1 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Tipo de Tejido</h1>
              <p style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>Paso 2 de 7</p>
            </div>
          </div>
          <button
            onClick={onPrev}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '11px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s'
            }}
          >
            ← Anterior
          </button>
        </div>
      </div>

      {/* Contenido Principal - Sin Scroll */}
      <div style={{ 
        flex: 1, 
        padding: '8px 16px 16px 16px', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          
          {/* Layout Principal - Dos Columnas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 300px',
            gap: '16px',
            height: '100%'
          }}>
            
            {/* Columna Izquierda - Selección Principal */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              
              {/* Campo de Búsqueda Compacto */}
              <div>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: '0 0 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Search style={{ height: '18px', width: '18px', color: '#667eea' }} />
                  Seleccionar Tipo de Tejido
                </h2>

                <div
                  onClick={() => onOpenVirtualKeyboard('full', 'tissueType', tissueType)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '10px',
                    border: tissueType ? '2px solid #667eea' : '2px solid #d1d5db',
                    backgroundColor: tissueType ? '#f0f4ff' : 'white',
                    color: tissueType ? '#667eea' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    outline: 'none',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    boxShadow: tissueType ? '0 2px 8px rgba(102, 126, 234, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {keyboardValue || tissueType || '🖱️ Toque para buscar...'}
                </div>

                {/* AutoComplete Compacto */}
                {autoCompleteOptions.length > 0 && (
                  <div style={{
                    marginTop: '8px',
                    backgroundColor: 'white',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    zIndex: 9999
                  }}>
                    {autoCompleteOptions.slice(0, 4).map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleTissueSelect(option)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          textAlign: 'left',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderBottom: index < Math.min(autoCompleteOptions.length, 4) - 1 ? '1px solid #f3f4f6' : 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          transition: 'all 0.2s ease',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f9ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Botones Frecuentes - Grid Compacto */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Tipos Más Frecuentes
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  height: 'calc(100% - 24px)'
                }}>
                  {organizedTissues['Más Frecuentes'].map((tissue, index) => (
                    <button
                      key={index}
                      onClick={() => handleTissueSelect(tissue)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: `2px solid ${tissueType === tissue ? '#667eea' : '#e5e7eb'}`,
                        backgroundColor: tissueType === tissue ? '#f0f4ff' : 'white',
                        color: tissueType === tissue ? '#667eea' : '#374151',
                        textAlign: 'center',
                        fontWeight: tissueType === tissue ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: tissueType === tissue ? '0 2px 8px rgba(102, 126, 234, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {tissue}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Columna Derecha - Panel de Configuración */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              padding: '12px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              
              {/* Panel de Información */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#374151',
                  margin: '0 0 8px 0'
                }}>
                  Selección Actual
                </h4>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: tissueType ? '#667eea' : '#6b7280',
                  padding: '8px',
                  backgroundColor: tissueType ? '#f0f4ff' : '#f9fafb',
                  borderRadius: '6px',
                  textAlign: 'center',
                  border: `1px solid ${tissueType ? '#667eea' : '#e5e7eb'}`
                }}>
                  {tissueType || 'Ninguno seleccionado'}
                </div>
              </div>

              {/* Panel PAP */}
              {tissueType === 'PAP' && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '2px solid #667eea'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#667eea',
                    margin: '0 0 8px 0'
                  }}>
                    📋 Configuración PAP
                  </h4>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '4px',
                      display: 'block'
                    }}>
                      Cantidad de unidades:
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => onPapQuantityChange?.(num)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '6px',
                            border: `2px solid ${papQuantity === num ? '#667eea' : '#e5e7eb'}`,
                            backgroundColor: papQuantity === num ? '#f0f4ff' : 'white',
                            color: papQuantity === num ? '#667eea' : '#374151',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={papUrgente}
                      onChange={(e) => onPapUrgenteChange?.(e.target.checked)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#667eea'
                      }}
                    />
                    ⚡ Urgente
                  </label>
                </div>
              )}

              {/* Panel Citología */}
              {tissueType === 'Citología' && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '2px solid #667eea'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#667eea',
                    margin: '0 0 8px 0'
                  }}>
                    🔬 Configuración Citología
                  </h4>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '4px',
                      display: 'block'
                    }}>
                      Cantidad de unidades:
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => onCitologiaQuantityChange?.(num)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '6px',
                            border: `2px solid ${citologiaQuantity === num ? '#667eea' : '#e5e7eb'}`,
                            backgroundColor: citologiaQuantity === num ? '#f0f4ff' : 'white',
                            color: citologiaQuantity === num ? '#667eea' : '#374151',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={citologiaUrgente}
                      onChange={(e) => onCitologiaUrgenteChange?.(e.target.checked)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#667eea'
                      }}
                    />
                    ⚡ Urgente
                  </label>
                </div>
              )}

              {/* Panel Endoscopia Compacto */}
              {showEndoscopiaMenu && tissueType === 'Endoscopia' && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '2px solid #667eea',
                  flex: 1,
                  overflow: 'hidden'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#667eea',
                    margin: '0 0 8px 0'
                  }}>
                    🔬 Subtipos Endoscopia
                  </h4>
                  
                  <div style={{ 
                    overflowY: 'auto', 
                    height: 'calc(100% - 24px)',
                    paddingRight: '4px'
                  }}>
                    {Object.entries(endoscopiaCategories).map(([categoryName, items]) => (
                      <div key={categoryName} style={{ marginBottom: '12px' }}>
                        <h5 style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#667eea',
                          margin: '0 0 6px 0',
                          textTransform: 'uppercase'
                        }}>
                          {categoryName}
                        </h5>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '4px'
                        }}>
                          {items.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => handleEndoscopiaSubTypeToggle(item.value)}
                              style={{
                                padding: '6px 4px',
                                borderRadius: '6px',
                                border: `2px solid ${endoscopiaSubTypes.includes(item.value) ? '#667eea' : '#e5e7eb'}`,
                                backgroundColor: endoscopiaSubTypes.includes(item.value) ? '#f0f4ff' : 'white',
                                color: endoscopiaSubTypes.includes(item.value) ? '#667eea' : '#374151',
                                textAlign: 'center',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '10px',
                                height: '36px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <span style={{ fontSize: '12px' }}>{item.icon}</span>
                              <span style={{ lineHeight: '1' }}>{item.value}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Estado de Validación */}
              <div style={{
                backgroundColor: isStepValid() ? '#f0fdf4' : '#fef2f2',
                borderRadius: '8px',
                padding: '8px',
                border: `1px solid ${isStepValid() ? '#22c55e' : '#ef4444'}`,
                textAlign: 'center'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isStepValid() ? '#16a34a' : '#dc2626'
                }}>
                  {isStepValid() ? '✅ Listo para continuar' : '❌ Seleccione un tipo'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Botón Continuar - Siempre Visible */}
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={onNext}
              disabled={!isStepValid()}
              style={{
                width: '100%',
                background: isStepValid() 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#e5e7eb',
                color: isStepValid() ? 'white' : '#9ca3af',
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '600',
                fontSize: '16px',
                cursor: isStepValid() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isStepValid() ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
              }}
            >
              Continuar al Paso 3
              <ArrowRight style={{ height: '20px', width: '20px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
                  if (!tissueType) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {keyboardValue || tissueType || '🖱️ Toque para buscar tipo de tejido...'}
              </div>

              {/* AutoComplete mejorado */}
              {autoCompleteOptions.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  backgroundColor: 'white',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 9999
                }}>
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#f0f4ff',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px',
                    color: '#667eea',
                    fontWeight: '600'
                  }}>
                    💡 {autoCompleteOptions.length} sugerencia{autoCompleteOptions.length !== 1 ? 's' : ''} encontrada{autoCompleteOptions.length !== 1 ? 's' : ''}
                  </div>
                  {autoCompleteOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        console.log('🖱️ Click en autocompletado:', option);
                        handleTissueSelect(option);
                        
                        setTimeout(() => {
                          const keyboardElements = document.querySelectorAll('[class*="keyboard"], [class*="modal"], [data-virtual-keyboard]');
                          keyboardElements.forEach(el => {
                            (el as HTMLElement).style.display = 'none';
                          });
                          (document.activeElement as HTMLElement)?.blur();
                          console.log('🔐 Métodos de cierre aplicados desde autocompletado');
                        }, 100);
                      }}
                      style={{
                        width: '100%',
                        padding: '16px',
                        textAlign: 'left',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: index < autoCompleteOptions.length - 1 ? '1px solid #f3f4f6' : 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#374151',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f9ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botones Frecuentes */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                Tipos Más Frecuentes
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                {organizedTissues['Más Frecuentes'].map((tissue, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleTissueSelect(tissue);
                    }}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '12px',
                      border: `2px solid ${tissueType === tissue ? '#667eea' : '#e5e7eb'}`,
                      backgroundColor: tissueType === tissue ? '#f0f4ff' : 'white',
                      color: tissueType === tissue ? '#667eea' : '#374151',
                      textAlign: 'center',
                      fontWeight: tissueType === tissue ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      fontSize: '14px',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: tissueType === tissue ? '0 4px 12px rgba(102, 126, 234, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseOver={(e) => {
                      if (tissueType !== tissue) {
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (tissueType !== tissue) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.transform = 'translateY(0px)';
                      }
                    }}
                  >
                    {tissue}
                  </button>
                ))}
              </div>
            </div>

            {/* Menú de Subopciones de Endoscopia */}
            {showEndoscopiaMenu && tissueType === 'Endoscopia' && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#374151',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  🔬 Seleccione los Subtipos de Endoscopia
                </h3>
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '2px solid #e5e7eb'
                }}>
                  {Object.entries(endoscopiaCategories).map(([categoryName, items]) => (
                    <div key={categoryName} style={{ marginBottom: '20px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          width: '4px',
                          height: '20px',
                          backgroundColor: '#667eea',
                          borderRadius: '2px'
                        }}></div>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#667eea',
                          margin: 0,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {categoryName}
                        </h4>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px'
                      }}>
                        {items.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleEndoscopiaSubTypeToggle(item.value)}
                            style={{
                              padding: '16px 12px',
                              borderRadius: '12px',
                              border: `3px solid ${endoscopiaSubTypes.includes(item.value) ? '#667eea' : '#e5e7eb'}`,
                              backgroundColor: endoscopiaSubTypes.includes(item.value) ? '#f0f4ff' : 'white',
                              color: endoscopiaSubTypes.includes(item.value) ? '#667eea' : '#374151',
                              textAlign: 'center',
                              fontWeight: endoscopiaSubTypes.includes(item.value) ? '700' : '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontSize: '14px',
                              minHeight: '70px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: endoscopiaSubTypes.includes(item.value) 
                                ? '0 6px 20px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                                : '0 3px 8px rgba(0, 0, 0, 0.08)',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                            onMouseOver={(e) => {
                              if (!endoscopiaSubTypes.includes(item.value)) {
                                e.currentTarget.style.borderColor = '#667eea';
                                e.currentTarget.style.backgroundColor = '#f8fafc';
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.2)';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!endoscopiaSubTypes.includes(item.value)) {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.08)';
                              }
                            }}
                          >
                            {/* Indicador de selección */}
                            {endoscopiaSubTypes.includes(item.value) && (
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#22c55e',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                color: 'white',
                                fontWeight: 'bold'
                              }}>
                                ✓
                              </div>
                            )}
                            
                            <span style={{ 
                              fontSize: '22px',
                              filter: endoscopiaSubTypes.includes(item.value) ? 'drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3))' : 'none'
                            }}>
                              {item.icon}
                            </span>
                            <span style={{
                              lineHeight: '1.2',
                              textAlign: 'center'
                            }}>
                              {item.value}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Información de selección mejorada */}
                  {endoscopiaSubTypes.length > 0 && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
                      borderRadius: '12px',
                      border: '2px solid #667eea',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: '#22c55e',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          ✓
                        </div>
                        <span style={{
                          fontSize: '16px',
                          color: '#667eea',
                          fontWeight: '700'
                        }}>
                          {endoscopiaSubTypes.length} Subtipo{endoscopiaSubTypes.length !== 1 ? 's' : ''} Seleccionado{endoscopiaSubTypes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '14px',
                        color: '#4338ca',
                        margin: 0,
                        fontWeight: '600',
                        lineHeight: '1.4'
                      }}>
                        {endoscopiaSubTypes.join(' • ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Campos específicos para PAP y Citología */}
          {(tissueType === 'PAP' || tissueType === 'Citología') && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '16px',
              border: '2px solid #667eea',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#667eea',
                marginBottom: '16px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                🔬 Configuración de {tissueType}
              </h3>

              {/* Campo de Cantidad */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Cantidad de Unidades:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => {
                      const currentQuantity = tissueType === 'PAP' ? papQuantity : citologiaQuantity;
                      if (currentQuantity > 0) {
                        if (tissueType === 'PAP' && onPapQuantityChange) {
                          onPapQuantityChange(currentQuantity - 1);
                        } else if (tissueType === 'Citología' && onCitologiaQuantityChange) {
                          onCitologiaQuantityChange(currentQuantity - 1);
                        }
                      }
                    }}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      border: '2px solid #667eea',
                      backgroundColor: 'white',
                      color: '#667eea',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#667eea';
                    }}
                  >
                    −
                  </button>
                  
                  <div style={{
                    minWidth: '120px',
                    height: '48px',
                    backgroundColor: 'white',
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#667eea'
                  }}>
                    {tissueType === 'PAP' ? papQuantity : citologiaQuantity}
                  </div>
                  
                  <button
                    onClick={() => {
                      const currentQuantity = tissueType === 'PAP' ? papQuantity : citologiaQuantity;
                      if (tissueType === 'PAP' && onPapQuantityChange) {
                        onPapQuantityChange(currentQuantity + 1);
                      } else if (tissueType === 'Citología' && onCitologiaQuantityChange) {
                        onCitologiaQuantityChange(currentQuantity + 1);
                      }
                    }}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      border: '2px solid #667eea',
                      backgroundColor: 'white',
                      color: '#667eea',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#667eea';
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Campo de Urgente */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseOut={(e) => {
                  const isChecked = tissueType === 'PAP' ? papUrgente : citologiaUrgente;
                  e.currentTarget.style.borderColor = isChecked ? '#667eea' : '#e5e7eb';
                }}
                >
                  <input
                    type="checkbox"
                    checked={tissueType === 'PAP' ? papUrgente : citologiaUrgente}
                    onChange={(e) => {
                      if (tissueType === 'PAP' && onPapUrgenteChange) {
                        onPapUrgenteChange(e.target.checked);
                      } else if (tissueType === 'Citología' && onCitologiaUrgenteChange) {
                        onCitologiaUrgenteChange(e.target.checked);
                      }
                    }}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#667eea'
                    }}
                  />
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    🚨 Urgente
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Botón fijo en la parte inferior */}
          <div style={{ 
            marginTop: '20px', 
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: 'white',
            position: 'sticky',
            bottom: 0
          }}>
            <button
              onClick={onNext}
              disabled={!isStepValid()}
              style={{
                width: '100%',
                padding: '20px 24px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '20px',
                background: isStepValid() 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                cursor: isStepValid() ? 'pointer' : 'not-allowed',
                boxShadow: isStepValid() ? '0 8px 24px rgba(102, 126, 234, 0.3)' : 'none',
                transition: 'all 0.3s',
                outline: 'none',
                minHeight: '70px'
              }}
              onMouseOver={(e) => {
                if (isStepValid()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (isStepValid()) {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <span>Continuar al Tipo de Biopsia</span>
                <ArrowRight style={{ height: '24px', width: '24px' }} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;
