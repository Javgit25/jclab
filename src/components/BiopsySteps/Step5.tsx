import React from 'react';
import { ArrowRight, Shield } from 'lucide-react';

interface Step5Props {
  declassify: string;
  onDeclassifyChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step5: React.FC<Step5Props> = ({
  declassify,
  onDeclassifyChange,
  onNext,
  onPrev
}) => {
  const isValid = declassify && (declassify === 'Sí' || declassify === 'No');

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
              <Shield style={{ height: '20px', width: '20px', color: 'white' }} />
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
                5
              </div>
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Desclasificación</h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>¿Requiere proceso especial?</p>
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
      <div style={{ flex: 1, padding: '2px 8px 4px 8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Título Principal - Fuera del box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '8px',
          padding: '0 16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '4px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
          }}>
            <Shield style={{ height: '14px', width: '14px', color: 'white' }} />
          </div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>Desclasificación</h2>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '12px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e5e7eb',
          width: 'calc(100% - 16px)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxSizing: 'border-box',
          margin: '0 auto',
          overflow: 'hidden',
          minHeight: 0
        }}>
          
          {/* Contenido sin scroll */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            {/* Pregunta principal */}
            <div style={{
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              <p style={{
                fontSize: '16px',
                color: '#374151',
                fontWeight: '500',
                margin: 0
              }}>
                ¿La muestra requiere proceso de desclasificación?
              </p>
            </div>

            {/* Opciones principales - Layout horizontal */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '8px'
            }}>
              
              {/* Opción SÍ */}
              <button
                onClick={() => onDeclassifyChange('Sí')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: `3px solid ${declassify === 'Sí' ? '#166534' : '#22c55e'}`,
                  backgroundColor: declassify === 'Sí' ? '#dcfce7' : '#f0fdf4',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  transform: declassify === 'Sí' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: declassify === 'Sí' ? '0 8px 24px rgba(34, 197, 94, 0.3)' : '0 4px 12px rgba(34, 197, 94, 0.15)'
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: declassify === 'Sí' ? '#166534' : '#22c55e',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  transition: 'all 0.3s ease'
                }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    ✓
                  </span>
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: declassify === 'Sí' ? '#166534' : '#22c55e',
                  marginBottom: '8px'
                }}>
                  SÍ
                </div>
                <div style={{
                  fontSize: '14px',
                  color: declassify === 'Sí' ? '#166534' : '#16a34a',
                  fontWeight: '500',
                  marginBottom: '6px'
                }}>
                  Requiere desclasificación
                </div>
                <div style={{
                  fontSize: '12px',
                  color: declassify === 'Sí' ? '#166534' : '#16a34a',
                  fontStyle: 'italic',
                  lineHeight: '1.2'
                }}>
                  ⏱️ Puede demorar más
                </div>
              </button>

              {/* Opción NO */}
              <button
                onClick={() => onDeclassifyChange('No')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: `3px solid ${declassify === 'No' ? '#991b1b' : '#ef4444'}`,
                  backgroundColor: declassify === 'No' ? '#fee2e2' : '#fef2f2',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  transform: declassify === 'No' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: declassify === 'No' ? '0 8px 24px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(239, 68, 68, 0.15)'
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: declassify === 'No' ? '#991b1b' : '#ef4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  transition: 'all 0.3s ease'
                }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    ✗
                  </span>
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: declassify === 'No' ? '#991b1b' : '#ef4444',
                  marginBottom: '8px'
                }}>
                  NO
                </div>
                <div style={{
                  fontSize: '14px',
                  color: declassify === 'No' ? '#991b1b' : '#dc2626',
                  fontWeight: '500',
                  marginBottom: '6px'
                }}>
                  Proceso estándar
                </div>
                <div style={{
                  fontSize: '12px',
                  color: declassify === 'No' ? '#991b1b' : '#dc2626',
                  fontStyle: 'italic',
                  lineHeight: '1.2'
                }}>
                  ⚡ Tiempo normal
                </div>
              </button>
            </div>

            {/* Confirmación de selección */}
            {isValid && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #22c55e',
                borderRadius: '4px',
                padding: '4px 6px',
                marginBottom: '4px',
                boxShadow: '0 1px 2px rgba(34, 197, 94, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#065f46'
                  }}>
                    ✓ {declassify === 'Sí' ? 'Requiere desclasificación' : 'Proceso estándar'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botón fijo en la parte inferior */}
          <div style={{ 
            marginTop: '8px', 
            paddingTop: '8px',
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
                padding: '16px 20px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '18px',
                background: isValid 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                cursor: isValid ? 'pointer' : 'not-allowed',
                boxShadow: isValid ? '0 8px 24px rgba(102, 126, 234, 0.3)' : 'none',
                transition: 'all 0.3s',
                outline: 'none',
                minHeight: '60px'
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
                gap: '8px'
              }}>
                <span>Continuar a Servicios</span>
                <ArrowRight style={{ height: '20px', width: '20px' }} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Step5;
