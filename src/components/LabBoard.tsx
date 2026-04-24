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
  anulacion_remito: { label: '\u{1F5D1} Anulacion', bg: '#7f1d1d', color: '#fca5a5' },
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
  let doctorNombre = '';
  // Buscar nombre del doctor desde médicos registrados
  try {
    const doctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
    const doc = doctors.find((d: any) => d.email?.toLowerCase() === sol.doctorEmail?.toLowerCase());
    if (doc) doctorNombre = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
  } catch {}
  // Fallback: buscar en remitos
  if (!doctorNombre) {
    try {
      const remitosLocal = JSON.parse(localStorage.getItem('adminRemitos') || '[]');
      const r = remitosLocal.find((rem: any) => rem.email?.toLowerCase() === sol.doctorEmail?.toLowerCase());
      if (r?.medico) doctorNombre = r.medico;
    } catch {}
  }
  // Si encontró nombre del doctor, agregar ayudante si corresponde
  if (doctorNombre) {
    const cargado = sol.solicitadoPor && !sol.solicitadoPor.startsWith('Dr') ? ` (${sol.solicitadoPor})` : '';
    return doctorNombre + cargado;
  }
  if (sol.solicitadoPor) return sol.solicitadoPor;
  return 'Desconocido';
}

interface UrgenteBiopsia {
  id: string;
  numero: string;
  tejido: string;
  tipo: string;
  medico: string;
  remitoNumber: string;
  fecha: string;
  listo: boolean;
  remitoId: string;
  biopsiaIdx: number;
}

const LabBoard: React.FC<LabBoardProps> = ({ labCode, onGoBack }) => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [urgentes, setUrgentes] = useState<UrgenteBiopsia[]>([]);
  const [serviciosEspeciales, setServiciosEspeciales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});

  // Cargar nombres de doctores desde Supabase
  useEffect(() => {
    const loadNames = async () => {
      try {
        const doctors = await db.getDoctors();
        const names: Record<string, string> = {};
        doctors.forEach((d: any) => {
          names[d.email.toLowerCase()] = `${d.firstName || ''} ${d.lastName || ''}`.trim();
        });
        setDoctorNames(names);
      } catch {}
    };
    loadNames();
  }, []);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  // Cargar urgentes desde remitos
  const fetchUrgentes = useCallback(async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase.from('remitos').select('*').eq('lab_code', labCode);
      if (data) {
        const urgs: UrgenteBiopsia[] = [];
        data.forEach((r: any) => {
          const biopsiaListas = r.biopsia_listas || [];
          (r.biopsias || []).forEach((b: any, idx: number) => {
            const sv = b.servicios || {};
            if (sv.cassetteUrgente || sv.papUrgente || sv.citologiaUrgente) {
              urgs.push({
                id: `${r.id}_${idx}`,
                numero: b.numero || '',
                tejido: b.tejido || '',
                tipo: b.tejido === 'PAP' ? 'PAP' : b.tejido === 'Citología' ? 'Cito' : (b.tipo === 'TC' || b.tejido === 'Taco en Consulta') ? 'TACO' : b.tipo === 'PQ' ? 'PQ' : (b.tipo === 'IHQ' || b.tejido === 'Inmunohistoquímica') ? 'IHQ' : 'BX',
                medico: r.medico || '',
                remitoNumber: r.remito_number || '',
                fecha: r.timestamp || r.fecha || '',
                listo: biopsiaListas[idx] || false,
                remitoId: r.id,
                biopsiaIdx: idx,
              });
            }
          });
        });
        setUrgentes(urgs);

        // Extraer servicios especiales de remitos no listos
        const svcs: any[] = [];
        data.forEach((r: any) => {
          const biopsiaListas = r.biopsia_listas || [];
          (r.biopsias || []).forEach((b: any, idx: number) => {
            if (biopsiaListas[idx]) return; // ya listo, skip
            const sv = b.servicios || {};
            const items: string[] = [];
            if ((sv.corteBlancoIHQ || 0) > 0) items.push('Corte IHQ x' + sv.corteBlancoIHQ);
            if ((sv.corteBlanco || 0) > 0) items.push('Corte Blanco x' + sv.corteBlanco);
            if (sv.giemsaPASMasson) {
              const opts = sv.giemsaOptions || {};
              const t = [opts.giemsa && 'Giemsa', opts.pas && 'PAS', opts.masson && 'Masson'].filter(Boolean);
              const gi = sv.giemsaCassettes || [];
              const cn = b.cassettesNumbers || [];
              const subsLabel = gi.length > 0 && cn.length > 0 ? ' [' + gi.map((ci: number) => { const c = cn[ci]; return c ? (c.suffix ? `${c.base}/${c.suffix}` : c.base) : `S${ci+1}`; }).join(', ') + ']' : (gi.length > 0 ? ' x' + gi.length : '');
              items.push((t.length > 0 ? t.join('/') : 'Tinción') + subsLabel);
            }
            if ((sv.profundizacion || 0) > 0) items.push('Profundización x' + sv.profundizacion);
            if (items.length > 0) {
              svcs.push({ numero: b.numero, tejido: b.tejido, medico: r.medico, remitoNumber: r.remito_number, fecha: r.timestamp || r.fecha, servicios: items });
            }
          });
        });
        setServiciosEspeciales(svcs);
      }
    } catch (e) { console.error('Error cargando urgentes:', e); }
  }, [labCode]);

  // Marcar urgente como listo
  const handleMarcarUrgenteListo = useCallback(async (urg: UrgenteBiopsia) => {
    if (urg.listo) return;
    // Optimistic update
    setUrgentes(prev => prev.map(u => u.id === urg.id ? { ...u, listo: true } : u));
    try {
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase.from('remitos').select('*').eq('id', urg.remitoId).single();
      if (data) {
        const biopsiaListas = data.biopsia_listas || [];
        while (biopsiaListas.length < (data.biopsias || []).length) biopsiaListas.push(false);
        biopsiaListas[urg.biopsiaIdx] = true;
        const todasListas = biopsiaListas.every(Boolean);
        await supabase.from('remitos').update({
          biopsia_listas: biopsiaListas,
          estado_envio: todasListas ? 'listo' : data.estado_envio,
          listo_at: todasListas ? new Date().toISOString() : data.listo_at,
          updated_at: new Date().toISOString(),
        }).eq('id', urg.remitoId);

        // Notificar al médico
        const biopsia = data.biopsias[urg.biopsiaIdx];
        const totalBiopsias = data.biopsias.length;
        const listasCount = biopsiaListas.filter(Boolean).length;
        const remitoNum = data.remito_number || data.id.slice(-6).toUpperCase();
        const medicoEmail = data.doctor_email || data.email;
        const notif = todasListas
          ? { id: `NOTIF_LISTO_${Date.now()}`, remitoId: data.id, medicoEmail, mensaje: `Su remito #${remitoNum} está LISTO PARA RETIRAR.\nTodos los estudios (${totalBiopsias}) fueron procesados.`, fecha: new Date().toISOString(), leida: false, tipo: 'listo' }
          : { id: `NOTIF_PARCIAL_${Date.now()}`, remitoId: data.id, medicoEmail, mensaje: `Paciente #${biopsia.numero} (${urg.tipo} - ${biopsia.tejido}) está LISTO.\nProgreso: ${listasCount}/${totalBiopsias} estudios listos.`, fecha: new Date().toISOString(), leida: false, tipo: 'parcial' };
        db.saveNotification(notif).catch(console.error);
      }
    } catch (e) {
      console.error('Error marcando urgente:', e);
      setUrgentes(prev => prev.map(u => u.id === urg.id ? { ...u, listo: false } : u));
    }
  }, []);

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
    fetchUrgentes();
    const interval = setInterval(() => { fetchSolicitudes(); fetchUrgentes(); }, 15000);
    return () => clearInterval(interval);
  }, [fetchSolicitudes, fetchUrgentes]);

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
      // Notificar al médico
      const desc = sol.descripcion || '';
      let tipoMsg = sol.tipo === 'taco' ? 'Taco/Cassette' : sol.tipo === 'profundizacion' ? 'Profundización' : '';
      if (sol.tipo === 'servicio_adicional') {
        const sn: string[] = [];
        if (desc.includes('Giemsa')) sn.push('Giemsa');
        if (desc.includes('PAS')) sn.push('PAS');
        if (desc.includes('Masson')) sn.push('Masson');
        if (desc.includes('Vidrios IHQ')) sn.push('Corte IHQ');
        if (desc.includes('Vidrios Blanco')) sn.push('Corte Blanco');
        tipoMsg = sn.length > 0 ? sn.join(', ') : 'Servicio Adicional';
      }
      const cassInfo = sol.cassetteLabels?.length > 0 ? `\nCassettes: ${sol.cassetteLabels.join(', ')}` : '';
      // Mensajes específicos para anulación de remito (flujo distinto al de solicitudes normales)
      const mensajes: Record<string, string> = sol.tipo === 'anulacion_remito'
        ? {
            en_proceso: `Su pedido de anulación del Remito #${sol.remitoNumber || ''} fue recibido y está en revisión por el laboratorio.`,
            entregado: `✅ Anulación del Remito #${sol.remitoNumber || ''} APROBADA.\nEl remito fue descontado de la facturación.`,
            rechazado: `❌ Anulación del Remito #${sol.remitoNumber || ''} RECHAZADA.\nEl remito se mantiene en la facturación.`
          }
        : {
            en_proceso: `Su solicitud de ${tipoMsg} fue aceptada y está en proceso.\nPaciente #${sol.numeroPaciente || ''} — ${sol.tejido || ''}${cassInfo}\nRemito #${sol.remitoNumber || ''}`,
            entregado: `${tipoMsg} listo para retirar!\nPaciente #${sol.numeroPaciente || ''} — ${sol.tejido || ''}${cassInfo}\nRemito #${sol.remitoNumber || ''}`
          };
      if (mensajes[updated.estado]) {
        // Para anulaciones aprobadas usamos tipo 'anulacion_aprobada' para label distinto
        let notifTipo: string = updated.estado === 'entregado' ? 'listo' : 'material_recibido';
        if (sol.tipo === 'anulacion_remito') {
          if (updated.estado === 'entregado') notifTipo = 'anulacion_aprobada';
          else if (updated.estado === 'rechazado') notifTipo = 'anulacion_rechazada';
          else notifTipo = 'anulacion_en_revision';
        }
        const notif = {
          id: `NOTIF_SOL_${Date.now()}`,
          remitoId: sol.id,
          medicoEmail: sol.doctorEmail || '',
          mensaje: mensajes[updated.estado],
          fecha: new Date().toISOString(),
          leida: false,
          tipo: notifTipo
        };
        db.saveNotification(notif).catch(console.error);
      }
      // Anulación de remito aprobada: marcar el remito como anulado en Supabase
      // Usa notaServicioAdicional (TEXT) — el schema Supabase rechaza 'anulado' en estado.
      if (updated.estado === 'entregado' && sol.tipo === 'anulacion_remito') {
        try {
          const allRemitos = await db.getRemitos();
          const target = allRemitos.find((r: any) => String(r.remitoNumber) === String(sol.remitoNumber));
          if (target) {
            const motivo = (sol.descripcion || '').replace(/^ANULACIÓN solicitada por el médico\.\s*/i, '').trim();
            const quien = sol.solicitadoPor || sol.doctorEmail || 'Médico';
            const anulado = {
              ...target,
              notaServicioAdicional: `ANULADO|${quien}|${new Date().toISOString()}|${motivo || 'Sin motivo'}`,
              modificadoPorSolicitud: true,
              modificadoAt: new Date().toISOString()
            };
            await db.saveRemito(anulado);
          }
        } catch (e) { console.error('Error marcando remito como anulado:', e); }
      }

      // Auto-facturar: sumar profundización/servicio al remito cuando se marca entregado
      if (updated.estado === 'entregado' && (sol.tipo === 'profundizacion' || sol.tipo === 'servicio_adicional')) {
        const desc = sol.descripcion || '';
        const aG = desc.includes('Giemsa'), aP = desc.includes('PAS'), aM = desc.includes('Masson');
        const cL = sol.cassetteLabels || [];
        const cC = cL.length || 1;
        const tC = (aG?1:0)+(aP?1:0)+(aM?1:0);

        // Función para actualizar servicios
        const updateSvc = (sv: any, cassettesNumbers?: any[]) => {
          if (sol.tipo === 'profundizacion') {
            sv.profundizacion = (sv.profundizacion || 0) + 1;
          } else {
            if (aG || aP || aM) {
              sv.giemsaPASMasson = (sv.giemsaPASMasson || 0) + (cC * tC);
              if (!sv.giemsaOptions) sv.giemsaOptions = { giemsa: false, pas: false, masson: false };
              if (aG) sv.giemsaOptions.giemsa = true;
              if (aP) sv.giemsaOptions.pas = true;
              if (aM) sv.giemsaOptions.masson = true;
              if (cL.length > 0 && cassettesNumbers) {
                const ni = cL.map((l: string) => cassettesNumbers.findIndex((c: any) => (c.suffix ? `${c.base}/${c.suffix}` : c.base) === l)).filter((i: number) => i >= 0);
                sv.giemsaCassettes = [...new Set([...(sv.giemsaCassettes || []), ...ni])];
              }
            }
            const im = desc.match(/Vidrios IHQ ×(\d+)/);
            if (im) { sv.corteBlancoIHQ = (sv.corteBlancoIHQ || 0) + parseInt(im[1]); }
            const bm = desc.match(/Vidrios Blanco ×(\d+)/);
            if (bm) { sv.corteBlanco = (sv.corteBlanco || 0) + parseInt(bm[1]); }
          }
          return sv;
        };

        // 1. Actualizar remito en Supabase
        try {
          const { supabase: sb } = await import('../lib/supabase');
          const { data: remitosData } = await sb.from('remitos').select('*').eq('lab_code', labCode);
          if (remitosData) {
            const solRN = (sol.remitoNumber || '').replace('#', '').trim();
            let remitoOrig = remitosData.find((r: any) => (r.remito_number || '').replace('#', '').trim() === solRN);
            if (!remitoOrig && sol.numeroPaciente && sol.doctorEmail) {
              remitoOrig = remitosData.find((r: any) =>
                ((r.doctor_email || r.email || '').toLowerCase() === sol.doctorEmail.toLowerCase()) &&
                (r.biopsias || []).some((b: any) => b.numero === sol.numeroPaciente)
              );
            }
            if (remitoOrig) {
              const biopsias = [...(remitoOrig.biopsias || [])];
              const biopsiaIdx = biopsias.findIndex((b: any) => b.numero === sol.numeroPaciente);
              if (biopsiaIdx >= 0) {
                const biopsia = { ...biopsias[biopsiaIdx] };
                biopsia.servicios = updateSvc({ ...(biopsia.servicios || {}) }, biopsia.cassettesNumbers);
                biopsias[biopsiaIdx] = biopsia;
                await sb.from('remitos').update({ biopsias, modificado_por_solicitud: true, modificado_at: new Date().toISOString() }).eq('id', remitoOrig.id);
              }
            }
          }
        } catch (e) { console.error('Error auto-facturando desde pizarrón:', e); }

        // 2. Sincronizar con doctor_history usando update directo
        try {
          const { supabase: sb2 } = await import('../lib/supabase');
          const docEmail = (sol.doctorEmail || '').toLowerCase().trim();
          const solRN = (sol.remitoNumber || '').replace('#', '').trim();
          if (docEmail) {
            // Leer servicios frescos del remito que acabamos de actualizar
            const { data: freshData } = await sb2.from('remitos').select('biopsias').eq('lab_code', labCode);
            if (freshData) {
              const freshRemito = freshData.find((r: any) => (r.biopsias || []).some((b: any) => b.numero === sol.numeroPaciente));
              if (freshRemito) {
                const freshBio = freshRemito.biopsias.find((b: any) => b.numero === sol.numeroPaciente);
                if (freshBio?.servicios) {
                  await db.updateDoctorBiopsyServices(docEmail, sol.numeroPaciente, solRN, freshBio.servicios);
                }
              }
            }
          }
        } catch (e) { console.error('Error sincronizando doctor_history desde pizarrón:', e); }
      }
    } catch (err) {
      console.error('Error saving solicitud:', err);
      setSolicitudes(prev => prev.map(s => s.id === sol.id ? sol : s));
    }
  }, [labCode]);

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const enProceso = solicitudes.filter(s => s.estado === 'en_proceso');
  const listosHoy = solicitudes.filter(s => s.estado === 'entregado' && isToday(s.entregadoAt || ''));

  const isUrgent = (sol: Solicitud) => (sol as any).urgente === true;

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

        {/* Doctor name - BIG */}
        <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px', lineHeight: 1.2, color: '#f1f5f9' }}>
          {(() => {
            const email = (sol.doctorEmail || '').toLowerCase();
            const docName = doctorNames[email] || '';
            const cargado = sol.solicitadoPor && !sol.solicitadoPor.startsWith('Dr') ? ` (${sol.solicitadoPor})` : '';
            const nombre = docName ? docName + cargado : getDoctorName(sol);
            return nombre.startsWith('Dr') ? nombre : 'Dr./Dra. ' + nombre;
          })()}
        </div>

        {/* Patient + Tissue + Remito */}
        <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '4px' }}>
          Pac. #{sol.numeroPaciente || '---'}{sol.tejido ? ` · ${sol.tejido}` : ''} · Remito #{sol.remitoNumber || '---'}
        </div>

        {/* Cassettes/SUBs */}
        {sol.cassetteLabels && sol.cassetteLabels.length > 0 && (
          <div style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: 700, marginBottom: '2px' }}>
            Cassettes: {sol.cassetteLabels.join(', ')}
          </div>
        )}

        {/* Description (truncated) */}
        {sol.descripcion && (
          <div style={{
            fontSize: '0.9rem',
            color: '#64748b',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {sol.descripcion}
          </div>
        )}

        {/* Time */}
        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
          {formatTime(sol.solicitadoAt)} ({timeAgo(sol.solicitadoAt)})
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
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>Pizarrón del Laboratorio</div>
          <div style={counterStyle}>
            <span style={{ color: '#fbbf24' }}>{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}</span>
            <span style={{ color: '#475569' }}> · </span>
            <span style={{ color: '#60a5fa' }}>{enProceso.length} en proceso</span>
            <span style={{ color: '#475569' }}> · </span>
            <span style={{ color: '#34d399' }}>{listosHoy.length} listo{listosHoy.length !== 1 ? 's' : ''} hoy</span>
          </div>
        </div>
      </div>

      {/* Urgentes */}
      {urgentes.filter(u => !u.listo).length > 0 && (
        <div style={{ padding: '8px 12px', flexShrink: 0 }}>
          <div style={{ background: '#450a0a', border: '2px solid #dc2626', borderRadius: '12px', padding: '10px 14px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ⚡ URGENTES ({urgentes.filter(u => !u.listo).length}) — Toque para marcar listo
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {urgentes.filter(u => !u.listo).map(urg => (
                <div key={urg.id}
                  onClick={() => handleMarcarUrgenteListo(urg)}
                  style={{
                    background: '#1a1a1a', border: '2px solid #dc2626', borderRadius: '10px',
                    padding: '10px 14px', cursor: 'pointer', minWidth: '200px', flex: '1 1 220px', maxWidth: '300px',
                    transition: 'transform 0.1s',
                  }}
                  onTouchStart={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.96)'; }}
                  onTouchEnd={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fca5a5' }}>{urg.medico?.startsWith('Dr') ? urg.medico : 'Dr./Dra. ' + urg.medico}</span>
                    <span style={{ background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{urg.tipo}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Pac. #{urg.numero} · {urg.tejido} · Remito #{urg.remitoNumber}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(urg.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Servicios Especiales */}
      {serviciosEspeciales.length > 0 && (
        <div style={{ padding: '8px 12px', flexShrink: 0 }}>
          <div style={{ background: '#1a1a2e', border: '2px solid #7c3aed', borderRadius: '12px', padding: '10px 14px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🧪 SERVICIOS ESPECIALES ({serviciosEspeciales.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {serviciosEspeciales.map((s, i) => (
                <div key={i} style={{
                  background: '#1a1a1a', border: '2px solid #7c3aed', borderRadius: '10px',
                  padding: '10px 14px', minWidth: '200px', flex: '1 1 220px', maxWidth: '300px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#c4b5fd' }}>
                      {s.medico?.startsWith('Dr') ? s.medico : 'Dr./Dra. ' + s.medico}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {s.servicios.map((svc: string, j: number) => (
                        <span key={j} style={{
                          background: svc.includes('IHQ') ? '#1e40af' : svc.includes('Giemsa') || svc.includes('PAS') || svc.includes('Masson') ? '#7c3aed' : svc.includes('Prof') ? '#0369a1' : '#475569',
                          color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700
                        }}>{svc}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Pac. #{s.numero} · {s.tejido} · Remito #{s.remitoNumber}</div>
                  {s.fecha && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(s.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
