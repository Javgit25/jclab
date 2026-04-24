import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Users, DollarSign, Plus, Edit, Trash2, CheckCircle, XCircle, Search, Settings, AlertTriangle, ChevronDown, ChevronUp, Save, Mail, FileText, Eye } from 'lucide-react';
import { db } from '../lib/database';

interface SuperAdminPanelProps {
  onGoBack: () => void;
}

interface Laboratory {
  id: string;
  labCode: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  estado: 'activo' | 'suspendido' | 'vencido';
  fechaAlta: string;
  fechaVencimiento: string;
  medicosActivos: number;
  logoUrl?: string;
  adminUser: string;
  adminPassword: string;
  historialPagos: { fecha: string; monto: number; meses: number; metodo?: string }[];
  emailjsConfig?: { serviceId: string; templateId: string; publicKey: string };
}

interface AppConfig {
  precioMedico: number;
  appNombre: string;
  appVersion: string;
  soporteTelefono: string;
  soporteEmail: string;
}

const defaultConfig: AppConfig = {
  precioMedico: 35000,
  appNombre: 'BiopsyTracker',
  appVersion: '2.5.0',
  soporteTelefono: '',
  soporteEmail: 'support@biopsytracker.com'
};

// Sync reads from localStorage for fast initial render (cache)
const getConfigSync = (): AppConfig => {
  try { return { ...defaultConfig, ...JSON.parse(localStorage.getItem('superAdmin_config') || '{}') }; }
  catch { return defaultConfig; }
};
const getLabsSync = (): Laboratory[] => {
  try { return JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]'); } catch { return []; }
};
const getDoctorsSync = (): any[] => {
  try { return JSON.parse(localStorage.getItem('registeredDoctors') || '[]'); } catch { return []; }
};
const getRemitosCountSync = (): number => {
  try { return JSON.parse(localStorage.getItem('adminRemitos') || '[]').length; } catch { return 0; }
};

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ onGoBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [labs, setLabs] = useState<Laboratory[]>(getLabsSync());
  const [config, setConfig] = useState<AppConfig>(getConfigSync());
  const [allDoctorsState, setAllDoctorsState] = useState<any[]>(getDoctorsSync());
  const [allRemitosState, setAllRemitosState] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('adminRemitos') || '[]'); } catch { return []; }
  });
  const [remitosCount, setRemitosCount] = useState<number>(getRemitosCountSync());
  const [currentView, setCurrentView] = useState<'dashboard' | 'config'>('dashboard');
  const [expandedLab, setExpandedLab] = useState<string | null>(null);
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState<Laboratory | null>(null);
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewMetodo, setRenewMetodo] = useState('transferencia');
  const [searchTerm, setSearchTerm] = useState('');
  const [newLab, setNewLab] = useState({ nombre: '', direccion: '', telefono: '', email: '' });

  // Load data from Supabase on mount (async), overriding localStorage cache
  useEffect(() => {
    const loadFromDb = async () => {
      try {
        const [dbLabs, dbConfig, dbDoctors, dbRemitos] = await Promise.all([
          db.getLabs(),
          db.getAppConfig(),
          db.getDoctors(),
          db.getRemitos(),
        ]);
        if (dbLabs) setLabs(dbLabs);
        if (dbConfig && Object.keys(dbConfig).length > 0) setConfig({ ...defaultConfig, ...dbConfig });
        if (dbDoctors) setAllDoctorsState(dbDoctors);
        if (dbRemitos) { setAllRemitosState(dbRemitos); setRemitosCount(dbRemitos.length); }
      } catch (e) {
        console.error('Error loading from database:', e);
      }
    };
    loadFromDb();
  }, []);

  // Auto-vencimiento
  useEffect(() => {
    let changed = false;
    const updated = labs.map(lab => {
      if (lab.estado === 'suspendido') return lab;
      if (new Date(lab.fechaVencimiento) < new Date() && lab.estado !== 'vencido') {
        changed = true;
        return { ...lab, estado: 'vencido' as const };
      }
      return lab;
    });
    if (changed) { setLabs(updated); db.saveLabs(updated); }
  }, [labs]);

  const handleLogin = () => {
    if (password === 'superadmin2025') setIsAuthenticated(true);
    else alert('Contraseña incorrecta');
  };

  const addLaboratory = () => {
    if (!newLab.nombre.trim()) { alert('Ingrese nombre'); return; }
    const venc = new Date(); venc.setMonth(venc.getMonth() + 1);
    // Generar código único de 6 caracteres alfanuméricos
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const lab: Laboratory = {
      id: `LAB_${Date.now()}`, labCode: code, ...newLab,
      estado: 'activo', fechaAlta: new Date().toISOString(),
      fechaVencimiento: venc.toISOString(), medicosActivos: 0,
      adminUser: 'admin', adminPassword: 'admin123',
      historialPagos: [{ fecha: new Date().toISOString(), monto: 0, meses: 1, metodo: 'Primer mes gratis' }]
    };
    const updated = [...labs, lab];
    setLabs(updated); db.saveLab(lab);
    setNewLab({ nombre: '', direccion: '', telefono: '', email: '' });
    setShowAddModal(false);
  };

  const updateLab = (id: string, data: Partial<Laboratory>) => {
    const updated = labs.map(l => l.id === id ? { ...l, ...data } : l);
    setLabs(updated);
    const updatedLab = updated.find(l => l.id === id);
    if (updatedLab) db.saveLab(updatedLab);
  };

  const renewSubscription = (lab: Laboratory) => {
    const monto = lab.medicosActivos * config.precioMedico * renewMonths;
    const base = new Date(lab.fechaVencimiento) > new Date() ? new Date(lab.fechaVencimiento) : new Date();
    base.setMonth(base.getMonth() + renewMonths);
    const updated = labs.map(l => l.id === lab.id ? {
      ...l, estado: 'activo' as const, fechaVencimiento: base.toISOString(),
      historialPagos: [...(l.historialPagos || []), { fecha: new Date().toISOString(), monto, meses: renewMonths, metodo: renewMetodo }]
    } : l);
    setLabs(updated);
    const renewedLab = updated.find(l => l.id === lab.id);
    if (renewedLab) db.saveLab(renewedLab);
    setShowRenewModal(null);
  };

  const deleteLab = (id: string) => {
    if (!confirm('¿Eliminar laboratorio? No se puede deshacer.')) return;
    const updated = labs.filter(l => l.id !== id);
    setLabs(updated); db.deleteLab(id);
  };

  const getDays = (fecha: string) => Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);

  // Métricas
  const activeLabs = labs.filter(l => l.estado === 'activo').length;
  const vencidos = labs.filter(l => l.estado === 'vencido').length;
  const allDoctors = allDoctorsState;
  const totalRevenue = labs.filter(l => l.estado === 'activo').reduce((s, l) => {
    const docs = allDoctorsState.filter((d: any) => d.labCode === l.labCode && d.active !== false).length;
    return s + docs * config.precioMedico;
  }, 0);
  const totalRemitos = remitosCount;

  const filtered = labs.filter(l => l.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || l.email.toLowerCase().includes(searchTerm.toLowerCase()));

  // Login
  if (!isAuthenticated) {
    return (
      <div style={{ height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', width: '360px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔐</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>Super Admin</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>Centro de control — {config.appNombre}</p>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Contraseña" autoFocus
            style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' }} />
          <button onClick={handleLogin} style={{ width: '100%', padding: '12px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Ingresar</button>
          <button onClick={onGoBack} style={{ width: '100%', padding: '8px', background: 'none', color: '#94a3b8', border: 'none', fontSize: '12px', cursor: 'pointer', marginTop: '8px' }}>← Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '12px 20px', color: 'white', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🏢</span>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>{config.appNombre} — Super Admin</h1>
            <p style={{ fontSize: '9px', opacity: 0.5, margin: 0 }}>v{config.appVersion} · Centro de control</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setCurrentView(currentView === 'config' ? 'dashboard' : 'config')}
            style={{ background: currentView === 'config' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
            <Settings size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {currentView === 'config' ? 'Dashboard' : 'Configuración'}
          </button>
          <button onClick={onGoBack} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Salir</button>
        </div>
      </div>

      {/* Configuración Global */}
      {currentView === 'config' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Configuración Global de la APP</h2>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Nombre de la APP', key: 'appNombre', value: config.appNombre },
              { label: 'Versión', key: 'appVersion', value: config.appVersion },
              { label: 'Email de soporte', key: 'soporteEmail', value: config.soporteEmail },
              { label: 'Teléfono de soporte', key: 'soporteTelefono', value: config.soporteTelefono },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                <input type="text" defaultValue={f.value}
                  onBlur={(e) => { const c = { ...config, [f.key]: e.target.value }; setConfig(c); db.saveAppConfig(c); }}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio por médico (mensual)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '700', color: '#64748b' }}>$</span>
                <input type="number" value={config.precioMedico}
                  onChange={(e) => { const c = { ...config, precioMedico: Number(e.target.value) }; setConfig(c); db.saveAppConfig(c); }}
                  style={{ width: '200px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', fontWeight: '700' }} />
              </div>
            </div>
          </div>
          <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>Los cambios se guardan automáticamente y se reflejan en todos los paneles.</p>
        </div>
      )}

      {/* Dashboard */}
      {currentView === 'dashboard' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Alerta vencidos */}
          {vencidos > 0 && (
            <div style={{ margin: '10px 20px 0', background: '#dc2626', color: 'white', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600' }}>
              <AlertTriangle size={16} /> {vencidos} laboratorio{vencidos > 1 ? 's' : ''} con suscripción vencida
            </div>
          )}

          {/* KPIs */}
          <div style={{ padding: '10px 20px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', flexShrink: 0 }}>
            {[
              { label: 'Labs', value: labs.length, sub: activeLabs + ' activos', bg: '#1e40af' },
              { label: 'Médicos', value: allDoctors.length, sub: 'registrados', bg: '#059669' },
              { label: 'Remitos', value: totalRemitos, sub: 'en sistema', bg: '#0369a1' },
              { label: 'Ingreso/mes', value: '$' + totalRevenue.toLocaleString(), sub: 'estimado', bg: '#0f172a' },
              { label: '$/médico', value: '$' + config.precioMedico.toLocaleString(), sub: 'mensual', bg: '#7c3aed' },
              { label: 'Vencidos', value: vencidos, sub: vencidos > 0 ? 'atención!' : 'OK', bg: vencidos > 0 ? '#dc2626' : '#059669' }
            ].map((k, i) => (
              <div key={i} style={{ backgroundColor: k.bg, borderRadius: '10px', padding: '10px', color: 'white' }}>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{k.value}</div>
                <div style={{ fontSize: '10px', fontWeight: '600', opacity: 0.9 }}>{k.label}</div>
                <div style={{ fontSize: '8px', opacity: 0.6 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ padding: '0 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={13} color="#94a3b8" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..." style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px', width: '200px' }} />
            </div>
            <button onClick={() => setShowAddModal(true)} style={{ background: '#1e40af', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={13} /> Nuevo Lab
            </button>
          </div>

          {/* Lista de laboratorios */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(lab => {
                const dias = getDays(lab.fechaVencimiento);
                const isExpanded = expandedLab === lab.id;
                const doctors = lab.labCode ? allDoctorsState.filter((d: any) => d.labCode === lab.labCode) : allDoctorsState;
                const medicosReales = doctors.filter((d: any) => d.active !== false).length;
                const mensual = medicosReales * config.precioMedico;

                return (
                  <div key={lab.id} style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {/* Fila principal */}
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                      onClick={() => setExpandedLab(isExpanded ? null : lab.id)}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: lab.estado === 'activo' ? '#1e40af' : lab.estado === 'vencido' ? '#dc2626' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={16} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{lab.nombre}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ background: '#1e40af', color: 'white', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: '700', fontSize: '10px', letterSpacing: '1px' }}>{lab.labCode || '---'}</span>
                          {lab.email || 'Sin email'} · Alta: {new Date(lab.fechaAlta).toLocaleDateString('es-AR')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', width: '50px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>{medicosReales}</div>
                        <div style={{ fontSize: '8px', color: '#94a3b8' }}>Médicos</div>
                      </div>
                      <div style={{ textAlign: 'center', width: '80px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>${mensual.toLocaleString()}</div>
                        <div style={{ fontSize: '8px', color: '#94a3b8' }}>Mensual</div>
                      </div>
                      <div style={{ textAlign: 'center', width: '80px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '600', color: dias < 0 ? '#dc2626' : dias < 7 ? '#d97706' : '#059669' }}>
                          {new Date(lab.fechaVencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </div>
                        <div style={{ fontSize: '8px', color: dias < 0 ? '#dc2626' : '#94a3b8' }}>
                          {dias < 0 ? `Vencido ${Math.abs(dias)}d` : `${dias}d restantes`}
                        </div>
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '700',
                        background: lab.estado === 'activo' ? '#ecfdf5' : lab.estado === 'vencido' ? '#fef2f2' : '#f8fafc',
                        color: lab.estado === 'activo' ? '#059669' : lab.estado === 'vencido' ? '#dc2626' : '#64748b' }}>
                        {lab.estado === 'activo' ? 'Activo' : lab.estado === 'vencido' ? 'Vencido' : 'Suspendido'}
                      </span>
                      {isExpanded ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
                    </div>

                    {/* Panel expandido */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px', background: '#fafbfc' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                          {/* Datos del laboratorio */}
                          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Datos del laboratorio</div>
                            {[
                              { label: 'Nombre', key: 'nombre', value: lab.nombre },
                              { label: 'Email', key: 'email', value: lab.email },
                              { label: 'Teléfono', key: 'telefono', value: lab.telefono },
                              { label: 'Dirección', key: 'direccion', value: lab.direccion },
                            ].map(f => (
                              <div key={f.key} style={{ marginBottom: '6px' }}>
                                <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>{f.label}</label>
                                <input type="text" defaultValue={f.value}
                                  onBlur={(e) => updateLab(lab.id, { [f.key]: e.target.value })}
                                  style={{ width: '100%', padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }} />
                              </div>
                            ))}
                            <div style={{ marginTop: '6px' }}>
                              <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Médicos activos</label>
                              <input type="number" defaultValue={lab.medicosActivos} min={0}
                                onBlur={(e) => updateLab(lab.id, { medicosActivos: Number(e.target.value) })}
                                style={{ width: '80px', padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }} />
                            </div>
                            <div style={{ marginTop: '10px', padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>🔐 Credenciales Admin</div>
                              <div style={{ marginBottom: '4px' }}>
                                <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Usuario</label>
                                <input type="text" defaultValue={lab.adminUser || 'admin'}
                                  onBlur={(e) => updateLab(lab.id, { adminUser: e.target.value })}
                                  style={{ width: '100%', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Contraseña</label>
                                <input type="text" defaultValue={lab.adminPassword || 'admin123'}
                                  onBlur={(e) => updateLab(lab.id, { adminPassword: e.target.value })}
                                  style={{ width: '100%', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                              </div>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button onClick={() => { setShowRenewModal(lab); setRenewMonths(1); setRenewMetodo('transferencia'); }}
                                style={{ background: '#059669', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Renovar</button>
                              <button onClick={() => updateLab(lab.id, { estado: lab.estado === 'suspendido' ? 'activo' : 'suspendido' })}
                                style={{ background: lab.estado === 'suspendido' ? '#ecfdf5' : '#fef2f2', border: '1px solid', borderColor: lab.estado === 'suspendido' ? '#a7f3d0' : '#fecaca', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: lab.estado === 'suspendido' ? '#059669' : '#dc2626' }}>
                                {lab.estado === 'suspendido' ? 'Activar' : 'Suspender'}
                              </button>
                              <button onClick={() => deleteLab(lab.id)}
                                style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: '#dc2626' }}>Eliminar</button>
                            </div>
                          </div>
                        </div>

                        {/* Médicos registrados */}
                        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px', marginTop: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Médicos registrados ({doctors.length})
                          </div>
                          {doctors.length === 0 ? (
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Sin médicos registrados</p>
                          ) : (
                            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                              {doctors.map((doc: any, di: number) => {
                                // Calcular datos del médico
                                let docRemitos = 0, docPacientes = 0, docTotal = 0;
                                try {
                                  const adminRemitos = allRemitosState;
                                  const docRem = adminRemitos.filter((r: any) => (r.email || r.doctorEmail || '').toLowerCase() === (doc.email || '').toLowerCase());
                                  docRemitos = docRem.length;
                                  docPacientes = docRem.reduce((s: number, r: any) => s + (r.biopsias?.length || 0), 0);
                                  docTotal = docRem.reduce((s: number, r: any) => {
                                    return s + (r.biopsias || []).reduce((ss: number, b: any) => {
                                      let t = 0;
                                      const cass = Number(b.cassettes) || 0;
                                      if (cass > 0) { t += (b.servicios?.cassetteUrgente > 0 ? 400 : 300); if (cass > 1) t += (cass - 1) * 120; }
                                      if (b.papQuantity > 0) t += b.papQuantity * (b.servicios?.papUrgente > 0 ? 110 : 90);
                                      if (b.citologiaQuantity > 0) t += b.citologiaQuantity * (b.servicios?.citologiaUrgente > 0 ? 120 : 90);
                                      return ss + t;
                                    }, 0);
                                  }, 0);
                                } catch {}

                                return (
                                  <div key={di} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>
                                        {(doc.firstName || '?')[0]}{(doc.lastName || '?')[0]}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{doc.firstName} {doc.lastName}</div>
                                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>{doc.email}</div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {doc.whatsapp && <span style={{ fontSize: '9px', color: '#059669', fontWeight: '600', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>WA: {doc.whatsapp}</span>}
                                        {doc.hospital && doc.hospital.trim() && <span style={{ fontSize: '9px', color: '#64748b', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>{doc.hospital}</span>}
                                      </div>
                                    </div>
                                    {/* Detalle del médico */}
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', marginLeft: '38px' }}>
                                      <div style={{ fontSize: '10px' }}>
                                        <span style={{ color: '#94a3b8' }}>Remitos: </span>
                                        <span style={{ fontWeight: '700', color: '#1e293b' }}>{docRemitos}</span>
                                      </div>
                                      <div style={{ fontSize: '10px' }}>
                                        <span style={{ color: '#94a3b8' }}>Pacientes: </span>
                                        <span style={{ fontWeight: '700', color: '#1e293b' }}>{docPacientes}</span>
                                      </div>
                                      <div style={{ fontSize: '10px' }}>
                                        <span style={{ color: '#94a3b8' }}>Facturado: </span>
                                        <span style={{ fontWeight: '700', color: '#059669' }}>${docTotal.toLocaleString()}</span>
                                      </div>
                                      <div style={{ fontSize: '10px' }}>
                                        <span style={{ color: '#94a3b8' }}>Alta: </span>
                                        <span style={{ color: '#64748b' }}>{new Date(doc.registeredAt).toLocaleDateString('es-AR')}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Historial de pagos */}
                        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px', marginTop: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Historial de pagos ({(lab.historialPagos || []).length})
                          </div>
                          {(lab.historialPagos || []).length === 0 ? (
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Sin pagos registrados</p>
                          ) : (
                            <div style={{ maxHeight: '120px', overflow: 'auto' }}>
                              {(lab.historialPagos || []).slice().reverse().map((p, pi) => (
                                <div key={pi} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f8fafc', fontSize: '11px' }}>
                                  <span style={{ color: '#64748b' }}>{new Date(p.fecha).toLocaleDateString('es-AR')}</span>
                                  <span style={{ color: '#94a3b8' }}>{p.metodo || 'N/A'}</span>
                                  <span style={{ fontWeight: '700', color: '#1e293b' }}>${p.monto.toLocaleString()} · {p.meses}m</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo laboratorio */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '24px', width: '380px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 14px' }}>Nuevo Laboratorio</h3>
            {[
              { label: 'Nombre *', key: 'nombre', ph: 'Lab. Patología Central' },
              { label: 'Email', key: 'email', ph: 'contacto@lab.com' },
              { label: 'Teléfono', key: 'telefono', ph: '+54 11 1234-5678' },
              { label: 'Dirección', key: 'direccion', ph: 'Av. Principal 123' }
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: '600', color: '#64748b' }}>{f.label}</label>
                <input value={(newLab as any)[f.key]} onChange={(e) => setNewLab(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.ph} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={addLaboratory} style={{ flex: 1, padding: '10px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal renovar */}
      {showRenewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '24px', width: '380px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px' }}>Renovar Suscripción</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px' }}>{showRenewModal.nombre}</p>

            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Médicos:</span>
                <span style={{ fontWeight: '700' }}>{showRenewModal.medicosActivos}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>Precio/médico:</span>
                <span style={{ fontWeight: '700' }}>${config.precioMedico.toLocaleString()}</span>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Meses:</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  {[1, 3, 6, 12].map(m => (
                    <button key={m} onClick={() => setRenewMonths(m)}
                      style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                        border: '2px solid', borderColor: renewMonths === m ? '#1e40af' : '#e2e8f0',
                        background: renewMonths === m ? '#1e40af' : 'white', color: renewMonths === m ? 'white' : '#374151' }}>{m}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Método de pago:</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  {['transferencia', 'efectivo', 'tarjeta'].map(m => (
                    <button key={m} onClick={() => setRenewMetodo(m)}
                      style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                        border: '2px solid', borderColor: renewMetodo === m ? '#059669' : '#e2e8f0',
                        background: renewMetodo === m ? '#059669' : 'white', color: renewMetodo === m ? 'white' : '#374151' }}>
                      {m === 'transferencia' ? 'Transferencia' : m === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Total:</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e40af' }}>
                  ${(showRenewModal.medicosActivos * config.precioMedico * renewMonths).toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowRenewModal(null)} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => renewSubscription(showRenewModal)}
                style={{ flex: 1, padding: '10px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Confirmar Pago</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPanel;
