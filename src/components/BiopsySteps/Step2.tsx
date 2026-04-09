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
  onFinishRemito?: () => void;
  todayBiopsiesCount?: number;
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
  onFinishRemito,
  todayBiopsiesCount,
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
    
    // Para PAP y Citología, verificar que tengan cantidad > 0
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

  // Endoscopia ya no tiene subtipos, avanza directo como cualquier tejido

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
        padding: '12px 20px',
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
              <Microscope style={{ height: '20px', width: '20px', color: 'white' }} />
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
                2
              </div>
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Tipo de Tejido</h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>Seleccione el tipo de análisis</p>
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
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              ← Anterior
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal - Con scroll habilitado */}
      <div style={{ flex: 1, padding: '12px 16px 20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '28px',
          minHeight: 'calc(100vh - 180px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e5e7eb',
          width: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        }}>
          
          {/* Contenido con scroll */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            {/* Campo de búsqueda principal */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
                  padding: '10px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                  <Search style={{ height: '24px', width: '24px', color: 'white' }} />
                </div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: 0
                }}>Tipo de Tejido</h2>
              </div>

              <div
                onClick={() => onOpenVirtualKeyboard('full', 'tissueType', tissueType)}
                style={{
                  width: '100%',
                  padding: '24px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  borderRadius: '16px',
                  border: tissueType ? '3px solid #1e3a5f' : '3px solid #d1d5db',
                  backgroundColor: tissueType ? '#f0f4ff' : 'white',
                  color: tissueType ? '#1e3a5f' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  outline: 'none',
                  minHeight: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: tissueType ? '0 4px 20px rgba(102, 126, 234, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  if (!tissueType) {
                    e.currentTarget.style.borderColor = '#1e3a5f';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
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
                  border: '2px solid #1e3a5f',
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
                    color: '#1e3a5f',
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
                      border: `2px solid ${tissueType === tissue ? '#1e3a5f' : '#e5e7eb'}`,
                      backgroundColor: tissueType === tissue ? '#f0f4ff' : 'white',
                      color: tissueType === tissue ? '#1e3a5f' : '#374151',
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
                        e.currentTarget.style.borderColor = '#1e3a5f';
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

          </div>

          {/* Configuración específica para PAP y Citología */}
          {(tissueType === 'PAP' || tissueType === 'Citología') && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: tissueType === 'PAP' ? '#f0fdf4' : '#eff6ff',
              borderRadius: '16px',
              border: `2px solid ${tissueType === 'PAP' ? '#51CF66' : '#7C9BFF'}`,
              boxShadow: `0 8px 24px ${tissueType === 'PAP' ? 'rgba(81, 207, 102, 0.15)' : 'rgba(124, 155, 255, 0.15)'}`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: tissueType === 'PAP' ? '#51CF66' : '#7C9BFF',
                marginBottom: '16px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: `linear-gradient(135deg, ${tissueType === 'PAP' ? '#51CF66' : '#7C9BFF'} 0%, ${tissueType === 'PAP' ? '#22c55e' : '#4F76F6'} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {tissueType === 'PAP' ? '🧪' : '🔬'} Configuración de {tissueType}
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
                  justifyContent: 'center',
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
                      border: '2px solid #1e3a5f',
                      backgroundColor: 'white',
                      color: '#1e3a5f',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#1e3a5f';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#1e3a5f';
                    }}
                  >
                    −
                  </button>
                  
                  <button
                    onClick={() => {
                      const currentValue = tissueType === 'PAP' ? papQuantity.toString() : citologiaQuantity.toString();
                      const field = tissueType === 'PAP' ? 'papQuantity' : 'citologiaQuantity';
                      onOpenVirtualKeyboard('numeric', field, currentValue);
                    }}
                    style={{
                      minWidth: '120px',
                      height: '48px',
                      backgroundColor: 'white',
                      border: '2px solid #1e3a5f',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1e3a5f',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f4ff';
                      e.currentTarget.style.borderColor = '#4338ca';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#1e3a5f';
                    }}
                  >
                    {tissueType === 'PAP' ? papQuantity : citologiaQuantity}
                  </button>
                  
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
                      border: '2px solid #1e3a5f',
                      backgroundColor: 'white',
                      color: '#1e3a5f',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#1e3a5f';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#1e3a5f';
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
                  border: `2px solid ${(tissueType === 'PAP' ? papUrgente : citologiaUrgente) ? '#1e3a5f' : '#e5e7eb'}`,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#1e3a5f';
                }}
                onMouseOut={(e) => {
                  const isChecked = tissueType === 'PAP' ? papUrgente : citologiaUrgente;
                  e.currentTarget.style.borderColor = isChecked ? '#1e3a5f' : '#e5e7eb';
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
                      accentColor: '#1e3a5f'
                    }}
                  />
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    🚨 Urgente (24hs)
                  </span>
                </label>
              </div>

              {/* Información de facturación */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#1e3a5f',
                  margin: 0,
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  💰 Este estudio se cobra por unidad
                </p>
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
                  ? 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)' 
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
                <span>
                  {!tissueType ? 'Seleccione un tipo de tejido' :
                   (tissueType === 'PAP' && papQuantity === 0) ? 'Especifique cantidad de PAP' :
                   (tissueType === 'Citología' && citologiaQuantity === 0) ? 'Especifique cantidad de Citología' :
                   'Continuar al Tipo de Biopsia'}
                </span>
                {isStepValid() && <ArrowRight style={{ height: '24px', width: '24px' }} />}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;
