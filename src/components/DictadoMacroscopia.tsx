import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Mic, Square, Save, Trash2, Clock, FileText, Search, Pause, Play, Copy, Check } from 'lucide-react';
import { DoctorInfo } from '../types';
import { supabase } from '../lib/supabase';

interface DictadoMacroscopiaProps {
  doctorInfo: DoctorInfo;
  onGoBack: () => void;
  onGoToNewBiopsy: (numero: string) => void;
}

const DictadoMacroscopia: React.FC<DictadoMacroscopiaProps> = ({ doctorInfo, onGoBack, onGoToNewBiopsy }) => {
  // Estados
  const [paso, setPaso] = useState<'numero' | 'grabando' | 'pausado' | 'revision'>('numero');
  const [isRecording, setIsRecording] = useState(false);
  const [transcripcion, setTranscripcion] = useState('');
  const [interimText, setInterimText] = useState('');
  const [numeroPaciente, setNumeroPaciente] = useState('');
  const [tejido, setTejido] = useState('');
  const [duracion, setDuracion] = useState(0);
  const [guardado, setGuardado] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [supported, setSupported] = useState(true);
  const [copiado, setCopiado] = useState<string | null>(null);

  const copiarTexto = (texto: string, id?: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(id || 'main');
      setTimeout(() => setCopiado(null), 2000);
    }).catch(() => {
      // Fallback para navegadores sin clipboard API
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiado(id || 'main');
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  // Refs
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const shouldRecordRef = useRef(false);

  // Verificar soporte
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-AR';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + ' ';
        } else {
          interim = t;
        }
      }
      if (final) {
        setTranscripcion(prev => prev + final);
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' && shouldRecordRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onend = () => {
      if (shouldRecordRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
  }, []);

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setDuracion(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  // Cargar historial
  const loadHistorial = useCallback(async () => {
    try {
      const { data } = await supabase.from('macroscopia').select('*')
        .eq('doctor_email', doctorInfo.email.toLowerCase().trim())
        .order('created_at', { ascending: false }).limit(50);
      if (data) setHistorial(data);
    } catch {}
  }, [doctorInfo.email]);

  useEffect(() => { loadHistorial(); }, [loadHistorial]);

  // Iniciar grabación
  const iniciarGrabacion = () => {
    if (!recognitionRef.current || !numeroPaciente.trim()) return;
    setTranscripcion('');
    setInterimText('');
    setDuracion(0);
    setGuardado(false);
    shouldRecordRef.current = true;
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setPaso('grabando');
    } catch {}
  };

  // Pausar grabación (sin borrar)
  const pausarGrabacion = () => {
    shouldRecordRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsRecording(false);
    setInterimText('');
    setPaso('pausado');
  };

  // Continuar grabación (sin borrar)
  const continuarGrabacion = () => {
    if (!recognitionRef.current) return;
    shouldRecordRef.current = true;
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setPaso('grabando');
    } catch {}
  };

  // Finalizar grabación → revisión
  const finalizarGrabacion = () => {
    shouldRecordRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsRecording(false);
    setInterimText('');
    setPaso('revision');
  };

  // Guardar y siguiente
  const guardarYSiguiente = async () => {
    if (!transcripcion.trim()) return;
    const doctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
    const doc = doctors.find((d: any) => d.email?.toLowerCase() === doctorInfo.email.toLowerCase());

    try {
      await supabase.from('macroscopia').upsert({
        id: `MAC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        doctor_email: doctorInfo.email.toLowerCase().trim(),
        lab_code: doc?.labCode || '',
        numero_paciente: numeroPaciente.trim(),
        tejido: tejido.trim(),
        transcripcion: transcripcion.trim(),
        duracion_segundos: duracion,
        dictado_por: doctorInfo.cargadoPor || doctorInfo.name,
        hospital: doctorInfo.hospital || '',
        updated_at: new Date().toISOString(),
      });
      setGuardado(true);
      loadHistorial();

      // Ir a nueva biopsia con número precargado
      setTimeout(() => {
        onGoToNewBiopsy(numeroPaciente.trim());
      }, 800);
    } catch (e) {
      console.error('Error guardando:', e);
      alert('Error al guardar. Verificá la conexión.');
    }
  };

  const cargarDictado = (item: any) => {
    setTranscripcion(item.transcripcion || '');
    setNumeroPaciente(item.numero_paciente || '');
    setTejido(item.tejido || '');
    setDuracion(item.duracion_segundos || 0);
    setPaso('revision');
    setShowHistorial(false);
  };

  const eliminarDictado = async (id: string) => {
    if (!confirm('¿Eliminar esta transcripción?')) return;
    try {
      await supabase.from('macroscopia').delete().eq('id', id);
      setHistorial(prev => prev.filter(h => h.id !== id));
      loadHistorial();
    } catch {}
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const filteredHistorial = searchQuery
    ? historial.filter(h =>
        (h.numero_paciente || '').includes(searchQuery) ||
        (h.tejido || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.transcripcion || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : historial;

  if (!supported) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎙️</div>
          <h2 style={{ color: 'white', marginBottom: '8px' }}>Dictado no disponible</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Este navegador no soporta reconocimiento de voz. Usá Google Chrome.</p>
          <button onClick={onGoBack} style={{ marginTop: '16px', padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
        padding: '10px 16px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { shouldRecordRef.current = false; if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {} onGoBack(); }}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} color="white" />
          </button>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>Dictado de Macroscopía</h1>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Dr./Dra. {doctorInfo.name} {doctorInfo.hospital ? `— ${doctorInfo.hospital}` : ''}
            </p>
          </div>
        </div>
        <button onClick={() => { setShowHistorial(!showHistorial); if (!showHistorial) loadHistorial(); }}
          style={{ background: showHistorial ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '12px', fontWeight: 600 }}>
          <FileText size={14} /> Historial
        </button>
      </div>

      {showHistorial ? (
        /* HISTORIAL */
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <div style={{ marginBottom: '12px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por paciente, tejido o texto..."
              style={{ width: '100%', padding: '8px 8px 8px 32px', border: '1px solid #334155', borderRadius: '8px', background: '#1e293b', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {filteredHistorial.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <p>No hay transcripciones</p>
            </div>
          ) : filteredHistorial.map(item => (
            <div key={item.id} style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '12px', marginBottom: '8px', cursor: 'pointer' }}
              onClick={() => cargarDictado(item)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: '14px' }}>#{item.numero_paciente || 'S/N'}</span>
                  {item.tejido && <span style={{ fontSize: '12px', color: '#94a3b8', background: '#0f172a', padding: '2px 8px', borderRadius: '4px' }}>{item.tejido}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{new Date(item.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} {formatTime(item.duracion_segundos || 0)}</span>
                  <button onClick={(e) => { e.stopPropagation(); copiarTexto(item.transcripcion, item.id); }}
                    style={{ background: copiado === item.id ? '#059669' : '#1e3a5f', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', transition: 'background 0.3s' }}>
                    {copiado === item.id ? <Check size={12} color="white" /> : <Copy size={12} color="#60a5fa" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); eliminarDictado(item.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                {item.transcripcion}
              </p>
            </div>
          ))}
        </div>
      ) : paso === 'numero' ? (
        /* PASO 1: Número de paciente */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '24px' }}>
          {guardado && (
            <div style={{ background: '#059669', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '16px', animation: 'pulse 1s' }}>
              ✓ Guardado correctamente
            </div>
          )}
          <div style={{ fontSize: '48px' }}>🎙️</div>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0, textAlign: 'center' }}>
            Número de paciente
          </h2>
          <input
            type="text"
            value={numeroPaciente}
            onChange={e => setNumeroPaciente(e.target.value)}
            placeholder="Ej: 14"
            style={{
              width: '200px', padding: '16px', textAlign: 'center',
              background: '#1e293b', border: '2px solid #334155', borderRadius: '12px',
              color: 'white', fontSize: '32px', fontWeight: 800, outline: 'none',
              fontFamily: 'monospace'
            }}
          />
          <input
            type="text"
            value={tejido}
            onChange={e => setTejido(e.target.value)}
            placeholder="Tejido (opcional)"
            style={{
              width: '250px', padding: '12px', textAlign: 'center',
              background: '#1e293b', border: '1px solid #334155', borderRadius: '10px',
              color: 'white', fontSize: '16px', outline: 'none'
            }}
          />
          <button
            onClick={iniciarGrabacion}
            disabled={!numeroPaciente.trim()}
            style={{
              width: '120px', height: '120px', borderRadius: '50%',
              background: numeroPaciente.trim() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#334155',
              border: 'none', cursor: numeroPaciente.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: numeroPaciente.trim() ? '0 0 40px rgba(34,197,94,0.4)' : 'none',
              transition: 'all 0.3s'
            }}>
            <Mic size={48} color="white" />
          </button>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            {numeroPaciente.trim() ? 'Tocá el micrófono para empezar a dictar' : 'Ingresá el número de paciente'}
          </p>
        </div>
      ) : paso === 'grabando' ? (
        /* PASO 2: Grabando */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflow: 'hidden' }}>
          {/* Info paciente */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 800 }}>Pac. #{numeroPaciente}</span>
              {tejido && <span style={{ color: '#94a3b8', fontSize: '14px', background: '#1e293b', padding: '4px 10px', borderRadius: '6px' }}>{tejido}</span>}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(239,68,68,0.9)', padding: '6px 14px',
              borderRadius: '20px', animation: 'pulse 1.5s infinite'
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />
              <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>GRABANDO {formatTime(duracion)}</span>
            </div>
          </div>

          {/* Transcripción en vivo */}
          <div style={{
            flex: 1, padding: '16px', background: '#1a1a2e', border: '2px solid #ef4444',
            borderRadius: '12px', color: 'white', fontSize: '16px', lineHeight: 1.7,
            overflow: 'auto', minHeight: 0
          }}>
            {transcripcion}
            {interimText && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{interimText}</span>}
            {!transcripcion && !interimText && (
              <span style={{ color: '#475569' }}>Escuchando... hablá claro y pausado.</span>
            )}
          </div>

          {/* Botones: Pausar + Finalizar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexShrink: 0, padding: '8px 0' }}>
            <button onClick={pausarGrabacion} style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245,158,11,0.3)'
            }}>
              <Pause size={32} color="white" fill="white" />
            </button>
            <button onClick={finalizarGrabacion} style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(239,68,68,0.3)'
            }}>
              <Square size={32} color="white" fill="white" />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexShrink: 0 }}>
            <p style={{ color: '#f59e0b', fontSize: '11px', margin: 0, fontWeight: 600 }}>Pausar</p>
            <p style={{ color: '#ef4444', fontSize: '11px', margin: 0, fontWeight: 600 }}>Finalizar</p>
          </div>
        </div>
      ) : paso === 'pausado' ? (
        /* PASO 2b: Pausado */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 800 }}>Pac. #{numeroPaciente}</span>
              {tejido && <span style={{ color: '#94a3b8', fontSize: '14px', background: '#1e293b', padding: '4px 10px', borderRadius: '6px' }}>{tejido}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.9)', padding: '6px 14px', borderRadius: '20px' }}>
              <Pause size={12} color="white" />
              <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>PAUSADO {formatTime(duracion)}</span>
            </div>
          </div>

          <div style={{
            flex: 1, padding: '16px', background: '#1e293b', border: '2px solid #f59e0b',
            borderRadius: '12px', color: 'white', fontSize: '16px', lineHeight: 1.7, overflow: 'auto', minHeight: 0
          }}>
            {transcripcion || <span style={{ color: '#475569' }}>Sin transcripción aún</span>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexShrink: 0, padding: '8px 0' }}>
            <button onClick={continuarGrabacion} style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(34,197,94,0.4)'
            }}>
              <Play size={44} color="white" fill="white" />
            </button>
            <button onClick={finalizarGrabacion} style={{
              width: '80px', height: '80px', borderRadius: '50%', alignSelf: 'center',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(239,68,68,0.3)'
            }}>
              <Square size={32} color="white" fill="white" />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', flexShrink: 0 }}>
            <p style={{ color: '#22c55e', fontSize: '12px', margin: 0, fontWeight: 600 }}>Continuar</p>
            <p style={{ color: '#ef4444', fontSize: '12px', margin: 0, fontWeight: 600 }}>Finalizar</p>
          </div>
        </div>
      ) : (
        /* PASO 3: Revisión */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 800 }}>Pac. #{numeroPaciente}</span>
              {tejido && <span style={{ color: '#94a3b8', fontSize: '14px', background: '#1e293b', padding: '4px 10px', borderRadius: '6px' }}>{tejido}</span>}
            </div>
            <span style={{ color: '#64748b', fontSize: '12px' }}><Clock size={12} style={{ verticalAlign: 'middle' }} /> {formatTime(duracion)}</span>
          </div>

          {/* Transcripción editable */}
          <textarea
            value={transcripcion}
            onChange={e => setTranscripcion(e.target.value)}
            style={{
              flex: 1, width: '100%', padding: '16px',
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: '12px', color: 'white', fontSize: '15px', lineHeight: 1.6,
              outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
            }}
          />

          {/* Botones */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => { setTranscripcion(''); setPaso('grabando'); iniciarGrabacion(); }}
              style={{ padding: '14px', borderRadius: '10px', background: '#334155', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mic size={14} /> Redictar
            </button>
            <button onClick={() => copiarTexto(transcripcion)}
              disabled={!transcripcion.trim()}
              style={{ padding: '14px', borderRadius: '10px', background: copiado === 'main' ? '#059669' : '#1e40af', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.3s' }}>
              {copiado === 'main' ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
            </button>
            <button onClick={guardarYSiguiente}
              disabled={!transcripcion.trim()}
              style={{
                flex: 1, padding: '14px', borderRadius: '10px', border: 'none',
                background: transcripcion.trim() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#334155',
                color: 'white', fontSize: '15px', fontWeight: 700, cursor: transcripcion.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: transcripcion.trim() ? '0 4px 20px rgba(34,197,94,0.3)' : 'none'
              }}>
              <Save size={16} /> Guardar
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }`}</style>
    </div>
  );
};

export default DictadoMacroscopia;
