import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Mic, MicOff, Save, Trash2, Clock, FileText, Search } from 'lucide-react';
import { DoctorInfo } from '../types';
import { supabase } from '../lib/supabase';

interface DictadoMacroscopiaProps {
  doctorInfo: DoctorInfo;
  onGoBack: () => void;
}

const DictadoMacroscopia: React.FC<DictadoMacroscopiaProps> = ({ doctorInfo, onGoBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripcion, setTranscripcion] = useState('');
  const [interimText, setInterimText] = useState('');
  const [numeroPaciente, setNumeroPaciente] = useState('');
  const [tejido, setTejido] = useState('');
  const [remitoNumber, setRemitoNumber] = useState('');
  const [duracion, setDuracion] = useState(0);
  const [guardado, setGuardado] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Verificar soporte de Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-AR';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim = transcript;
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
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // Reiniciar si se cortó
        if (isRecording) {
          try { recognition.start(); } catch {}
        }
      }
    };

    recognition.onend = () => {
      // Si sigue grabando, reiniciar (Chrome corta cada ~60 seg)
      if (isRecording) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
  }, [isRecording]);

  // Timer de duración
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
      const email = doctorInfo.email.toLowerCase().trim();
      const { data } = await supabase.from('macroscopia').select('*')
        .eq('doctor_email', email)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setHistorial(data);
    } catch {}
  }, [doctorInfo.email]);

  useEffect(() => { loadHistorial(); }, [loadHistorial]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setInterimText('');
    } else {
      setGuardado(false);
      setDuracion(0);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  };

  const guardarTranscripcion = async () => {
    if (!transcripcion.trim()) return;
    const doctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
    const doc = doctors.find((d: any) => d.email?.toLowerCase() === doctorInfo.email.toLowerCase());

    const registro = {
      id: editingId || `MAC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      doctor_email: doctorInfo.email.toLowerCase().trim(),
      lab_code: doc?.labCode || '',
      numero_paciente: numeroPaciente.trim(),
      tejido: tejido.trim(),
      remito_number: remitoNumber.trim(),
      transcripcion: transcripcion.trim(),
      duracion_segundos: duracion,
      dictado_por: doctorInfo.cargadoPor || doctorInfo.name,
      hospital: doctorInfo.hospital || '',
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('macroscopia').upsert(registro);
      setGuardado(true);
      setEditingId(registro.id);
      loadHistorial();
    } catch (e) {
      console.error('Error guardando macroscopía:', e);
      alert('Error al guardar. Verificá la conexión.');
    }
  };

  const nuevoDictado = () => {
    setTranscripcion('');
    setInterimText('');
    setNumeroPaciente('');
    setTejido('');
    setRemitoNumber('');
    setDuracion(0);
    setGuardado(false);
    setEditingId(null);
    setIsRecording(false);
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
  };

  const cargarDictado = (item: any) => {
    setTranscripcion(item.transcripcion || '');
    setNumeroPaciente(item.numero_paciente || '');
    setTejido(item.tejido || '');
    setRemitoNumber(item.remito_number || '');
    setDuracion(item.duracion_segundos || 0);
    setEditingId(item.id);
    setGuardado(true);
    setShowHistorial(false);
  };

  const eliminarDictado = async (id: string) => {
    if (!confirm('¿Eliminar esta transcripción?')) return;
    try {
      await supabase.from('macroscopia').delete().eq('id', id);
      setHistorial(prev => prev.filter(h => h.id !== id));
      if (editingId === id) nuevoDictado();
    } catch {}
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredHistorial = searchQuery
    ? historial.filter(h =>
        (h.numero_paciente || '').includes(searchQuery) ||
        (h.tejido || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.transcripcion || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : historial;

  if (!supported) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎙️</div>
          <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Dictado no disponible</h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Este navegador no soporta reconocimiento de voz. Usá Google Chrome o un navegador compatible.</p>
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
          <button onClick={onGoBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} color="white" />
          </button>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>Dictado de Macroscopía</h1>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Dr./Dra. {doctorInfo.name} {doctorInfo.hospital ? `— ${doctorInfo.hospital}` : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setShowHistorial(!showHistorial); if (!showHistorial) loadHistorial(); }}
            style={{ background: showHistorial ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '12px', fontWeight: 600 }}>
            <FileText size={14} /> Historial
          </button>
        </div>
      </div>

      {showHistorial ? (
        /* Historial de transcripciones */
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por paciente, tejido o texto..."
                style={{ width: '100%', padding: '8px 8px 8px 32px', border: '1px solid #334155', borderRadius: '8px', background: '#1e293b', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          {filteredHistorial.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <p style={{ fontSize: '14px' }}>No hay transcripciones guardadas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredHistorial.map(item => (
                <div key={item.id} style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '12px', cursor: 'pointer' }}
                  onClick={() => cargarDictado(item)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: '14px' }}>#{item.numero_paciente || 'S/N'}</span>
                      {item.tejido && <span style={{ fontSize: '12px', color: '#94a3b8', background: '#0f172a', padding: '2px 8px', borderRadius: '4px' }}>{item.tejido}</span>}
                      {item.remito_number && <span style={{ fontSize: '11px', color: '#64748b' }}>R#{item.remito_number}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {new Date(item.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        {' '}{new Date(item.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); eliminarDictado(item.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.4,
                    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                    {item.transcripcion}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '10px', color: '#475569' }}>
                    <span><Clock size={10} style={{ verticalAlign: 'middle' }} /> {formatTime(item.duracion_segundos || 0)}</span>
                    {item.dictado_por && <span>Por: {item.dictado_por}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Pantalla de dictado */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflow: 'hidden' }}>
          {/* Datos del paciente */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <input type="text" value={numeroPaciente} onChange={e => setNumeroPaciente(e.target.value)}
              placeholder="N° Paciente"
              style={{ flex: 1, padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: 700, outline: 'none' }} />
            <input type="text" value={tejido} onChange={e => setTejido(e.target.value)}
              placeholder="Tejido"
              style={{ flex: 1, padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }} />
            <input type="text" value={remitoNumber} onChange={e => setRemitoNumber(e.target.value)}
              placeholder="Remito"
              style={{ width: '80px', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }} />
          </div>

          {/* Área de transcripción */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <textarea
              ref={textareaRef}
              value={transcripcion + interimText}
              onChange={e => { if (!isRecording) setTranscripcion(e.target.value); }}
              readOnly={isRecording}
              placeholder={isRecording ? 'Escuchando...' : 'La transcripción aparecerá aquí. Tocá el micrófono para empezar a dictar.'}
              style={{
                flex: 1, width: '100%', padding: '16px',
                background: isRecording ? '#1a1a2e' : '#1e293b',
                border: isRecording ? '2px solid #ef4444' : '1px solid #334155',
                borderRadius: '12px', color: 'white', fontSize: '15px', lineHeight: 1.6,
                outline: 'none', resize: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s, background 0.3s'
              }}
            />
            {/* Indicador de grabación */}
            {isRecording && (
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(239,68,68,0.9)', padding: '4px 12px',
                borderRadius: '20px', animation: 'pulse 1.5s infinite'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>GRABANDO {formatTime(duracion)}</span>
              </div>
            )}
          </div>

          {/* Controles */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
            {/* Botón de micrófono GRANDE */}
            <button onClick={toggleRecording} style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: isRecording ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isRecording ? '0 0 20px rgba(239,68,68,0.4)' : '0 0 20px rgba(34,197,94,0.3)',
              transition: 'all 0.3s', flexShrink: 0
            }}>
              {isRecording ? <MicOff size={28} color="white" /> : <Mic size={28} color="white" />}
            </button>

            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
              <button onClick={guardarTranscripcion}
                disabled={!transcripcion.trim()}
                style={{
                  flex: 1, padding: '14px', borderRadius: '10px', border: 'none',
                  background: guardado ? '#059669' : transcripcion.trim() ? '#2563eb' : '#334155',
                  color: 'white', fontSize: '14px', fontWeight: 700, cursor: transcripcion.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'background 0.3s'
                }}>
                <Save size={16} /> {guardado ? 'Guardado' : 'Guardar'}
              </button>
              <button onClick={nuevoDictado}
                style={{
                  padding: '14px 20px', borderRadius: '10px',
                  background: '#334155', border: 'none', color: 'white',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                + Nuevo
              </button>
            </div>
          </div>

          {/* Info */}
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#475569', flexShrink: 0 }}>
            {isRecording ? 'Hablá claro y pausado. Se transcribe en tiempo real.' : guardado ? 'Transcripción guardada en la nube.' : 'Tocá el micrófono verde para empezar a dictar.'}
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default DictadoMacroscopia;
