import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../lib/database';

interface LabBoardProps {
  labCode: string;
  onGoBack?: () => void;
}

interface Solicitud {
  id: string;
  tipo: 'taco' | 'profundizacion' | 'servicio_adicional';
  numeroPaciente: string;
  remitoNumber: string;
  descripcion: string;
  tejido: string;
  solicitadoPor: string;
  solicitadoAt: string;
  estado: 'pendiente' | 'en_proceso' | 'entregado' | 'rechazado';
  entregadoAt?: string;
  entregadoPor?: string;
  doctorEmail: string;
  labCode: string;
  cassetteLabels?: string[];
  notas?: string;
}

const tipoBadge: Record<string, { label: string; bg: string; color: string }> = {
  taco: { label: '\u{1F4E6} Taco', bg: '#78350f', color: '#fbbf24' },
  profundizacion: { label: '\u{1F52C} Profundizacion', bg: '#1e3a5f', color: '#60a5fa' },
  servicio_adicional: { label: '\u2795 Serv. Adicional', bg: '#3b0764', color: '#c084fc' },
};

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return new Date(dateStr).toLocaleDateString('es-AR');
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function getDoctorName(sol: Solicitud): string {
  if (sol.solicitadoPor) return sol.solicitadoPor;
  if (sol.doctorEmail) {
    const parts = sol.doctorEmail.split('@')[0].split('.');
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return 'Desconocido';
}

const LabBoard: React.FC<LabBoardProps> = ({ labCode, onGoBack }) => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  const fetchSolicitudes = useCallback(async () => {
    try {
      const data = await db.getSolicitudes(undefined, labCode);
      setSolicitudes(data as Solicitud[]);

      // Check for new pendientes to beep
      const currentPendienteIds = new Set(
        data.filter((s: any) => s.estado === 'pendiente').map((s: any) => s.id)
      );
      if (!initialLoadRef.current) {
        for (const id of currentPendienteIds) {
          if (!prevIdsRef.current.has(id)) {
            playBeep();
            break;
          }
        }
      }
      prevIdsRef.current = currentPendienteIds;
      initialLoadRef.current = false;
    } catch (err) {
      console.error('LabBoard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [labCode]);

  useEffect(() => {
    fetchSolicitudes();
    const interval = setInterval(fetchSolicitudes, 15000);
    return () => clearInterval(interval);
  }, [fetchSolicitudes]);

  const handleTap = useCallback(async (sol: Solicitud) => {
    let updated: Solicitud;
    if (sol.estado === 'pendiente') {
      updated = { ...sol, estado: 'en_proceso' };
    } else if (sol.estado === 'en_proceso') {
      updated = {
        ...sol,
        estado: 'entregado',
        entregadoAt: new Date().toISOString(),
        entregadoPor: 'Laboratorio',
      };
    } else {
      return;
    }

    // Optimistic update
    setSolicitudes(prev => prev.map(s => s.id === sol.id ? updated : s));

    try {
      await db.saveSolicitud(updated);
    } catch (err) {
      console.error('Error saving solicitud:', err);
      // Revert on error
      setSolicitudes(prev => prev.map(s => s.id === sol.id ? sol : s));
    }
  }, []);

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const enProceso = solicitudes.filter(s => s.estado === 'en_proceso');
  const listosHoy = solicitudes.filter(s => s.estado === 'entregado' && isToday(s.entregadoAt || ''));

  const isUrgent = (sol: Solicitud) => sol.id.startsWith('SOL_TACO_');

  // Styles
  const containerStyle: React.CSSProperties = {
    background: '#0f172a',
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#e2e8f0',
    overflow: 'hidden',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
    flexShrink: 0,
  };

  const counterStyle: React.CSSProperties = {
    fontSize: '1.3rem',
    fontWeight: 600,
    letterSpacing: '0.5px',
  };

  const boardStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    gap: '12px',
    padding: '12px',
    overflow: 'hidden',
  };

  const columnStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#1e293b',
    borderRadius: '16px',
    overflow: 'hidden',
    minWidth: 0,
  };

  const columnHeaderBase: React.CSSProperties = {
    padding: '16px 20px',
    fontSize: '1.4rem',
    fontWeight: 700,
    textAlign: 'center',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    flexShrink: 0,
  };

  const cardsContainerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const renderCard = (sol: Solicitud, columnState: string) => {
    const badge = tipoBadge[sol.tipo] || tipoBadge.taco;
    const urgent = isUrgent(sol);

    const cardStyle: React.CSSProperties = {
      background: urgent ? '#1a1a2e' : '#0f172a',
      border: urgent ? '2px solid #f59e0b' : '1px solid #334155',
      borderRadius: '14px',
      padding: '16px 18px',
      cursor: columnState !== 'entregado' ? 'pointer' : 'default',
      transition: 'transform 0.1s, box-shadow 0.1s',
      boxShadow: urgent ? '0 0 12px rgba(245,158,11,0.15)' : '0 2px 8px rgba(0,0,0,0.3)',
      WebkitTapHighlightColor: 'transparent',
    };

    return (
      <div
        key={sol.id}
        style={cardStyle}
        onClick={() => handleTap(sol)}
        onMouseDown={e => {
          if (columnState !== 'entregado') {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)';
          }
        }}
        onMouseUp={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
        onTouchStart={e => {
          if (columnState !== 'entregado') {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)';
          }
        }}
        onTouchEnd={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        {/* Type badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{
            background: badge.bg,
            color: badge.color,
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '1.1rem',
            fontWeight: 700,
          }}>
            {badge.label}
          </span>
          {urgent && (
            <span style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 600 }}>URGENTE</span>
          )}
        </div>

        {/* Patient + Tissue */}
        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px', lineHeight: 1.2 }}>
          #{sol.numeroPaciente || '---'}
          {sol.tejido && (
            <span style={{ color: '#94a3b8', fontWeight: 500 }}> - {sol.tejido}</span>
          )}
        </div>

        {/* Description (truncated) */}
        {sol.descripcion && (
          <div style={{
            fontSize: '1rem',
            color: '#94a3b8',
            marginBottom: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {sol.descripcion}
          </div>
        )}

        {/* Doctor + Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <span style={{ fontSize: '1rem', color: '#64748b' }}>
            {getDoctorName(sol)}
          </span>
          <span style={{ fontSize: '1rem', color: '#64748b' }}>
            {formatTime(sol.solicitadoAt)} ({timeAgo(sol.solicitadoAt)})
          </span>
        </div>

        {/* Remito */}
        <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '4px' }}>
          Remito #{sol.remitoNumber || '---'}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '2rem', color: '#64748b' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {onGoBack && (
            <button
              onClick={onGoBack}
              style={{
                background: '#334155',
                border: 'none',
                color: '#e2e8f0',
                fontSize: '1.2rem',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              \u2190 Volver
            </button>
          )}
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Pizarron del Laboratorio
          </div>
        </div>

        <div style={counterStyle}>
          <span style={{ color: '#fbbf24' }}>{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}</span>
          <span style={{ color: '#475569' }}> \u00B7 </span>
          <span style={{ color: '#60a5fa' }}>{enProceso.length} en proceso</span>
          <span style={{ color: '#475569' }}> \u00B7 </span>
          <span style={{ color: '#34d399' }}>{listosHoy.length} listo{listosHoy.length !== 1 ? 's' : ''} hoy</span>
        </div>

        <div style={{ fontSize: '1rem', color: '#475569' }}>
          Lab: {labCode}
        </div>
      </div>

      {/* Kanban Board */}
      <div style={boardStyle}>
        {/* PENDIENTES */}
        <div style={columnStyle}>
          <div style={{ ...columnHeaderBase, background: '#78350f', color: '#fbbf24' }}>
            Pendientes ({pendientes.length})
          </div>
          <div style={cardsContainerStyle}>
            {pendientes.length === 0 && (
              <div style={{ textAlign: 'center', color: '#475569', fontSize: '1.2rem', marginTop: '40px' }}>
                Sin solicitudes pendientes
              </div>
            )}
            {pendientes.map(s => renderCard(s, 'pendiente'))}
          </div>
        </div>

        {/* EN PROCESO */}
        <div style={columnStyle}>
          <div style={{ ...columnHeaderBase, background: '#1e3a5f', color: '#60a5fa' }}>
            En Proceso ({enProceso.length})
          </div>
          <div style={cardsContainerStyle}>
            {enProceso.length === 0 && (
              <div style={{ textAlign: 'center', color: '#475569', fontSize: '1.2rem', marginTop: '40px' }}>
                Nada en proceso
              </div>
            )}
            {enProceso.map(s => renderCard(s, 'en_proceso'))}
          </div>
        </div>

        {/* LISTOS HOY */}
        <div style={columnStyle}>
          <div style={{ ...columnHeaderBase, background: '#064e3b', color: '#34d399' }}>
            Listos Hoy ({listosHoy.length})
          </div>
          <div style={cardsContainerStyle}>
            {listosHoy.length === 0 && (
              <div style={{ textAlign: 'center', color: '#475569', fontSize: '1.2rem', marginTop: '40px' }}>
                Sin entregas hoy
              </div>
            )}
            {listosHoy.map(s => renderCard(s, 'entregado'))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabBoard;
