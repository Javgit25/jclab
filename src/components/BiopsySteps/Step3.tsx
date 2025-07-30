import React from 'react';
import { ArrowRight, FileText, Check } from 'lucide-react';

interface Step3Props {
  type: string;
  onTypeChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3: React.FC<Step3Props> = ({
  type,
  onTypeChange,
  onNext,
  onPrev
}) => {
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
              <FileText style={{ height: '20px', width: '20px', color: 'white' }} />
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
                3
              </div>
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Tipo de Procedimiento</h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>Seleccione el tipo de análisis</p>
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

      {/* Contenido Principal - Con scroll habilitado */}
      <div style={{ flex: 1, padding: '4px 8px 12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          minHeight: 'calc(100vh - 180px)',
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
            {/* Título Principal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '8px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <FileText style={{ height: '20px', width: '20px', color: 'white' }} />
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>Tipo de Procedimiento</h2>
            </div>

            {/* Opciones de tipo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              
              {/* Opción BX - Biopsia */}
              <button
                onClick={() => onTypeChange('BX')}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  border: `3px solid ${type === 'BX' ? '#667eea' : '#E5E7EB'}`,
                  backgroundColor: type === 'BX' ? '#f0f4ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  transform: type === 'BX' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: type === 'BX' ? '0 8px 24px rgba(102, 126, 234, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
                  minHeight: '80px'
                }}
                onMouseOver={(e) => {
                  if (type !== 'BX') {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.transform = 'scale(1.01)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.2)';
                  }
                }}
                onMouseOut={(e) => {
                  if (type !== 'BX') {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: type === 'BX' ? '#667eea' : '#1f2937',
                      marginBottom: '2px'
                    }}>
                      BX - Biopsia
                    </div>
                    <div style={{
                      fontSize: '15px',
                      color: type === 'BX' ? '#4338ca' : '#6b7280',
                      lineHeight: '1.2'
                    }}>
                      Muestra de tejido para análisis histopatológico
                    </div>
                  </div>
                  {type === 'BX' && (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#22c55e',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                    }}>
                      <Check style={{ width: '22px', height: '22px', color: 'white' }} />
                    </div>
                  )}
                </div>
              </button>

              {/* Opción PQ - Pieza Quirúrgica */}
              <button
                onClick={() => onTypeChange('PQ')}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  border: `3px solid ${type === 'PQ' ? '#667eea' : '#E5E7EB'}`,
                  backgroundColor: type === 'PQ' ? '#f0f4ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  transform: type === 'PQ' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: type === 'PQ' ? '0 8px 24px rgba(102, 126, 234, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
                  minHeight: '80px'
                }}
                onMouseOver={(e) => {
                  if (type !== 'PQ') {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.transform = 'scale(1.01)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.2)';
                  }
                }}
                onMouseOut={(e) => {
                  if (type !== 'PQ') {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: type === 'PQ' ? '#667eea' : '#1f2937',
                      marginBottom: '2px'
                    }}>
                      PQ - Pieza Quirúrgica
                    </div>
                    <div style={{
                      fontSize: '15px',
                      color: type === 'PQ' ? '#4338ca' : '#6b7280',
                      lineHeight: '1.2'
                    }}>
                      Muestra quirúrgica completa para análisis detallado
                    </div>
                  </div>
                  {type === 'PQ' && (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#22c55e',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                    }}>
                      <Check style={{ width: '22px', height: '22px', color: 'white' }} />
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Confirmación de selección mejorada */}
            {type && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #22c55e',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.15)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    color: '#065f46' 
                  }}>
                    Tipo seleccionado: {type === 'BX' ? 'Biopsia' : 'Pieza Quirúrgica'}
                  </span>
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
              disabled={!type}
              style={{
                width: '100%',
                padding: '20px 24px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '20px',
                background: type 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                cursor: type ? 'pointer' : 'not-allowed',
                boxShadow: type ? '0 8px 24px rgba(102, 126, 234, 0.3)' : 'none',
                transition: 'all 0.3s',
                outline: 'none',
                minHeight: '70px'
              }}
              onMouseOver={(e) => {
                if (type) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (type) {
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
                <span>Continuar a Cantidad de Material</span>
                <ArrowRight style={{ height: '24px', width: '24px' }} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};