import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Mic, Square, Save, Trash2, Clock, FileText, Search, Pause, Play, Copy, Check, Loader } from 'lucide-react';
import { DoctorInfo } from '../types';
import { supabase } from '../lib/supabase';

// Endpoint de la Vercel Function que llama a Whisper (OpenAI)
const TRANSCRIBE_API_URL =
  (import.meta.env.VITE_TRANSCRIBE_API_URL as string | undefined) ||
  'https://jclab.vercel.app/api/transcribe';

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
  const [numeroPaciente, setNumeroPaciente] = useState('');
  const [tejido, setTejido] = useState('');
  const [duracion, setDuracion] = useState(0);
  const [guardado, setGuardado] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [supported, setSupported] = useState(true);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const copiarTexto = (texto: string, id?: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(id || 'main');
      setTimeout(() => setCopiado(null), 2000);
    }).catch(() => {
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Verificar soporte (getUserMedia + MediaRecorder)
  useEffect(() => {
    const hasGUM = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasMR = typeof (window as any).MediaRecorder !== 'undefined';
    if (!hasGUM || !hasMR) setSupported(false);
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

  // Liberar recursos al desmontar
  useEffect(() => {
    return () => {
      try { mediaRecorderRef.current?.stop(); } catch {}
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

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

  // Blob → base64 (sin el prefijo "data:...;base64,")
  const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.substring(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  // Enviar audio a Whisper
  const transcribeAudio = async (blob: Blob): Promise<string> => {
    const base64 = await blobToBase64(blob);
    const response = await fetch(TRANSCRIBE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: base64,
        mimeType: blob.type,
        language: 'es',
      }),
    });
    if (!response.ok) {
      let msg = `Error ${response.status}`;
      try { const d = await response.json(); if (d?.error) msg = d.error; } catch {}
      throw new Error(msg);
    }
    const data = await response.json();
    return data.text || '';
  };

  // Iniciar grabación (solicita permiso de micrófono)
  const iniciarGrabacion = async () => {
    if (!numeroPaciente.trim()) return;
    setTranscribeError(null);
    setTranscripcion('');
    setDuracion(0);
    setGuardado(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Elegir mimeType que funcione en el dispositivo
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      let mimeType = '';
      for (const m of candidates) {
        if (typeof (window as any).MediaRecorder?.isTypeSupported === 'function' &&
            (window as any).MediaRecorder.isTypeSupported(m)) {
          mimeType = m;
          break;
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onerror = (e: any) => {
        console.error('MediaRecorder error:', e);
        setTranscribeError('Error grabando audio: ' + (e?.error?.message || 'desconocido'));
        setIsRecording(false);
      };

      recorder.start(1000); // emitir chunk cada 1s (por si corta la conexión, no perdemos todo)
      setIsRecording(true);
      setPaso('grabando');
    } catch (err: any) {
      console.error('getUserMedia error:', err);
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setTranscribeError('Permiso de micrófono denegado. Habilitalo en la configuración del navegador y reintentá.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setTranscribeError('No se encontró un micrófono en este dispositivo.');
      } else {
        setTranscribeError('No se pudo acceder al micrófono: ' + (err?.message || name || 'error desconocido'));
      }
    }
  };

  // Pausar
  const pausarGrabacion = () => {
    try { mediaRecorderRef.current?.pause(); } catch {}
    setIsRecording(false);
    setPaso('pausado');
  };

  // Continuar
  const continuarGrabacion = () => {
    try { mediaRecorderRef.current?.resume(); } catch {}
    setIsRecording(true);
    setPaso('grabando');
  };

  // Finalizar → detener, ensamblar audio, enviar a Whisper, ir a revisión
  const finalizarGrabacion = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setIsRecording(false);
    setIsTranscribing(true);

    // Capturar el chunk final y esperar a que se detenga
    await new Promise<void>((resolve) => {
      recorder.addEventListener('stop', () => resolve(), { once: true });
      try { recorder.stop(); } catch { resolve(); }
    });

    // Liberar micrófono
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    // Ensamblar blob final
    const mimeType = recorder.mimeType || audioChunksRef.current[0]?.type || 'audio/webm';
    const blob = new Blob(audioChunksRef.current, { type: mimeType });

    if (blob.size < 1000) {
      setTranscribeError('Audio demasiado corto. Grabá al menos 1 segundo.');
      setIsTranscribing(false);
      setPaso('numero');
      return;
    }

    try {
      const text = await transcribeAudio(blob);
      setTranscripcion(text);
      setPaso('revision');
    } catch (err: any) {
      console.error('Transcribe error:', err);
      setTranscribeError('Error al transcribir: ' + (err?.message || 'desconocido'));
      setPaso('pausado'); // dejamos pausado para que pueda reintentar
    } finally {
      setIsTranscribing(false);
    }
  };

  // Reintentar transcripción con el último audio grabado (si falló)
  const reintentarTranscripcion = async () => {
    if (audioChunksRef.current.length === 0) return;
    setTranscribeError(null);
    setIsTranscribing(true);
    try {
      const mimeType = mediaRecorderRef.current?.mimeType || audioChunksRef.current[0]?.type || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      const text = await transcribeAudio(blob);
      setTranscripcion(text);
      setPaso('revision');
    } catch (err: any) {
      setTranscribeError('Error al transcribir: ' + (err?.message || 'desconocido'));
    } finally {
      setIsTranscribing(false);
    }
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
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Tu navegador no soporta acceso al micrófono (getUserMedia) o grabación de audio (MediaRecorder).</p>
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
          <button onClick={() => {
            try { mediaRecorderRef.current?.stop(); } catch {}
            streamRef.current?.getTracks().forEach(t => t.stop());
            onGoBack();
          }}
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

      {/* Banner de error */}
      {transcribeError && (
        <div style={{ background: '#991b1b', color: 'white', padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span>⚠️ {transcribeError}</span>
          <button onClick={() => setTranscribeError(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Cerrar</button>
        </div>
      )}

      {/* Overlay de transcripción en curso */}
      {isTranscribing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', padding: '32px 40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #334155' }}>
            <Loader size={48} color="#60a5fa" style={{ animation: 'spin 1.2s linear infinite', marginBottom: '12px' }} />
            <div style={{ color: 'white', fontSize: '16px', fontWeight: 700 }}>Transcribiendo audio...</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>Enviando a Whisper. Tarda unos segundos.</div>
          </div>
        </div>
      )}

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
            {numeroPaciente.trim() ? 'Tocá el micrófono y autorizá el permiso' : 'Ingresá el número de paciente'}
          </p>
        </div>
      ) : paso === 'grabando' ? (
        /* PASO 2: Grabando */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflow: 'hidden' }}>
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

          {/* Placeholder grande mientras graba (Whisper transcribe al finalizar, no en vivo) */}
          <div style={{
            flex: 1, padding: '24px', background: '#1a1a2e', border: '2px solid #ef4444',
            borderRadius: '12px', color: 'white', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px'
          }}>
            <div style={{ fontSize: '64px', animation: 'pulse 1.2s infinite' }}>🎙️</div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>Hablá con claridad</div>
            <div style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '340px', lineHeight: 1.5 }}>
              La transcripción se hace cuando tocás <b>Finalizar</b>. Podés <b>pausar</b> si necesitás una pausa larga.
            </div>
          </div>

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
            flex: 1, padding: '24px', background: '#1e293b', border: '2px solid #f59e0b',
            borderRadius: '12px', color: 'white', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px'
          }}>
            <Pause size={56} color="#f59e0b" />
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Grabación pausada</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', maxWidth: '340px' }}>
              Tocá <b>Continuar</b> para seguir dictando, o <b>Finalizar</b> para transcribir.
            </div>
            {transcribeError && audioChunksRef.current.length > 0 && (
              <button onClick={reintentarTranscripcion} style={{
                marginTop: '8px', padding: '10px 20px', borderRadius: '10px',
                background: '#1e40af', color: 'white', border: 'none', fontSize: '13px',
                fontWeight: 700, cursor: 'pointer'
              }}>Reintentar transcripción</button>
            )}
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

          <textarea
            value={transcripcion}
            onChange={e => setTranscripcion(e.target.value)}
            placeholder="Revisá y corregí la transcripción aquí..."
            style={{
              flex: 1, width: '100%', padding: '16px',
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: '12px', color: 'white', fontSize: '15px', lineHeight: 1.6,
              outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => { setTranscripcion(''); iniciarGrabacion(); }}
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

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DictadoMacroscopia;
