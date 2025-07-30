import React from 'react';
import { ArrowLeft, ArrowRight, Package, Hash, Info, Plus, Minus } from 'lucide-react';
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

// Componente TouchNumericInput para tablets táctiles
interface TouchNumericInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  colors: any;
}

const TouchNumericInput: React.FC<TouchNumericInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "0",
  min = 1,
  max = 999,
  colors
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
  
  const handleDirectInput = (inputValue: string) => {
    const num = parseInt(inputValue) || 0;
    if (num >= min && num <= max) {
      onChange(inputValue);
    } else if (inputValue === '' || inputValue === '0') {
      onChange('');
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '12px'
      }}>
        {label}
      </label>
      
      {/* Botones táctiles + input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px',
        border: `2px solid ${value ? colors.primaryBlue : '#E5E7EB'}`,
        borderRadius: '12px',
        backgroundColor: colors.white,
        transition: 'all 0.3s ease',
        boxShadow: value ? `0 0 0 3px rgba(79, 118, 246, 0.1)` : 'none'
      }}>
        
        {/* Botón - */}
        <button
          onClick={decrement}
          disabled={numValue <= min}
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: numValue > min ? colors.primaryBlue : '#E5E7EB',
            color: numValue > min ? colors.white : '#9CA3AF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '32px',
            fontWeight: 'bold',
            cursor: numValue > min ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation', // Mejora la respuesta táctil
            userSelect: 'none'
          }}
          onTouchStart={(e) => {
            if (numValue > min) {
              e.currentTarget.style.transform = 'scale(0.95)';
              e.currentTarget.style.backgroundColor = colors.darkBlue;
            }
          }}
          onTouchEnd={(e) => {
            if (numValue > min) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = colors.primaryBlue;
            }
          }}
        >
          −
        </button>
        
        {/* Input central */}
        <div style={{ flex: '1', textAlign: 'center' }}>
          <input
            type="number"
            value={value}
            onChange={(e) => handleDirectInput(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 8px',
              fontSize: '28px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              fontWeight: '700',
              color: value ? colors.primaryBlue : '#9CA3AF',
              textAlign: 'center',
              outline: 'none'
            }}
            placeholder={placeholder}
            min={min}
            max={max}
          />
          <div style={{
            fontSize: '12px',
            color: colors.darkGray,
            marginTop: '4px'
          }}>
            Toque + y − o escriba directamente
          </div>
        </div>
        
        {/* Botón + */}
        <button
          onClick={increment}
          disabled={numValue >= max}
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: numValue < max ? colors.primaryBlue : '#E5E7EB',
            color: numValue < max ? colors.white : '#9CA3AF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '32px',
            fontWeight: 'bold',
            cursor: numValue < max ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            userSelect: 'none'
          }}
          onTouchStart={(e) => {
            if (numValue < max) {
              e.currentTarget.style.transform = 'scale(0.95)';
              e.currentTarget.style.backgroundColor = colors.darkBlue;
            }
          }}
          onTouchEnd={(e) => {
            if (numValue < max) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = colors.primaryBlue;
            }
          }}
        >
          +
        </button>
      </div>
      
      {/* Indicador de valor actual */}
      {value && parseInt(value) > 0 && (
        <div style={{
          marginTop: '8px',
          textAlign: 'center',
          padding: '8px',
          backgroundColor: '#EBF4FF',
          borderRadius: '8px',
          color: colors.primaryBlue,
          fontWeight: '600',
          fontSize: '14px'
        }}>
          ✅ {value} {label.toLowerCase()}{parseInt(value) !== 1 ? 's' : ''}
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

  const currentStep = 4;
  const totalSteps = 7;

  // Determinar si es PAP o Citología para manejo especial
  const isPapOrCitologia = tissueType === 'PAP' || tissueType === 'Citología';
  const materialType = isPapOrCitologia ? 'Vidrios' : 'Cassettes';

  // Barra de progreso
  const ProgressBar = () => (
    <div style={{
      padding: '12px 24px',
      backgroundColor: colors.white,
      borderBottom: '1px solid #E2E8F0'
    }}>
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: '#E2E8F0',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(currentStep / totalSteps) * 100}%`,
          height: '100%',
          background: colors.primaryBlue,
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px',
        fontSize: '12px'
      }}>
        {['Número', 'Tejido', 'Tipo', 'Cassettes', 'Trozos', 'Servicios', 'Confirmar'].map((step, index) => (
          <span 
            key={step}
            style={{
              color: index < currentStep ? colors.primaryBlue : index === currentStep - 1 ? '#1F2937' : colors.darkGray,
              fontWeight: index === currentStep - 1 ? '600' : '500'
            }}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.lightGray,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      
      {/* Barra de Progreso */}
      <ProgressBar />
      
      {/* Header Compacto */}
      <div style={{
        backgroundColor: colors.white,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        borderBottom: '1px solid #E2E8F0'
      }}>
        
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: colors.primaryBlue,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(79, 118, 246, 0.3)'
          }}>
            <Package style={{ width: '26px', height: '26px', color: colors.white }} />
          </div>
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '20px',
            height: '20px',
            backgroundColor: colors.green,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${colors.white}`,
            color: colors.white,
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            4
          </div>
        </div>

        <div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#1F2937',
            margin: '0',
            lineHeight: '1.2'
          }}>
            📦 Cantidad de Material
          </h1>
          <p style={{
            fontSize: '14px',
            color: colors.darkGray,
            margin: '0',
            lineHeight: '1.3'
          }}>
            Especifique las cantidades de {materialType.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 15px'
      }}>
        
        <div style={{
          backgroundColor: colors.white,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          maxWidth: '600px',
          margin: '0 auto',
          width: '100%'
        }}>
          
          {/* Título del paso */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <Package style={{ width: '24px', height: '24px', color: colors.primaryBlue }} />
            <h2 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#1F2937',
              margin: '0'
            }}>
              Cantidad de Material
            </h2>
          </div>

          {/* Campo de cassettes/vidrios - CORREGIDO */}
          <TouchNumericInput
            label={`Cantidad de ${materialType}`}
            value={cassettes}
            onChange={onCassettesChange}
            placeholder="0"
            min={1}
            max={999}
            colors={colors}
          />

          {/* Campo de trozos - Solo si NO es PAP/Citología - CORREGIDO */}
          {!isPapOrCitologia && (
            <TouchNumericInput
              label="Cantidad de Trozos"
              value={pieces}
              onChange={onPiecesChange}
              placeholder="0"
              min={1}
              max={999}
              colors={colors}
            />
          )}

          {/* Numeración de cassettes - Solo si NO es PAP/Citología y hay más de 1 cassette */}
          {!isPapOrCitologia && parseInt(cassettes) > 1 && cassettesNumbers.length > 0 && (
            <div style={{
              background: '#EBF4FF',
              border: '2px solid #BFDBFE',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <Hash style={{ width: '20px', height: '20px', color: colors.primaryBlue }} />
                <label style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.primaryBlue,
                  margin: '0'
                }}>
                  Numeración de Cassettes:
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cassettesNumbers.map((cassette, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: colors.primaryBlue,
                      fontWeight: '500',
                      minWidth: '80px'
                    }}>
                      Cassette {index + 1}:
                    </span>
                    {index === 0 ? (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        fontWeight: '600'
                      }}>
                        {cassette.base} (original)
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1' }}>
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: '#F3F4F6',
                          color: '#374151',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                          fontWeight: '600'
                        }}>
                          {cassette.base}/
                        </div>
                        <input
                          type="text"
                          value={cassette.suffix}
                          onChange={(e) => onUpdateCassetteSuffix(index, e.target.value)}
                          style={{
                            padding: '8px 12px',
                            border: `2px solid ${colors.lightBlue}`,
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            fontWeight: '600',
                            width: '80px',
                            textAlign: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          placeholder={index.toString()}
                          maxLength={10}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = colors.primaryBlue;
                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(79, 118, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = colors.lightBlue;
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información específica para PAP/Citología */}
          {isPapOrCitologia && (
            <div style={{
              background: '#F3E8FF',
              border: '2px solid #D8B4FE',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <Info style={{ width: '20px', height: '20px', color: '#7C3AED' }} />
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#7C3AED',
                  margin: '0'
                }}>
                  Información para {tissueType}:
                </h4>
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6B46C1',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div>• Cada vidrio se procesa individualmente</div>
                <div>• No requiere numeración especial de cassettes</div>
                <div>• Se puede solicitar procesamiento urgente en el siguiente paso</div>
              </div>
            </div>
          )}

          {/* Resumen de cantidades */}
          {(cassettes && parseInt(cassettes) > 0) && (
            <div style={{
              background: '#F0FDF4',
              border: `2px solid ${colors.green}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <Package style={{ width: '20px', height: '20px', color: colors.green }} />
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#065F46'
                }}>
                  ✅ {cassettes} {materialType.toLowerCase()}{parseInt(cassettes) !== 1 ? 's' : ''}
                  {!isPapOrCitologia && pieces && ` - ${pieces} trozo${parseInt(pieces) !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          )}

          {/* Botón continuar */}
          <button
            onClick={onNext}
            disabled={!cassettes || parseInt(cassettes) < 1 || (!isPapOrCitologia && (!pieces || parseInt(pieces) < 1))}
            style={{
              width: '100%',
              fontWeight: 'bold',
              padding: '16px',
              borderRadius: '14px',
              fontSize: '18px',
              border: 'none',
              cursor: (cassettes && parseInt(cassettes) >= 1 && (isPapOrCitologia || (pieces && parseInt(pieces) >= 1))) ? 'pointer' : 'not-allowed',
              background: (cassettes && parseInt(cassettes) >= 1 && (isPapOrCitologia || (pieces && parseInt(pieces) >= 1)))
                ? `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.darkBlue} 100%)` 
                : '#CBD5E1',
              color: colors.white,
              boxShadow: (cassettes && parseInt(cassettes) >= 1 && (isPapOrCitologia || (pieces && parseInt(pieces) >= 1))) ? '0 4px 16px rgba(79, 118, 246, 0.3)' : 'none',
              transition: 'all 0.3s ease',
              opacity: (cassettes && parseInt(cassettes) >= 1 && (isPapOrCitologia || (pieces && parseInt(pieces) >= 1))) ? 1 : 0.6
            }}
            onMouseOver={(e) => {
              if (cassettes && parseInt(cassettes) >= 1 && (isPapOrCitologia || (pieces && parseInt(pieces) >= 1))) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 118, 246, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (cassettes && parseInt(cassettes) >= 1 && (isPapOrCitologia || (pieces && parseInt(pieces) >= 1))) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(79, 118, 246, 0.3)';
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <span>Continuar a Desclasificación</span>
              <ArrowRight style={{ width: '20px', height: '20px' }} />
            </div>
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
          <span>Volver al Tipo</span>
        </button>
      </div>
    </div>
  );
};