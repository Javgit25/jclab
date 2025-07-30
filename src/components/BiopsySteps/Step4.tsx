import React from 'react';
import { ArrowRight, Package, Plus, Minus } from 'lucide-react';
import { CassetteNumber } from '../../types';

interface Step4Props {
  cassettes: string;
  pieces: string;
  cassettesNumbers: CassetteNumber[];
  tissueType: string;
  onCassettesChange: (value: string) => void;
  onPiecesChange: (value: string) => void;
  onUpdateCassetteSuffix: (index: number, newSuffix: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenVirtualKeyboard: (type: 'numeric' | 'full', field: string, currentValue?: string) => void;
}

// Componente TouchNumericInput optimizado para tablet
interface TouchNumericInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  onOpenKeyboard: () => void;
}

const TouchNumericInput: React.FC<TouchNumericInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "0",
  min = 1,
  max = 999,
  onOpenKeyboard
}) => {
  const numValue = parseInt(value) || 0;
  
  const increment = () => {
    if (numValue < max) {
      onChange((numValue + 1).toString());
    }
  };
  
  const decrement = () => {
    if (numValue > min) {
      onChange((numValue - 1).toString());
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '18px',
        fontWeight: '700',
        color: '#374151',
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        {label}
      </label>
      
      {/* Controles táctiles */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '12px',
        border: `3px solid ${value ? '#667eea' : '#E5E7EB'}`,
        borderRadius: '16px',
        backgroundColor: 'white',
        transition: 'all 0.3s ease',
        boxShadow: value ? '0 4px 16px rgba(102, 126, 234, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        
        {/* Botón - */}
        <button
          onClick={decrement}
          disabled={numValue <= min}
          style={{
            width: '45px',
            height: '45px',
            backgroundColor: numValue > min ? '#667eea' : '#e5e7eb',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: numValue > min ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: numValue > min ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
          }}
          onMouseOver={(e) => {
            if (numValue > min) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseOut={(e) => {
            if (numValue > min) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <Minus style={{ width: '18px', height: '18px' }} />
        </button>
        
        {/* Input central táctil */}
        <button
          onClick={onOpenKeyboard}
          style={{
            flex: 1,
            maxWidth: '80px',
            padding: '12px',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: value ? '#f0f4ff' : '#f8fafc',
            color: value ? '#667eea' : '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = value ? '#e0e7ff' : '#f1f5f9';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = value ? '#f0f4ff' : '#f8fafc';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {value || placeholder}
        </button>
        
        {/* Botón + */}
        <button
          onClick={increment}
          disabled={numValue >= max}
          style={{
            width: '45px',
            height: '45px',
            backgroundColor: numValue < max ? '#667eea' : '#e5e7eb',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: numValue < max ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: numValue < max ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
          }}
          onMouseOver={(e) => {
            if (numValue < max) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseOut={(e) => {
            if (numValue < max) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
        </button>
      </div>

      {/* Confirmación de valor */}
      {value && parseInt(value) > 0 && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#065f46',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          ✓ {value} {label.toLowerCase()}{parseInt(value) !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export const Step4: React.FC<Step4Props> = ({
  cassettes,
  pieces,
  cassettesNumbers,
  tissueType,
  onCassettesChange,
  onPiecesChange,
  onUpdateCassetteSuffix,
  onNext,
  onPrev,
  onOpenVirtualKeyboard
}) => {
  // Determinar si es PAP o Citología para manejo especial
  const isPapOrCitologia = tissueType === 'PAP' || tissueType === 'Citología';
  const materialType = isPapOrCitologia ? 'Vidrios' : 'Cassettes';

  const isValid = cassettes && parseInt(cassettes) > 0 && pieces && parseInt(pieces) > 0;

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
              <Package style={{ height: '20px', width: '20px', color: 'white' }} />
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
                4
              </div>
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Cantidad de Material</h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>Indique la cantidad de {materialType.toLowerCase()}</p>
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
            <Package style={{ height: '16px', width: '16px', color: 'white' }} />
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>Cantidad de Material</h2>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          minHeight: 'calc(100vh - 220px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e5e7eb',
          width: 'calc(100% - 16px)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxSizing: 'border-box',
          margin: '0 auto'
        }}>
          
          {/* Contenido con scroll */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            {/* Inputs de cantidad */}
            <div style={{ marginBottom: '20px' }}>
              <TouchNumericInput
                label={`Número de ${materialType}`}
                value={cassettes}
                onChange={onCassettesChange}
                placeholder="0"
                min={1}
                max={999}
                onOpenKeyboard={() => onOpenVirtualKeyboard('numeric', 'cassettes', cassettes)}
              />

              <TouchNumericInput
                label="Número de Trozos"
                value={pieces}
                onChange={onPiecesChange}
                placeholder="0"
                min={1}
                max={999}
                onOpenKeyboard={() => onOpenVirtualKeyboard('numeric', 'pieces', pieces)}
              />
            </div>

            {/* Cassettes individuales - Solo si no es PAP o Citología Y hay 2 o más cassettes */}
            {!isPapOrCitologia && cassettes && parseInt(cassettes) > 1 && cassettesNumbers.length > 1 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#374151',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  🏷️ Numeración de Cassettes
                </h3>
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '2px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '12px'
                  }}>
                    {/* Mostrar solo los cassettes adicionales (desde index 1) */}
                    {cassettesNumbers.slice(1).map((cassette, index) => {
                      const realIndex = index + 1; // El índice real en el array
                      const defaultSuffix = cassette.suffix || (realIndex).toString();
                      return (
                        <div key={realIndex} style={{
                          backgroundColor: 'white',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {/* Número base (no modificable) */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{
                              fontSize: '16px',
                              fontWeight: 'bold',
                              color: '#374151',
                              backgroundColor: '#f3f4f6',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db'
                            }}>
                              {cassette.base}
                            </span>
                          </div>

                          {/* Barra separadora */}
                          <span style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#667eea',
                            margin: '0 4px'
                          }}>
                            /
                          </span>

                          {/* Sufijo (modificable) */}
                          <button
                            onClick={() => onOpenVirtualKeyboard('numeric', `cassetteSuffix_${realIndex}`, defaultSuffix)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              border: '2px solid #667eea',
                              borderRadius: '6px',
                              backgroundColor: defaultSuffix ? '#f0f4ff' : 'white',
                              color: '#667eea',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              minWidth: '60px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#e0e7ff';
                              e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = defaultSuffix ? '#f0f4ff' : 'white';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            {defaultSuffix}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    textAlign: 'center',
                    margin: '12px 0 0 0',
                    fontStyle: 'italic'
                  }}>
                    💡 Cassettes adicionales al número original
                  </p>
                </div>
              </div>
            )}

            {/* Resumen */}
            {isValid && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #22c55e',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '12px',
                boxShadow: '0 2px 6px rgba(34, 197, 94, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#065f46',
                  margin: '0 0 6px 0',
                  textAlign: 'center'
                }}>
                  📋 Resumen del Material
                </h3>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#059669'
                }}>
                  <span><strong>{materialType}:</strong> {cassettes}</span>
                  <span><strong>Trozos:</strong> {pieces}</span>
                </div>
              </div>
            )}
          </div>

          {/* Botón fijo en la parte inferior */}
          <div style={{ 
            marginTop: '16px', 
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: 'white',
            position: 'sticky',
            bottom: 0
          }}>
            <button
              onClick={onNext}
              disabled={!isValid}
              style={{
                width: '100%',
                padding: '20px 24px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '20px',
                background: isValid 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                cursor: isValid ? 'pointer' : 'not-allowed',
                boxShadow: isValid ? '0 8px 24px rgba(102, 126, 234, 0.3)' : 'none',
                transition: 'all 0.3s',
                outline: 'none',
                minHeight: '70px'
              }}
              onMouseOver={(e) => {
                if (isValid) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (isValid) {
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
                <span>Continuar a Servicios</span>
                <ArrowRight style={{ height: '24px', width: '24px' }} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
