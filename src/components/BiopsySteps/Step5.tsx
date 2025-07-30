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
      {/* Header minimalista */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '8px 16px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield style={{ height: '16px', width: '16px', color: 'white' }} />
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Paso 5 - Desclasificación</span>
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
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          ← Anterior
        </button>
      </div>

      {/* Pregunta centrada */}
      <div style={{
        padding: '16px',
        textAlign: 'center',
        flexShrink: 0
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: 0,
          marginBottom: '8px'
        }}>
          ¿La muestra requiere proceso de desclasificación?
        </h2>
      </div>

      {/* Botones principales que ocupan toda la pantalla */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '12px',
        padding: '0 16px 16px 16px',
        minHeight: 0
      }}>
        
        {/* Botón SÍ - Ocupa toda la altura disponible */}
        <button
          onClick={() => onDeclassifyChange('Sí')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '20px',
            border: `4px solid ${declassify === 'Sí' ? '#166534' : '#22c55e'}`,
            backgroundColor: declassify === 'Sí' ? '#dcfce7' : '#f0fdf4',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: declassify === 'Sí' ? 'scale(1.02)' : 'scale(1)',
            boxShadow: declassify === 'Sí' ? '0 12px 40px rgba(34, 197, 94, 0.4)' : '0 8px 24px rgba(34, 197, 94, 0.2)',
            padding: '24px',
            minHeight: 0
          }}
        >
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: declassify === 'Sí' ? '#166534' : '#22c55e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)'
          }}>
            <span style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              ✓
            </span>
          </div>
          
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: declassify === 'Sí' ? '#166534' : '#22c55e',
            marginBottom: '16px',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            SÍ
          </div>
          
          <div style={{
            fontSize: '20px',
            color: declassify === 'Sí' ? '#166534' : '#16a34a',
            fontWeight: '600',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Requiere desclasificación
          </div>
          
          <div style={{
            fontSize: '16px',
            color: declassify === 'Sí' ? '#166534' : '#16a34a',
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            ⏱️ Proceso especial<br/>Puede demorar más tiempo
          </div>
        </button>

        {/* Botón NO - Ocupa toda la altura disponible */}
        <button
          onClick={() => onDeclassifyChange('No')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '20px',
            border: `4px solid ${declassify === 'No' ? '#991b1b' : '#ef4444'}`,
            backgroundColor: declassify === 'No' ? '#fee2e2' : '#fef2f2',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: declassify === 'No' ? 'scale(1.02)' : 'scale(1)',
            boxShadow: declassify === 'No' ? '0 12px 40px rgba(239, 68, 68, 0.4)' : '0 8px 24px rgba(239, 68, 68, 0.2)',
            padding: '24px',
            minHeight: 0
          }}
        >
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: declassify === 'No' ? '#991b1b' : '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)'
          }}>
            <span style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              ✗
            </span>
          </div>
          
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: declassify === 'No' ? '#991b1b' : '#ef4444',
            marginBottom: '16px',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            NO
          </div>
          
          <div style={{
            fontSize: '20px',
            color: declassify === 'No' ? '#991b1b' : '#dc2626',
            fontWeight: '600',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Proceso estándar
          </div>
          
          <div style={{
            fontSize: '16px',
            color: declassify === 'No' ? '#991b1b' : '#dc2626',
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            ⚡ Procesamiento normal<br/>Tiempo estándar
          </div>
        </button>
      </div>

      {/* Botón continuar fijo en la parte inferior */}
      {isValid && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          flexShrink: 0
        }}>
          <button
            onClick={onNext}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              fontWeight: 'bold',
              fontSize: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <span>Continuar a Servicios</span>
            <ArrowRight style={{ height: '24px', width: '24px' }} />
          </button>
        </div>
      )}
    </div>
  );
};
export default Step5;
