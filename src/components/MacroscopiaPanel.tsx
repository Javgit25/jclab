import React, { useState, useEffect, useCallback } from 'react';
import { Search, Copy, Check, FileText, Calendar, Clock, ArrowLeft, LogIn, Mic, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/database';

interface MacroscopiaPanelProps {
  labCode: string;
  onGoBack?: () => void;
}

const MacroscopiaPanel: React.FC<MacroscopiaPanelProps> = ({ labCode, onGoBack }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [transcripciones, setTranscripciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [copiado, setCopiado] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [labNombre, setLabNombre] = useState('');

  // Cargar nombre del lab
  useEffect(() => {
    const loadLabName = async () => {
      try {
        const labs = await db.getLabs();
        const lab = labs.find((l: any) => l.labCode === labCode);
        if (lab) setLabNombre(lab.nombre || '');
      } catch {}
    };
    loadLabName();
  }, [labCode]);

  // Login
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setLoginError('Completá email y contraseña'); return; }
    try {
      const doctors = await db.getDoctors();
      const doc = doctors.find((d: any) =>
        d.email.toLowerCase() === email.toLowerCase().trim() &&
        d.labCode === labCode
      );
      if (!doc) { setLoginError('Email no registrado en este laboratorio'); return; }
      if (doc.password !== password) { setLoginError('Contraseña incorrecta'); return; }
      setDoctorName(`${doc.firstName} ${doc.lastName}`);
      setIsLoggedIn(true);
      setLoginError('');
      loadTranscripciones(email.toLowerCase().trim());
    } catch { setLoginError('Error de conexión'); }
  };

  // Cargar transcripciones
  const loadTranscripciones = useCallback(async (doctorEmail: string) => {
    setLoading(true);
    try {
      let query = supabase.from('macroscopia').select('*')
        .eq('doctor_email', doctorEmail)
        .order('created_at', { ascending: false });
      const { data } = await query;
      if (data) setTranscripciones(data);
    } catch {}
    setLoading(false);
  }, []);

  // Copiar
  const copiarTexto = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(id);
      setTimeout(() => setCopiado(null), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiado(id);
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  // Guardar edición
  const guardarEdicion = async (id: string) => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await supabase.from('macroscopia').update({ transcripcion: editText.trim(), updated_at: new Date().toISOString() }).eq('id', id);
      setTranscripciones(prev => prev.map(t => t.id === id ? { ...t, transcripcion: editText.trim() } : t));
      setSaving(false);
      setTimeout(() => setSaving(false), 1500);
    } catch { setSaving(false); alert('Error al guardar'); }
  };

  // Eliminar
  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta transcripción?')) return;
    try {
      await supabase.from('macroscopia').delete().eq('id', id);
      setTranscripciones(prev => prev.filter(t => t.id !== id));
    } catch {}
  };

  // Filtros
  const filtered = transcripciones.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = (t.numero_paciente || '').toLowerCase().includes(q);
      const matchTejido = (t.tejido || '').toLowerCase().includes(q);
      const matchTexto = (t.transcripcion || '').toLowerCase().includes(q);
      if (!matchNum && !matchTejido && !matchTexto) return false;
    }
    if (dateFrom) {
      const d = new Date(t.created_at).toISOString().split('T')[0];
      if (d < dateFrom) return false;
    }
    if (dateTo) {
      const d = new Date(t.created_at).toISOString().split('T')[0];
      if (d > dateTo) return false;
    }
    return true;
  });

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Login screen
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎙️</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Macroscopía</h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Acceso a transcripciones de dictado</p>
            {labNombre && <p style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, margin: '8px 0 0' }}>{labNombre}</p>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Email</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="tu@email.com"
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Contraseña</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Tu contraseña"
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {loginError && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0, textAlign: 'center' }}>{loginError}</p>}
            <button onClick={handleLogin}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <LogIn size={18} /> Ingresar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Panel principal
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)', padding: '16px 24px', color: 'white' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onGoBack && (
              <button onClick={onGoBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                <ArrowLeft size={18} color="white" />
              </button>
            )}
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={20} /> Macroscopía
              </h1>
              <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0' }}>
                Dr./Dra. {doctorName} {labNombre ? `— ${labNombre}` : ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>{filtered.length} transcripciones</span>
            <button onClick={() => { setIsLoggedIn(false); setEmail(''); setPassword(''); }}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600 }}>
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por N° paciente, tejido o texto..."
              style={{ width: '100%', padding: '10px 10px 10px 38px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={14} color="#94a3b8" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>a</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
          </div>
          {(searchQuery || dateFrom || dateTo) && (
            <button onClick={() => { setSearchQuery(''); setDateFrom(''); setDateTo(''); }}
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Listado */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px 24px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ color: '#64748b', margin: '0 0 4px' }}>
              {searchQuery || dateFrom || dateTo ? 'No se encontraron resultados' : 'No hay transcripciones'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              {searchQuery || dateFrom || dateTo ? 'Probá con otros filtros' : 'Las transcripciones dictadas aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(t => {
              const isExpanded = expandedId === t.id;
              return (
                <div key={t.id} style={{
                  background: 'white', borderRadius: '12px',
                  border: isExpanded ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  boxShadow: isExpanded ? '0 4px 12px rgba(37,99,235,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: 'hidden', transition: 'all 0.2s'
                }}>
                  {/* Header clickeable */}
                  <div onClick={() => { if (!isExpanded) setEditText(t.transcripcion); setExpandedId(isExpanded ? null : t.id); }}
                    style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎙️</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Paciente #{t.numero_paciente || 'S/N'}</span>
                          {t.tejido && <span style={{ fontSize: '12px', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{t.tejido}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '12px', color: '#94a3b8' }}>
                          <span>{new Date(t.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                          <span>·</span>
                          <span><Clock size={11} style={{ verticalAlign: 'middle' }} /> {formatTime(t.duracion_segundos || 0)}</span>
                          {t.dictado_por && <><span>·</span><span>Por: {t.dictado_por}</span></>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); copiarTexto(t.transcripcion, t.id); }}
                        style={{
                          padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                          background: copiado === t.id ? '#059669' : '#2563eb', color: 'white',
                          fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                          transition: 'background 0.3s'
                        }}>
                        {copiado === t.id ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                      </button>
                      {isExpanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                    </div>
                  </div>

                  {/* Preview (siempre visible) */}
                  {!isExpanded && (
                    <div style={{ padding: '0 20px 12px', marginTop: '-4px' }}>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        {t.transcripcion}
                      </p>
                    </div>
                  )}

                  {/* Expandido — editable */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px' }}>
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        style={{
                          width: '100%', minHeight: '200px', maxHeight: '400px',
                          background: '#f8fafc', borderRadius: '10px', padding: '16px',
                          border: '1px solid #e2e8f0', fontSize: '14px', color: '#1e293b',
                          lineHeight: 1.8, resize: 'vertical', fontFamily: 'inherit',
                          outline: 'none', boxSizing: 'border-box'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {t.hospital && <span>{t.hospital} · </span>}
                          {t.remito_number && <span>Remito #{t.remito_number} · </span>}
                          Creado: {new Date(t.created_at).toLocaleString('es-AR')}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {editText !== t.transcripcion && (
                            <button onClick={() => guardarEdicion(t.id)}
                              style={{ background: '#059669', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '12px', fontWeight: 600 }}>
                              {saving ? 'Guardando...' : <><Save size={12} /> Guardar cambios</>}
                            </button>
                          )}
                          <button onClick={() => eliminar(t.id)}
                            style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px' }}>
                            <Trash2 size={12} /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MacroscopiaPanel;
