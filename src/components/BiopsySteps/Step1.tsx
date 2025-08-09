import React, { useEffect, useState } from 'react';
import { Microscope, CheckCircle, ArrowRight, Hash, Delete, Check } from 'lucide-react';

interface Step1Props {
  biopsyNumber: string;
  todayBiopsiesCount: number;
  todayBiopsies: any[];
  onBiopsyNumberChange: (value: string) => void;
  onNext: () => void;
  onFinishDailyReport: () => void;
}

export const Step1: React.FC<Step1Props> = ({
  biopsyNumber,
  todayBiopsiesCount,
  todayBiopsies,
  onBiopsyNumberChange,
  onNext,
  onFinishDailyReport
}) => {
  const [smartSuggestion, setSmartSuggestion] = useState<string>('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState<'numeric' | 'letters'>('numeric');

  // Generar sugerencia inteligente basada en la última biopsia
  useEffect(() => {
    if (todayBiopsies.length > 0) {
      const lastBiopsy = todayBiopsies[todayBiopsies.length - 1];
      const lastNumber = lastBiopsy.number;
      
      const numberMatch = lastNumber.match(/(\d+)$/);
      if (numberMatch) {
        const baseNumber = parseInt(numberMatch[1]);
        const prefix = lastNumber.replace(/\d+$/, '');
        const nextNumber = baseNumber + 1;
        const suggestion = `${prefix}${String(nextNumber).padStart(numberMatch[1].length, '0')}`;
        setSmartSuggestion(suggestion);
      } else {
        setSmartSuggestion(`${lastNumber}1`);
      }
    } else {
      // Si no hay biopsias previas, generar sugerencia basada en fecha
      const today = new Date();
      const year = today.getFullYear().toString().slice(-2);
      const suggestion = `BX${year}-${String(todayBiopsiesCount + 1).padStart(3, '0')}`;
      setSmartSuggestion(suggestion);
    }
  }, [todayBiopsies, todayBiopsiesCount]);

  const handleKeyboardOpen = () => {
    setShowKeyboard(true);
  };

  // ✅ NUEVA FUNCIÓN: Aceptar y cerrar teclado
  const handleAcceptKeyboard = () => {
    setShowKeyboard(false);
  };

  const canProceed = biopsyNumber.trim() !== '';

  // Funciones del teclado
  const addToNumber = (char: string) => {
    onBiopsyNumberChange(biopsyNumber + char);
  };

  const deleteLastChar = () => {
    onBiopsyNumberChange(biopsyNumber.slice(0, -1));
  };

  const clearNumber = () => {
    onBiopsyNumberChange('');
  };

  // Debug log para verificar que Step1 se está renderizando
  console.log('Step1 renderizado con estilos inline - biopsyNumber:', biopsyNumber);

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
                1
              </div>
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Nuevo Paciente</h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>Identificación del Espécimen</p>
            </div>
          </div>
          <button
            onClick={onFinishDailyReport}
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
            ← Inicio
          </button>
        </div>
      </div>

      {/* Dashboard Principal - Restaurado y Mejorado */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        margin: '16px',
        borderRadius: '16px',
        padding: '20px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '16px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>{todayBiopsiesCount}</div>
            <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '500' }}>Biopsias Hoy</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '16px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>#{todayBiopsiesCount + 1}</div>
            <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '500' }}>Próxima BX</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '16px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
              {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '500' }}>Fecha</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '16px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
              {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '500' }}>Hora</div>
          </div>
        </div>
        
        {/* Sugerencia inteligente */}
        {smartSuggestion && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px'
            }}>
              <span style={{ fontSize: '16px' }}>💡</span>
              <span style={{ opacity: 0.9, fontWeight: '500' }}>Sugerencia:</span>
              <span style={{ 
                background: 'rgba(255, 255, 255, 0.3)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}>{smartSuggestion}</span>
            </div>
          </div>
        )}
      </div>

      {/* Contenido Principal - Usando toda la pantalla */}
      <div style={{ flex: 1, padding: '12px 16px 20px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '28px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e5e7eb',
          width: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        }}>
          {/* Sección Superior */}
          <div>
            {/* Título del campo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '32px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <Hash style={{ height: '24px', width: '24px', color: 'white' }} />
              </div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>Número de Identificación</h2>
            </div>

            {/* Campo de entrada principal */}
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={handleKeyboardOpen}
                style={{
                  width: '100%',
                  padding: '24px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  borderRadius: '16px',
                  border: biopsyNumber ? '3px solid #667eea' : '3px solid #d1d5db',
                  backgroundColor: biopsyNumber ? '#f0f4ff' : 'white',
                  color: biopsyNumber ? '#667eea' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  outline: 'none',
                  minHeight: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: biopsyNumber ? '0 4px 20px rgba(102, 126, 234, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  if (!biopsyNumber) {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!biopsyNumber) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {biopsyNumber || '🖱️ Toque para abrir teclado...'}
              </button>
            </div>

            {/* Botón de sugerencia */}
            {smartSuggestion && !biopsyNumber && (
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => onBiopsyNumberChange(smartSuggestion)}
                  style={{
                    width: '100%',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '2px solid #fbbf24',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.2)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#fde68a';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef3c7';
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.2)';
                  }}
                >
                  ✨ Usar Sugerencia: {smartSuggestion}
                </button>
              </div>
            )}

            {/* Confirmación */}
            {biopsyNumber && (
              <div style={{
                marginBottom: '24px',
                backgroundColor: '#f0fdf4',
                border: '2px solid #22c55e',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <CheckCircle style={{ height: '24px', width: '24px', color: '#16a34a' }} />
                  <span style={{
                    color: '#166534',
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}>
                    ✅ Número #{biopsyNumber} confirmado
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sección Inferior - Botón */}
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={onNext}
              disabled={!canProceed}
              style={{
                width: '100%',
                padding: '20px 24px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '20px',
                background: canProceed 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                cursor: canProceed ? 'pointer' : 'not-allowed',
                boxShadow: canProceed ? '0 8px 24px rgba(102, 126, 234, 0.3)' : 'none',
                transition: 'all 0.3s',
                outline: 'none',
                minHeight: '70px'
              }}
              onMouseOver={(e) => {
                if (canProceed) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (canProceed) {
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
                <span>Continuar al Tipo de Tejido</span>
                <ArrowRight style={{ height: '24px', width: '24px' }} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Teclado Virtual - Mejorado para Tablet */}
      {showKeyboard && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '600px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid #e5e7eb',
          zIndex: 50
        }}>
          
          {/* Header del teclado */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px 16px 0 0',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '12px' }}>⌨️</span>
              </div>
              <h3 style={{
                fontWeight: '600',
                fontSize: '16px',
                margin: 0
              }}>Teclado Virtual</h3>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '12px',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {biopsyNumber || 'Vacío'}
              </div>
              <button
                onClick={() => setShowKeyboard(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Pestañas */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '8px',
            backgroundColor: '#f9fafb'
          }}>
            <button
              onClick={() => setKeyboardMode('numeric')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: keyboardMode === 'numeric' ? '#667eea' : 'white',
                color: keyboardMode === 'numeric' ? 'white' : '#6b7280'
              }}
            >
              🔢 Numérico
            </button>
            <button
              onClick={() => setKeyboardMode('letters')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: keyboardMode === 'letters' ? '#667eea' : 'white',
                color: keyboardMode === 'letters' ? 'white' : '#6b7280'
              }}
            >
              🔤 Letras
            </button>
          </div>

          {/* Teclado Numérico */}
          {keyboardMode === 'numeric' && (
            <div style={{ padding: '12px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    onClick={() => addToNumber(num)}
                    style={{
                      height: '48px',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = 'black';
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <button
                  onClick={() => addToNumber('-')}
                  style={{
                    height: '48px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#5a67d8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#667eea';
                  }}
                >
                  −
                </button>
                <button
                  onClick={() => addToNumber('0')}
                  style={{
                    height: '48px',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#667eea';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = 'black';
                  }}
                >
                  0
                </button>
                <button
                  onClick={() => addToNumber('/')}
                  style={{
                    height: '48px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#5a67d8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#667eea';
                  }}
                >
                  ∕
                </button>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                <button
                  onClick={deleteLastChar}
                  style={{
                    height: '40px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                >
                  <Delete style={{ height: '14px', width: '14px' }} />
                  Borrar
                </button>
                <button
                  onClick={clearNumber}
                  style={{
                    height: '40px',
                    backgroundColor: '#fefce8',
                    color: '#a16207',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#ca8a04';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fefce8';
                    e.currentTarget.style.color = '#a16207';
                  }}
                >
                  Limpiar
                </button>
                <button
                  onClick={handleAcceptKeyboard}
                  style={{
                    height: '40px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: '500',
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#15803d';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#16a34a';
                  }}
                >
                  <Check style={{ height: '14px', width: '14px' }} />
                  LISTO
                </button>
              </div>
            </div>
          )}

          {/* Teclado Alfabético */}
          {keyboardMode === 'letters' && (
            <div style={{ padding: '12px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '6px',
                marginBottom: '8px'
              }}>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(letter => (
                  <button
                    key={letter}
                    onClick={() => addToNumber(letter)}
                    style={{
                      height: '36px',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = 'black';
                    }}
                  >
                    {letter}
                  </button>
                ))}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '6px',
                marginBottom: '8px'
              }}>
                {['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'].map(letter => (
                  <button
                    key={letter}
                    onClick={() => addToNumber(letter)}
                    style={{
                      height: '36px',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = 'black';
                    }}
                  >
                    {letter}
                  </button>
                ))}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '6px',
                marginBottom: '12px'
              }}>
                {['U', 'V', 'W', 'X', 'Y', 'Z'].map(letter => (
                  <button
                    key={letter}
                    onClick={() => addToNumber(letter)}
                    style={{
                      height: '36px',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = 'black';
                    }}
                  >
                    {letter}
                  </button>
                ))}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '6px'
              }}>
                {['.', '_', ':', ';'].map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => addToNumber(symbol)}
                    style={{
                      height: '36px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.color = 'black';
                    }}
                  >
                    {symbol}
                  </button>
                ))}
                <button
                  onClick={deleteLastChar}
                  style={{
                    height: '36px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                >
                  <Delete style={{ height: '12px', width: '12px' }} />
                  DEL
                </button>
                <button
                  onClick={handleAcceptKeyboard}
                  style={{
                    height: '36px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontWeight: '500',
                    fontSize: '11px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#15803d';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#16a34a';
                  }}
                >
                  <Check style={{ height: '12px', width: '12px' }} />
                  LISTO
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Step1;
