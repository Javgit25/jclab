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
  onFinishRemito?: () => void;
  todayBiopsiesCount?: number;
  trozoPorCassette?: number[];
  onTrozoPorCassetteChange?: (trozos: number[]) => void;
  quedaMaterial?: boolean;
  onQuedaMaterialChange?: (value: boolean) => void;
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
    <div style={{ marginBottom: '10px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '700',
        color: '#374151',
        marginBottom: '6px',
        textAlign: 'center'
      }}>
        {label}
      </label>

      {/* Controles táctiles */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '8px',
        border: `2px solid ${value ? '#1e3a5f' : '#E5E7EB'}`,
        borderRadius: '12px',
        backgroundColor: 'white',
        transition: 'all 0.3s ease'
      }}>
        
        {/* Botón - */}
        <button
          onClick={decrement}
          disabled={numValue <= min}
          style={{
            width: '38px',
            height: '38px',
            backgroundColor: numValue > min ? '#1e3a5f' : '#e5e7eb',
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
            padding: '8px',
            fontSize: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: value ? '#f0f4ff' : '#f8fafc',
            color: value ? '#1e3a5f' : '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minHeight: '38px',
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
            width: '38px',
            height: '38px',
            backgroundColor: numValue < max ? '#1e3a5f' : '#e5e7eb',
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
          marginTop: '4px',
          padding: '4px 8px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #22c55e',
          borderRadius: '6px',
          textAlign: 'center',
          color: '#065f46',
          fontWeight: '600',
          fontSize: '12px'
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
  onOpenVirtualKeyboard,
  onFinishRemito,
  todayBiopsiesCount,
  trozoPorCassette = [],
  onTrozoPorCassetteChange,
  quedaMaterial = false,
  onQuedaMaterialChange
}) => {
  // Determinar si es PAP o Citología para manejo especial
  const isPapOrCitologia = tissueType === 'PAP' || tissueType === 'Citología';
  const isTacoConsulta = tissueType === 'Taco en Consulta';
  const isIHQ = tissueType === 'Inmunohistoquímica';
  const materialType = isPapOrCitologia ? 'Vidrios' : 'Cassettes';

  // Auto-inicializar trozos cuando hay 2+ cassettes y pieces está vacío
  React.useEffect(() => {
    const numCass = parseInt(cassettes) || 0;
    if (numCass >= 2 && (!pieces || parseInt(pieces) === 0)) {
      const defaultTrozos = Array(numCass).fill(1);
      onTrozoPorCassetteChange?.(defaultTrozos);
      onPiecesChange(String(numCass));
    } else if (numCass === 1 && (!pieces || parseInt(pieces) === 0)) {
      onPiecesChange('1');
    }
  }, [cassettes]);

  const isValid = isTacoConsulta || isIHQ
    ? cassettes && parseInt(cassettes) > 0
    : cassettes && parseInt(cassettes) > 0 && pieces && parseInt(pieces) > 0;

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

      {/* Contenido Principal */}
      <div style={{ flex: 1, padding: '4px 8px 12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Título Principal - Fuera del box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '8px',
          padding: '0 16px'
        }}>
          <Package style={{ height: '16px', width: '16px', color: '#1e3a5f' }} />
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>Cantidad de Material</h2>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '12px',
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
            <div style={{ marginBottom: '8px' }}>
              <TouchNumericInput
                label={`Número de ${materialType}`}
                value={cassettes}
                onChange={onCassettesChange}
                placeholder="0"
                min={1}
                max={999}
                onOpenKeyboard={() => onOpenVirtualKeyboard('numeric', 'cassettes', cassettes)}
              />

              {/* Trozos: si 1 cassette = input global (oculto para Taco en Consulta e IHQ) */}
              {!isTacoConsulta && !isIHQ && (!cassettes || parseInt(cassettes) <= 1) && (
                <TouchNumericInput
                  label="Número de Trozos"
                  value={pieces}
                  onChange={onPiecesChange}
                  placeholder="0"
                  min={1}
                  max={999}
                  onOpenKeyboard={() => onOpenVirtualKeyboard('numeric', 'pieces', pieces)}
                />
              )}
            </div>

            {/* Trozos por cassette - cuando hay 2+ cassettes (oculto para Taco en Consulta e IHQ) */}
            {!isPapOrCitologia && !isTacoConsulta && !isIHQ && cassettes && parseInt(cassettes) >= 2 && (
              <div style={{ marginBottom: '8px', backgroundColor: '#f0f4ff', borderRadius: '10px', padding: '10px', border: '2px solid #1e3a5f20' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>Trozos por Cassette</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669', background: '#f0fdf4', padding: '2px 8px', borderRadius: '6px' }}>
                    Total: {trozoPorCassette.length > 0 ? trozoPorCassette.reduce((s, v) => s + (v || 1), 0) : parseInt(cassettes) || 0}
                  </span>
                </div>
                {Array.from({ length: parseInt(cassettes) || 0 }, (_, i) => {
                  const cn = cassettesNumbers[i];
                  const label = cn?.suffix ? `${cn.base}/${cn.suffix}` : `Cassette ${i+1}`;
                  const val = trozoPorCassette[i] || 1;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: i % 2 === 0 ? 'white' : '#f8fafc', borderRadius: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => { const t = [...trozoPorCassette]; while (t.length <= i) t.push(1); t[i] = Math.max(1, (t[i] || 1) - 1); onTrozoPorCassetteChange?.(t); onPiecesChange(String(t.reduce((s, v) => s + v, 0))); }}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#e2e8f0', cursor: 'pointer', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>−</button>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a5f', minWidth: '28px', textAlign: 'center' }}>{val}</span>
                        <button onClick={() => { const t = [...trozoPorCassette]; while (t.length <= i) t.push(1); t[i] = (t[i] || 1) + 1; onTrozoPorCassetteChange?.(t); onPiecesChange(String(t.reduce((s, v) => s + v, 0))); }}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#1e3a5f', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vidrios por Cassette para IHQ */}
            {isIHQ && cassettes && parseInt(cassettes) >= 1 && (
              <div style={{ marginBottom: '8px', backgroundColor: '#eff6ff', borderRadius: '10px', padding: '10px', border: '2px solid #3b82f620' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>🔬 Vidrios por Cassette</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669', background: '#f0fdf4', padding: '2px 8px', borderRadius: '6px' }}>
                    Total: {trozoPorCassette.length > 0 ? trozoPorCassette.reduce((s, v) => s + (v || 1), 0) : parseInt(cassettes) || 0} vidrios
                  </span>
                </div>
                {Array.from({ length: parseInt(cassettes) || 0 }, (_, i) => {
                  const cn = cassettesNumbers[i];
                  const label = cn?.suffix ? `${cn.base}/${cn.suffix}` : `Cassette ${i+1}`;
                  const val = trozoPorCassette[i] || 1;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: i % 2 === 0 ? 'white' : '#f8fafc', borderRadius: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => { const t = [...trozoPorCassette]; while (t.length <= i) t.push(1); t[i] = Math.max(1, (t[i] || 1) - 1); onTrozoPorCassetteChange?.(t); onPiecesChange(String(t.reduce((s, v) => s + v, 0))); }}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#e2e8f0', cursor: 'pointer', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>−</button>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e40af', minWidth: '28px', textAlign: 'center' }}>{val}</span>
                        <button onClick={() => { const t = [...trozoPorCassette]; while (t.length <= i) t.push(1); t[i] = (t[i] || 1) + 1; onTrozoPorCassetteChange?.(t); onPiecesChange(String(t.reduce((s, v) => s + v, 0))); }}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#1e40af', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cassettes individuales - Solo si no es PAP o Citología ni Taco en Consulta ni IHQ Y hay 2 o más cassettes */}
            {!isPapOrCitologia && !isTacoConsulta && !isIHQ && cassettes && parseInt(cassettes) > 1 && cassettesNumbers.length > 1 && (
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#374151',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  🏷️ Numeración de SUBs
                </h3>
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '8px',
                  border: '2px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '6px'
                  }}>
                    {/* Mostrar todos los cassettes para cambio de nombre */}
                    {cassettesNumbers.map((cassette, index) => {
                      const realIndex = index;
                      const defaultSuffix = cassette.suffix || (index + 1).toString();
                      return (
                        <div key={realIndex} style={{
                          backgroundColor: 'white',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {/* Número base (no modificable) */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: '#374151',
                              backgroundColor: '#f3f4f6',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db'
                            }}>
                              {cassette.base}
                            </span>
                          </div>

                          {/* Barra separadora */}
                          <span style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#1e3a5f',
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
                              border: '2px solid #1e3a5f',
                              borderRadius: '6px',
                              backgroundColor: defaultSuffix ? '#f0f4ff' : 'white',
                              color: '#1e3a5f',
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
                background: '#f0fdf4',
                border: '1px solid #22c55e',
                borderRadius: '6px',
                padding: '6px 10px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                fontSize: '12px',
                color: '#059669',
                fontWeight: '600'
              }}>
                <span>📋 {materialType}: {cassettes}</span>
                {isIHQ && <span>Vidrios: {trozoPorCassette.length > 0 ? trozoPorCassette.reduce((s, v) => s + (v || 1), 0) : parseInt(cassettes) || 0}</span>}
                {!isTacoConsulta && !isIHQ && <span>Trozos: {pieces}</span>}
              </div>
            )}

            {/* Checkbox Queda Material — al final (oculto para Taco en Consulta e IHQ) */}
            {!isPapOrCitologia && !isTacoConsulta && !isIHQ && cassettes && parseInt(cassettes) >= 1 && (
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: quedaMaterial ? '#fef3c7' : '#f9fafb', border: `2px solid ${quedaMaterial ? '#f59e0b' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={quedaMaterial} onChange={(e) => onQuedaMaterialChange?.(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#f59e0b' }} />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: quedaMaterial ? '#92400e' : '#374151' }}>Queda material</span>
                    <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px' }}>— No se colocó todo el material</span>
                  </div>
                </label>
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
                minHeight: '50px'
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

export default Step4;
