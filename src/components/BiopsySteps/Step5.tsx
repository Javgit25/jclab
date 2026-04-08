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
              <Shield style={{ height: '20px', width: '20px', color: 'white' }} />
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)'
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
            <Shield style={{ height: '16px', width: '16px', color: 'white' }} />
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>Desclasificación</h2>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
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
          
          {/* Contenido */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* Pregunta principal */}
            <div style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <p style={{
                fontSize: '20px',
                color: '#374151',
                fontWeight: '500',
                margin: 0
              }}>
                ¿La muestra requiere proceso de desclasificación?
              </p>
            </div>

            {/* Opciones principales - Layout horizontal (igual que Step3) */}
            <div style={{
              display: 'flex',
              gap: '20px',
              marginBottom: '24px',
              flex: 1
            }}>
              
              {/* Opción SÍ */}
              <button
                onClick={() => { onDeclassifyChange('Sí'); setTimeout(() => onNext(), 300); }}
                style={{
                  flex: 1,
                  padding: '28px',
                  borderRadius: '16px',
                  border: `3px solid ${declassify === 'Sí' ? '#1d4ed8' : '#3b82f6'}`,
                  backgroundColor: declassify === 'Sí' ? '#dbeafe' : '#eff6ff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  transform: declassify === 'Sí' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: declassify === 'Sí' ? '0 8px 24px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(59, 130, 246, 0.15)'
                }}
                onMouseOver={(e) => { if (declassify !== 'Sí') { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.25)'; } }}
                onMouseOut={(e) => { if (declassify !== 'Sí') { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'; } }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: declassify === 'Sí' ? '#1d4ed8' : '#3b82f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  transition: 'all 0.3s ease'
                }}>
                  <span style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    ✓
                  </span>
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: declassify === 'Sí' ? '#1d4ed8' : '#3b82f6',
                  marginBottom: '12px'
                }}>
                  SÍ
                </div>
                <div style={{
                  fontSize: '18px',
                  color: declassify === 'Sí' ? '#1d4ed8' : '#2563eb',
                  fontWeight: '500',
                  marginBottom: '12px'
                }}>
                  Requiere desclasificación
                </div>
                <div style={{
                  fontSize: '14px',
                  color: declassify === 'Sí' ? '#1d4ed8' : '#2563eb',
                  fontStyle: 'italic',
                  lineHeight: '1.3'
                }}>
                  ⏱️ Puede demorar más tiempo en procesamiento
                </div>
              </button>

              {/* Opción NO */}
              <button
                onClick={() => { onDeclassifyChange('No'); setTimeout(() => onNext(), 300); }}
                style={{
                  flex: 1,
                  padding: '28px',
                  borderRadius: '16px',
                  border: `3px solid ${declassify === 'No' ? '#1e293b' : '#475569'}`,
                  backgroundColor: declassify === 'No' ? '#e2e8f0' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  transform: declassify === 'No' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: declassify === 'No' ? '0 8px 24px rgba(30, 41, 59, 0.3)' : '0 4px 12px rgba(71, 85, 105, 0.15)'
                }}
                onMouseOver={(e) => { if (declassify !== 'No') { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(71, 85, 105, 0.25)'; } }}
                onMouseOut={(e) => { if (declassify !== 'No') { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(71, 85, 105, 0.15)'; } }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: declassify === 'No' ? '#1e293b' : '#475569',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  transition: 'all 0.3s ease'
                }}>
                  <span style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    ✗
                  </span>
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: declassify === 'No' ? '#1e293b' : '#475569',
                  marginBottom: '12px'
                }}>
                  NO
                </div>
                <div style={{
                  fontSize: '18px',
                  color: declassify === 'No' ? '#1e293b' : '#64748b',
                  fontWeight: '500',
                  marginBottom: '12px'
                }}>
                  Proceso estándar
                </div>
                <div style={{
                  fontSize: '14px',
                  color: declassify === 'No' ? '#1e293b' : '#64748b',
                  fontStyle: 'italic',
                  lineHeight: '1.3'
                }}>
                  ⚡ Tiempo de procesamiento normal
                </div>
              </button>
            </div>

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
                  ? 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)' 
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

export default Step5;