import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Users, FileText, Settings, DollarSign, Calendar, Download, Edit, Save, X, Plus, Trash2,
  Eye, EyeOff, Lock, Search, Filter, TrendingUp, AlertTriangle, BarChart3, Activity,
  Clock, CheckCircle, XCircle, RefreshCw, Bell, Target, Zap, Award, Building2 as Building, Mail, Package
} from 'lucide-react';
import { db } from '../lib/database';

interface AdminPanelProps {
  onGoBack: () => void;
}

interface AdminRemito {
  id: string;
  medico: string;
  email: string;
  fecha: string;
  hospital: string;
  biopsias: AdminBiopsia[];
  estado: 'pendiente' | 'facturado';
  materialRecibido?: boolean;
  fechaMaterialRecibido?: string;
  impreso?: boolean;
  fechaImpreso?: string;
}

interface AdminBiopsia {
  numero: string;
  tejido: string;
  tipo: string;
  cassettes: number;
  trozos: number;
  desclasificar: string;
  servicios: {
    cassetteNormal: number;
    cassetteUrgente: number;
    profundizacion: number;
    pap: number;
    papUrgente: number;
    citologia: number;
    citologiaUrgente: number;
    corteBlanco: number;
    corteBlancoIHQ: number;
    giemsaPASMasson: number;
  };
  papQuantity: number;
  citologiaQuantity: number;
  numeroExterno?: string;
}

interface Configuracion {
  precioCassette: number;
  precioCassetteUrgente: number;
  precioProfundizacion: number;
  precioPAP: number;
  precioPAPUrgente: number;
  precioCitologia: number;
  precioCitologiaUrgente: number;
  precioCorteBlanco: number;
  precioCorteBlancoIHQ: number;
  precioGiemsaPASMasson: number;
  tiposTejido: string[];
}

interface Notification {
  id: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  titulo: string;
  mensaje: string;
  fecha: Date;
  leida: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onGoBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'tecnico'>('admin');
  const [loginForm, setLoginForm] = useState({ username: '', password: '', labCode: localStorage.getItem('lastAdminLabCode') || '' });
  const [currentLabCode, setCurrentLabCode] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [remitos, setRemitos] = useState<AdminRemito[]>([]);
  const [medicos, setMedicos] = useState<string[]>([]);
  const [filtroMedico, setFiltroMedico] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('este-mes');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [editingRemito, setEditingRemito] = useState<string | null>(null);
  const [originalBiopsiaSnapshot, setOriginalBiopsiaSnapshot] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRemitos, setSelectedRemitos] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; medico: string; deuda: number }>({ open: false, medico: '', deuda: 0 });
  const [paymentForm, setPaymentForm] = useState({ monto: '', metodo: 'efectivo', fecha: new Date().toISOString().split('T')[0] });
  const [showPaymentHistory, setShowPaymentHistory] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<{ open: boolean; medico: string; email: string } | null>(null);
  const [emailMessage, setEmailMessage] = useState('');
  const [editingBiopsias, setEditingBiopsias] = useState<any[] | null>(null);
  const [dashFilter, setDashFilter] = useState('actual');
  const [cobrosFilter, setCobrosFilter] = useState('todos');
  const [expandedUrgents, setExpandedUrgents] = useState<Set<string>>(new Set());
  const [showChangePass, setShowChangePass] = useState(false);
  const [credForm, setCredForm] = useState({ currentPassword: '', newUser: '', newPassword: '', confirmPassword: '' });
  const [solicitudesAdmin, setSolicitudesAdmin] = useState<any[]>([]);
  const [tacoBusqueda, setTacoBusqueda] = useState('');
  const [tacoResultados, setTacoResultados] = useState<any[]>([]);
  const [tacoBuscado, setTacoBuscado] = useState(false);

  const [configuracion, setConfiguracion] = useState<Configuracion>({
    precioCassette: 300,
    precioCassetteUrgente: 400,
    precioProfundizacion: 120,
    precioPAP: 90,
    precioPAPUrgente: 110,
    precioCitologia: 90,
    precioCitologiaUrgente: 120,
    precioCorteBlanco: 60,
    precioCorteBlancoIHQ: 85,
    precioGiemsaPASMasson: 75,
    tiposTejido: [
      'Gastrica', 'Vesicula biliar', 'Endometrio', 'Endoscopia', 
      'Endocervix', 'Vulva', 'Recto', 'Piel', 'Mucosa', 'Colon', 'Ganglio',
      'Mama', 'Tiroides', 'Próstata', 'Útero', 'Ovario', 'PAP', 'Citología'
    ]
  });

  // Configuración del laboratorio
  const [labConfig, setLabConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('labConfig');
      return saved ? JSON.parse(saved) : {
        nombre: 'Laboratorio de Anatomía Patológica',
        direccion: '',
        telefono: '',
        email: '',
        logoUrl: ''
      };
    } catch { return { nombre: 'Laboratorio de Anatomía Patológica', direccion: '', telefono: '', email: '', logoUrl: '' }; }
  });

  const saveLabConfig = (config: typeof labConfig) => {
    setLabConfig(config);
    localStorage.setItem('labConfig', JSON.stringify(config));
    if (currentLabCode) db.saveLabConfig(currentLabCode, config).catch(console.error);
  };

  useEffect(() => {
    loadAdminData();
    generateNotifications();
    // Polling: recargar remitos desde Supabase cada 30 segundos
    if (!currentLabCode) return;
    db.getSolicitudes(undefined, currentLabCode).then(s => setSolicitudesAdmin(s)).catch(() => {});
    const interval = setInterval(() => {
      db.getRemitos(currentLabCode).then((remote: any[]) => {
        if (remote && remote.length > 0) {
          // Merge: preservar materialRecibido/impreso locales
          setRemitos(prev => {
            const localMap = new Map(prev.map(r => [r.id, r]));
            const merged = remote.map((r: any) => {
              const local = localMap.get(r.id);
              if (local) {
                return {
                  ...r,
                  materialRecibido: r.materialRecibido ?? local.materialRecibido,
                  fechaMaterialRecibido: r.fechaMaterialRecibido ?? local.fechaMaterialRecibido,
                  impreso: r.impreso ?? local.impreso,
                  fechaImpreso: r.fechaImpreso ?? local.fechaImpreso
                };
              }
              return r;
            });
            return merged;
          });
          const medicosUnicos = [...new Set(remote.map((r: any) => r.medico))];
          setMedicos(medicosUnicos);
        }
      }).catch(() => {});
      db.getSolicitudes(undefined, currentLabCode).then(s => setSolicitudesAdmin(s)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [currentLabCode]);

  const loadAdminData = () => {
    // Cargar desde Supabase primero (fuente de verdad)
    if (currentLabCode) {
      db.getRemitos(currentLabCode).then((remote: any[]) => {
        if (remote && remote.length >= 0) {
          setRemitos(remote);
          const medicosUnicos = [...new Set(remote.map((r: any) => r.medico))];
          setMedicos(medicosUnicos);
          // Si Supabase respondió, no necesitamos localStorage
          return;
        }
      }).catch(() => {
        // Si Supabase falla, cargar de localStorage como fallback
        loadFromLocalStorage();
      });
      // Cargar config
      db.getAdminConfig(currentLabCode).then((cfg: any) => {
        if (cfg && Object.keys(cfg).length > 0) setConfiguracion((prev: any) => ({ ...prev, ...cfg }));
      }).catch(() => {});
      return;
    }
    loadFromLocalStorage();
  };

  const loadFromLocalStorage = () => {
    try {
      let allRemitos: AdminRemito[] = [];
      
      // Buscar todas las claves del localStorage que contengan datos de historial
      const allKeys = Object.keys(localStorage);
      const historyKeys = allKeys.filter(key => key.includes('_history'));
      
      console.log('🔍 Buscando datos en claves de historial:', historyKeys);
      
      // Cargar datos de cada doctor
      historyKeys.forEach(historyKey => {
        try {
          const historyData = localStorage.getItem(historyKey);
          if (historyData) {
            const parsedHistory = JSON.parse(historyData);
            
            // Convertir cada entrada del historial a formato AdminRemito
            Object.values(parsedHistory).forEach((entry: any) => {
              if (entry && entry.biopsies && entry.doctorInfo) {
                const adminRemito: any = {
                  id: entry.id || `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  remitoNumber: entry.remitoNumber || null,
                  medico: entry.doctorInfo.name || 'Médico no especificado',
                  email: entry.doctorInfo.email || 'email@ejemplo.com',
                  fecha: entry.date || entry.timestamp || new Date().toISOString(),
                  hospital: entry.doctorInfo.hospital || 'Hospital no especificado',
                  estado: 'pendiente' as const,
                  biopsias: entry.biopsies.map((biopsy: any) => ({
                    numero: biopsy.number || 'N/A',
                    tejido: biopsy.tissueType || 'No especificado',
                    tipo: biopsy.type || 'Biopsia',
                    cassettes: parseInt(biopsy.cassettes) || 0,
                    trozos: parseInt(biopsy.pieces) || 0,
                    desclasificar: biopsy.declassify || 'No',
                    servicios: {
                      cassetteNormal: biopsy.servicios?.cassetteUrgente ? 0 : (parseInt(biopsy.cassettes) || 0),
                      cassetteUrgente: biopsy.servicios?.cassetteUrgente ? (parseInt(biopsy.cassettes) || 0) : 0,
                      profundizacion: 0, // No hay equivalente directo
                      pap: biopsy.servicios?.pap ? (biopsy.papQuantity || 1) : 0,
                      papUrgente: biopsy.servicios?.papUrgente ? (biopsy.papQuantity || 1) : 0,
                      citologia: biopsy.servicios?.citologia ? (biopsy.citologiaQuantity || 1) : 0,
                      citologiaUrgente: biopsy.servicios?.citologiaUrgente ? (biopsy.citologiaQuantity || 1) : 0,
                      corteBlanco: biopsy.servicios?.corteBlancoComun ? (biopsy.servicios.corteBlancoComunQuantity || 1) : 0,
                      corteBlancoIHQ: biopsy.servicios?.corteBlancoIHQ ? (biopsy.servicios.corteBlancoIHQQuantity || 1) : 0,
                      giemsaPASMasson: biopsy.servicios?.giemsaPASMasson
                        ? (typeof biopsy.servicios.giemsaPASMasson === 'number'
                          ? biopsy.servicios.giemsaPASMasson
                          : (biopsy.servicios.giemsaPASMassonTotal || Object.values(biopsy.servicios.giemsaOptions || {}).filter(Boolean).length || 1))
                        : 0,
                      giemsaOptions: biopsy.servicios?.giemsaOptions || undefined,
                      corteBlancoIHQCassettes: biopsy.servicios?.corteBlancoIHQCassettes || undefined,
                      corteBlancoComunCassettes: biopsy.servicios?.corteBlancoComunCassettes || undefined,
                      giemsaCassettes: biopsy.servicios?.giemsaCassettes || undefined,
                      incluyeCitologia: biopsy.servicios?.incluyeCitologia || false,
                      citologiaFormato: biopsy.servicios?.citologiaFormato || undefined,
                      citologiaVidriosQty: biopsy.servicios?.citologiaVidriosQty || undefined
                    },
                    papQuantity: biopsy.papQuantity || 0,
                    citologiaQuantity: biopsy.citologiaQuantity || 0,
                    citologiaSubType: biopsy.citologiaSubType || '',
                    cassettesNumbers: biopsy.cassettesNumbers || biopsy.cassettes_numbers || [],
                    trozoPorCassette: biopsy.trozoPorCassette || [],
                    quedaMaterial: biopsy.quedaMaterial || false,
                    entregarConTaco: biopsy.entregarConTaco || false,
                    tacosSeleccionados: biopsy.tacosSeleccionados || []
                  }))
                };
                allRemitos.push(adminRemito);
              }
            });
          }
        } catch (error) {
          console.error(`Error procesando datos de ${historyKey}:`, error);
        }
      });
      
      console.log('📊 Datos encontrados:', allRemitos.length, 'remitos');
      
      // Mergear con adminRemitos (tienen datos completos: cassettesNumbers, servicios editados, etc.)
      try {
        const savedRemitos = localStorage.getItem('adminRemitos');
        if (savedRemitos) {
          const parsedRemitos = JSON.parse(savedRemitos);
          // Para cada adminRemito, buscar si ya existe uno del historial con misma fecha+email+cantidad
          parsedRemitos.forEach((ar: any) => {
            const arDate = new Date(ar.fecha).toDateString();
            const arEmail = (ar.doctorEmail || ar.email || '').toLowerCase().trim();
            const arCount = ar.biopsias?.length || 0;
            const arTimestamp = ar.timestamp || '';
            const duplicateIdx = allRemitos.findIndex((r: any) => {
              if (r.id === ar.id) return true;
              const rEmail = (r.doctorEmail || r.email || '').toLowerCase().trim();
              if (arTimestamp && (r as any).timestamp === arTimestamp) return true;
              const rDate = new Date(r.fecha).toDateString();
              return rDate === arDate && rEmail === arEmail && r.biopsias?.length === arCount;
            });
            if (duplicateIdx >= 0) {
              // Reemplazar con adminRemito (más completo) pero preservar remitoNumber
              const existingRemitoNumber = (allRemitos[duplicateIdx] as any).remitoNumber;
              allRemitos[duplicateIdx] = { ...ar, remitoNumber: ar.remitoNumber || existingRemitoNumber };
            } else {
              allRemitos.push(ar);
            }
          });
        }
      } catch {}
      
      // Si no hay datos, mostrar vacío
      if (allRemitos.length === 0) {
        setRemitos([]);
        setMedicos([]);
        return;
      }
      
      // Eliminar duplicados por ID
      const remitosUnicos = allRemitos.filter((remito, index, self) =>
        index === self.findIndex(r => r.id === remito.id)
      );

      // Filtrar por labCode: solo mostrar remitos de médicos registrados en este laboratorio
      let remitosFiltrados = remitosUnicos;
      if (currentLabCode) {
        try {
          const registeredDoctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
          const labDoctorEmails = registeredDoctors
            .filter((d: any) => (d.labCode || '').toUpperCase() === currentLabCode)
            .map((d: any) => (d.email || '').toLowerCase().trim());

          remitosFiltrados = remitosUnicos.filter(r =>
            labDoctorEmails.includes((r.email || '').toLowerCase().trim())
          );
          console.log(`🔒 Filtrado por lab ${currentLabCode}: ${remitosFiltrados.length}/${remitosUnicos.length} remitos`);
        } catch {
          console.error('Error filtrando por labCode');
        }
      }

      setRemitos(remitosFiltrados);
      const medicosUnicos = [...new Set(remitosFiltrados.map(r => r.medico))];
      setMedicos(medicosUnicos);

      console.log('✅ Datos cargados exitosamente:', remitosFiltrados.length, 'remitos de', medicosUnicos.length, 'médicos');

      const savedConfig = localStorage.getItem('adminConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfiguracion(prev => ({ ...prev, ...parsedConfig }));
      }

      // Background sync from Supabase
      if (currentLabCode) {
        db.getRemitos(currentLabCode).then(dbRemitos => {
          if (dbRemitos && dbRemitos.length > 0) {
            console.log('☁️ Supabase sync: recibidos', dbRemitos.length, 'remitos');
            setRemitos(prev => {
              const merged = [...prev];
              dbRemitos.forEach((dr: any) => {
                if (!merged.find(r => r.id === dr.id)) merged.push(dr);
              });
              return merged;
            });
          }
        }).catch(console.error);
        db.getAdminConfig(currentLabCode).then(dbConfig => {
          if (dbConfig && Object.keys(dbConfig).length > 0) {
            setConfiguracion(prev => ({ ...prev, ...dbConfig }));
          }
        }).catch(console.error);
      }
    } catch (error) {
      console.error('❌ Error cargando datos del administrador:', error);
      setRemitos([]);
      setMedicos([]);
    }
  };

  const generateNotifications = () => {};

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, leida: true } : n)
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída
    markNotificationAsRead(notification.id);
    
    // Cerrar panel de notificaciones
    setShowNotifications(false);
    
    // Navegación según el tipo de notificación
    if (notification.titulo.includes('Remitos Pendientes')) {
      // Ir a gestión de remitos y filtrar por pendientes
      setCurrentView('remitos');
      setFiltroEstado('pendiente');
      setSearchTerm(''); // Limpiar búsqueda para mostrar todos los pendientes
    } else if (notification.titulo.includes('Meta Alcanzada')) {
      // Ir a facturación para ver las estadísticas
      setCurrentView('facturacion');
    } else {
      // Para otros tipos, ir al dashboard
      setCurrentView('dashboard');
    }
  };

  const generateInsights = () => {
    const totalRemitos = remitos.length;
    const pendientes = remitos.filter(r => r.estado === 'pendiente').length;
    const facturados = remitos.filter(r => r.estado === 'facturado').length;
    
    const insights = [
      `Se han procesado ${totalRemitos} remitos en total`,
      `${pendientes} remitos están pendientes de facturación`,
      `${facturados} remitos han sido facturados exitosamente`,
      `Tasa de facturación: ${totalRemitos > 0 ? Math.round((facturados / totalRemitos) * 100) : 0}%`
    ];
    
    alert(`📊 Insights Generados:\n\n${insights.join('\n')}\n\n🔍 Análisis completado exitosamente`);
  };

  const exportAnalytics = () => {
    const analyticsData = {
      fecha: new Date().toISOString().split('T')[0],
      totalRemitos: remitos.length,
      pendientes: remitos.filter(r => r.estado === 'pendiente').length,
      facturados: remitos.filter(r => r.estado === 'facturado').length,
      medicos: medicos.length,
      totalFacturado: remitos.filter(r => r.estado === 'facturado').reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0)
    };
    
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogin = async () => {
    const code = loginForm.labCode.trim().toUpperCase();
    if (!code) {
      alert('Ingrese el código del laboratorio');
      return;
    }
    try {
      let labs: any[] = [];
      try { labs = await db.getLabs(); } catch {}
      if (labs.length === 0) { labs = JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]'); }
      const lab = labs.find((l: any) => l.labCode === code);
      if (!lab) {
        alert('Código de laboratorio no válido');
        return;
      }
      // Validar credenciales: admin principal o técnico
      const labUser = lab.adminUser || 'admin';
      const labPass = lab.adminPassword || 'admin123';
      const tecnicos = lab.adminTecnicos || [];

      let role: 'admin' | 'tecnico' = 'admin';

      if (loginForm.username.toLowerCase() === labUser.toLowerCase() && loginForm.password === labPass) {
        role = 'admin';
      } else {
        const tecnico = tecnicos.find((t: any) => t.activo && t.usuario.toLowerCase() === loginForm.username.toLowerCase() && t.password === loginForm.password);
        if (tecnico) {
          role = 'tecnico';
        } else {
          alert('❌ Credenciales incorrectas');
          return;
        }
      }
      if (lab.estado === 'vencido') {
        alert('La suscripción de este laboratorio está vencida.\nContacte a BiopsyTracker para renovar.');
        return;
      }
      if (lab.estado === 'suspendido') {
        alert('Este laboratorio está suspendido.\nContacte a BiopsyTracker.');
        return;
      }
      setCurrentLabCode(code);
      localStorage.setItem('lastAdminLabCode', code);
      setUserRole(role);
      setIsAuthenticated(true);
    } catch {
      alert('Error al verificar laboratorio');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '', labCode: '' });
    setCurrentView('dashboard');
    onGoBack();
  };

  const calcularTotalBiopsia = (biopsia: AdminBiopsia) => {
    if ((biopsia as any).noVino) return 0;
    const servicios = biopsia.servicios || {
      cassetteNormal: 0,
      cassetteUrgente: 0,
      profundizacion: 0,
      pap: 0,
      papUrgente: 0,
      citologia: 0,
      citologiaUrgente: 0,
      corteBlanco: 0,
      corteBlancoIHQ: 0,
      giemsaPASMasson: 0
    };
    let total = 0;
    const totalCassettes = Math.max(biopsia.cassettes || 0, 0);
    const esCassetteUrgente = (servicios.cassetteUrgente || 0) > 0;
    const esIHQ = biopsia.tipo === 'IHQ' || biopsia.tejido === 'Inmunohistoquímica';

    // IHQ: cobrar por vidrio al precio Corte Blanco IHQ
    if (esIHQ) {
      const tpc = (biopsia as any).trozoPorCassette || [];
      const totalVidrios = tpc.length > 0 ? tpc.reduce((s: number, v: number) => s + (v || 1), 0) : totalCassettes;
      total += totalVidrios * configuracion.precioCorteBlancoIHQ;
      return total;
    }

    // Cálculo de cassettes
    if (totalCassettes > 0) {
      if (esCassetteUrgente) {
        // Primer cassette urgente, los adicionales son profundización
        total += configuracion.precioCassetteUrgente;
        if (totalCassettes > 1) {
          total += (totalCassettes - 1) * configuracion.precioProfundizacion;
        }
      } else {
        // Primer cassette normal, los adicionales son profundización
        total += configuracion.precioCassette;
        if (totalCassettes > 1) {
          total += (totalCassettes - 1) * configuracion.precioProfundizacion;
        }
      }
    }
    
    // Cálculo de PAP
    const papCantidad = biopsia.papQuantity || 0;
    const esPapUrgente = (servicios.papUrgente || 0) > 0;
    if (papCantidad > 0) {
      if (esPapUrgente) {
        // TODOS los PAP son urgentes
        total += papCantidad * configuracion.precioPAPUrgente;
      } else {
        // TODOS los PAP son normales
        total += papCantidad * configuracion.precioPAP;
      }
    }
    
    // Cálculo de Citología — PAAF/Líquidos cobra 1 paciente, independiente de vidrios
    const citologiaCantidad = biopsia.citologiaQuantity || 0;
    const esCitologiaUrgente = (servicios.citologiaUrgente || 0) > 0;
    const citoSubType = (biopsia as any).citologiaSubType || '';
    if (citologiaCantidad > 0) {
      // PAAF y Líquidos = 1 × precio (independiente de vidrios)
      // Sin subtipo (datos viejos) = cobra por vidrio como antes
      const unidadesACobrar = (citoSubType === 'PAAF' || citoSubType === 'Líquidos') ? 1 : citologiaCantidad;
      if (esCitologiaUrgente) {
        total += unidadesACobrar * configuracion.precioCitologiaUrgente;
      } else {
        total += unidadesACobrar * configuracion.precioCitologia;
      }
    }
    
    // Profundizaciones solicitadas (adicionales a las de cassettes)
    total += (servicios.profundizacion || 0) * configuracion.precioProfundizacion;

    // Otros estudios
    total += (servicios.corteBlanco || 0) * configuracion.precioCorteBlanco;
    total += (servicios.corteBlancoIHQ || 0) * configuracion.precioCorteBlancoIHQ;
    
    // Giemsa/PAS/Masson: cobrar por cada cassette seleccionado × técnicas
    const giemsaTecnicas = typeof servicios.giemsaPASMasson === 'number'
      ? servicios.giemsaPASMasson
      : (servicios.giemsaPASMasson ? 1 : 0);
    const giemsaCassCount = (servicios as any).giemsaCassettes?.length || 0;
    // Si hay cassettes específicos seleccionados, cobrar por cada uno; sino cobrar por técnicas
    const giemsaTotal = giemsaCassCount > 0 ? giemsaCassCount * giemsaTecnicas : giemsaTecnicas;
    total += giemsaTotal * configuracion.precioGiemsaPASMasson;

    // Citología incluida en biopsia (cobra 1 paciente)
    if ((servicios as any).incluyeCitologia) {
      total += configuracion.precioCitologia;
    }

    return Number(total) || 0;
  };

  const calcularTotalRemito = (biopsias: AdminBiopsia[]) => {
    return biopsias.reduce((total, biopsia) => total + calcularTotalBiopsia(biopsia), 0);
  };

  const cambiarEstadoRemito = (remitoId: string, nuevoEstado: 'pendiente' | 'facturado') => {
    // Pedir confirmación solo al marcar como facturado
    if (nuevoEstado === 'facturado') {
      const confirmar = window.confirm(
        '⚠️ ¿Está seguro que desea marcar este remito como FACTURADO?\n\n' +
        'Esta acción cambiará el estado del remito y se reflejará en los reportes.'
      );
      
      if (!confirmar) {
        return; // No hacer nada si cancela
      }
    }
    
    setRemitos(prev => {
      const updated = prev.map(remito =>
        remito.id === remitoId ? { ...remito, estado: nuevoEstado } : remito
      );
      localStorage.setItem('adminRemitos', JSON.stringify(updated));
      db.saveRemitos(updated).catch(console.error);
      return updated;
    });
  };

  // Marcar material recibido en un remito + notificar al médico
  const toggleMaterialRecibido = (remitoId: string) => {
    setRemitos(prev => {
      const remito = prev.find(r => r.id === remitoId);
      const wasRecibido = remito?.materialRecibido;
      const updated = prev.map(r =>
        r.id === remitoId ? {
          ...r,
          materialRecibido: !r.materialRecibido,
          fechaMaterialRecibido: !r.materialRecibido ? new Date().toISOString() : undefined
        } : r
      );
      localStorage.setItem('adminRemitos', JSON.stringify(updated));
      db.saveRemitos(updated).catch(console.error);

      // Notificar al médico solo cuando se MARCA como recibido (no al desmarcar)
      if (!wasRecibido && remito) {
        const nro = (remito as any).remitoNumber || remito.id.slice(-6).toUpperCase();
        const labNombre = labConfig.nombre || 'Laboratorio';
        const newNotif = {
          id: `NOTIF_MATERIAL_${Date.now()}`,
          remitoId: remito.id,
          medicoEmail: (remito as any).doctorEmail || remito.email,
          mensaje: `${labNombre} confirma que recibió el material de su remito #${nro} (${remito.biopsias.length} paciente${remito.biopsias.length !== 1 ? 's' : ''}).\nEl material está siendo procesado.`,
          fecha: new Date().toISOString(),
          leida: false,
          tipo: 'material_recibido'
        };
        const notifications = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
        notifications.push(newNotif);
        localStorage.setItem('doctorNotifications', JSON.stringify(notifications));
        db.saveNotification(newNotif).catch(console.error);
      }

      return updated;
    });
  };

  // Marcar remitos como impresos
  const marcarRemitosImpresos = (remitoIds: string[]) => {
    setRemitos(prev => {
      const updated = prev.map(r =>
        remitoIds.includes(r.id) ? { ...r, impreso: true, fechaImpreso: new Date().toISOString() } : r
      );
      localStorage.setItem('adminRemitos', JSON.stringify(updated));
      db.saveRemitos(updated).catch(console.error);
      return updated;
    });
  };

  // Estado para modal de selección de impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSelection, setPrintSelection] = useState<Set<string>>(new Set());

  // Función para determinar qué campos mostrar en edición según lo que tiene la biopsia
  const getCamposEditables = (biopsia: AdminBiopsia) => {
    const campos = [];
    
    // Siempre mostrar cassettes si tiene
    if (biopsia.cassettes > 0) {
      campos.push('cassettes');
    }
    
    // Mostrar PAP si tiene cantidad
    if ((biopsia.papQuantity || 0) > 0) {
      campos.push('pap');
    }
    
    // Mostrar Citología si tiene cantidad
    if ((biopsia.citologiaQuantity || 0) > 0) {
      campos.push('citologia');
    }
    
    // Mostrar estudios especiales si tiene alguno
    if ((biopsia.servicios?.corteBlanco || 0) > 0 || 
        (biopsia.servicios?.corteBlancoIHQ || 0) > 0 || 
        (biopsia.servicios?.giemsaPASMasson || 0) > 0) {
      campos.push('estudios');
    }
    
    return campos;
  };

  // Componente de edición inteligente
  const EdicionInteligente = ({ biopsia, index, remito }: { biopsia: AdminBiopsia, index: number, remito: AdminRemito }) => {
    const camposEditables = getCamposEditables(biopsia);
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
        <div className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
          <Edit size={12} />
          Editando #{biopsia.numero} - Solo campos con datos
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Cassettes */}
          {camposEditables.includes('cassettes') && (
            <div className="bg-white rounded-lg p-2 border">
              <div className="text-xs font-semibold text-gray-700 mb-2">🧪 Cassettes de Biopsia</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={biopsia.cassettes}
                  min="0"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                  onChange={(e) => {
                    const updatedRemitos = remitos.map(r => {
                      if (r.id === remito.id) {
                        const updatedBiopsias = r.biopsias.map((b, i) => {
                          if (i === index) {
                            return { ...b, cassettes: Number(e.target.value) };
                          }
                          return b;
                        });
                        return { ...r, biopsias: updatedBiopsias };
                      }
                      return r;
                    });
                    setRemitos(updatedRemitos);
                  }}
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    defaultChecked={(biopsia.servicios?.cassetteUrgente || 0) > 0}
                    className="w-3 h-3"
                    onChange={(e) => {
                      const updatedRemitos = remitos.map(r => {
                        if (r.id === remito.id) {
                          const updatedBiopsias = r.biopsias.map((b, i) => {
                            if (i === index) {
                              return { 
                                ...b, 
                                servicios: { 
                                  ...b.servicios, 
                                  cassetteUrgente: e.target.checked ? 1 : 0
                                }
                              };
                            }
                            return b;
                          });
                          return { ...r, biopsias: updatedBiopsias };
                        }
                        return r;
                      });
                      setRemitos(updatedRemitos);
                    }}
                  />
                  <span className="text-red-600 font-medium">🚨 Urgente</span>
                </label>
              </div>
            </div>
          )}

          {/* PAP */}
          {camposEditables.includes('pap') && (
            <div className="bg-white rounded-lg p-2 border">
              <div className="text-xs font-semibold text-pink-700 mb-2">🌸 PAP</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={biopsia.papQuantity || 0}
                  min="0"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                  onChange={(e) => {
                    const updatedRemitos = remitos.map(r => {
                      if (r.id === remito.id) {
                        const updatedBiopsias = r.biopsias.map((b, i) => {
                          if (i === index) {
                            return { ...b, papQuantity: Number(e.target.value) };
                          }
                          return b;
                        });
                        return { ...r, biopsias: updatedBiopsias };
                      }
                      return r;
                    });
                    setRemitos(updatedRemitos);
                  }}
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    defaultChecked={(biopsia.servicios?.papUrgente || 0) > 0}
                    className="w-3 h-3"
                    onChange={(e) => {
                      const updatedRemitos = remitos.map(r => {
                        if (r.id === remito.id) {
                          const updatedBiopsias = r.biopsias.map((b, i) => {
                            if (i === index) {
                              return { 
                                ...b, 
                                servicios: { 
                                  ...b.servicios, 
                                  papUrgente: e.target.checked ? 1 : 0
                                }
                              };
                            }
                            return b;
                          });
                          return { ...r, biopsias: updatedBiopsias };
                        }
                        return r;
                      });
                      setRemitos(updatedRemitos);
                    }}
                  />
                  <span className="text-red-600 font-medium">🚨 Urgente</span>
                </label>
              </div>
            </div>
          )}

          {/* Citología */}
          {camposEditables.includes('citologia') && (
            <div className="bg-white rounded-lg p-2 border">
              <div className="text-xs font-semibold text-purple-700 mb-2">🔬 Citología</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={biopsia.citologiaQuantity || 0}
                  min="0"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                  onChange={(e) => {
                    const updatedRemitos = remitos.map(r => {
                      if (r.id === remito.id) {
                        const updatedBiopsias = r.biopsias.map((b, i) => {
                          if (i === index) {
                            return { ...b, citologiaQuantity: Number(e.target.value) };
                          }
                          return b;
                        });
                        return { ...r, biopsias: updatedBiopsias };
                      }
                      return r;
                    });
                    setRemitos(updatedRemitos);
                  }}
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    defaultChecked={(biopsia.servicios?.citologiaUrgente || 0) > 0}
                    className="w-3 h-3"
                    onChange={(e) => {
                      const updatedRemitos = remitos.map(r => {
                        if (r.id === remito.id) {
                          const updatedBiopsias = r.biopsias.map((b, i) => {
                            if (i === index) {
                              return { 
                                ...b, 
                                servicios: { 
                                  ...b.servicios, 
                                  citologiaUrgente: e.target.checked ? 1 : 0
                                }
                              };
                            }
                            return b;
                          });
                          return { ...r, biopsias: updatedBiopsias };
                        }
                        return r;
                      });
                      setRemitos(updatedRemitos);
                    }}
                  />
                  <span className="text-red-600 font-medium">🚨 Urgente</span>
                </label>
              </div>
            </div>
          )}

          {/* Estudios Especiales */}
          {camposEditables.includes('estudios') && (
            <div className="bg-white rounded-lg p-2 border">
              <div className="text-xs font-semibold text-orange-700 mb-2">⚗️ Estudios Especiales</div>
              <div className="space-y-2">
                {(biopsia.servicios?.corteBlanco || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={biopsia.servicios?.corteBlanco || 0}
                      min="0"
                      className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-xs"
                      onChange={(e) => {
                        const updatedRemitos = remitos.map(r => {
                          if (r.id === remito.id) {
                            const updatedBiopsias = r.biopsias.map((b, i) => {
                              if (i === index) {
                                return { 
                                  ...b, 
                                  servicios: { 
                                    ...b.servicios, 
                                    corteBlanco: Number(e.target.value) 
                                  }
                                };
                              }
                              return b;
                            });
                            return { ...r, biopsias: updatedBiopsias };
                          }
                          return r;
                        });
                        setRemitos(updatedRemitos);
                      }}
                    />
                    <span className="text-blue-600 font-medium text-xs">Corte Blanco</span>
                  </div>
                )}
                {(biopsia.servicios?.corteBlancoIHQ || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={biopsia.servicios?.corteBlancoIHQ || 0}
                      min="0"
                      className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-xs"
                      onChange={(e) => {
                        const updatedRemitos = remitos.map(r => {
                          if (r.id === remito.id) {
                            const updatedBiopsias = r.biopsias.map((b, i) => {
                              if (i === index) {
                                return { 
                                  ...b, 
                                  servicios: { 
                                    ...b.servicios, 
                                    corteBlancoIHQ: Number(e.target.value) 
                                  }
                                };
                              }
                              return b;
                            });
                            return { ...r, biopsias: updatedBiopsias };
                          }
                          return r;
                        });
                        setRemitos(updatedRemitos);
                      }}
                    />
                    <span className="text-orange-600 font-medium text-xs">IHQ</span>
                  </div>
                )}
                {(biopsia.servicios?.giemsaPASMasson || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={biopsia.servicios?.giemsaPASMasson || 0}
                      min="0"
                      className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-xs"
                      onChange={(e) => {
                        const updatedRemitos = remitos.map(r => {
                          if (r.id === remito.id) {
                            const updatedBiopsias = r.biopsias.map((b, i) => {
                              if (i === index) {
                                return { 
                                  ...b, 
                                  servicios: { 
                                    ...b.servicios, 
                                    giemsaPASMasson: Number(e.target.value) 
                                  }
                                };
                              }
                              return b;
                            });
                            return { ...r, biopsias: updatedBiopsias };
                          }
                          return r;
                        });
                        setRemitos(updatedRemitos);
                      }}
                    />
                    <span className="text-green-600 font-medium text-xs">Giemsa/PAS</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const generarHTMLFacturacion = (medico: string, centroFilter?: string) => {
    const remitosDelMedico = remitos.filter(r => r.medico === medico && (!centroFilter || (r.hospital || '') === centroFilter));
    const fechaActual = new Date().toLocaleDateString('es-AR');
    
    const totalGeneral = remitosDelMedico.reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0);
    
    const totalPacientes = remitosDelMedico.reduce((s, r) => s + r.biopsias.length, 0);
    const totalBX = remitosDelMedico.reduce((s, r) => s + r.biopsias.filter((b: any) => b.tipo !== 'PQ' && b.tejido !== 'PAP' && b.tejido !== 'Citología').length, 0);
    const totalPQ = remitosDelMedico.reduce((s, r) => s + r.biopsias.filter((b: any) => b.tipo === 'PQ').length, 0);
    const totalPAP = remitosDelMedico.reduce((s, r) => s + r.biopsias.reduce((ss: number, b: any) => ss + (b.papQuantity || 0), 0), 0);
    const totalCito = remitosDelMedico.reduce((s, r) => s + r.biopsias.reduce((ss: number, b: any) => ss + (b.citologiaQuantity || 0), 0), 0);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Facturación ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })} - ${medico}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, 'Segoe UI', sans-serif; padding: 0; background: white; color: #1e293b; font-size: 13px; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%); color: white; padding: 28px 32px; text-align: center; }
        .header .logo img { height: 70px; max-width: 280px; object-fit: contain; margin-bottom: 8px; }
        .header .lab-name { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .header .lab-info { font-size: 12px; opacity: 0.7; margin-top: 12px; line-height: 1.6; }
        .content { padding: 24px 32px; }
        .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
        .doc-title { font-size: 20px; font-weight: 700; color: #0f172a; }
        .doc-medico { font-size: 16px; color: #1e40af; font-weight: 600; margin-top: 4px; }
        .doc-fecha { font-size: 12px; color: #64748b; margin-top: 4px; }
        .doc-total { text-align: right; }
        .doc-total .amount { font-size: 28px; font-weight: 800; color: #0f172a; }
        .doc-total .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
        .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
        .kpi .val { font-size: 22px; font-weight: 700; color: #1e40af; }
        .kpi .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        thead th { background: #0f172a; color: white; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; vertical-align: top; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-bx { background: #dcfce7; color: #166534; }
        .badge-pq { background: #fed7aa; color: #c2410c; }
        .badge-pap { background: #fce7f3; color: #be185d; }
        .badge-cito { background: #ede9fe; color: #7c3aed; }
        .badge-urgente { background: #fee2e2; color: #dc2626; }
        .badge-servicio { background: #eff6ff; color: #1e40af; }
        .servicios-cell { line-height: 1.6; }
        .subtotal { font-weight: 700; color: #0f172a; text-align: right; white-space: nowrap; }
        .total-row td { background: #0f172a !important; color: white; font-weight: 700; font-size: 14px; padding: 14px 12px; }
        .footer { text-align: center; padding: 16px 32px; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; }
        @media print { body { padding: 0; } .header { break-after: avoid; } }
      </style>
    </head>
    <body>
      <div class="header">
        ${labConfig.logoUrl ? `<div class="logo"><img src="${labConfig.logoUrl}" alt="Logo" /></div>` : `<div class="lab-name">${labConfig.nombre || 'Laboratorio de Anatomía Patológica'}</div>`}
        <div class="lab-info">
          ${labConfig.direccion || ''}<br>
          ${labConfig.telefono ? `Tel: ${labConfig.telefono}` : ''} ${labConfig.email ? `&nbsp;|&nbsp; ${labConfig.email}` : ''}
        </div>
      </div>

      <div class="content">
        <div class="doc-header">
          <div>
            <div class="doc-title">Facturación ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}${centroFilter ? ' — ' + centroFilter : ''}</div>
            <div class="doc-medico">Dr/a. ${medico}</div>
            <div class="doc-fecha">${fechaActual} &nbsp;·&nbsp; ${remitosDelMedico.length} remito${remitosDelMedico.length > 1 ? 's' : ''} &nbsp;·&nbsp; ${totalPacientes} paciente${totalPacientes > 1 ? 's' : ''}</div>
          </div>
          <div class="doc-total">
            <div class="label">Total a facturar</div>
            <div class="amount">$${totalGeneral.toLocaleString()}</div>
          </div>
        </div>

        <div class="kpis">
          <div class="kpi"><div class="val">${remitosDelMedico.length}</div><div class="lbl">Remitos</div></div>
          <div class="kpi"><div class="val">${totalBX}</div><div class="lbl">BX</div></div>
          <div class="kpi"><div class="val">${totalPQ}</div><div class="lbl">PQ</div></div>
          <div class="kpi"><div class="val">${totalPAP}</div><div class="lbl">PAP</div></div>
          <div class="kpi"><div class="val">${totalCito}</div><div class="lbl">Citología</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Remito</th>
              <th>Cargado por</th>
              <th>Fecha</th>
              <th>N° Estudio</th>
              <th>Material</th>
              <th>Tipo</th>
              <th>Cant.</th>
              <th>Servicios / Detalle</th>
              <th style="text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${[...remitosDelMedico].sort((a, b) => new Date((a as any).timestamp || a.fecha).getTime() - new Date((b as any).timestamp || b.fecha).getTime()).map(remito =>
              remito.biopsias.map((biopsia: any) => {
                const citoSub = (biopsia as any).citologiaSubType || '';
                const tipo = (biopsia.tipo === 'IHQ' || biopsia.tejido === 'Inmunohistoquímica') ? 'IHQ' : biopsia.tipo === 'TC' || biopsia.tejido === 'Taco en Consulta' ? 'TACO' : biopsia.tipo === 'PQ' ? 'PQ' : biopsia.tejido === 'PAP' ? 'PAP' : biopsia.tejido === 'Citología' ? (citoSub || 'CITO') : 'BX';
                const bc = tipo === 'IHQ' ? 'badge-bx' : tipo === 'TACO' ? 'badge-pq' : tipo === 'PQ' ? 'badge-pq' : tipo === 'PAP' ? 'badge-pap' : biopsia.tejido === 'Citología' ? 'badge-cito' : 'badge-bx';

                const svcs: string[] = [];
                if ((biopsia.servicios?.cassetteUrgente || 0) > 0) svcs.push('<span class="badge badge-urgente">URGENTE 24hs</span>');
                if ((biopsia.servicios?.papUrgente || 0) > 0) svcs.push('<span class="badge badge-urgente">PAP Urgente</span>');
                if ((biopsia.servicios?.citologiaUrgente || 0) > 0) svcs.push('<span class="badge badge-urgente">Cito Urgente</span>');
                const cn = (biopsia as any).cassettesNumbers || [];
                const getCassNames = (indices: number[]) => {
                  if (!indices || indices.length === 0) return '';
                  return ' [' + indices.map((c: number) => c === 0 ? (cn[0]?.base || 'C') : 'S/' + (cn[c]?.suffix || c)).join(', ') + ']';
                };
                if ((biopsia.servicios?.corteBlancoIHQ || 0) > 0) {
                  const cassNames = getCassNames((biopsia.servicios as any)?.corteBlancoIHQCassettes || []);
                  svcs.push('<span class="badge badge-servicio">Corte IHQ &times;' + biopsia.servicios.corteBlancoIHQ + cassNames + '</span>');
                }
                if ((biopsia.servicios?.corteBlanco || 0) > 0) {
                  const cassNames = getCassNames((biopsia.servicios as any)?.corteBlancoComunCassettes || []);
                  svcs.push('<span class="badge badge-servicio">Corte Blanco &times;' + biopsia.servicios.corteBlanco + cassNames + '</span>');
                }
                if ((biopsia.servicios?.giemsaPASMasson || 0) > 0) {
                  const opts = biopsia.servicios?.giemsaOptions;
                  const t: string[] = [];
                  if (opts?.giemsa) t.push('Giemsa');
                  if (opts?.pas) t.push('PAS');
                  if (opts?.masson) t.push('Masson');
                  const cassNames = getCassNames((biopsia.servicios as any)?.giemsaCassettes || []);
                  svcs.push('<span class="badge badge-servicio">' + (t.length > 0 ? t.join(', ') : 'Giemsa/PAS/Masson') + ' &times;' + biopsia.servicios.giemsaPASMasson + cassNames + '</span>');
                }
                if ((biopsia.servicios?.profundizacion || 0) > 0) svcs.push('<span class="badge badge-servicio" style="background:#dbeafe;color:#1d4ed8;">Profundización &times;' + biopsia.servicios.profundizacion + '</span>');
                if ((biopsia.servicios as any)?.incluyeCitologia) {
                  const fmt = (biopsia.servicios as any).citologiaFormato === 'jeringa' ? 'Jeringa' : (biopsia.servicios as any).citologiaFormato === 'frasco' ? 'Frasco' : ((biopsia.servicios as any).citologiaVidriosQty || 1) + ' vid.';
                  svcs.push('<span class="badge badge-servicio" style="background:#f3e8ff;color:#7c3aed;">Citología (' + fmt + ')</span>');
                }
                if ((biopsia.papQuantity || 0) > 0) svcs.push('<span class="badge badge-pap">PAP &times;' + biopsia.papQuantity + '</span>');
                if ((biopsia.citologiaQuantity || 0) > 0) svcs.push('<span class="badge badge-cito">Cito &times;' + biopsia.citologiaQuantity + '</span>');

                // Calcular diferencia si fue editado por el lab
                const currCass = Number(biopsia.cassettes) || 0;
                let diff = 0;
                if (((remito as any).modificadoPorAdmin || (remito as any).modificadoPorSolicitud) && tipo !== 'PAP' && tipo !== 'CITO') {
                  // Buscar cantidad original del historial del doctor
                  const origCass = (biopsia as any)._originalCassettes;
                  if (origCass !== undefined && origCass !== null && currCass > origCass) {
                    diff = currCass - origCass;
                  } else {
                    // Buscar en el historial del doctor por remitoNumber
                    try {
                      const rn = (remito as any).remitoNumber;
                      const email = ((remito as any).doctorEmail || remito.email || '').toLowerCase().trim().replace(/\s+/g, '');
                      const histKey = `doctor_${email}_history`;
                      const hist = JSON.parse(localStorage.getItem(histKey) || '{}');
                      const origEntry = Object.values(hist).find((e: any) => e.remitoNumber === rn) as any;
                      if (origEntry?.biopsies) {
                        const origBiopsy = origEntry.biopsies.find((ob: any) => ob.number === biopsia.numero);
                        if (origBiopsy) {
                          const origC = Number(origBiopsy.cassettes) || 0;
                          if (currCass > origC) diff = currCass - origC;
                        }
                      }
                    } catch {}
                  }
                }
                const ihqVidTotal = tipo === 'IHQ' ? ((biopsia.trozoPorCassette || []).reduce((s: number, v: number) => s + (v || 1), 0) || currCass) : 0;
                const cantLabel = tipo === 'IHQ' ? currCass + ' cass. / ' + ihqVidTotal + ' vid.'
                  : tipo === 'PAP' ? (biopsia.papQuantity || 1) + ' vid.'
                  : tipo === 'CITO' ? (biopsia.citologiaQuantity || 1) + ' vid.'
                  : diff > 0 ? currCass + ' <span style="color:#059669;font-size:10px;font-weight:700">(+' + diff + ')</span> <span style="color:#6b7280;font-size:9px;font-style:italic;">Dividido por el Lab</span>' : String(currCass);

                const isNoVino = (biopsia as any).noVino;
                const isProf = (remito as any).esServicioAdicional && ((remito as any).notaServicioAdicional || '').includes('Profundización');
                const isSA = (remito as any).esServicioAdicional && !isProf;
                const rowStyle = isNoVino ? 'background:#fef2f2;text-decoration:line-through;color:#9ca3af;' : diff > 0 ? 'background:#f0fdf4;' : isProf ? 'background:#eff6ff;' : isSA ? 'background:#f5f3ff;' : '';
                const cargadoPorLabel = (remito as any).cargadoPor || '';
                const remitoDisplay = ((remito as any).remitoNumber || remito.id.slice(-6).toUpperCase()) + ((remito as any).remitoOriginalId ? '<br><span style="font-size:9px;color:#94a3b8;">Orig: #' + (remito as any).remitoOriginalId + '</span>' : '');
                const tipoDisplay = isProf ? '<span class="badge" style="background:#dbeafe;color:#1d4ed8;">PROF</span>' : isSA ? '<span class="badge" style="background:#f3e8ff;color:#7c3aed;">SA</span>' : '<span class="badge ' + bc + '">' + tipo + '</span>';
                return '<tr style="' + rowStyle + '">' +
                  '<td style="font-size:11px;color:#64748b;font-family:monospace;">#' + remitoDisplay + '</td>' +
                  '<td style="font-size:11px;color:#d97706;">' + (cargadoPorLabel || '-') + '</td>' +
                  '<td>' + new Date((remito as any).timestamp || remito.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' }) + '</td>' +
                  '<td><strong>' + biopsia.numero + '</strong>' + (biopsia.numeroExterno ? ' <span style="color:#b45309;font-size:10px;">(Ext: ' + biopsia.numeroExterno + ')</span>' : '') + '</td>' +
                  '<td>' + biopsia.tejido + '</td>' +
                  '<td>' + tipoDisplay + '</td>' +
                  '<td>' + cantLabel + '</td>' +
                  '<td class="servicios-cell">' + (isNoVino ? '<span style="color:#dc2626;font-weight:700;text-decoration:none;display:inline-block;">❌ No se recibió en el Lab</span>' : svcs.length > 0 ? svcs.join(' ') : '<span style="color:#94a3b8">Estándar</span>') + '</td>' +
                  '<td class="subtotal">$' + calcularTotalBiopsia(biopsia).toLocaleString() + '</td>' +
                  '</tr>';
              }).join('')
            ).join('')}
            <tr class="total-row">
              <td colspan="8" style="text-align:right; text-transform:uppercase; letter-spacing:1px; font-size:12px;">Total a Facturar</td>
              <td style="text-align:right; font-size:18px;">$${totalGeneral.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${(() => {
        // Desempeño por usuario
        const porUsuario: Record<string, { remitos: number; estudios: number }> = {};
        remitosDelMedico.forEach((r: any) => {
          const quien = (r as any).cargadoPor || 'Dr/a. ' + medico;
          if (!porUsuario[quien]) porUsuario[quien] = { remitos: 0, estudios: 0 };
          porUsuario[quien].remitos++;
          porUsuario[quien].estudios += r.biopsias.length;
        });
        const usuarios = Object.entries(porUsuario);
        if (usuarios.length <= 1) return '';
        const maxEstudios = Math.max(...usuarios.map(([, d]) => d.estudios));
        const colores = ['#1e40af', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
        const totalEstudios = usuarios.reduce((s, [, d]) => s + d.estudios, 0);
        return '<div style="margin-top:24px;padding:20px;background:linear-gradient(135deg,#f8fafc,#f1f5f9);border:1px solid #e2e8f0;border-radius:12px;">' +
          '<h4 style="margin:0 0 16px;font-size:13px;color:#1e293b;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:center;">📊 Desempeño por Usuario</h4>' +
          '<div style="display:flex;gap:12px;margin-bottom:16px;justify-content:center;">' +
          usuarios.map(([nombre, datos], i) => {
            const color = colores[i % colores.length];
            const pct = totalEstudios > 0 ? Math.round((datos.estudios / totalEstudios) * 100) : 0;
            return '<div style="flex:1;max-width:200px;background:white;border-radius:10px;padding:14px;text-align:center;border:2px solid ' + color + '20;box-shadow:0 2px 8px rgba(0,0,0,0.04);">' +
              '<div style="font-size:11px;color:#64748b;margin-bottom:6px;">' + nombre + '</div>' +
              '<div style="font-size:28px;font-weight:800;color:' + color + ';">' + datos.estudios + '</div>' +
              '<div style="font-size:9px;color:#94a3b8;margin-bottom:8px;">estudios (' + pct + '%)</div>' +
              '<div style="background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden;">' +
              '<div style="background:' + color + ';height:100%;width:' + (maxEstudios > 0 ? Math.round((datos.estudios / maxEstudios) * 100) : 0) + '%;border-radius:4px;"></div>' +
              '</div>' +
              '<div style="font-size:10px;color:#64748b;margin-top:6px;">' + datos.remitos + ' remito' + (datos.remitos !== 1 ? 's' : '') + '</div>' +
            '</div>';
          }).join('') +
          '</div>' +
          '<div style="text-align:center;font-size:11px;color:#94a3b8;">Total: ' + totalEstudios + ' estudios en ' + remitosDelMedico.length + ' remitos</div>' +
        '</div>';
      })()}

      <div class="footer">
        Reporte generado el ${fechaActual} &nbsp;·&nbsp; Powered by BiopsyTracker<br>
        Este documento es confidencial y está destinado únicamente para el uso del destinatario.
      </div>
    </body>
    </html>
    `;

    return htmlContent;
  };

  // Verificar si ya se envió email de facturación este mes
  const emailYaEnviado = (medico: string, centro?: string): boolean => {
    try {
      const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      const key = `emailsFacturacion_${mes.replace(/\s+/g, '_')}`;
      const historial = JSON.parse(localStorage.getItem(key) || '[]');
      return historial.some((e: any) => e.medico === medico && (!centro || e.centro === centro));
    } catch { return false; }
  };

  // Registrar envío de email de facturación
  const [emailSentCounter, setEmailSentCounter] = useState(0);
  const registrarEmailEnviado = (medico: string, email: string, centro?: string) => {
    try {
      const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      const key = `emailsFacturacion_${mes.replace(/\s+/g, '_')}`;
      const historial = JSON.parse(localStorage.getItem(key) || '[]');
      historial.push({
        medico,
        email,
        centro: centro || '',
        fecha: new Date().toISOString(),
        mes
      });
      localStorage.setItem(key, JSON.stringify(historial));
      setEmailSentCounter(prev => prev + 1); // Forzar re-render
    } catch {}
  };

  const exportarFacturacionMedico = (medico: string, centroFilter?: string) => {
    const htmlContent = generarHTMLFacturacion(medico, centroFilter);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const centroSuffix = centroFilter ? `_${centroFilter.replace(/\s+/g, '_')}` : '';
    link.setAttribute('href', url);
    const mesArchivo = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');
    link.setAttribute('download', `Facturacion_${mesArchivo}_${medico.replace(/\s+/g, '_')}${centroSuffix}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generar HTML compacto para email de facturación (< 50KB para EmailJS)
  const generarHTMLEmailFacturacion = (medico: string, centroFilter?: string) => {
    const fn = labConfig.nombre || 'Laboratorio';
    const fa = new Date().toLocaleDateString('es-AR');
    let ft = '', btRaw = '';
    try { const cfg = JSON.parse(localStorage.getItem('emailjsConfig') || '{}'); ft = cfg.footerText || ''; btRaw = cfg.bodyText || ''; } catch {}
    const info = [labConfig.direccion, labConfig.telefono, labConfig.email].filter(Boolean).join(' | ');
    const mesActual = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const defaultBody = `Estimado/a Dr./Dra. ${medico},\nPor medio de la presente, le adjuntamos el detalle completo de las biopsias y pacientes remitidos a nuestro laboratorio durante el mes de ${mesActual}.\nQuedamos a su disposición para cualquier consulta o aclaración que considere necesaria.\nSin otro particular, saludamos a usted muy atentamente.`;
    const bt = btRaw || defaultBody;

    const rmAll = remitos.filter(r => r.medico === medico);
    const centros = centroFilter ? [centroFilter] : [...new Set(rmAll.map(r => r.hospital || '').filter(Boolean))];
    const isMulti = !centroFilter && centros.length > 1;

    // Estilos reutilizables abreviados
    const td = 'padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;';
    const th = 'padding:6px 8px;text-align:left;font-size:10px;color:#fff;';

    const seccion = (rm: any[], tit?: string) => {
      const tot = rm.reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
      const rows = rm.flatMap(r => r.biopsias.map((b: any) => {
        const tipo = (b.tipo === 'IHQ' || b.tejido === 'Inmunohistoquímica') ? 'IHQ' : (b.tipo === 'TC' || b.tejido === 'Taco en Consulta') ? 'TACO' : b.tipo === 'PQ' ? 'PQ' : b.tejido === 'PAP' ? 'PAP' : b.tejido === 'Citología' ? 'CITO' : 'BX';
        if (b.noVino) return '<tr style="color:#aaa;text-decoration:line-through;"><td style="' + td + '">' + b.numero + '</td><td style="' + td + '">' + b.tejido + '</td><td style="' + td + '">' + tipo + '</td><td style="' + td + 'text-align:center;">-</td><td style="' + td + '">No recibido</td><td style="' + td + 'text-align:right;">$0</td></tr>';
        const sv: string[] = [];
        if ((b.servicios?.cassetteUrgente || 0) > 0) sv.push('URGENTE');
        if ((b.servicios?.corteBlancoIHQ || 0) > 0) sv.push('IHQ x' + b.servicios.corteBlancoIHQ);
        if ((b.servicios?.corteBlanco || 0) > 0) sv.push('CB x' + b.servicios.corteBlanco);
        if ((b.servicios?.giemsaPASMasson || 0) > 0) { const o = b.servicios?.giemsaOptions; const t = [o?.giemsa && 'Giemsa', o?.pas && 'PAS', o?.masson && 'Masson'].filter(Boolean); sv.push(t.length ? t.join('/') : 'Tinción'); }
        if ((b.servicios?.profundizacion || 0) > 0) sv.push('Prof x' + b.servicios.profundizacion);
        const ihq = tipo === 'IHQ' ? ((b.trozoPorCassette || []).reduce((s: number, v: number) => s + (v || 1), 0) || parseInt(b.cassettes) || 0) : 0;
        const cant = tipo === 'IHQ' ? (parseInt(b.cassettes) || 0) + '/' + ihq + 'v' : tipo === 'PAP' ? (b.papQuantity || 1) + 'v' : tipo === 'CITO' ? (b.citologiaQuantity || 1) + 'v' : String(parseInt(b.cassettes) || 0);
        return '<tr><td style="' + td + 'font-weight:600;">' + b.numero + '</td><td style="' + td + '">' + b.tejido + '</td><td style="' + td + 'font-weight:700;color:#1e40af;">' + tipo + '</td><td style="' + td + 'text-align:center;">' + cant + '</td><td style="' + td + 'font-size:11px;">' + (sv.length ? sv.join(', ') : '-') + '</td><td style="' + td + 'text-align:right;font-weight:700;">$' + calcularTotalBiopsia(b).toLocaleString() + '</td></tr>';
      })).join('');
      return (tit ? '<h3 style="color:#1e40af;font-size:13px;margin:16px 0 6px;border-bottom:2px solid #dbeafe;padding-bottom:4px;">' + tit + ' (' + rm.length + ' rem.)</h3>' : '') +
        '<table style="width:100%;border-collapse:collapse;">' +
        '<tr style="background:#0f172a;"><th style="' + th + '">N°</th><th style="' + th + '">Material</th><th style="' + th + '">Tipo</th><th style="' + th + 'text-align:center;">Cant.</th><th style="' + th + '">Servicios</th><th style="' + th + 'text-align:right;">Subtotal</th></tr>' +
        rows +
        '<tr style="background:#0f172a;"><td colspan="5" style="padding:8px;text-align:right;font-weight:700;font-size:12px;color:#fff;">' + (tit ? 'Subtotal ' + tit : 'TOTAL') + '</td><td style="padding:8px;text-align:right;font-weight:700;font-size:15px;color:#fff;">$' + tot.toLocaleString() + '</td></tr></table>';
    };

    const rmF = centroFilter ? rmAll.filter(r => (r.hospital || '') === centroFilter) : rmAll;
    const totG = rmF.reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
    const totP = rmF.reduce((s, r) => s + r.biopsias.length, 0);

    let det = '';
    if (isMulti) {
      centros.forEach(c => det += seccion(rmAll.filter(r => (r.hospital || '') === c), c));
      const sc = rmAll.filter(r => !r.hospital);
      if (sc.length) det += seccion(sc, 'Sin centro');
      det += '<div style="background:#0f172a;color:#fff;padding:12px 16px;border-radius:6px;margin-top:12px;text-align:right;"><b style="font-size:13px;margin-right:16px;">TOTAL GENERAL</b><b style="font-size:18px;">$' + totG.toLocaleString() + '</b></div>';
    } else {
      det = seccion(rmF);
    }

    const pie = ft ? '<div style="margin-top:20px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;"><div style="font-size:10px;font-weight:700;color:#555;text-transform:uppercase;margin-bottom:6px;">Datos de pago</div><div style="font-size:12px;color:#1e293b;line-height:1.5;">' + ft.replace(/\n/g, '<br>') + '</div></div>' : '';

    return '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">' +
      '<div style="background:#0f172a;color:#fff;padding:20px;text-align:center;">' +
      '<h2 style="margin:0;font-size:17px;">' + fn + '</h2>' +
      (info ? '<p style="margin:4px 0 0;font-size:10px;opacity:0.7;">' + info + '</p>' : '') + '</div>' +
      '<div style="padding:20px;">' +
      (bt ? '<div style="font-size:13px;color:#333;line-height:1.6;margin-bottom:20px;">' + bt.replace(/\n/g, '<br>') + '</div>' : '') +
      '<table style="width:100%;margin-bottom:16px;"><tr><td><div style="font-size:16px;font-weight:700;color:#0f172a;">Facturación ' + mesActual + (centroFilter ? ' — ' + centroFilter : '') + '</div>' +
      '<div style="font-size:13px;color:#1e40af;font-weight:600;margin-top:3px;">Dr/a. ' + medico + '</div>' +
      '<div style="font-size:11px;color:#888;margin-top:3px;">' + fa + ' · ' + rmF.length + ' rem. · ' + totP + ' pac.</div></td>' +
      '<td style="text-align:right;vertical-align:top;"><div style="font-size:9px;color:#888;text-transform:uppercase;">Total</div><div style="font-size:24px;font-weight:800;color:#0f172a;">$' + totG.toLocaleString() + '</div></td></tr></table>' +
      det + pie +
      '<div style="text-align:center;padding:12px 0;margin-top:16px;color:#aaa;font-size:9px;border-top:1px solid #eee;">' + fa + ' · BiopsyTracker</div>' +
      '</div></div>';
  };

  const exportarExcel = (medicoFiltro: string | null = null) => {
    const remitosFiltro = medicoFiltro 
      ? remitos.filter(r => r.medico === medicoFiltro)
      : remitos;
      
    let csvContent = 'Médico,Fecha,Hospital,Número Biopsia,Tejido,Tipo,Total Cassettes,Total Biopsia,Estado\n';
    
    remitosFiltro.forEach(remito => {
      remito.biopsias.forEach(biopsia => {
        const totalBiopsia = calcularTotalBiopsia(biopsia);
        
        csvContent += [
          remito.medico, remito.fecha, remito.hospital, biopsia.numero, biopsia.tejido, biopsia.tipo,
          biopsia.cassettes || 0, totalBiopsia, remito.estado
        ].join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `remitos_admin_${medicoFiltro || 'todos'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 flex items-center justify-center p-4 overflow-hidden">
        <div className="bg-white rounded-2xl shadow-2xl p-2 w-full max-w-md border border-gray-100">
          <div className="text-center mb-1">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-3 border-2 border-blue-200 shadow-sm">
              <img 
                src={`${import.meta.env.BASE_URL}assets/biopsytracker_logo_final.svg`} 
                alt="BiopsyTracker Logo" 
                className="w-full h-56 mx-auto"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}
              />
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-1 mt-1">
              <p className="text-sm text-gray-700">🔒 Acceso restringido para administradores</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Ingrese su usuario"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-200"
                  placeholder="Ingrese su contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Código de Laboratorio</label>
              <input
                type="text"
                value={loginForm.labCode}
                onChange={(e) => setLoginForm(prev => ({ ...prev, labCode: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 uppercase tracking-widest text-center font-mono text-lg"
                placeholder="Ej: A1B2C3"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Código de 6 caracteres proporcionado por BiopsyTracker</p>
            </div>

            <button
              onClick={handleLogin}
              disabled={!loginForm.username || !loginForm.password || !loginForm.labCode}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              Iniciar Sesión
            </button>
            
            <button
              onClick={onGoBack}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Volver a la App</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen shadow-2xl">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-slate-700">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <span className="text-xl font-bold">{(() => { try { const labs = JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]'); const lab = labs.find((l: any) => l.labCode === currentLabCode); return lab ? lab.nombre : 'BiopsyTracker'; } catch { return 'BiopsyTracker'; } })()}</span>
              <p className="text-xs text-slate-300">Admin — <span className="font-mono">{currentLabCode}</span></p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard', desc: 'Urgentes, en proceso y listos para retirar', roles: ['admin', 'tecnico'] },
              { id: 'remitos', icon: FileText, label: 'Gestión de Remitos', desc: 'Editar biopsias y agregar servicios adicionales', roles: ['admin', 'tecnico'] },
              { id: 'solicitudes', icon: Package, label: 'Solicitudes', desc: 'Tacos, profundizaciones y servicios adicionales', roles: ['admin', 'tecnico'] },
              { id: 'buscador-tacos', icon: Search, label: 'Buscar Taco', desc: 'Buscar cassette por número', roles: ['admin', 'tecnico'] },
              { id: 'facturacion', icon: DollarSign, label: 'Facturación', desc: 'Enviar detalle mensual a cada médico', roles: ['admin'] },
              { id: 'analytics', icon: DollarSign, label: 'Cobros', desc: 'Quién pagó, quién debe y registro de pagos', roles: ['admin'] },
              { id: 'configuracion', icon: Settings, label: 'Configuración', desc: 'Precios, tejidos, datos del laboratorio y médicos', roles: ['admin'] }
            ].filter(item => item.roles.includes(userRole)).map(({ id, icon: Icon, label, desc }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`w-full group relative overflow-hidden rounded-xl transition-all duration-200 ${
                  currentView === id 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' 
                    : 'hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-3 px-4 py-3">
                  <Icon size={20} className={currentView === id ? 'text-white' : 'text-slate-300'} />
                  <div className="text-left flex-1">
                    <span className={`font-medium ${currentView === id ? 'text-white' : 'text-slate-200'}`}>
                      {label}
                    </span>
                    <p className={`text-xs ${currentView === id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {desc}
                    </p>
                  </div>
                  {id === 'solicitudes' && solicitudesAdmin.filter((s: any) => s.estado === 'pendiente' || s.estado === 'en_proceso').length > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5">
                      {solicitudesAdmin.filter((s: any) => s.estado === 'pendiente' || s.estado === 'en_proceso').length}
                    </span>
                  )}
                </div>
                {currentView === id && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-8 p-4 bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-slate-600">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="text-green-400" size={16} />
              <span className="text-sm font-medium text-slate-200">Sistema Activo</span>
            </div>
            <p className="text-xs text-slate-400">
              {remitos.length} remitos gestionados
            </p>
            <div className="mt-3 bg-slate-600 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full w-3/4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Panel de Administrador
                  </h1>
                  <p className="text-gray-600">{(() => { try { const labs = JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]'); const lab = labs.find((l: any) => l.labCode === currentLabCode); return lab ? lab.nombre : 'Laboratorio'; } catch { return 'Laboratorio'; } })()} — <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{currentLabCode}</span></p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button onClick={onGoBack} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <ArrowLeft size={16} />
                  <span>Volver a la App</span>
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">Administrador</p>
                    <p className="text-xs text-gray-500">{userRole === 'tecnico' ? '🔧 Técnico' : '🔑 Administrador'}</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">A</span>
                  </div>
                </div>
                
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <Lock size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {currentView === 'dashboard' && (() => {
            const sortedRemitos = [...remitos].sort((a, b) => new Date((b as any).timestamp || b.fecha).getTime() - new Date((a as any).timestamp || a.fecha).getTime());
            const esRemitoListo = (r: any) => {
              const bl = r.biopsiaListas || [];
              return r.estadoEnvio === 'listo' || (bl.length > 0 && bl.length === r.biopsias.length && bl.every(Boolean));
            };
            const bEsUrgente = (b: any) => (b.servicios?.cassetteUrgente || 0) > 0 || (b.servicios?.papUrgente || 0) > 0 || (b.servicios?.citologiaUrgente || 0) > 0;
            // Un remito tiene urgentes PENDIENTES si tiene alguna biopsia urgente no marcada como lista
            const tieneUrgentesPendientes = (r: any) => {
              const bl = r.biopsiaListas || [];
              return r.biopsias.some((b: any, i: number) => bEsUrgente(b) && !bl[i]);
            };
            // Un remito tiene al menos una biopsia pendiente
            const tienePendientes = (r: any) => {
              const bl = r.biopsiaListas || [];
              return r.biopsias.some((_: any, i: number) => !bl[i]);
            };
            const enProceso = remitos.filter(r => !esRemitoListo(r));
            const listos = remitos.filter(r => esRemitoListo(r) || !tienePendientes(r));
            const urgentes = remitos.filter(r => tieneUrgentesPendientes(r));

            const filteredRemitos = sortedRemitos.filter(r => {
              if (dashFilter === 'actual') return tienePendientes(r);
              if (dashFilter === 'proceso') return tienePendientes(r) && !tieneUrgentesPendientes(r);
              if (dashFilter === 'urgentes') return tieneUrgentesPendientes(r);
              if (dashFilter === 'listos') return !tienePendientes(r);
              return tienePendientes(r);
            });

            // Tiempo promedio total (carga → listo)
            const tiemposProc = listos.map(r => {
              const inicio = new Date((r as any).timestamp || r.fecha).getTime();
              const fin = new Date((r as any).listoAt || Date.now()).getTime();
              return (fin - inicio) / (1000 * 60 * 60);
            });
            const tiempoPromedio = tiemposProc.length > 0 ? Math.round(tiemposProc.reduce((a, b) => a + b, 0) / tiemposProc.length) : 0;

            // Tiempo promedio de procesamiento en lab (recibido → listo)
            const tiemposLab = listos.filter(r => (r as any).fechaMaterialRecibido && (r as any).listoAt).map(r => {
              const recibido = new Date((r as any).fechaMaterialRecibido).getTime();
              const listo = new Date((r as any).listoAt).getTime();
              return (listo - recibido) / (1000 * 60 * 60);
            });
            const tiempoLab = tiemposLab.length > 0 ? Math.round(tiemposLab.reduce((a, b) => a + b, 0) / tiemposLab.length) : 0;

            // Remitos esperando material
            const esperanMaterial = enProceso.filter(r => !(r as any).materialRecibido).length;

            return (
            <div className="p-4 space-y-3 h-full overflow-auto">

              {/* ALERTA DE URGENCIAS */}
              {urgentes.length > 0 && (
                <div className="bg-red-600 rounded-xl p-4 text-white flex items-center gap-4" style={{ animation: 'pulse 3s infinite' }}>
                  <div className="bg-white/20 rounded-lg p-3 flex-shrink-0">
                    <Activity size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold">⚠ {urgentes.length} remito{urgentes.length > 1 ? 's' : ''} con estudios URGENTES</div>
                    <div className="text-sm opacity-90 mt-1">
                      {urgentes.slice(0, 3).map(r => `Dr/a. ${r.medico}`).join(' · ')}
                      {urgentes.length > 3 ? ` y ${urgentes.length - 3} más` : ''}
                    </div>
                  </div>
                  <button onClick={() => setDashFilter('urgentes')} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-bold flex-shrink-0">
                    Ver urgentes
                  </button>
                </div>
              )}

              {/* KPIs compactos */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'En proceso', value: enProceso.length, icon: <Clock size={18} />, bg: '#d97706' },
                  { label: 'Espera material', value: esperanMaterial, icon: <Package size={18} />, bg: '#9333ea' },
                  { label: 'Listos', value: listos.length, icon: <CheckCircle size={18} />, bg: '#059669' },
                  { label: 'Urgentes', value: urgentes.length, icon: <Activity size={18} />, bg: '#dc2626' },
                ].map((kpi, i) => (
                  <div key={i} style={{ backgroundColor: kpi.bg }} className="rounded-xl p-3 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold">{kpi.value}</div>
                        <div className="text-xs opacity-80">{kpi.label}</div>
                      </div>
                      <div className="opacity-60">{kpi.icon}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* KPIs de tiempos */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total remitos', value: remitos.length, icon: <FileText size={18} />, bg: '#1e40af' },
                  { label: 'Tiempo total prom.', value: tiempoPromedio > 24 ? Math.round(tiempoPromedio / 24) + 'd' : tiempoPromedio + 'h', icon: <Clock size={18} />, bg: '#7c3aed' },
                  { label: 'Tiempo lab prom.', value: tiemposLab.length > 0 ? (tiempoLab > 24 ? Math.round(tiempoLab / 24) + 'd' : tiempoLab + 'h') : 'S/D', icon: <Activity size={18} />, bg: '#0891b2' }
                ].map((kpi, i) => (
                  <div key={i} style={{ backgroundColor: kpi.bg }} className="rounded-xl p-3 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold">{kpi.value}</div>
                        <div className="text-xs opacity-80">{kpi.label}</div>
                      </div>
                      <div style={{ opacity: 0.3 }}>{kpi.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filtros rápidos + Accesos directos */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {[
                    { key: 'actual', label: 'Actual', count: enProceso.length },
                    { key: 'urgentes', label: 'Urgentes', count: urgentes.length },
                    { key: 'listos', label: 'Listos', count: listos.length },
                  ].map(f => (
                    <button key={f.key} onClick={() => setDashFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        dashFilter === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}>
                      {f.label} ({f.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabla de remitos filtrados */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '28%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Remito</th>
                      <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Médico</th>
                      <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Fecha</th>
                      <th className="text-center py-2 px-2 text-xs text-gray-500 font-semibold">Pac.</th>
                      <th className="text-right py-2 px-2 text-xs text-gray-500 font-semibold">Total</th>
                      <th className="text-center py-2 px-2 text-xs text-gray-500 font-semibold">Prioridad</th>
                      <th className="text-center py-2 px-2 text-xs text-gray-500 font-semibold">Estado</th>
                      <th className="text-center py-2 px-2 text-xs text-gray-500 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRemitos.slice(0, 15).map(remito => {
                      const biopsiaListas: boolean[] = (remito as any).biopsiaListas || remito.biopsias.map(() => false);
                      const listasCount = biopsiaListas.filter(Boolean).length;
                      const totalBiopsias = remito.biopsias.length;
                      const todasListas = listasCount === totalBiopsias && totalBiopsias > 0;
                      const isListo = (remito as any).estadoEnvio === 'listo' || todasListas;
                      const hasUrgent = remito.biopsias.some(b => (b.servicios?.cassetteUrgente || 0) > 0 || (b.servicios?.papUrgente || 0) > 0 || (b.servicios?.citologiaUrgente || 0) > 0);
                      const isExpanded = expandedUrgents.has(remito.id);
                      // Biopsias visibles según el filtro activo
                      const biopsiaEsUrgente = (b: any) => (b.servicios?.cassetteUrgente || 0) > 0 || (b.servicios?.papUrgente || 0) > 0 || (b.servicios?.citologiaUrgente || 0) > 0;
                      const biopsiasPendientes = remito.biopsias.filter((_: any, i: number) => !biopsiaListas[i]);
                      const pendientesCount = biopsiasPendientes.length;
                      let whatsappNum = '';
                      try { const docs = JSON.parse(localStorage.getItem('registeredDoctors') || '[]'); const doc = docs.find((d: any) => d.email?.toLowerCase() === (remito.email || (remito as any).doctorEmail || '').toLowerCase()); whatsappNum = doc?.whatsapp || ''; } catch {}

                      const marcarBiopsia = (idx: number, valor: boolean) => {
                        const nuevasListas = [...biopsiaListas];
                        while (nuevasListas.length < totalBiopsias) nuevasListas.push(false);
                        nuevasListas[idx] = valor;
                        const todasAhoraListas = nuevasListas.every(Boolean);
                        const updated = remitos.map(r => r.id === remito.id ? {
                          ...r,
                          biopsiaListas: nuevasListas,
                          estadoEnvio: todasAhoraListas ? 'listo' : (r as any).estadoEnvio === 'listo' ? undefined : (r as any).estadoEnvio,
                          listoAt: todasAhoraListas ? new Date().toISOString() : (r as any).listoAt
                        } as any : r);
                        setRemitos(updated);
                        localStorage.setItem('adminRemitos', JSON.stringify(updated));
                        db.saveRemitos(updated).catch(console.error);

                        // Notificar al médico sobre las biopsias marcadas
                        const biopsia = remito.biopsias[idx];
                        const esPAP = biopsia.tejido === 'PAP' || (biopsia.papQuantity || 0) > 0;
                        const esCito = biopsia.tejido === 'Citología' || (biopsia.citologiaQuantity || 0) > 0;
                        const tipoB = esPAP ? 'PAP' : esCito ? ((biopsia as any).citologiaSubType || 'Citología') : (biopsia.tipo === 'TC' || biopsia.tejido === 'Taco en Consulta') ? 'TACO' : biopsia.tipo === 'PQ' ? 'PQ' : biopsia.tipo === 'IHQ' || biopsia.tejido === 'Inmunohistoquímica' ? 'IHQ' : 'BX';
                        if (valor) {
                          const notifications = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
                          let newNotif: any;
                          if (todasAhoraListas) {
                            newNotif = { id: `NOTIF_LISTO_${Date.now()}`, remitoId: remito.id, medicoEmail: (remito as any).doctorEmail || remito.email, mensaje: `Su remito #${((remito as any).remitoNumber || remito.id.slice(-6).toUpperCase())} está LISTO PARA RETIRAR.\nTodos los estudios (${totalBiopsias}) fueron procesados.`, fecha: new Date().toISOString(), leida: false, tipo: 'listo' };
                            notifications.push(newNotif);
                          } else {
                            newNotif = { id: `NOTIF_PARCIAL_${Date.now()}`, remitoId: remito.id, medicoEmail: (remito as any).doctorEmail || remito.email, mensaje: `Paciente #${biopsia.numero} (${tipoB} - ${biopsia.tejido}) está LISTO.\nProgreso del remito: ${nuevasListas.filter(Boolean).length}/${totalBiopsias} estudios listos.`, fecha: new Date().toISOString(), leida: false, tipo: 'parcial' };
                            notifications.push(newNotif);
                          }
                          localStorage.setItem('doctorNotifications', JSON.stringify(notifications));
                          db.saveNotification(newNotif).catch(console.error);

                          // Auto-marcar solicitud de taco como entregado
                          try {
                            if ((biopsia as any).entregarConTaco) {
                              const remitoNum = (remito as any).remitoNumber;
                              const allSols = [...solicitudesAdmin, ...JSON.parse(localStorage.getItem('solicitudes') || '[]')];
                              const solTaco = allSols.find((s: any) => s.tipo === 'taco' && s.remitoNumber === remitoNum && s.numeroPaciente === biopsia.numero && s.estado !== 'entregado');
                              if (solTaco) {
                                const updatedSol = { ...solTaco, estado: 'entregado', entregadoAt: new Date().toISOString(), entregadoPor: loginForm.username || 'Laboratorio' };
                                db.saveSolicitud(updatedSol).catch(console.error);
                                setSolicitudesAdmin(prev => prev.some(s => s.id === solTaco.id) ? prev.map(s => s.id === solTaco.id ? updatedSol : s) : [...prev, updatedSol]);
                              }
                            }
                          } catch (e) { console.error('Error auto-entregando taco:', e); }
                        }
                      };

                      const marcarTodas = () => {
                        const nuevasListas = remito.biopsias.map(() => true);
                        const updated = remitos.map(r => r.id === remito.id ? { ...r, biopsiaListas: nuevasListas, estadoEnvio: 'listo', listoAt: new Date().toISOString() } as any : r);
                        setRemitos(updated);
                        localStorage.setItem('adminRemitos', JSON.stringify(updated));
                        db.saveRemitos(updated).catch(console.error);
                        const notifications = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
                        const newNotif = { id: `NOTIF_LISTO_${Date.now()}`, remitoId: remito.id, medicoEmail: (remito as any).doctorEmail || remito.email, mensaje: `Su remito #${((remito as any).remitoNumber || remito.id.slice(-6).toUpperCase())} está LISTO PARA RETIRAR.\nTodos los estudios (${totalBiopsias}) fueron procesados.`, fecha: new Date().toISOString(), leida: false, tipo: 'listo' };
                        notifications.push(newNotif);
                        localStorage.setItem('doctorNotifications', JSON.stringify(notifications));
                        db.saveNotification(newNotif).catch(console.error);

                        // Auto-marcar solicitudes de taco como entregadas
                        try {
                          const remitoNum = (remito as any).remitoNumber;
                          const allSols = [...solicitudesAdmin, ...JSON.parse(localStorage.getItem('solicitudes') || '[]')];
                          remito.biopsias.forEach((biopsia: any) => {
                            if (biopsia.entregarConTaco) {
                              const solTaco = allSols.find((s: any) => s.tipo === 'taco' && s.remitoNumber === remitoNum && s.numeroPaciente === biopsia.numero && s.estado !== 'entregado');
                              if (solTaco) {
                                const updatedSol = { ...solTaco, estado: 'entregado', entregadoAt: new Date().toISOString(), entregadoPor: loginForm.username || 'Laboratorio' };
                                db.saveSolicitud(updatedSol).catch(console.error);
                                setSolicitudesAdmin(prev => prev.some(s => s.id === solTaco.id) ? prev.map(s => s.id === solTaco.id ? updatedSol : s) : [...prev, updatedSol]);
                              }
                            }
                          });
                        } catch (e) { console.error('Error auto-entregando tacos:', e); }
                      };

                      return (
                        <React.Fragment key={remito.id}>
                        <tr className={`border-b border-gray-50 cursor-pointer ${isListo ? 'bg-green-50/40' : hasUrgent ? 'bg-red-50/40' : ''}`}
                          onClick={() => { const next = new Set(expandedUrgents); if (next.has(remito.id)) next.delete(remito.id); else next.add(remito.id); setExpandedUrgents(next); }}>
                          <td className="py-2 px-3">
                            <span className="font-mono text-xs font-bold text-blue-700">#{(remito as any).remitoNumber || remito.id.slice(-6).toUpperCase()}</span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-gray-900 text-xs">Dr/a. {remito.medico}</div>
                            {remito.hospital && (
                              <div className="text-xs text-blue-500">{remito.hospital}</div>
                            )}
                            {(remito as any).cargadoPor && (
                              <div className="text-xs text-amber-600">Cargado por: {(remito as any).cargadoPor}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-500">
                            {new Date(remito.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            {(() => {
                              const tCargado = new Date((remito as any).timestamp || remito.fecha).getTime();
                              const tRecibido = (remito as any).fechaMaterialRecibido ? new Date((remito as any).fechaMaterialRecibido).getTime() : null;
                              const tListo = (remito as any).listoAt ? new Date((remito as any).listoAt).getTime() : null;
                              if (!tRecibido && !tListo) return null;
                              const fmt = (ms: number) => { const m = Math.floor(ms / 60000); if (m < 60) return m + 'min'; const h = Math.floor(m / 60); if (h < 24) return h + 'h' + (m % 60 > 0 ? m % 60 + 'm' : ''); return Math.floor(h / 24) + 'd ' + (h % 24) + 'h'; };
                              return (
                                <div className="mt-0.5 space-y-0.5">
                                  {tRecibido && <div className="text-amber-600" style={{ fontSize: '9px' }}>📦 {fmt(tRecibido - tCargado)}</div>}
                                  {tRecibido && tListo && <div className="text-blue-600" style={{ fontSize: '9px' }}>⚙️ {fmt(tListo - tRecibido)}</div>}
                                  {tListo && <div className="text-green-600" style={{ fontSize: '9px' }}>✅ {fmt(tListo - tCargado)}</div>}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{dashFilter === 'listos' ? listasCount : pendientesCount}/{totalBiopsias}</span>
                          </td>
                          <td className="py-2 px-3 text-right text-xs font-bold text-gray-900">{userRole === 'admin' ? `$${calcularTotalRemito(remito.biopsias).toLocaleString()}` : '—'}</td>
                          <td className="py-2 px-3 text-center">
                            {hasUrgent ? (
                              <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">URGENTE</span>
                            ) : (
                              <span className="text-xs text-gray-400">Normal</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isListo ? (
                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">Listo</span>
                            ) : listasCount > 0 ? (
                              <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">Parcial</span>
                            ) : (
                              <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded">En proceso</span>
                            )}
                            {/* Indicador material / impreso */}
                            <div className="mt-0.5">
                              {(remito as any).impreso ? (
                                <span className="text-xs text-blue-600 font-semibold">🖨 Impreso</span>
                              ) : (remito as any).materialRecibido ? (
                                <span className="text-xs text-emerald-600 font-semibold">📦 Material recibido ✓</span>
                              ) : (
                                <span className="text-xs text-gray-400">⏳ Espera material</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex flex-col gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1">
                              {/* Botón Material Recibido */}
                              {!(remito as any).materialRecibido ? (
                                <button onClick={() => { if (confirm(`¿Confirmar que el MATERIAL FÍSICO del remito de Dr/a. ${remito.medico} fue recibido en el laboratorio?`)) toggleMaterialRecibido(remito.id); }}
                                  className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">📦 RECIBIDO</button>
                              ) : listasCount > 0 ? (
                                <span className="text-xs text-emerald-600 font-bold px-2 py-1">📦 ✓</span>
                              ) : (
                                <button onClick={() => { if (confirm(`¿Desmarcar material recibido del remito de Dr/a. ${remito.medico}?`)) toggleMaterialRecibido(remito.id); }}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">↩ Desmarcar</button>
                              )}
                              {/* Botón Entregar Todo */}
                              {!isListo && (
                                <button onClick={() => { if (confirm(`¿Marcar TODAS las biopsias del remito de Dr/a. ${remito.medico} como listas para retirar?\n\n${pendientesCount} estudio(s) pendiente(s) serán marcados como listos.\nEsta acción no se puede deshacer.`)) marcarTodas(); }} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">ENTREGAR TODO</button>
                              )}
                              {isListo && <span className="text-xs text-green-600 font-bold">✓ Completo</span>}
                              {whatsappNum && (
                                <a href={`https://wa.me/549${whatsappNum}?text=${encodeURIComponent(`Dr/a. ${remito.medico}, le informamos que ${isListo ? 'todo su material' : listasCount + ' de ' + totalBiopsias + ' estudios'} del remito #${((remito as any).remitoNumber || remito.id.slice(-6).toUpperCase())} ${isListo ? 'está listo para ser retirado' : 'ya están listos'}.\n\n${labConfig.nombre || 'Laboratorio'}\n${labConfig.telefono || ''}`)}`}
                                  target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">WA</a>
                              )}
                              <span className="text-gray-400 text-xs ml-1">{isExpanded ? '▲' : '▼'}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {/* Panel expandido con biopsias filtradas según tab */}
                        {isExpanded && (
                          <tr><td colSpan={8} className="p-0">
                            <div className="bg-gray-50 border-y border-gray-200">
                              <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                  <col style={{ width: '3%' }} />
                                  <col style={{ width: '9%' }} />
                                  <col style={{ width: '12%' }} />
                                  <col style={{ width: '6%' }} />
                                  <col style={{ width: '6%' }} />
                                  <col style={{ width: '8%' }} />
                                  <col style={{ width: '38%' }} />
                                  <col style={{ width: '18%' }} />
                                </colgroup>
                                <thead>
                                  <tr className="bg-gray-200">
                                    <th className="py-1.5 px-2 text-left text-gray-600 font-semibold"></th>
                                    <th className="py-1.5 px-2 text-left text-gray-600 font-semibold">N° Estudio</th>
                                    <th className="py-1.5 px-2 text-left text-gray-600 font-semibold">Material</th>
                                    <th className="py-1.5 px-2 text-center text-gray-600 font-semibold">Tipo</th>
                                    <th className="py-1.5 px-2 text-center text-gray-600 font-semibold">Cant.</th>
                                    <th className="py-1.5 px-2 text-center text-gray-600 font-semibold">Trozos</th>
                                    <th className="py-1.5 px-2 text-left text-gray-600 font-semibold">Servicios / Detalle</th>
                                    <th className="py-1.5 px-2 text-center text-gray-600 font-semibold">Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                {remito.biopsias.map((b, bi) => {
                                  const esPAP = b.tejido === 'PAP' || (b.papQuantity || 0) > 0;
                                  const esCito = b.tejido === 'Citología' || (b.citologiaQuantity || 0) > 0;
                                  const citoST = (b as any).citologiaSubType || '';
                                  const tipo = esPAP ? 'PAP' : esCito ? (citoST || 'Cito') : (b.tipo === 'TC' || b.tejido === 'Taco en Consulta') ? 'TACO' : b.tipo === 'PQ' ? 'PQ' : (b.tipo === 'IHQ' || b.tejido === 'Inmunohistoquímica') ? 'IHQ' : 'BX';
                                  const cass = parseInt(String(b.cassettes)) || 0;
                                  const esUrgente = biopsiaEsUrgente(b);
                                  const estaLista = biopsiaListas[bi] || false;

                                  if (dashFilter === 'urgentes' && !esUrgente) return null;
                                  if ((dashFilter === 'actual' || dashFilter === 'proceso') && estaLista) return null;
                                  if (dashFilter === 'listos' && !estaLista) return null;

                                  // Servicios detalle
                                  const svcList: string[] = [];
                                  const sv = b.servicios || {} as any;
                                  if (esUrgente) svcList.push('⚡ URGENTE 24hs');
                                  if ((sv.corteBlancoIHQ || 0) > 0) svcList.push(`Corte IHQ ×${sv.corteBlancoIHQ}`);
                                  if ((sv.corteBlanco || 0) > 0) svcList.push(`Corte Blanco ×${sv.corteBlanco}`);
                                  if (sv.giemsaPASMasson) {
                                    const opts = (sv as any).giemsaOptions || {};
                                    const t: string[] = [];
                                    if (opts.giemsa) t.push('Giemsa');
                                    if (opts.pas) t.push('PAS');
                                    if (opts.masson) t.push('Masson');
                                    svcList.push(t.length > 0 ? t.join(', ') : 'Giemsa/PAS/Masson');
                                  }
                                  if (sv.incluyeCitologia) {
                                    const fmt = sv.citologiaFormato === 'jeringa' ? 'Jeringa' : sv.citologiaFormato === 'frasco' ? 'Frasco' : `${sv.citologiaVidriosQty || 1} vid.`;
                                    svcList.push(`+ Cito (${fmt})`);
                                  }

                                  const cant = esPAP ? `${b.papQuantity || b.cassettes || 1} vid.` : esCito ? `${b.citologiaQuantity || b.cassettes || 1} vid.` : `${cass} cass.`;

                                  return (
                                    <tr key={bi} className={`border-b border-gray-100 ${estaLista ? 'bg-green-50' : esUrgente ? 'bg-red-50' : ''}`}>
                                      <td className="py-1.5 px-2">
                                        <button onClick={() => { if (!estaLista && confirm(`¿Marcar paciente #${b.numero} (${b.tejido}) como LISTO?\n\nNo se puede deshacer.`)) marcarBiopsia(bi, true); }}
                                          disabled={estaLista}
                                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${estaLista ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 hover:border-green-500 cursor-pointer'}`}>
                                          {estaLista && <CheckCircle size={12} />}
                                        </button>
                                      </td>
                                      <td className="py-1.5 px-2 font-semibold text-gray-800">#{b.numero}{b.numeroExterno ? <span className="text-amber-600 text-xs ml-1">(Ext: {b.numeroExterno})</span> : null}</td>
                                      <td className="py-1.5 px-2 text-gray-700">{esCito && citoST ? `Citología (${citoST})` : b.tejido}</td>
                                      <td className="py-1.5 px-2 text-center">
                                        <span className={`px-1.5 py-0.5 rounded font-bold text-xs ${esUrgente ? 'bg-red-600 text-white' : esPAP ? 'bg-purple-100 text-purple-700' : esCito ? 'bg-indigo-100 text-indigo-700' : tipo === 'TACO' ? 'bg-amber-100 text-amber-700' : tipo === 'PQ' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{tipo}</span>
                                      </td>
                                      <td className="py-1.5 px-2 text-center font-bold">{cant}</td>
                                      <td className="py-1.5 px-2 text-center">
                                        {tipo === 'IHQ' ? (() => {
                                          const tpc = (b as any).trozoPorCassette || [];
                                          const cn = (b as any).cassettesNumbers || [];
                                          const totalV = tpc.length > 0 ? tpc.reduce((s: number, v: number) => s + (v || 1), 0) : cass;
                                          return <div>
                                            <div className="font-bold text-blue-700">{totalV} vid.</div>
                                            {tpc.length > 1 && <div className="text-blue-400" style={{ fontSize: '8px' }}>{tpc.map((t: number, ci: number) => { const c = cn[ci]; return (c?.suffix ? c.base + '/' + c.suffix : 'C' + (ci+1)) + ':' + (t || 1); }).join(' · ')}</div>}
                                          </div>;
                                        })() : !esPAP && !esCito && tipo !== 'TACO' ? (() => {
                                          const tpc = (b as any).trozoPorCassette || [];
                                          const totalT = tpc.length > 0 ? tpc.reduce((s: number, v: number) => s + (v || 1), 0) : (parseInt(String(b.trozos || (b as any).pieces)) || 0);
                                          const cn = (b as any).cassettesNumbers || [];
                                          if (tpc.length > 1) {
                                            return <div>
                                              <div className="font-bold">{totalT}</div>
                                              <div className="text-gray-400" style={{ fontSize: '8px' }}>{tpc.map((t: number, ci: number) => { const c = cn[ci]; return (c?.suffix ? c.base + '/' + c.suffix : (ci === 0 ? (c?.base || 'C1') : 'S/' + ci)) + ':' + (t || 1); }).join(' · ')}</div>
                                            </div>;
                                          }
                                          return <span>{totalT || '-'}</span>;
                                        })() : <span className="text-gray-300">-</span>}
                                      </td>
                                      <td className="py-1.5 px-2">
                                        {svcList.length > 0 ? (
                                          <div className="flex flex-wrap gap-1">
                                            {svcList.map((s, si) => (
                                              <span key={si} className={`px-1 py-0.5 rounded text-xs font-semibold ${s.includes('URGENTE') ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{s}</span>
                                            ))}
                                          </div>
                                        ) : <span className="text-gray-300">—</span>}
                                        {(b as any).entregarConTaco && (() => {
                                          const tacosSel = (b as any).tacosSeleccionados || [];
                                          const cns = (b as any).cassettesNumbers || [];
                                          if (tacosSel.length > 0 && cns.length > 0) {
                                            const labels = tacosSel.map((idx: number) => {
                                              const cn = cns[idx];
                                              return idx === 0 ? (cn?.base || 'C1') : (cn?.suffix ? `${cn.base}/${cn.suffix}` : `S/${idx}`);
                                            });
                                            return <div className="mt-1"><span className="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">📦 Devolver: {labels.join(', ')}</span></div>;
                                          }
                                          return <div className="mt-1"><span className="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">📦 Devolver todos los tacos</span></div>;
                                        })()}
                                      </td>
                                      <td className="py-1.5 px-2 text-center">
                                        {estaLista ? <span className="text-green-600 font-bold">✓ Listo</span> : esUrgente ? <span className="text-red-600 font-bold">⚡ 24hs</span> : <span className="text-gray-400">Proceso</span>}
                                      </td>
                                    </tr>
                                  );
                                })}
                                </tbody>
                              </table>
                            </div>
                          </td></tr>
                        )}
                        {/* Separador visual entre remitos */}
                        <tr><td colSpan={8} style={{ height: isExpanded ? '10px' : '2px', background: isExpanded ? '#cbd5e1' : 'transparent', padding: 0, border: 'none' }}></td></tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botón abrir modal de selección para imprimir */}
              <div className="flex gap-2 mt-3">
                <button onClick={() => {
                  const remitosToPrint = filteredRemitos.filter(r => !(r as any).estadoEnvio || (r as any).estadoEnvio !== 'listo');
                  if (remitosToPrint.length === 0) { alert('No hay remitos pendientes para imprimir'); return; }
                  // Pre-seleccionar: material recibido y no impresos
                  const preSelected = new Set<string>();
                  remitosToPrint.forEach(r => {
                    if ((r as any).materialRecibido && !(r as any).impreso) preSelected.add(r.id);
                  });
                  // Si ninguno tiene materialRecibido, seleccionar todos los no impresos
                  if (preSelected.size === 0) {
                    remitosToPrint.forEach(r => { if (!(r as any).impreso) preSelected.add(r.id); });
                  }
                  setPrintSelection(preSelected);
                  setShowPrintModal(true);
                }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                  🖨 Imprimir pendientes
                </button>
              </div>

              {/* Modal de selección de remitos para imprimir */}
              {showPrintModal && (() => {
                const allPrintable = filteredRemitos.filter(r => !(r as any).estadoEnvio || (r as any).estadoEnvio !== 'listo');
                const selectedCount = allPrintable.filter(r => printSelection.has(r.id)).length;
                const totalPacSel = allPrintable.filter(r => printSelection.has(r.id)).reduce((s, r) => s + r.biopsias.length, 0);

                const executePrint = () => {
                  const remitosToPrint = allPrintable.filter(r => printSelection.has(r.id));
                  if (remitosToPrint.length === 0) { alert('Seleccione al menos un remito'); return; }
                  const labNombre = labConfig.nombre || 'Laboratorio';
                  const totalPacientes = remitosToPrint.reduce((s: number, r: any) => s + r.biopsias.length, 0);
                  const htmlParts = remitosToPrint.map((r: any, ri: number) => {
                    const nro = (r as any).remitoNumber || r.id.slice(-6).toUpperCase();
                    const fecha = new Date((r as any).timestamp || r.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });
                    const hasUrgents = r.biopsias.some((b: any) => b.servicios?.cassetteUrgente || b.servicios?.papUrgente || b.servicios?.citologiaUrgente);
                    return `
                    <div class="remito">
                      <div class="remito-header">
                        <div>
                          <span class="medico">Dr/a. ${r.medico}</span>
                          ${r.hospital ? '<span style="color:#2563eb;font-weight:600;font-size:11px;margin-left:4px;">— ' + r.hospital + '</span>' : ''}
                          ${(r as any).cargadoPor ? '<span class="cargado">(' + (r as any).cargadoPor + ')</span>' : ''}
                          <span class="nro">Remito #${nro}</span>
                        </div>
                        <div class="right">
                          ${hasUrgents ? '<span class="urgente">⚡ URGENTE</span>' : ''}
                          <span>${fecha}</span> · <span>${r.biopsias.length} pac.</span>
                        </div>
                      </div>
                      <table>
                        <colgroup><col style="width:8%"><col style="width:28%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:34%"></colgroup>
                        <tr>
                          <th style="text-align:left">N°</th>
                          <th style="text-align:left">Material</th>
                          <th style="text-align:center">Tipo</th>
                          <th style="text-align:center">Cant.</th>
                          <th style="text-align:center">Trozos</th>
                          <th style="text-align:left">Servicios</th>
                        </tr>
                        ${r.biopsias.map((b: any, i: number) => {
                          const sv = b.servicios || {};
                          const svc: string[] = [];
                          const isUrgent = sv.cassetteUrgente || sv.papUrgente || sv.citologiaUrgente;
                          if (isUrgent) svc.push('<b style="color:#dc2626;">⚡ URGENTE 24hs</b>');
                          if (sv.corteBlancoIHQ) svc.push('Corte IHQ ×' + (sv.corteBlancoIHQ || 1));
                          if (sv.corteBlanco) svc.push('Corte Blanco ×' + (sv.corteBlanco || 1));
                          if (sv.giemsaPASMasson) {
                            const opts = sv.giemsaOptions || {};
                            const t: string[] = [];
                            if (opts.giemsa) t.push('Giemsa');
                            if (opts.pas) t.push('PAS');
                            if (opts.masson) t.push('Masson');
                            svc.push(t.length > 0 ? t.join(', ') : 'Giemsa/PAS/Masson');
                          }
                          if (sv.incluyeCitologia) {
                            const fmt = sv.citologiaFormato === 'jeringa' ? 'Jeringa' : sv.citologiaFormato === 'frasco' ? 'Frasco' : (sv.citologiaVidriosQty || 1) + ' vid.';
                            svc.push('Citología (' + fmt + ')');
                          }
                          const isPAP = b.tejido === 'PAP';
                          const isCito = b.tejido === 'Citología';
                          const isTacoC = b.tipo === 'TC' || b.tejido === 'Taco en Consulta';
                          const citoLabel = isCito ? (b.citologiaSubType || 'Cito') : '';
                          const cant = isPAP ? (b.papQuantity || b.cassettes || 1) + ' vid.' : isCito ? (b.citologiaQuantity || b.cassettes || 1) + ' vid.' : (b.cassettes || 0);
                          // Trozos detallado por cassette
                          const trozoPorCass = b.trozoPorCassette || [];
                          const isIHQp2 = b.tipo === 'IHQ' || b.tejido === 'Inmunohistoquímica';
                          const totalTrozos = isPAP || isCito || isTacoC ? '-' : isIHQp2 ? (trozoPorCass.length > 0 ? trozoPorCass.reduce((s: number, v: number) => s + (v || 1), 0) + ' vid.' : '-') : (trozoPorCass.length > 0 ? trozoPorCass.reduce((s: number, v: number) => s + (v || 1), 0) : (b.trozos || b.pieces || '-'));
                          const cassNums = b.cassettesNumbers || [];
                          let trozosDetalle = '';
                          if (!isPAP && !isCito && !isTacoC && trozoPorCass.length > 1) {
                            trozosDetalle = trozoPorCass.map((t: number, ci: number) => {
                              const cn = cassNums[ci];
                              const name = cn?.suffix ? cn.base + '/' + cn.suffix : (ci === 0 ? (cn?.base || 'C1') : 'S/' + ci);
                              return name + ':' + (t || 1);
                            }).join(', ');
                          }
                          let tacoInfo = '';
                          if (b.entregarConTaco) {
                            const tacosSel = b.tacosSeleccionados || [];
                            const cns = b.cassettesNumbers || [];
                            if (tacosSel.length > 0 && cns.length > 0) {
                              const labels = tacosSel.map((idx: number) => {
                                const cn = cns[idx];
                                return idx === 0 ? (cn?.base || 'C1') : (cn?.suffix ? cn.base + '/' + cn.suffix : 'S/' + idx);
                              });
                              tacoInfo = '<div style="margin-top:3px;"><span class="taco">📦 Devolver: ' + labels.join(', ') + '</span></div>';
                            } else {
                              tacoInfo = '<div style="margin-top:3px;"><span class="taco">📦 Devolver todos los tacos</span></div>';
                            }
                          }
                          const numExtLabel = b.numeroExterno ? ' <span style="color:#b45309;font-size:5.5pt;">(Ext: ' + b.numeroExterno + ')</span>' : '';
                          return `<tr class="${isUrgent ? 'urgent' : ''}">
                            <td class="num">${b.numero||i+1}${numExtLabel}</td>
                            <td>${b.tejido||'-'}${tacoInfo}</td>
                            <td style="text-align:center"><span class="tipo-badge" style="background:${isPAP?'#7c3aed':isCito?'#475569':isTacoC?'#d97706':b.tipo==='PQ'?'#c2410c':'#166534'}">${isPAP?'PAP':isCito?citoLabel:isTacoC?'TACO':b.tipo||'BX'}</span></td>
                            <td class="cant">${cant}</td>
                            <td style="text-align:center">${trozosDetalle ? '<div style="font-weight:700;font-size:10pt;">' + totalTrozos + '</div><div class="trozos-detail">' + trozosDetalle + '</div>' : totalTrozos}</td>
                            <td class="svc">${svc.length > 0 ? svc.map(s => s.includes('URGENTE') ? '<span class="svc-urgent">' + s + '</span>' : s).join(' · ') : '<span style="color:#bbb">—</span>'}</td>
                          </tr>`;
                        }).join('')}
                      </table>
                    </div>`;
                  }).join('');
                  const fechaHoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });
                  const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
                    <title>Remitos Pendientes - ${labNombre}</title>
                    <style>
                      @page { size: A4; margin: 8mm 7mm; }
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; font-size: 7pt; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                      .header { text-align: center; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 2px solid #1a1a1a; }
                      .header h1 { font-size: 11pt; font-weight: 800; letter-spacing: -0.3px; }
                      .header .sub { font-size: 8pt; color: #555; margin-top: 1px; }
                      .header .meta { font-size: 6.5pt; color: #999; margin-top: 2px; }
                      .remito { border: 1.5px solid #1a1a1a; margin-bottom: 5px; page-break-inside: avoid; }
                      .remito-header { background: #1a1a1a; color: white; padding: 3px 6px; display: flex; align-items: center; justify-content: space-between; }
                      .remito-header .medico { font-size: 8pt; font-weight: 800; }
                      .remito-header .cargado { font-size: 6pt; color: #d97706; margin-left: 4px; }
                      .remito-header .nro { font-size: 6.5pt; opacity: 0.6; margin-left: 4px; }
                      .remito-header .right { font-size: 6pt; opacity: 0.7; text-align: right; }
                      .remito-header .urgente { background: #dc2626; color: white; padding: 1px 4px; border-radius: 2px; font-size: 6pt; font-weight: 700; margin-right: 4px; }
                      table { width: 100%; border-collapse: collapse; }
                      th { background: #f0f0f0; border-bottom: 1.5px solid #1a1a1a; padding: 2px 4px; font-size: 5.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: #333; }
                      td { padding: 2px 4px; border-bottom: 1px solid #e0e0e0; font-size: 6.5pt; vertical-align: top; line-height: 1.2; }
                      tr.urgent { background: #fff5f5 !important; border-left: 3px solid #dc2626; }
                      tr:nth-child(even) { background: #fafafa; }
                      .num { font-weight: 700; font-size: 7pt; }
                      .tipo-badge { color: white; padding: 1px 4px; border-radius: 2px; font-weight: 700; font-size: 6pt; display: inline-block; }
                      .cant { font-size: 7.5pt; font-weight: 800; text-align: center; }
                      .trozos-detail { font-size: 5.5pt; color: #888; }
                      .taco { background: #fef3c7; color: #92400e; padding: 1px 3px; border-radius: 2px; font-size: 5.5pt; font-weight: 700; border: 1px solid #fbbf24; display: inline-block; margin-top: 1px; }
                      .svc { font-size: 6pt; color: #333; }
                      .svc-urgent { color: #dc2626; font-weight: 700; }
                      .print-btn { display: inline-block; background: #1e40af; color: white; padding: 10px 24px; border-radius: 8px; font-size: 11pt; font-weight: 700; border: none; cursor: pointer; margin-bottom: 16px; }
                      .print-btn:hover { background: #1e3a8a; }
                      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
                    </style></head><body>
                    <div class="no-print" style="text-align:center;padding:12px 0;">
                      <button class="print-btn" onclick="window.print()">🖨 Imprimir</button>
                    </div>
                    <div class="header">
                      <h1>${labNombre}</h1>
                      <div class="sub">Remitos Pendientes por Entregar</div>
                      <div class="meta">${fechaHoy} · ${remitosToPrint.length} remito${remitosToPrint.length !== 1 ? 's' : ''} · ${totalPacientes} paciente${totalPacientes !== 1 ? 's' : ''}</div>
                    </div>
                    ${htmlParts}
                  </body></html>`;
                  // Usar iframe oculto para imprimir sin abrir ventana nueva (evita perder sesión)
                  let printFrame = document.getElementById('print-pendientes-frame') as HTMLIFrameElement;
                  if (!printFrame) {
                    printFrame = document.createElement('iframe');
                    printFrame.id = 'print-pendientes-frame';
                    printFrame.style.position = 'fixed';
                    printFrame.style.right = '0';
                    printFrame.style.bottom = '0';
                    printFrame.style.width = '0';
                    printFrame.style.height = '0';
                    printFrame.style.border = 'none';
                    document.body.appendChild(printFrame);
                  }
                  const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
                  if (frameDoc) {
                    frameDoc.open();
                    frameDoc.write(fullHtml);
                    frameDoc.close();
                    setTimeout(() => { printFrame.contentWindow?.print(); }, 300);
                  }
                  // Marcar como impresos
                  marcarRemitosImpresos(remitosToPrint.map((r: any) => r.id));
                  setShowPrintModal(false);
                };

                return (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setShowPrintModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold text-gray-900">🖨 Seleccionar remitos para imprimir</h3>
                          <button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{selectedCount} remito{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''} · {totalPacSel} paciente{totalPacSel !== 1 ? 's' : ''}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => { const all = new Set<string>(); allPrintable.forEach(r => all.add(r.id)); setPrintSelection(all); }}
                            className="text-xs text-blue-600 font-semibold hover:underline">Seleccionar todos</button>
                          <button onClick={() => setPrintSelection(new Set())}
                            className="text-xs text-gray-500 font-semibold hover:underline">Deseleccionar todos</button>
                          <button onClick={() => { const s = new Set<string>(); allPrintable.forEach(r => { if ((r as any).materialRecibido && !(r as any).impreso) s.add(r.id); }); setPrintSelection(s); }}
                            className="text-xs text-amber-600 font-semibold hover:underline">Solo material recibido</button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3">
                        {allPrintable.map(r => {
                          const nro = (r as any).remitoNumber || r.id.slice(-6).toUpperCase();
                          const isSelected = printSelection.has(r.id);
                          const matRecibido = (r as any).materialRecibido;
                          const yaImpreso = (r as any).impreso;
                          return (
                            <label key={r.id} className={`flex items-center gap-3 p-2.5 rounded-lg mb-1.5 cursor-pointer border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                              <input type="checkbox" checked={isSelected}
                                onChange={() => { const next = new Set(printSelection); if (next.has(r.id)) next.delete(r.id); else next.add(r.id); setPrintSelection(next); }}
                                className="w-5 h-5 accent-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-gray-900">Dr/a. {r.medico}</span>
                                  <span className="text-xs text-gray-400 font-mono">#{nro}</span>
                                </div>
                                <div className="text-xs text-gray-500">{r.biopsias.length} pac. · {new Date((r as any).timestamp || r.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</div>
                              </div>
                              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                {yaImpreso && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">🖨 Impreso</span>}
                                {matRecibido ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">📦 Recibido</span>
                                  : <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">⏳ Espera</span>}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      <div className="p-4 border-t border-gray-200 flex gap-2">
                        <button onClick={() => setShowPrintModal(false)}
                          className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50">Cancelar</button>
                        <button onClick={executePrint} disabled={selectedCount === 0}
                          className={`flex-1 py-2 rounded-lg text-white font-semibold text-sm ${selectedCount > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                          🖨 Imprimir {selectedCount} remito{selectedCount !== 1 ? 's' : ''}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Solicitudes movidas a sección propia */}
              {(() => {
                if (solicitudesAdmin.length === 0) return null;
                const solsPendientes = solicitudesAdmin.filter((s: any) => s.estado === 'pendiente' || s.estado === 'en_proceso');
                // Solo mostrar resumen rápido en dashboard
                if (solsPendientes.length === 0) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-center justify-between cursor-pointer" onClick={() => setCurrentView('solicitudes')}>
                    <div className="flex items-center gap-2">
                      <Package size={18} className="text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">{solsPendientes.length} solicitud{solsPendientes.length !== 1 ? 'es' : ''} pendiente{solsPendientes.length !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-xs text-amber-600 font-semibold">Ver →</span>
                  </div>
                );
              })()}

              {/* Eficiencia del laboratorio - separado */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Eficiencia del laboratorio</h4>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{tiempoPromedio > 24 ? Math.round(tiempoPromedio / 24) + ' días' : tiempoPromedio + ' hs'}</div>
                    <div className="text-xs text-gray-500">Tiempo promedio</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-3 mb-2">
                      <div className="bg-green-50 rounded-lg p-2 text-center flex-1">
                        <div className="text-lg font-bold text-green-700">{listos.length}</div>
                        <div className="text-xs text-green-600">Completados</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2 text-center flex-1">
                        <div className="text-lg font-bold text-yellow-700">{enProceso.length}</div>
                        <div className="text-xs text-yellow-600">Pendientes</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${remitos.length > 0 ? (listos.length / remitos.length) * 100 : 0}%` }}></div>
                    </div>
                    <div className="text-xs text-center text-gray-500 mt-1">{remitos.length > 0 ? Math.round((listos.length / remitos.length) * 100) : 0}% procesados</div>
                  </div>
                </div>
              </div>

            </div>
            );
          })()}

          {currentView === 'remitos' && (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Header profesional */}
              <div className="flex-shrink-0 px-5 pt-4 pb-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Gestión de Remitos</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{remitos.length} remitos en el sistema</p>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex gap-2 items-center bg-gray-50 rounded-lg p-2">
                  <select value={filtroMedico} onChange={(e) => setFiltroMedico(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white font-medium">
                    <option value="todos">Todos los médicos</option>
                    {medicos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-300" size={14} />
                    <input type="text" placeholder="N° paciente, médico, hospital..."
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {(() => {
                let remitosFiltrados = remitos;
                if (filtroMedico !== 'todos') remitosFiltrados = remitosFiltrados.filter(r => r.medico === filtroMedico);
                if (filtroEstado !== 'todos') remitosFiltrados = remitosFiltrados.filter(r => r.estado === filtroEstado);
                if (searchTerm.trim()) {
                  const searchLower = searchTerm.toLowerCase().trim();
                  remitosFiltrados = remitosFiltrados.filter(r => {
                    const medicoMatch = r.medico.toLowerCase().includes(searchLower);
                    const hospitalMatch = r.hospital.toLowerCase().includes(searchLower);
                    const emailMatch = r.email?.toLowerCase().includes(searchLower);
                    const biopsiaMatch = r.biopsias.some(b =>
                      b.numero.toLowerCase().includes(searchLower) ||
                      b.tejido.toLowerCase().includes(searchLower) ||
                      b.tipo.toLowerCase().includes(searchLower)
                    );
                    
                    return medicoMatch || hospitalMatch || emailMatch || biopsiaMatch;
                  });
                }
                
                return remitosFiltrados.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      <p className="text-gray-400 text-sm">{remitos.length === 0 ? 'Los remitos aparecerán aquí' : 'Sin resultados para esos filtros'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden mx-5 mb-4 bg-white rounded-xl border border-gray-200">
                    <div className="overflow-auto h-full">
                    <table className="w-full">
                      <thead className="sticky top-0">
                        <tr style={{ background: '#0f172a' }}>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-white/70 uppercase w-16">N°</th>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-white/70 uppercase">Médico</th>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-white/70 uppercase w-28">Fecha</th>
                          <th className="text-center py-2.5 px-4 text-xs font-semibold text-white/70 uppercase w-20">Estudios</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-white/70 uppercase w-24">Total</th>
                          <th className="text-center py-2.5 px-4 text-xs font-semibold text-white/70 uppercase w-20">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                    {[...remitosFiltrados].sort((a, b) => { const tA = new Date((a as any).timestamp || a.fecha).getTime(); const tB = new Date((b as any).timestamp || b.fecha).getTime(); return tB - tA; }).map(remito => (
                      <tr key={remito.id} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${(remito as any).modificadoPorAdmin && !(remito as any).modificadoPorSolicitud ? 'bg-amber-50/40' : ''} ${(remito as any).modificadoPorSolicitud ? 'bg-green-50/40' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="text-xs font-mono text-gray-400">#{((remito as any).remitoNumber || remito.id.slice(-6).toUpperCase())}</div>
                          {(remito as any).esServicioAdicional && (
                            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-bold border ${((remito as any).esProfundizacion || ((remito as any).notaServicioAdicional || '').includes('Profundización')) ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>{((remito as any).esProfundizacion || ((remito as any).notaServicioAdicional || '').includes('Profundización')) ? 'Profundización' : 'Serv. Adicional'}</span>
                          )}
                          {(remito as any).modificadoPorAdmin && !(remito as any).esServicioAdicional && !(remito as any).modificadoPorSolicitud && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Editado</span>
                          )}
                          {(remito as any).modificadoPorSolicitud && !(remito as any).esServicioAdicional && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">Solicitud médico</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-semibold text-gray-900">Dr/a. {remito.medico}</div>
                          {remito.hospital && (
                            <div className="text-xs text-blue-500">{remito.hospital}</div>
                          )}
                          {(remito as any).cargadoPor && (
                            <div className="text-xs text-amber-600">Por: {(remito as any).cargadoPor}</div>
                          )}
                          <div className="text-xs text-gray-400">{remito.email}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {new Date(remito.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
                          <div className="text-gray-400">{(remito as any).timestamp ? new Date((remito as any).timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                          {(remito as any).esServicioAdicional && (remito as any).remitoOriginalFecha && (
                            <div className="text-purple-500 text-xs mt-0.5">Orig: {new Date((remito as any).remitoOriginalFecha).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{remito.biopsias.length}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">${calcularTotalRemito(remito.biopsias).toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            {(remito as any).estadoEnvio === 'listo' ? (
                              <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle size={12} /> Entregado</span>
                            ) : (
                              <button onClick={() => { const snap = JSON.parse(JSON.stringify(remito.biopsias)); setOriginalBiopsiaSnapshot(snap); localStorage.setItem('_editSnapshot', JSON.stringify(snap)); setEditingBiopsias(JSON.parse(JSON.stringify(remito.biopsias))); setEditingRemito(remito.id); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1">
                                <Edit size={12} /> Editar
                              </button>
                            )}
                            {(remito as any).modificadoPorAdmin && (() => {
                              try {
                                const notifs = JSON.parse(localStorage.getItem('doctorNotifications') || '[]')
                                  .filter((n: any) => n.remitoId === remito.id)
                                  .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                                if (notifs.length > 0) {
                                  const last = notifs[0];
                                  return (
                                    <div className="text-left mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg" style={{ whiteSpace: 'pre-line', minWidth: '280px' }}>
                                      <div className="text-xs font-bold text-amber-700 mb-2">Último cambio registrado:</div>
                                      <div className="text-sm text-amber-900 leading-relaxed">{last.mensaje}</div>
                                      <div className="text-xs text-amber-500 mt-2 pt-2 border-t border-amber-200">{new Date(last.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                  );
                                }
                              } catch {}
                              return null;
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                );
              })()}

              {/* Modal de edición de remito */}
              {editingRemito && editingBiopsias && (() => {
                const remito = remitos.find(r => r.id === editingRemito);
                if (!remito) return null;
                return (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Editar Remito #{((remito as any).remitoNumber || remito.id.slice(-6).toUpperCase())}</h3>
                          <p className="text-sm text-gray-500">Dr/a. {remito.medico}{remito.hospital ? ` — ${remito.hospital}` : ''} — {new Date(remito.fecha).toLocaleDateString('es-AR')}</p>
                        </div>
                        <button onClick={() => { setEditingBiopsias(null); setEditingRemito(null); }} className="text-gray-400 hover:text-gray-600 text-xl font-bold px-2">×</button>
                      </div>

                      {/* Tabla de biopsias editable - usa copia temporal */}
                      <div className="flex-1 overflow-auto p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <th className="text-left py-2 px-3 text-xs text-gray-500">N°</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-500">Tejido</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-500">Tipo</th>
                              <th className="text-center py-2 px-3 text-xs text-gray-500">Cassettes</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-500">Servicios</th>
                              <th className="text-center py-2 px-3 text-xs text-gray-500">Estado</th>
                              <th className="text-right py-2 px-3 text-xs text-gray-500">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editingBiopsias.map((biopsia: any, index: number) => {
                              const servicios: string[] = [];
                              if ((biopsia.servicios?.cassetteUrgente || 0) > 0) servicios.push('URGENTE 24hs');
                              if ((biopsia.servicios?.papUrgente || 0) > 0) servicios.push('PAP Urgente');
                              if ((biopsia.servicios?.citologiaUrgente || 0) > 0) servicios.push('Cito Urgente');
                              if ((biopsia.servicios?.corteBlancoIHQ || 0) > 0) {
                                const cass = (biopsia.servicios as any)?.corteBlancoIHQCassettes;
                                const cassLabel = cass?.length > 0 ? ` [C${cass.map((c: number) => { const cn = (biopsia as any).cassettesNumbers || []; return c === 0 ? (cn[0]?.base || '') : '/' + (cn[c]?.suffix || 'S/' + c); }).join(', ')}]` : '';
                                servicios.push(`Corte IHQ (${biopsia.servicios.corteBlancoIHQ})${cassLabel}`);
                              }
                              if ((biopsia.servicios?.corteBlanco || 0) > 0) {
                                const cass = (biopsia.servicios as any)?.corteBlancoComunCassettes;
                                const cassLabel = cass?.length > 0 ? ` [C${cass.map((c: number) => { const cn = (biopsia as any).cassettesNumbers || []; return c === 0 ? (cn[0]?.base || '') : '/' + (cn[c]?.suffix || 'S/' + c); }).join(', ')}]` : '';
                                servicios.push(`Corte Blanco (${biopsia.servicios.corteBlanco})${cassLabel}`);
                              }
                              if ((biopsia.servicios?.giemsaPASMasson || 0) > 0) {
                                const opts = (biopsia.servicios as any)?.giemsaOptions;
                                const cass = (biopsia.servicios as any)?.giemsaCassettes;
                                const cassLabel = cass?.length > 0 ? ` [C${cass.map((c: number) => { const cn = (biopsia as any).cassettesNumbers || []; return c === 0 ? (cn[0]?.base || '') : '/' + (cn[c]?.suffix || 'S/' + c); }).join(', ')}]` : '';
                                if (opts) {
                                  const t: string[] = [];
                                  if (opts.giemsa) t.push('Giemsa');
                                  if (opts.pas) t.push('PAS');
                                  if (opts.masson) t.push('Masson');
                                  servicios.push((t.length > 0 ? t.join(', ') : 'Giemsa/PAS/Masson') + cassLabel);
                                } else {
                                  servicios.push('Giemsa/PAS/Masson' + cassLabel);
                                }
                              }

                              const snapBiopsias = originalBiopsiaSnapshot || (() => { try { return JSON.parse(localStorage.getItem('_editSnapshot') || '[]'); } catch { return []; } })();
                              const origBiopsia = (snapBiopsias || [])[index];
                              const minCass = Number(origBiopsia?.cassettes) || 0;

                              const isPapCito = biopsia.tejido === 'PAP' || biopsia.tejido === 'Citología';
                              return (
                              <tr key={index} className={`border-b border-gray-100 ${isPapCito ? 'bg-gray-50/50' : ''}`}>
                                <td className="py-2 px-3 font-bold text-blue-600 text-xs">#{biopsia.numero}{biopsia.numeroExterno ? <span className="text-amber-600 ml-1">(Ext: {biopsia.numeroExterno})</span> : null}</td>
                                <td className="py-2 px-3 text-xs">{biopsia.tejido}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    (biopsia.tipo === 'IHQ' || biopsia.tejido === 'Inmunohistoquímica') ? 'bg-blue-100 text-blue-700' : (biopsia.tipo === 'TC' || biopsia.tejido === 'Taco en Consulta') ? 'bg-amber-100 text-amber-700' : biopsia.tipo === 'PQ' ? 'bg-orange-100 text-orange-700' : biopsia.tejido === 'PAP' ? 'bg-pink-100 text-pink-700' : biopsia.tejido === 'Citología' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                  }`}>{(biopsia.tipo === 'IHQ' || biopsia.tejido === 'Inmunohistoquímica') ? 'IHQ' : (biopsia.tipo === 'TC' || biopsia.tejido === 'Taco en Consulta') ? 'TACO' : biopsia.tipo === 'PQ' ? 'PQ' : biopsia.tejido === 'PAP' ? 'PAP' : biopsia.tejido === 'Citología' ? ((biopsia as any).citologiaSubType || 'CITO') : 'BX'}</span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {(biopsia.tipo === 'IHQ' || biopsia.tejido === 'Inmunohistoquímica') ? (
                                    <div>
                                      <div className="text-xs font-bold text-gray-700">{biopsia.cassettes} cass.</div>
                                      <div className="text-xs font-bold text-blue-600">{((biopsia as any).trozoPorCassette || []).reduce((s: number, v: number) => s + (v || 1), 0) || biopsia.cassettes} vidrios</div>
                                    </div>
                                  ) : isPapCito ? (
                                    <span className="text-xs text-gray-500">{biopsia.tejido === 'PAP' ? (biopsia.papQuantity || biopsia.cassettes) : (biopsia.citologiaQuantity || biopsia.cassettes)} vidrios</span>
                                  ) : (
                                    <input type="number" value={biopsia.cassettes} min={minCass}
                                      className="w-16 text-center border border-gray-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
                                      onChange={(e) => {
                                        const val = Math.max(Number(e.target.value), minCass);
                                        const updated = [...editingBiopsias];
                                        updated[index] = { ...updated[index], cassettes: val };
                                        setEditingBiopsias(updated);
                                      }}
                                    />
                                  )}
                                </td>
                                {/* Servicios del médico (solo lectura) */}
                                <td className="py-2 px-3">
                                  <div className="flex flex-wrap gap-1">
                                    {servicios.length > 0 ? servicios.map((s, si) => (
                                      <span key={si} className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                                        s.includes('URGENTE') || s.includes('Urgente') ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                                      }`}>{s}</span>
                                    )) : <span className="text-xs text-gray-300">—</span>}
                                    {(biopsia.papQuantity || 0) > 0 && <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-pink-50 text-pink-700">PAP: {biopsia.papQuantity}</span>}
                                    {(biopsia.citologiaQuantity || 0) > 0 && <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700">Cito: {biopsia.citologiaQuantity}</span>}
                                  </div>
                                </td>
                                {/* Estado: NO VINO (solo para pacientes del médico, no agregados por el lab) */}
                                <td className="py-2 px-3 text-center">
                                  {(biopsia as any).agregadoPorLab ? (
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Agregado</span>
                                  ) : (biopsia as any).noVino ? (
                                    <button onClick={() => { const u = [...editingBiopsias]; u[index] = { ...u[index], noVino: false }; setEditingBiopsias(u); }}
                                      className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300 hover:bg-red-200">
                                      ❌ NO VINO
                                    </button>
                                  ) : (
                                    <button onClick={() => { if (confirm(`¿Marcar paciente #${biopsia.numero} como NO VINO?\nEl material no llegó al laboratorio.`)) { const u = [...editingBiopsias]; u[index] = { ...u[index], noVino: true }; setEditingBiopsias(u); } }}
                                      className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                      No vino
                                    </button>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right text-xs font-bold text-gray-700">${calcularTotalBiopsia(biopsia).toLocaleString()}</td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-bold text-gray-900">
                            Total: ${calcularTotalRemito(editingBiopsias as any).toLocaleString()}
                          </div>
                          <button onClick={() => {
                            const numero = prompt('Número de paciente:');
                            if (!numero?.trim()) return;
                            const cassettes = prompt('Cantidad de cassettes:', '1');
                            const newBiopsia = {
                              numero: numero.trim(),
                              tejido: 'No anotado',
                              tipo: 'BX',
                              cassettes: parseInt(cassettes || '1') || 1,
                              trozos: parseInt(cassettes || '1') || 1,
                              servicios: { cassetteNormal: parseInt(cassettes || '1') || 1 },
                              cassettesNumbers: [],
                              papQuantity: 0,
                              citologiaQuantity: 0,
                              agregadoPorLab: true,
                            };
                            setEditingBiopsias([...editingBiopsias, newBiopsia]);
                          }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-700 text-white flex items-center gap-1">
                            <Plus size={12} /> Agregar paciente
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setEditingBiopsias(null);
                            setOriginalBiopsiaSnapshot(null);
                            setEditingRemito(null);
                          }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                            Cancelar
                          </button>
                          <button onClick={() => {
                            // Primero detectar si hay cambios reales
                            const cambiosDetalle: string[] = [];
                            let origBiopsias: any[] = [];
                            try { origBiopsias = JSON.parse(localStorage.getItem('_editSnapshot') || '[]'); } catch {}
                            if (origBiopsias.length === 0) origBiopsias = originalBiopsiaSnapshot || [];
                            editingBiopsias.forEach((curr: any, idx: number) => {
                              const orig = origBiopsias[idx];
                              // Paciente nuevo agregado por el lab
                              if (!orig) {
                                cambiosDetalle.push(`Paciente N° ${curr.numero || 'S/N'} — AGREGADO POR LABORATORIO\nMaterial: ${curr.tejido || '-'}\nCassettes: ${curr.cassettes}`);
                                return;
                              }
                              const cambiosPaciente: string[] = [];
                              // NO VINO
                              if (curr.noVino && !orig.noVino) {
                                cambiosPaciente.push('⚠️ NO VINO — El material no llegó al laboratorio');
                              } else if (!curr.noVino && orig.noVino) {
                                cambiosPaciente.push('Se revirtió el estado NO VINO');
                              }
                              const origCass = Number(orig.cassettes) || 0;
                              const currCass = Number(curr.cassettes) || 0;
                              const origPap = Number(orig.papQuantity) || 0;
                              const currPap = Number(curr.papQuantity) || 0;
                              const origCito = Number(orig.citologiaQuantity) || 0;
                              const currCito = Number(curr.citologiaQuantity) || 0;
                              if (origCass !== currCass) {
                                const diff = currCass - origCass;
                                const cassLabel = (curr.tejido === 'PAP' || curr.tejido === 'Citología') ? 'Cantidad' : 'Cassettes';
                                cambiosPaciente.push(`${cassLabel}: ${origCass} → ${currCass} (${diff > 0 ? '+' : ''}${diff})`);
                              }
                              if (origPap !== currPap) {
                                const diff = currPap - origPap;
                                cambiosPaciente.push(`PAP: ${origPap} → ${currPap} (${diff > 0 ? '+' : ''}${diff})`);
                              }
                              if (origCito !== currCito) {
                                const diff = currCito - origCito;
                                cambiosPaciente.push(`Citología: ${origCito} → ${currCito} (${diff > 0 ? '+' : ''}${diff})`);
                              }
                              if (cambiosPaciente.length > 0) {
                                const tipo = curr.tipo === 'PQ' ? 'PQ' : curr.tejido === 'PAP' ? 'PAP' : curr.tejido === 'Citología' ? 'Citología' : 'BX';
                                cambiosDetalle.push(`Paciente N° ${curr.numero || 'S/N'}\nMaterial: ${curr.tejido || '-'} (${tipo})\n${cambiosPaciente.join('\n')}`);
                              }
                            });

                            // Solo guardar, notificar y sincronizar si hubo cambios reales
                            if (cambiosDetalle.length === 0) {
                              setEditingBiopsias(null);
                              setOriginalBiopsiaSnapshot(null);
                              setEditingRemito(null);
                              return;
                            }

                            // Detectar si el remito es de un mes anterior
                            const now = new Date();
                            const remitoFecha = new Date((remito as any).timestamp || remito.fecha);
                            const esOtroMes = remitoFecha.getMonth() !== now.getMonth() || remitoFecha.getFullYear() !== now.getFullYear();

                            if (esOtroMes) {
                              // MES ANTERIOR: crear nuevo remito "Servicio Adicional" en el mes actual
                              // Solo incluir las biopsias que tuvieron cambios (con los servicios nuevos únicamente)
                              const biopsiasConCambios: any[] = [];
                              editingBiopsias.forEach((curr: any, idx: number) => {
                                const orig = origBiopsias[idx];
                                if (!orig) return;
                                // Calcular solo la diferencia (servicios nuevos)
                                const diffServicios: any = { ...curr.servicios };
                                const origS = orig.servicios || {};
                                // Restar los valores originales para dejar solo lo nuevo
                                diffServicios.cassetteNormal = Math.max(0, (Number(curr.cassettes) || 0) - (Number(orig.cassettes) || 0));
                                diffServicios.cassetteUrgente = 0; // No se cambia urgencia retroactivamente
                                diffServicios.corteBlancoIHQ = Math.max(0, (diffServicios.corteBlancoIHQ || 0) - (origS.corteBlancoIHQ || 0));
                                diffServicios.corteBlanco = Math.max(0, (diffServicios.corteBlanco || 0) - (origS.corteBlanco || 0));
                                const origGiemsa = typeof origS.giemsaPASMasson === 'number' ? origS.giemsaPASMasson : (origS.giemsaPASMasson ? 1 : 0);
                                const currGiemsa = typeof diffServicios.giemsaPASMasson === 'number' ? diffServicios.giemsaPASMasson : (diffServicios.giemsaPASMasson ? 1 : 0);
                                diffServicios.giemsaPASMasson = Math.max(0, currGiemsa - origGiemsa);

                                const tieneNuevos = diffServicios.cassetteNormal > 0 || diffServicios.corteBlancoIHQ > 0 ||
                                  diffServicios.corteBlanco > 0 || diffServicios.giemsaPASMasson > 0;

                                if (tieneNuevos) {
                                  biopsiasConCambios.push({
                                    ...curr,
                                    cassettes: diffServicios.cassetteNormal,
                                    servicios: diffServicios,
                                    cassettesNumbers: curr.cassettesNumbers || [],
                                  });
                                }
                              });

                              if (biopsiasConCambios.length > 0) {
                                const mesOriginal = remitoFecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                                const nuevoRemito: any = {
                                  id: `SA_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                                  medico: remito.medico,
                                  email: remito.email,
                                  doctorEmail: (remito as any).doctorEmail || remito.email,
                                  fecha: now.toISOString(),
                                  timestamp: now.toISOString(),
                                  hospital: remito.hospital,
                                  estado: 'pendiente',
                                  biopsias: biopsiasConCambios,
                                  esServicioAdicional: true,
                                  remitoOriginalId: remito.id,
                                  remitoOriginalFecha: remito.fecha,
                                  notaServicioAdicional: `Servicio adicional sobre pacientes de ${mesOriginal}`,
                                };

                                const updatedRemitos = [...remitos, nuevoRemito];
                                // También marcar el original como que tiene servicios adicionales
                                const finalRemitos = updatedRemitos.map(r => {
                                  if (r.id === remito.id) return { ...r, tieneServiciosAdicionales: true } as any;
                                  return r;
                                });
                                setRemitos(finalRemitos);
                                localStorage.setItem('adminRemitos', JSON.stringify(finalRemitos));
                                db.saveRemitos(finalRemitos).catch(console.error);

                                const mensajeDetalle = `SERVICIO ADICIONAL (original de ${mesOriginal})\n\n` + cambiosDetalle.join('\n\n');
                                const notifications = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
                                const newNotif = {
                                  id: `NOTIF_${Date.now()}`,
                                  remitoId: nuevoRemito.id,
                                  medicoEmail: (remito as any).doctorEmail || remito.email,
                                  mensaje: mensajeDetalle,
                                  fecha: now.toISOString(),
                                  leida: false
                                };
                                notifications.push(newNotif);
                                localStorage.setItem('doctorNotifications', JSON.stringify(notifications));
                                db.saveNotification(newNotif).catch(console.error);

                                alert(`✅ Se creó un "Servicio Adicional" en el mes actual.\nEl remito original de ${mesOriginal} no fue modificado.\nLos nuevos servicios se facturarán este mes.`);
                              }
                            } else {
                              // MISMO MES: editar el remito normalmente - guardar original para comparación
                              const biopsWithOrig = editingBiopsias.map((eb: any, idx: number) => {
                                const orig = origBiopsias[idx];
                                if (orig && Number(eb.cassettes) !== Number(orig.cassettes) && eb._originalCassettes === undefined) {
                                  return { ...eb, _originalCassettes: Number(orig.cassettes) || 0 };
                                }
                                return eb;
                              });
                              const updatedRemitos = remitos.map(r => {
                                if (r.id === remito.id) return { ...r, biopsias: biopsWithOrig, modificadoPorAdmin: true, modificadoAt: new Date().toISOString() } as any;
                                return r;
                              });
                              setRemitos(updatedRemitos);
                              localStorage.setItem('adminRemitos', JSON.stringify(updatedRemitos));
                              db.saveRemitos(updatedRemitos).catch(console.error);

                              const mensajeDetalle = cambiosDetalle.join('\n\n');
                              const notifications = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
                              const newNotif = {
                                id: `NOTIF_${Date.now()}`,
                                remitoId: remito.id,
                                medicoEmail: (remito as any).doctorEmail || remito.email,
                                mensaje: mensajeDetalle,
                                fecha: new Date().toISOString(),
                                leida: false
                              };
                              notifications.push(newNotif);
                              localStorage.setItem('doctorNotifications', JSON.stringify(notifications));
                              db.saveNotification(newNotif).catch(console.error);

                              // Cancelar solicitudes de taco pendientes para pacientes marcados NO VINO
                              try {
                                const remitoNum = (remito as any).remitoNumber || '';
                                editingBiopsias.forEach((curr: any, idx: number) => {
                                  const orig = origBiopsias[idx];
                                  if (curr.noVino && !(orig?.noVino)) {
                                    // Buscar solicitudes pendientes de este paciente
                                    const solicitudes = JSON.parse(localStorage.getItem('solicitudes') || '[]');
                                    solicitudes.forEach((sol: any) => {
                                      if (
                                        sol.estado === 'pendiente' &&
                                        sol.numeroPaciente === curr.numero &&
                                        (sol.remitoNumber === remitoNum || !sol.remitoNumber)
                                      ) {
                                        sol.estado = 'rechazado';
                                        sol.notas = (sol.notas || '') + (sol.notas ? ' | ' : '') + 'Cancelado: paciente NO VINO';
                                        db.saveSolicitud(sol).catch(console.error);
                                      }
                                    });
                                    localStorage.setItem('solicitudes', JSON.stringify(solicitudes));
                                  }
                                });
                              } catch (e) { console.error('Error cancelando solicitudes por NO VINO:', e); }

                              // SINCRONIZAR con historial del médico (desde Supabase)
                              try {
                                const doctorEmail = ((remito as any).doctorEmail || remito.email || '').toLowerCase().trim();
                                const remitoNum = (remito as any).remitoNumber || '';
                                console.log('🔵 SYNC historial - email:', doctorEmail, 'remitoNum:', remitoNum);
                                if (doctorEmail) {
                                  db.getDoctorHistory(doctorEmail).then(history => {
                                    console.log('🔵 Historial cargado de Supabase:', Object.keys(history).length, 'entries');
                                    console.log('🔵 Buscando remitoNumber:', remitoNum, 'en:', Object.values(history).map((e: any) => e.remitoNumber));
                                    let matched = false;
                                    Object.keys(history).forEach(key => {
                                      if (matched) return;
                                      const entry = history[key];
                                      if (!entry?.biopsies) return;
                                      console.log('🔵 Comparando entry:', entry.remitoNumber, 'con:', remitoNum, 'id:', entry.id);
                                      if (entry.remitoNumber === remitoNum || entry.id?.includes(remitoNum)) {
                                        // Actualizar biopsias existentes
                                        entry.biopsies.forEach((biopsy: any, i: number) => {
                                          const edited = editingBiopsias[i];
                                          if (edited) {
                                            biopsy.cassettes = String(edited.cassettes ?? biopsy.cassettes);
                                            biopsy.noVino = edited.noVino || false;
                                            if (edited.servicios) biopsy.servicios = { ...biopsy.servicios, ...edited.servicios };
                                          }
                                        });
                                        // Agregar pacientes nuevos (agregados por el lab)
                                        for (let i = entry.biopsies.length; i < editingBiopsias.length; i++) {
                                          const newB = editingBiopsias[i];
                                          entry.biopsies.push({
                                            number: newB.numero, tissueType: newB.tejido, type: newB.tipo || 'BX',
                                            cassettes: String(newB.cassettes || 0), pieces: String(newB.trozos || newB.cassettes || 0),
                                            servicios: newB.servicios || {}, agregadoPorLab: true,
                                            noVino: newB.noVino || false
                                          });
                                        }
                                        entry.totalCount = entry.biopsies.length;
                                        matched = true;
                                        console.log('🔵 MATCH! Guardando entry con', entry.biopsies.length, 'biopsias, id:', entry.id);
                                        db.saveDoctorHistoryEntry(doctorEmail, currentLabCode, entry).then(() => {
                                          console.log('🔵 ✅ Guardado exitosamente en Supabase');
                                        }).catch(e => console.error('🔵 ❌ Error guardando:', e));
                                      }
                                    });
                                  }).catch(console.error);
                                }
                              } catch (e) {
                                console.error('Error sincronizando historial del médico:', e);
                              }
                            }

                            setEditingBiopsias(null);
                            setOriginalBiopsiaSnapshot(null);
                            setEditingRemito(null);
                          }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
                            <Save size={14} /> Guardar Cambios
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {currentView === 'facturacion' && (() => {
            const totalGeneral = remitos.reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
            const allBiopsias = remitos.flatMap(r => r.biopsias);
            const totalPacientes = allBiopsias.length;
            const countBX = allBiopsias.filter(b => b.tejido !== 'PAP' && b.tejido !== 'Citología' && b.tipo !== 'PQ').length;
            const countPQ = allBiopsias.filter(b => b.tipo === 'PQ').length;
            const countPAP = allBiopsias.reduce((s, b) => s + (b.papQuantity || 0), 0);
            const countCito = allBiopsias.reduce((s, b) => s + (b.citologiaQuantity || 0), 0);
            const countUrgencias = allBiopsias.filter(b => (b.servicios?.cassetteUrgente || 0) > 0 || (b.servicios?.papUrgente || 0) > 0 || (b.servicios?.citologiaUrgente || 0) > 0).length;
            const countCorteIHQ = allBiopsias.reduce((s, b) => s + (b.servicios?.corteBlancoIHQ || 0), 0);
            const countCorteBlanco = allBiopsias.reduce((s, b) => s + (b.servicios?.corteBlanco || 0), 0);
            const countGiemsa = allBiopsias.filter(b => (b.servicios?.giemsaPASMasson || 0) > 0).length;

            return (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 px-5 pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Facturación — {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h2>
                    <p className="text-xs text-gray-400">{medicos.length} médicos · {remitos.length} remitos</p>
                  </div>
                  <div className="flex items-center gap-2">
                  </div>
                </div>

                {/* KPIs principales */}
                <div className="grid grid-cols-6 gap-2 mb-3">
                  <div style={{ background: '#0f172a' }} className="rounded-xl p-3 text-white col-span-2">
                    <div className="text-xs opacity-60">TOTAL FACTURADO</div>
                    <div className="text-2xl font-bold">${totalGeneral.toLocaleString()}</div>
                    <div className="text-xs opacity-50 mt-1">{totalPacientes} pacientes</div>
                  </div>
                  {[
                    { label: 'BX', value: countBX, color: '#1e40af' },
                    { label: 'PQ', value: countPQ, color: '#0369a1' },
                    { label: 'PAP', value: countPAP, color: '#7c3aed' },
                    { label: 'Cito', value: countCito, color: '#6d28d9' },
                  ].map((k, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-gray-200 text-center">
                      <div style={{ color: k.color }} className="text-xl font-bold">{k.value}</div>
                      <div className="text-xs text-gray-400">{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Servicios adicionales resumen */}
                <div className="flex gap-3 text-xs">
                  {[
                    { label: 'Urgencias', value: countUrgencias, color: '#dc2626' },
                    { label: 'Corte IHQ', value: countCorteIHQ, color: '#1e40af' },
                    { label: 'Corte Blanco', value: countCorteBlanco, color: '#475569' },
                    { label: 'Tinciones', value: countGiemsa, color: '#7c3aed' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div style={{ backgroundColor: s.color }} className="w-2 h-2 rounded-full"></div>
                      <span className="text-gray-500">{s.label}: <strong style={{ color: s.color }}>{s.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabla de médicos agrupada por centro */}
              <div className="flex-1 overflow-auto px-5 pb-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="sticky top-0">
                      <tr style={{ background: '#0f172a' }}>
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-white/70 uppercase">Médico / Centro</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">Remitos</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">Pac.</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">BX</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">PQ</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">PAP</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">Cito</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-white/70 uppercase">Total</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Agrupar por médico, y dentro de cada médico por centro
                        const medicosSorted = [...medicos].sort((a, b) => {
                          const tA = remitos.filter(r => r.medico === a).reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
                          const tB = remitos.filter(r => r.medico === b).reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
                          return tB - tA;
                        });
                        const rows: React.ReactNode[] = [];
                        medicosSorted.forEach((medico) => {
                          const rmMedico = remitos.filter(r => r.medico === medico);
                          const centros = [...new Set(rmMedico.map(r => r.hospital || 'Sin centro'))];
                          const tieneCentros = centros.length > 1 || (centros.length === 1 && centros[0] !== 'Sin centro');
                          const totalMedico = rmMedico.reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);

                          if (tieneCentros && centros.length > 1) {
                            // Médico con múltiples centros: fila header del médico + subfila por centro
                            rows.push(
                              <tr key={medico} className="bg-gray-50 border-b border-gray-200">
                                <td className="py-2.5 px-4" colSpan={7}>
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                      {medico.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-gray-900">Dr/a. {medico}</div>
                                      <div className="text-xs text-gray-400">{rmMedico[0]?.email || ''} · {centros.length} centros</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-right text-sm font-bold text-gray-900">${totalMedico.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <button onClick={async () => {
                                    const doctorEmail = rmMedico[0]?.email || '';
                                    if (!doctorEmail) { alert('Este médico no tiene email registrado.'); return; }
                                    try {
                                      const { sendEmail, isEmailConfigured } = await import('../utils/emailService');
                                      if (!isEmailConfigured()) { alert('EmailJS no está configurado. Andá a Configuración.'); return; }
                                      const fromName = labConfig.nombre || 'Laboratorio';
                                      const emailHtml = generarHTMLEmailFacturacion(medico);
                                      const mesEmail = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                                      await sendEmail({ toEmail: doctorEmail, toName: medico, subject: 'Facturación ' + mesEmail + ' - ' + fromName, messageHtml: emailHtml, fromName });
                                      registrarEmailEnviado(medico, doctorEmail);
                                      alert('Email unificado enviado a ' + doctorEmail);
                                    } catch (e: any) { alert('Error: ' + (e.message || e.text || 'Error')); }
                                  }} className={`${emailYaEnviado(medico) ? 'bg-gray-400 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'} text-white px-2 py-1 rounded text-xs font-semibold`} title={emailYaEnviado(medico) ? 'Ya enviado — click para reenviar' : 'Enviar email con todos los centros'}>
                                    {emailYaEnviado(medico) ? <><CheckCircle size={10} /> <span className="ml-0.5">Enviado</span></> : <Mail size={12} />}
                                  </button>
                                </td>
                              </tr>
                            );
                            centros.forEach((centro) => {
                              const rm = rmMedico.filter(r => (r.hospital || 'Sin centro') === centro);
                              const total = rm.reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
                              const pac = rm.reduce((s, r) => s + r.biopsias.length, 0);
                              const bx = rm.reduce((s, r) => s + r.biopsias.filter(b => b.tejido !== 'PAP' && b.tejido !== 'Citología' && b.tipo !== 'PQ').length, 0);
                              const pq = rm.reduce((s, r) => s + r.biopsias.filter(b => b.tipo === 'PQ').length, 0);
                              const pap = rm.reduce((s, r) => s + r.biopsias.reduce((ss, b) => ss + (b.papQuantity || 0), 0), 0);
                              const cito = rm.reduce((s, r) => s + r.biopsias.reduce((ss, b) => ss + (b.citologiaQuantity || 0), 0), 0);
                              rows.push(
                                <tr key={`${medico}_${centro}`} className="border-b border-gray-50 hover:bg-blue-50/30">
                                  <td className="py-2 px-4 pl-14">
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{centro}</span>
                                  </td>
                                  <td className="py-2 px-3 text-center text-xs font-bold text-gray-700">{rm.length}</td>
                                  <td className="py-2 px-3 text-center text-xs font-bold text-gray-700">{pac}</td>
                                  <td className="py-2 px-3 text-center"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{bx}</span></td>
                                  <td className="py-2 px-3 text-center"><span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">{pq}</span></td>
                                  <td className="py-2 px-3 text-center"><span className="text-xs font-bold text-gray-600">{pap || '-'}</span></td>
                                  <td className="py-2 px-3 text-center"><span className="text-xs font-bold text-gray-600">{cito || '-'}</span></td>
                                  <td className="py-2 px-4 text-right text-sm font-bold text-gray-700">${total.toLocaleString()}</td>
                                  <td className="py-2 px-3 text-center">
                                    <div className="flex gap-1 justify-center">
                                      <button onClick={() => exportarFacturacionMedico(medico, centro)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold">
                                        <Download size={12} />
                                      </button>
                                      <button onClick={async () => {
                                        const doctorEmail = rm[0]?.email || '';
                                        if (!doctorEmail) { alert('Este médico no tiene email registrado.'); return; }
                                        try {
                                          const { sendEmail, isEmailConfigured } = await import('../utils/emailService');
                                          if (!isEmailConfigured()) { alert('EmailJS no está configurado. Andá a Configuración.'); return; }
                                          const fromName = labConfig.nombre || 'Laboratorio';
                                          const emailHtml = generarHTMLEmailFacturacion(medico, centro);
                                          const mesEmail = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                                          await sendEmail({ toEmail: doctorEmail, toName: medico, subject: 'Facturación ' + mesEmail + ' ' + centro + ' - ' + fromName, messageHtml: emailHtml, fromName });
                                          registrarEmailEnviado(medico, doctorEmail, centro);
                                          alert('Email de ' + centro + ' enviado a ' + doctorEmail);
                                        } catch (e: any) { alert('Error: ' + (e.message || e.text || 'Error')); }
                                      }} className={`${emailYaEnviado(medico, centro) ? 'bg-gray-400 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'} text-white px-2 py-1 rounded text-xs font-semibold`} title={emailYaEnviado(medico, centro) ? 'Ya enviado — click para reenviar' : 'Enviar email de ' + centro}>
                                        {emailYaEnviado(medico, centro) ? <><CheckCircle size={10} /> <span className="ml-0.5">Enviado</span></> : <Mail size={12} />}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          } else {
                            // Médico con un solo centro o sin centro: fila simple
                            const rm = rmMedico;
                            const total = totalMedico;
                            const pac = rm.reduce((s, r) => s + r.biopsias.length, 0);
                            const bx = rm.reduce((s, r) => s + r.biopsias.filter(b => b.tejido !== 'PAP' && b.tejido !== 'Citología' && b.tipo !== 'PQ').length, 0);
                            const pq = rm.reduce((s, r) => s + r.biopsias.filter(b => b.tipo === 'PQ').length, 0);
                            const pap = rm.reduce((s, r) => s + r.biopsias.reduce((ss, b) => ss + (b.papQuantity || 0), 0), 0);
                            const cito = rm.reduce((s, r) => s + r.biopsias.reduce((ss, b) => ss + (b.citologiaQuantity || 0), 0), 0);
                            const centroName = centros[0] !== 'Sin centro' ? centros[0] : '';
                            rows.push(
                              <tr key={medico} className="border-b border-gray-50 hover:bg-blue-50/30">
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                      {medico.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold text-gray-900">Dr/a. {medico}</div>
                                      {centroName && <div className="text-xs text-blue-500 font-medium">{centroName}</div>}
                                      <div className="text-xs text-gray-400">{rm[0]?.email || ''}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center text-xs font-bold text-gray-700">{rm.length}</td>
                                <td className="py-2.5 px-3 text-center text-xs font-bold text-gray-700">{pac}</td>
                                <td className="py-2.5 px-3 text-center"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{bx}</span></td>
                                <td className="py-2.5 px-3 text-center"><span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">{pq}</span></td>
                                <td className="py-2.5 px-3 text-center"><span className="text-xs font-bold text-gray-600">{pap || '-'}</span></td>
                                <td className="py-2.5 px-3 text-center"><span className="text-xs font-bold text-gray-600">{cito || '-'}</span></td>
                                <td className="py-2.5 px-4 text-right text-sm font-bold text-gray-900">${total.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex gap-1 justify-center">
                                    <button onClick={() => exportarFacturacionMedico(medico)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold">
                                      <Download size={12} />
                                    </button>
                                    <button onClick={async () => {
                                      const doctorEmail = rm[0]?.email || '';
                                      if (!doctorEmail) { alert('Este médico no tiene email registrado.'); return; }
                                      try {
                                        const { sendEmail, isEmailConfigured } = await import('../utils/emailService');
                                        if (!isEmailConfigured()) { alert('EmailJS no está configurado. Andá a Configuración.'); return; }
                                        const fromName = labConfig.nombre || 'Laboratorio';
                                        const emailHtml = generarHTMLEmailFacturacion(medico, centroName || undefined);
                                        const mesEmail = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                                        await sendEmail({ toEmail: doctorEmail, toName: medico, subject: 'Facturación ' + mesEmail + ' - ' + fromName, messageHtml: emailHtml, fromName });
                                        registrarEmailEnviado(medico, doctorEmail, centroName || undefined);
                                        alert('Email enviado a ' + doctorEmail);
                                      } catch (e: any) { alert('Error: ' + (e.message || e.text || 'Error')); }
                                    }} className={`${emailYaEnviado(medico, centroName || undefined) ? 'bg-gray-400 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'} text-white px-2 py-1 rounded text-xs font-semibold`} title={emailYaEnviado(medico, centroName || undefined) ? 'Ya enviado — click para reenviar' : 'Enviar email'}>
                                      {emailYaEnviado(medico, centroName || undefined) ? <><CheckCircle size={10} /> <span className="ml-0.5">Enviado</span></> : <Mail size={12} />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        });
                        return rows;
                      })()}
                      {/* Fila total general */}
                      <tr style={{ background: '#0f172a' }}>
                        <td className="py-3 px-4 text-white font-bold text-xs" colSpan={2}>TOTAL GENERAL</td>
                        <td className="py-3 px-3 text-center text-white font-bold text-xs">{totalPacientes}</td>
                        <td className="py-3 px-3 text-center text-white font-bold text-xs">{countBX}</td>
                        <td className="py-3 px-3 text-center text-white font-bold text-xs">{countPQ}</td>
                        <td className="py-3 px-3 text-center text-white font-bold text-xs">{countPAP || '-'}</td>
                        <td className="py-3 px-3 text-center text-white font-bold text-xs">{countCito || '-'}</td>
                        <td className="py-3 px-4 text-right text-white font-bold text-sm">${totalGeneral.toLocaleString()}</td>
                        <td className="py-3 px-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historial de emails enviados */}
              {(() => {
                const mesActual = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                const keyActual = `emailsFacturacion_${mesActual.replace(/\s+/g, '_')}`;
                const emailsDelMes: any[] = JSON.parse(localStorage.getItem(keyActual) || '[]');
                // Buscar meses anteriores
                const mesesConEmails: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const k = localStorage.key(i);
                  if (k?.startsWith('emailsFacturacion_')) {
                    const mes = k.replace('emailsFacturacion_', '').replace(/_/g, ' ');
                    if (!mesesConEmails.includes(mes)) mesesConEmails.push(mes);
                  }
                }
                mesesConEmails.sort((a, b) => new Date('1 ' + b).getTime() - new Date('1 ' + a).getTime());

                return (emailsDelMes.length > 0 || mesesConEmails.length > 0) ? (
                  <div className="px-5 pb-3">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div style={{ background: '#0f172a' }} className="px-4 py-2.5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Emails enviados — {mesActual}</h3>
                        <span className="text-xs text-white/60">{emailsDelMes.length} enviado(s)</span>
                      </div>
                      {emailsDelMes.length > 0 ? (
                        <div className="p-3 max-h-40 overflow-y-auto">
                          <div className="space-y-1">
                            {emailsDelMes.map((e: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">Dr./Dra. {e.medico}</span>
                                  {e.centro && <span className="text-blue-500">{e.centro}</span>}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <span>{e.email}</span>
                                  <span>{new Date(e.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} {new Date(e.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-xs text-gray-400">No se enviaron emails este mes</div>
                      )}
                      {mesesConEmails.length > 1 && (
                        <div className="px-3 pb-2 border-t border-gray-100 pt-2">
                          <div className="text-xs text-gray-400">Meses anteriores: {mesesConEmails.filter(m => m !== mesActual).map(m => {
                            const cnt = JSON.parse(localStorage.getItem(`emailsFacturacion_${m.replace(/\s+/g, '_')}`) || '[]').length;
                            return `${m} (${cnt})`;
                          }).join(' · ')}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Sección de actualización de precios (colapsable) */}
              <div className="px-5 pb-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div style={{ background: '#0f172a' }} className="px-4 py-3 flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      const el = document.getElementById('preciosSection');
                      if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                    }}>
                    <div>
                      <h3 className="text-sm font-bold text-white">Comunicar actualización de precios</h3>
                      <p className="text-xs text-white/50">Enviar tabla de precios vigentes a todos los médicos</p>
                    </div>
                    <span className="text-white/60 text-xs">▼</span>
                  </div>
                  <div id="preciosSection" style={{ display: 'none' }}>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Tabla de precios */}
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Precios vigentes</div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="text-left py-1.5 px-3 text-gray-500 font-semibold">Servicio</th>
                                <th className="text-right py-1.5 px-3 text-gray-500 font-semibold">Precio</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { name: 'Cassette Normal', price: configuracion.precioCassette },
                                { name: 'Cassette Urgente (24hs)', price: configuracion.precioCassetteUrgente },
                                { name: 'Profundización (cassette adicional)', price: configuracion.precioProfundizacion },
                                { name: 'PAP', price: configuracion.precioPAP },
                                { name: 'PAP Urgente', price: configuracion.precioPAPUrgente },
                                { name: 'Citología', price: configuracion.precioCitologia },
                                { name: 'Citología Urgente', price: configuracion.precioCitologiaUrgente },
                                { name: 'Corte en Blanco', price: configuracion.precioCorteBlanco },
                                { name: 'Corte en Blanco IHQ', price: configuracion.precioCorteBlancoIHQ },
                                { name: 'Giemsa/PAS/Masson (por técnica)', price: configuracion.precioGiemsaPASMasson },
                              ].map((item, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                  <td className="py-1.5 px-3 text-gray-700">{item.name}</td>
                                  <td className="py-1.5 px-3 text-right font-bold text-gray-900">${item.price.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mensaje personalizado */}
                      <div className="flex flex-col">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Mensaje para los médicos</div>
                        <textarea
                          id="preciosEmailMsg"
                          defaultValue={`Estimado/a Doctor/a:\n\nLe comunicamos la actualización de aranceles vigentes a partir de ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}.\n\nA continuación encontrará el detalle de los nuevos valores.\n\nQuedamos a disposición ante cualquier consulta.\n\nSaludos cordiales,\n${labConfig.nombre || 'Laboratorio'}`}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={8}
                        />
                        <button
                          onClick={() => {
                            const msg = (document.getElementById('preciosEmailMsg') as HTMLTextAreaElement)?.value || '';

                            // Generar HTML profesional con logo y colores
                            const preciosRows = [
                              ['Cassette Normal', configuracion.precioCassette],
                              ['Cassette Urgente (24hs)', configuracion.precioCassetteUrgente],
                              ['Profundización (cassette adicional)', configuracion.precioProfundizacion],
                              ['PAP', configuracion.precioPAP],
                              ['PAP Urgente', configuracion.precioPAPUrgente],
                              ['Citología', configuracion.precioCitologia],
                              ['Citología Urgente', configuracion.precioCitologiaUrgente],
                              ['Corte en Blanco', configuracion.precioCorteBlanco],
                              ['Corte en Blanco IHQ', configuracion.precioCorteBlancoIHQ],
                              ['Giemsa/PAS/Masson (por técnica)', configuracion.precioGiemsaPASMasson],
                            ];

                            const fullHTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f8fafc;">' +
                              '<div style="max-width:600px;margin:0 auto;">' +
                              '<div style="background:linear-gradient(135deg,#0f172a 0%,#1e40af 100%);color:white;padding:28px;border-radius:12px;text-align:center;margin-bottom:24px;">' +
                              (labConfig.logoUrl ? '<img src="' + labConfig.logoUrl + '" style="height:60px;margin-bottom:10px;" /><br>' : '') +
                              '<h2 style="margin:0;font-size:20px;font-weight:700;">' + (labConfig.nombre || 'Laboratorio') + '</h2>' +
                              '<p style="margin:6px 0 0;font-size:12px;opacity:0.7;">' + (labConfig.direccion || '') + ' | ' + (labConfig.telefono || '') + ' | ' + (labConfig.email || '') + '</p>' +
                              '</div>' +
                              '<div style="background:white;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin-bottom:20px;">' +
                              '<h3 style="margin:0 0 16px;color:#0f172a;font-size:16px;">Actualización de Aranceles</h3>' +
                              '<div style="white-space:pre-line;font-size:14px;line-height:1.6;color:#374151;margin-bottom:20px;">' + msg + '</div>' +
                              '</div>' +
                              '<div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
                              '<table style="width:100%;border-collapse:collapse;">' +
                              '<tr style="background:#0f172a;"><th style="padding:12px 16px;text-align:left;color:white;font-size:13px;">Servicio</th><th style="padding:12px 16px;text-align:right;color:white;font-size:13px;">Precio</th></tr>' +
                              preciosRows.map(function(row, i) { return '<tr style="border-bottom:1px solid #f1f5f9;' + (i % 2 !== 0 ? 'background:#f8fafc;' : '') + '"><td style="padding:10px 16px;font-size:13px;color:#374151;">' + row[0] + '</td><td style="padding:10px 16px;text-align:right;font-weight:700;color:#0f172a;font-size:13px;">$' + Number(row[1]).toLocaleString() + '</td></tr>'; }).join('') +
                              '</table></div>' +
                              '<p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:20px;">Powered by BiopsyTracker</p>' +
                              '</div></body></html>';

                            // Descargar HTML
                            const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8;' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = 'Actualizacion_Precios_' + new Date().toISOString().split('T')[0] + '.html';
                            link.click();

                            // Abrir modal de email
                            setEmailModal({ open: true, medico: 'Todos los médicos', email: 'todos' });
                            setEmailMessage(msg);
                          }}
                          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
                        >
                          <Mail size={14} /> Enviar actualización de precios por email
                        </button>
                      </div>
                    </div>
                  </div>
                  </div>{/* cierre preciosSection */}
                </div>
              </div>

                {/* Modal de envío de email */}
                {emailModal?.open && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Enviar Facturación</h3>
                      <p className="text-sm text-gray-500 mb-3">
                        Para: <span className="font-medium text-gray-700">{emailModal.medico}</span>
                        {emailModal.email && <span className="ml-1 text-blue-600">({emailModal.email})</span>}
                      </p>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                        <textarea
                          value={emailMessage}
                          onChange={(e) => setEmailMessage(e.target.value)}
                          rows={8}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">El reporte de facturación se adjuntará automáticamente.</p>
                      </div>

                      <div className="flex gap-3 mt-5">
                        <button onClick={() => setEmailModal(null)}
                          className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
                        >Cancelar</button>
                        <button
                          onClick={async () => {
                            try {
                              const { sendEmail, sendBulkEmail, isEmailConfigured } = await import('../utils/emailService');
                              if (!isEmailConfigured()) {
                                alert('EmailJS no está configurado. Andá a Configuración → Configuración de Email.');
                                return;
                              }

                              const fromName = labConfig.nombre || 'Laboratorio';
                              const subject = emailModal.medico === 'Todos los médicos' ? 'Actualización de Aranceles - ' + fromName : 'Facturación - ' + fromName;
                              const messageHtml = '<div style="font-family:Arial,sans-serif;white-space:pre-line;font-size:14px;line-height:1.6;">' + emailMessage.replace(/\n/g, '<br>') + '</div>';

                              if (emailModal.email === 'todos') {
                                // Envío masivo a todos los médicos
                                const docs = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
                                const recipients = docs.filter((d: any) => d.email).map((d: any) => ({ email: d.email, name: d.firstName + ' ' + d.lastName }));
                                if (recipients.length === 0) { alert('No hay médicos con email registrado.'); return; }
                                if (!confirm('¿Enviar email a ' + recipients.length + ' médicos?')) return;

                                const results = await sendBulkEmail(recipients, { subject, messageHtml, fromName });
                                const ok = results.filter(r => r.success).length;
                                const fail = results.filter(r => !r.success).length;
                                alert('Envío completado.\n✓ Enviados: ' + ok + '\n✗ Fallidos: ' + fail);
                              } else {
                                // Envío individual
                                await sendEmail({
                                  toEmail: emailModal.email,
                                  toName: emailModal.medico,
                                  subject,
                                  messageHtml,
                                  fromName
                                });
                                alert('Email enviado correctamente a ' + emailModal.email);
                              }
                              setEmailModal(null);
                            } catch (e: any) {
                              alert('Error al enviar: ' + (e.message || e.text || 'Error desconocido'));
                            }
                          }}
                          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                        >
                          <Mail size={16} /> Enviar Email
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
            );
          })()}

          {currentView === 'configuracion' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h2>
                  <p className="text-gray-600">Gestión de precios, tipos de tejido y parámetros del laboratorio</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      localStorage.setItem('adminConfig', JSON.stringify(configuracion));
                      if (currentLabCode) db.saveAdminConfig(currentLabCode, configuracion).catch(console.error);
                      alert('✅ Configuración guardada exitosamente');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>

              {/* Configuración de Precios */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="mr-2 text-green-600" size={20} />
                  Configuración de Precios
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Precios Normales */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-blue-600 text-white px-4 py-2.5 text-sm font-bold">Precios Normales</div>
                    <table className="w-full text-sm">
                      <tbody>
                        {[
                          { label: 'Cassette (BX/PQ)', key: 'precioCassette' },
                          { label: 'PAP', key: 'precioPAP' },
                          { label: 'Citología', key: 'precioCitologia' },
                          { label: 'Profundización', key: 'precioProfundizacion' },
                          { label: 'Corte en Blanco', key: 'precioCorteBlanco' },
                          { label: 'Corte en Blanco IHQ', key: 'precioCorteBlancoIHQ' },
                          { label: 'Giemsa/PAS/Masson', key: 'precioGiemsaPASMasson' },
                        ].map(({ label, key }) => (
                          <tr key={key} className="border-b border-gray-100">
                            <td className="px-4 py-2.5 font-medium text-gray-700">{label}</td>
                            <td className="px-4 py-2.5 w-32">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                                <input type="number" value={(configuracion as any)[key]} min="0"
                                  onChange={(e) => setConfiguracion(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                  className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Precios Urgentes */}
                  <div className="border border-red-200 rounded-xl overflow-hidden">
                    <div className="bg-red-600 text-white px-4 py-2.5 text-sm font-bold flex items-center gap-2">Precios Urgentes (24hs)</div>
                    <table className="w-full text-sm">
                      <tbody>
                        {[
                          { label: 'Cassette Urgente', key: 'precioCassetteUrgente' },
                          { label: 'PAP Urgente', key: 'precioPAPUrgente' },
                          { label: 'Citología Urgente', key: 'precioCitologiaUrgente' },
                        ].map(({ label, key }) => (
                          <tr key={key} className="border-b border-gray-100">
                            <td className="px-4 py-2.5 font-medium text-gray-700">{label}</td>
                            <td className="px-4 py-2.5 w-32">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                                <input type="number" value={(configuracion as any)[key]} min="0"
                                  onChange={(e) => setConfiguracion(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                  className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-red-500" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 bg-red-50 text-xs text-red-700">
                      El precio urgente reemplaza al normal (no se suma)
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Información:</strong> Los precios se actualizarán inmediatamente en todos los cálculos del sistema. 
                        Los remitos existentes mantendrán sus valores originales hasta que se recalculen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recordatorio de Deuda */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="mr-2 text-red-600" size={20} />
                  Recordatorio de Deuda
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Si no se ha registrado el pago hasta el día indicado, se habilitará la opción de enviar un recordatorio por email al médico.
                </p>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Activar recordatorio a partir del día</label>
                  <input
                    type="number"
                    value={(configuracion as any).diaRecordatorioDeuda || 15}
                    onChange={(e) => {
                      const dia = Math.max(1, Math.min(28, Number(e.target.value)));
                      const updated = { ...configuracion, diaRecordatorioDeuda: dia } as any;
                      setConfiguracion(updated);
                      localStorage.setItem('adminConfig', JSON.stringify(updated));
                      if (currentLabCode) db.saveAdminConfig(currentLabCode, updated).catch(() => {});
                    }}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-red-500"
                    min="1"
                    max="28"
                  />
                  <span className="text-sm text-gray-500">de cada mes</span>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje del recordatorio (email)</label>
                  <textarea
                    value={(configuracion as any).mensajeRecordatorioDeuda || 'Nos dirigimos a usted a fin de recordarle que, al día de la fecha, registra un saldo pendiente correspondiente al período del mes anterior por los servicios brindados por nuestro laboratorio.'}
                    onChange={(e) => {
                      const updated = { ...configuracion, mensajeRecordatorioDeuda: e.target.value } as any;
                      setConfiguracion(updated);
                      localStorage.setItem('adminConfig', JSON.stringify(updated));
                      if (currentLabCode) db.saveAdminConfig(currentLabCode, updated).catch(() => {});
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 resize-none"
                    placeholder="Mensaje personalizado para el recordatorio de deuda..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">Se incluirá automáticamente: nombre del médico, monto adeudado y datos del laboratorio</p>
                    <button onClick={() => {
                      const defaultMsg = 'Nos dirigimos a usted a fin de recordarle que, al día de la fecha, registra un saldo pendiente correspondiente al período del mes anterior por los servicios brindados por nuestro laboratorio.';
                      const updated = { ...configuracion, mensajeRecordatorioDeuda: defaultMsg } as any;
                      setConfiguracion(updated);
                      localStorage.setItem('adminConfig', JSON.stringify(updated));
                      if (currentLabCode) db.saveAdminConfig(currentLabCode, updated).catch(() => {});
                    }} className="text-xs text-blue-600 hover:text-blue-800 font-semibold whitespace-nowrap">
                      Restaurar predeterminado
                    </button>
                  </div>
                </div>

                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700">
                    📅 Si hoy es día <strong>{(configuracion as any).diaRecordatorioDeuda || 15}</strong> o posterior y hay médicos con deuda pendiente, aparecerá el botón de recordatorio en la sección de <strong>Cobros</strong>.
                  </p>
                </div>

                {/* Vista previa del email */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-800">
                    👁 Ver vista previa del email completo
                  </summary>
                  <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", maxWidth: '100%', padding: '24px', color: '#1a1a1a', lineHeight: 1.7, fontSize: '13px', background: 'white' }}>
                      <div style={{ borderBottom: '2px solid #1e3a5f', paddingBottom: '12px', marginBottom: '18px' }}>
                        <h3 style={{ color: '#1e3a5f', margin: 0, fontSize: '16px' }}>Recordatorio de Saldo Pendiente</h3>
                        <p style={{ color: '#64748b', fontSize: '11px', margin: '4px 0 0' }}>Ref: Servicios de [mes anterior]</p>
                      </div>
                      <p>Estimado/a <strong>Dr./Dra. [Nombre del médico]</strong>,</p>
                      <p style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: '6px', border: '1px dashed #3b82f6', color: '#1e40af', fontSize: '12px' }}>
                        ✏️ {(configuracion as any).mensajeRecordatorioDeuda || 'Nos dirigimos a usted a fin de recordarle que, al día de la fecha, registra un saldo pendiente...'}
                      </p>
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px', textAlign: 'center', margin: '14px 0' }}>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px' }}>Saldo pendiente — [mes]</p>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>$XX.XXX</span>
                      </div>
                      <p>Le solicitamos tenga a bien regularizar dicha situación a la mayor brevedad posible. Una vez efectuado el pago, le agradecemos enviar el comprobante correspondiente a esta misma dirección de correo, a fin de poder actualizar nuestros registros.</p>
                      <p>Quedamos a su disposición ante cualquier consulta o aclaración que considere necesaria.</p>
                      <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                        <p style={{ margin: 0 }}>Sin otro particular, lo saludamos atentamente.</p>
                        <p style={{ margin: '10px 0 0', fontWeight: 700, color: '#1e3a5f' }}>Administración</p>
                        <p style={{ margin: '2px 0', fontWeight: 700 }}>{labConfig.nombre || '[Nombre del Laboratorio]'}</p>
                        {labConfig.direccion && <p style={{ margin: '2px 0', fontSize: '12px', color: '#64748b' }}>{labConfig.direccion}</p>}
                        {labConfig.telefono && <p style={{ margin: '2px 0', fontSize: '12px', color: '#64748b' }}>Tel: {labConfig.telefono}</p>}
                        {labConfig.email && <p style={{ margin: '2px 0', fontSize: '12px', color: '#64748b' }}>{labConfig.email}</p>}
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              {/* Gestión de Tipos de Tejido */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="mr-2 text-purple-600" size={20} />
                    Tipos de Tejido
                  </h3>
                  <button
                    onClick={() => {
                      const nuevoTipo = prompt('Ingrese el nuevo tipo de tejido:');
                      if (nuevoTipo && nuevoTipo.trim()) {
                        setConfiguracion(prev => ({
                          ...prev,
                          tiposTejido: [...prev.tiposTejido, nuevoTipo.trim()]
                        }));
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Agregar Tipo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {configuracion.tiposTejido.map((tipo, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="text-sm font-medium text-gray-700">{tipo}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const nuevoNombre = prompt('Editar tipo de tejido:', tipo);
                            if (nuevoNombre && nuevoNombre.trim()) {
                              setConfiguracion(prev => ({
                                ...prev,
                                tiposTejido: prev.tiposTejido.map((t, i) => i === index ? nuevoNombre.trim() : t)
                              }));
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Está seguro de eliminar "${tipo}"?`)) {
                              setConfiguracion(prev => ({
                                ...prev,
                                tiposTejido: prev.tiposTejido.filter((_, i) => i !== index)
                              }));
                            }
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {configuracion.tiposTejido.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No hay tipos de tejido configurados</p>
                    <p className="text-sm">Agregue tipos de tejido para que aparezcan en los formularios</p>
                  </div>
                )}
              </div>

              {/* Configuración del Laboratorio */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Building className="mr-2 text-blue-600" size={20} />
                  Configuración del Laboratorio
                </h3>
                <p className="text-sm text-gray-500 mb-4">Estos datos se mostrarán en reportes, PDFs y la interfaz.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Laboratorio</label>
                    <input
                      type="text"
                      value={labConfig.nombre}
                      onChange={(e) => setLabConfig((prev: any) => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Lab. Patología Central"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email del Laboratorio</label>
                    <input
                      type="email"
                      value={labConfig.email}
                      onChange={(e) => setLabConfig((prev: any) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="contacto@laboratorio.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={labConfig.telefono}
                      onChange={(e) => setLabConfig((prev: any) => ({ ...prev, telefono: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                    <input
                      type="text"
                      value={labConfig.direccion}
                      onChange={(e) => setLabConfig((prev: any) => ({ ...prev, direccion: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Av. Principal 123, CABA"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo del Laboratorio</label>
                    <p className="text-xs text-gray-400 mb-2">Subir logo horizontal. Tamaño recomendado: 300x100 px. Máximo: 1MB. Formato: PNG o JPG.</p>
                    <div className="flex gap-3 items-start">
                      <label className="flex-1 cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                          <div className="text-sm text-gray-600 font-medium">
                            {labConfig.logoUrl ? 'Cambiar logo' : 'Seleccionar archivo'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">PNG, JPG o SVG</div>
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 1024 * 1024) {
                              alert('El archivo excede 1MB. Por favor, use una imagen más pequeña.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const dataUrl = ev.target?.result as string;
                              setLabConfig((prev: any) => ({ ...prev, logoUrl: dataUrl }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {labConfig.logoUrl && (
                        <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg border text-center" style={{ minWidth: '120px' }}>
                          <img src={labConfig.logoUrl} alt="Logo" style={{ maxHeight: '50px', maxWidth: '150px', margin: '0 auto', objectFit: 'contain' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <button
                            onClick={() => setLabConfig((prev: any) => ({ ...prev, logoUrl: '' }))}
                            className="text-xs text-red-500 hover:text-red-700 mt-1"
                          >Eliminar</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => saveLabConfig(labConfig)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>Guardar Configuración del Laboratorio</span>
                </button>

                {/* Preview en tiempo real con controles de posición */}
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase">Vista previa — Encabezado de reportes</div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Logo</span>
                        <button onClick={() => { const v = (labConfig.logoMarginTop || 0) - 2; setLabConfig((prev: any) => ({ ...prev, logoMarginTop: v })); }}
                          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 text-sm font-bold">▲</button>
                        <button onClick={() => { const v = (labConfig.logoMarginTop || 0) + 2; setLabConfig((prev: any) => ({ ...prev, logoMarginTop: v })); }}
                          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 text-sm font-bold">▼</button>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Info</span>
                        <button onClick={() => { const v = (labConfig.infoMarginTop || 0) - 2; setLabConfig((prev: any) => ({ ...prev, infoMarginTop: v })); }}
                          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 text-sm font-bold">▲</button>
                        <button onClick={() => { const v = (labConfig.infoMarginTop || 0) + 2; setLabConfig((prev: any) => ({ ...prev, infoMarginTop: v })); }}
                          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 text-sm font-bold">▼</button>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
                    borderRadius: '10px', padding: '16px', color: 'white', textAlign: 'center'
                  }}>
                    <div style={{ marginTop: (labConfig.logoMarginTop || 0) + 'px' }}>
                      {labConfig.logoUrl ? (
                        <img src={labConfig.logoUrl} alt="Logo" style={{ height: '50px', maxWidth: '200px', objectFit: 'contain', margin: '0 auto 8px' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{labConfig.nombre || 'Nombre del laboratorio'}</div>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: (labConfig.infoMarginTop || 0) + 'px' }}>
                      {labConfig.direccion || 'Dirección'} | {labConfig.telefono || 'Teléfono'} | {labConfig.email || 'Email'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuración de Email (EmailJS) */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <Mail className="mr-2 text-blue-600" size={20} />
                  Configuración de Email
                </h3>
                <p className="text-xs text-gray-400 mb-4">Configurá EmailJS para enviar emails desde el email del laboratorio. Los emails de facturación y notificaciones saldrán desde esta cuenta.</p>
                {(() => {
                  let emailCfg = { serviceId: '', templateId: '', publicKey: '' };
                  try { emailCfg = JSON.parse(localStorage.getItem('emailjsConfig') || '{}'); } catch {}
                  const isConfigured = !!(emailCfg.serviceId && emailCfg.templateId && emailCfg.publicKey);
                  return (
                    <div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Service ID</label>
                          <input type="text" defaultValue={emailCfg.serviceId} id="emailjs_serviceId"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="service_xxxxxxx" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Template ID</label>
                          <input type="text" defaultValue={emailCfg.templateId} id="emailjs_templateId"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="template_xxxxxxx" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Public Key</label>
                          <input type="text" defaultValue={emailCfg.publicKey} id="emailjs_publicKey"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="pk_xxxxxxxxxxxx" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => {
                          const sId = (document.getElementById('emailjs_serviceId') as HTMLInputElement)?.value || '';
                          const tId = (document.getElementById('emailjs_templateId') as HTMLInputElement)?.value || '';
                          const pKey = (document.getElementById('emailjs_publicKey') as HTMLInputElement)?.value || '';
                          const bodyText = (document.getElementById('emailjs_body') as HTMLTextAreaElement)?.value || '';
                          const footerText = (document.getElementById('emailjs_footer') as HTMLTextAreaElement)?.value || '';
                          localStorage.setItem('emailjsConfig', JSON.stringify({ serviceId: sId, templateId: tId, publicKey: pKey, bodyText, footerText }));
                          alert('Configuración de EmailJS guardada correctamente.');
                          setRemitos([...remitos]); // forzar re-render
                        }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                          <Save size={14} /> Guardar
                        </button>
                        <button onClick={async () => {
                          try {
                            const { sendTestEmail } = await import('../utils/emailService');
                            const testEmail = labConfig.email || prompt('Email para prueba:');
                            if (!testEmail) return;
                            await sendTestEmail(testEmail);
                            alert('Email de prueba enviado correctamente a ' + testEmail);
                          } catch (e: any) {
                            alert('Error al enviar: ' + (e.message || e.text || 'Verificá la configuración'));
                          }
                        }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                          <Mail size={14} /> Enviar prueba
                        </button>
                        <span className={`text-xs font-semibold ${isConfigured ? 'text-green-600' : 'text-gray-400'}`}>
                          {isConfigured ? '✓ Configurado' : 'No configurado'}
                        </span>
                      </div>
                      {/* Cuerpo y pie de email configurables */}
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Mensaje del email <span className="text-gray-400 font-normal">(opcional)</span></label>
                          <p className="text-xs text-gray-400 mb-2">Si se deja vacío, se usa el mensaje predeterminado que se muestra abajo.</p>
                          <textarea
                            id="emailjs_body"
                            defaultValue={(() => { try { return JSON.parse(localStorage.getItem('emailjsConfig') || '{}').bodyText || ''; } catch { return ''; } })()}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Escribí un mensaje personalizado o dejalo vacío para usar el predeterminado."
                          />
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs font-semibold text-blue-700 mb-1">Mensaje predeterminado (se usa si el campo está vacío):</div>
                            <div className="text-xs text-blue-900 italic leading-relaxed">
                              Estimado/a Dr./Dra. <strong>[nombre del médico]</strong>,<br/>
                              Por medio de la presente, le adjuntamos el detalle completo de las biopsias y pacientes remitidos a nuestro laboratorio durante el mes de <strong>[mes actual]</strong>.<br/>
                              Quedamos a su disposición para cualquier consulta o aclaración que considere necesaria.<br/>
                              Sin otro particular, saludamos a usted muy atentamente.
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Pie del email (datos de pago)</label>
                          <p className="text-xs text-gray-400 mb-2">Datos bancarios, CBU, alias, instrucciones de pago, etc.</p>
                          <textarea
                            id="emailjs_footer"
                            defaultValue={(() => { try { return JSON.parse(localStorage.getItem('emailjsConfig') || '{}').footerText || ''; } catch { return ''; } })()}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Datos para transferencia:&#10;Banco Nación - CBU: 000000000000&#10;Alias: laboratorio.pagos&#10;Titular: Laboratorio S.R.L."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Cambio de Credenciales Admin */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="mr-2 text-red-600" size={20} />
                  Cambiar Credenciales de Acceso
                </h3>
                <div>
                  <p className="text-sm text-gray-500 mb-3">Cambiá tu usuario y/o contraseña de acceso al panel de administración. Nadie más tiene acceso a estas credenciales.</p>
                  {!showChangePass ? (
                    <button onClick={() => setShowChangePass(true)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                      🔐 Cambiar credenciales
                    </button>
                  ) : (
                    <div className="space-y-3 max-w-md">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña actual</label>
                        <input type="password" value={credForm.currentPassword}
                          onChange={(e) => setCredForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ingresá tu contraseña actual" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nuevo usuario (opcional)</label>
                        <input type="text" value={credForm.newUser}
                          onChange={(e) => setCredForm(prev => ({ ...prev, newUser: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Dejá vacío para mantener el actual" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nueva contraseña</label>
                        <input type="password" value={credForm.newPassword}
                          onChange={(e) => setCredForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Mínimo 4 caracteres" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Confirmar nueva contraseña</label>
                        <input type="password" value={credForm.confirmPassword}
                          onChange={(e) => setCredForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Repetí la nueva contraseña" />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => {
                          try {
                            const labs = JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]');
                            const lab = labs.find((l: any) => l.labCode === currentLabCode);
                            if (!lab) { alert('Error: laboratorio no encontrado'); return; }
                            if (credForm.currentPassword !== (lab.adminPassword || 'admin123')) {
                              alert('❌ La contraseña actual es incorrecta'); return;
                            }
                            if (!credForm.newPassword || credForm.newPassword.length < 4) {
                              alert('La nueva contraseña debe tener al menos 4 caracteres'); return;
                            }
                            if (credForm.newPassword !== credForm.confirmPassword) {
                              alert('Las contraseñas nuevas no coinciden'); return;
                            }
                            const updatedLabs = labs.map((l: any) => l.labCode === currentLabCode ? {
                              ...l,
                              adminUser: credForm.newUser.trim() || l.adminUser || 'admin',
                              adminPassword: credForm.newPassword
                            } : l);
                            localStorage.setItem('superAdmin_laboratories', JSON.stringify(updatedLabs));
                            const updatedLab = updatedLabs.find((l: any) => l.labCode === currentLabCode);
                            if (updatedLab) db.saveLab(updatedLab).catch(console.error);
                            alert('✅ Credenciales actualizadas correctamente');
                            setCredForm({ currentPassword: '', newUser: '', newPassword: '', confirmPassword: '' });
                            setShowChangePass(false);
                          } catch { alert('Error al actualizar credenciales'); }
                        }}
                          disabled={!credForm.currentPassword || !credForm.newPassword || !credForm.confirmPassword}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                          Guardar cambios
                        </button>
                        <button onClick={() => { setShowChangePass(false); setCredForm({ currentPassword: '', newUser: '', newPassword: '', confirmPassword: '' }); }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gestión de Técnicos */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="mr-2 text-orange-600" size={20} />
                  Usuarios del Panel (Técnicos)
                </h3>
                <p className="text-sm text-gray-500 mb-4">Los técnicos pueden acceder al Dashboard y Gestión de Remitos, pero no a Facturación, Cobros ni Configuración.</p>
                {(() => {
                  const labs = JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]');
                  const lab = labs.find((l: any) => l.labCode === currentLabCode);
                  const tecnicos = lab?.adminTecnicos || [];

                  const saveTecnicos = (updated: any[]) => {
                    const allLabs = JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]');
                    const updatedLabs = allLabs.map((l: any) => l.labCode === currentLabCode ? { ...l, adminTecnicos: updated } : l);
                    localStorage.setItem('superAdmin_laboratories', JSON.stringify(updatedLabs));
                    const updatedLab = updatedLabs.find((l: any) => l.labCode === currentLabCode);
                    if (updatedLab) db.saveLab(updatedLab);
                  };

                  return (
                    <div>
                      {tecnicos.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-3">No hay técnicos registrados</p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {tecnicos.map((t: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border">
                              <div>
                                <div className="font-semibold text-sm text-gray-900">{t.nombre}</div>
                                <div className="text-xs text-gray-500">Usuario: <span className="font-mono font-semibold">{t.usuario}</span> · Clave: <span className="font-mono font-semibold">{t.password}</span></div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {t.activo ? 'Activo' : 'Inactivo'}
                                </span>
                                <button onClick={() => {
                                  const updated = [...tecnicos];
                                  updated[i] = { ...updated[i], activo: !updated[i].activo };
                                  saveTecnicos(updated);
                                  setRemitos([...remitos]); // force re-render
                                }} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                                  {t.activo ? 'Desactivar' : 'Activar'}
                                </button>
                                <button onClick={() => {
                                  if (confirm(`¿Eliminar técnico ${t.nombre}?`)) {
                                    saveTecnicos(tecnicos.filter((_: any, j: number) => j !== i));
                                    setRemitos([...remitos]);
                                  }
                                }} className="text-xs text-red-600 hover:text-red-800 font-semibold">
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Agregar técnico</div>
                        <div className="grid grid-cols-3 gap-2">
                          <input type="text" placeholder="Nombre" id="tecNombre"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                          <input type="text" placeholder="Usuario" id="tecUsuario"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
                          <input type="password" placeholder="Contraseña" id="tecPassword"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        <button onClick={() => {
                          const nombre = (document.getElementById('tecNombre') as HTMLInputElement)?.value?.trim();
                          const usuario = (document.getElementById('tecUsuario') as HTMLInputElement)?.value?.trim();
                          const password = (document.getElementById('tecPassword') as HTMLInputElement)?.value?.trim();
                          if (!nombre || !usuario || !password || password.length < 4) {
                            alert('Complete todos los campos (contraseña mín. 4 caracteres)');
                            return;
                          }
                          const updated = [...tecnicos, { nombre, usuario, password, activo: true, creadoAt: new Date().toISOString() }];
                          saveTecnicos(updated);
                          (document.getElementById('tecNombre') as HTMLInputElement).value = '';
                          (document.getElementById('tecUsuario') as HTMLInputElement).value = '';
                          (document.getElementById('tecPassword') as HTMLInputElement).value = '';
                          setRemitos([...remitos]);
                          alert(`✅ Técnico "${nombre}" agregado. Puede ingresar con usuario "${usuario}" y su contraseña.`);
                        }} className="mt-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                          + Agregar Técnico
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Control de Médicos */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="mr-2 text-purple-600" size={20} />
                  Control de Médicos Registrados
                </h3>
                {(() => {
                  const registeredDoctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
                  return (
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center flex-1">
                          <div className="text-2xl font-bold text-blue-700">{registeredDoctors.length}</div>
                          <div className="text-xs text-blue-600">Médicos Registrados</div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center flex-1">
                          <div className="text-2xl font-bold text-green-700">{registeredDoctors.filter((d: any) => d.active !== false).length}</div>
                          <div className="text-xs text-green-600">Activos</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center flex-1">
                          <div className="text-2xl font-bold text-gray-700">{registeredDoctors.filter((d: any) => d.active === false).length}</div>
                          <div className="text-xs text-gray-600">Inactivos</div>
                        </div>
                      </div>
                      {registeredDoctors.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No hay médicos registrados aún.</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {registeredDoctors.map((doc: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm">{doc.firstName} {doc.lastName}</div>
                                <div className="text-xs text-gray-500">{doc.email}</div>
                                <div className="text-xs text-gray-400">Alta: {new Date(doc.registeredAt).toLocaleDateString('es-AR')}</div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="tel"
                                    placeholder="WhatsApp"
                                    defaultValue={doc.whatsapp || ''}
                                    className="w-28 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                    onBlur={(e) => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      const docs = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
                                      docs[idx] = { ...docs[idx], whatsapp: val };
                                      localStorage.setItem('registeredDoctors', JSON.stringify(docs));
                                    }}
                                  />
                                  {doc.whatsapp && (
                                    <span className="text-xs text-green-600 font-semibold">WA ✓</span>
                                  )}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  doc.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {doc.active !== false ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Resumen de Suscripción Mensual */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5">
                <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <DollarSign className="mr-2 text-blue-600" size={16} />
                  Resumen de Suscripción Mensual
                </h3>
                {(() => {
                  const registeredDoctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
                  const activeDoctors = registeredDoctors.filter((d: any) => d.active !== false).length;
                  let pricePerDoctor = 35000;
                  try { pricePerDoctor = JSON.parse(localStorage.getItem('superAdmin_config') || '{}').precioMedico || 35000; } catch {}
                  const totalMonthly = activeDoctors * pricePerDoctor;
                  return (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl p-4 border text-center">
                        <div className="text-2xl font-bold text-blue-700">{activeDoctors}</div>
                        <div className="text-xs text-gray-600">Médicos Activos</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border text-center">
                        <div className="text-lg font-bold text-gray-700">${pricePerDoctor.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Precio / Médico</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border text-center">
                        <div className="text-2xl font-bold text-green-600">${totalMonthly.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Total Mensual</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Información de la Aplicación - Al final */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-200 p-5 mt-2">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                  <Award className="mr-2 text-gray-400" size={16} />
                  Información de la Aplicación
                </h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="font-medium text-gray-700">{(() => { try { return JSON.parse(localStorage.getItem('superAdmin_config') || '{}').appNombre || 'BiopsyTracker'; } catch { return 'BiopsyTracker'; } })()} Professional</p>
                    <p className="text-gray-500">Versión {(() => { try { return JSON.parse(localStorage.getItem('superAdmin_config') || '{}').appVersion || '2.5.0'; } catch { return '2.5.0'; } })()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Licencia</p>
                    <p className="text-gray-500">Profesional</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Soporte</p>
                    <p className="text-gray-500">{(() => { try { return JSON.parse(localStorage.getItem('superAdmin_config') || '{}').soporteEmail || 'support@biopsytracker.com'; } catch { return 'support@biopsytracker.com'; } })()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN SOLICITUDES */}
          {currentView === 'solicitudes' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex-shrink-0 px-5 pt-4 pb-3">
                <h2 className="text-lg font-bold text-gray-900">📦 Solicitudes de Material</h2>
                <p className="text-xs text-gray-400">Tacos, profundizaciones y servicios adicionales solicitados por médicos</p>
              </div>
              <div className="flex-1 overflow-auto px-5 pb-4">
                {(() => {
                  const solsPendientes = solicitudesAdmin.filter((s: any) => s.estado === 'pendiente' || s.estado === 'en_proceso');
                  const solsHistorial = solicitudesAdmin.filter((s: any) => s.estado === 'entregado' || s.estado === 'rechazado');
                  const tipoBadge = (tipo: string) => tipo === 'taco' ? 'bg-amber-100 text-amber-800' : tipo === 'profundizacion' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
                  const tipoLabel = (tipo: string) => tipo === 'taco' ? '📦 Taco' : tipo === 'profundizacion' ? '🔬 Profundización' : '➕ Serv. Adicional';
                  const estadoBadge = (estado: string) => estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' : estado === 'entregado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                  const estadoLabel = (estado: string) => estado === 'pendiente' ? '⏳ Pendiente' : estado === 'en_proceso' ? '🔄 En proceso' : estado === 'entregado' ? '✓ Entregado' : '✕ Rechazado';

                  const handleUpdateSolicitud = async (sol: any, nuevoEstado: string) => {
                    const updated = { ...sol, estado: nuevoEstado, ...(nuevoEstado === 'entregado' ? { entregadoAt: new Date().toISOString(), entregadoPor: loginForm.username || 'Laboratorio' } : {}) };
                    await db.saveSolicitud(updated);
                    setSolicitudesAdmin((prev: any[]) => prev.map(s => s.id === sol.id ? updated : s));
                    // Solo notificar entregado y rechazado (no en_proceso)
                    if (nuevoEstado === 'entregado' || nuevoEstado === 'rechazado') {
                      const tipoMsg = sol.tipo === 'taco' ? 'Taco/Cassette' : sol.tipo === 'profundizacion' ? 'Profundización' : 'Servicio Adicional';
                      const notif = {
                        id: `NOTIF_SOL_${Date.now()}`,
                        remitoId: sol.id,
                        medicoEmail: sol.doctorEmail || '',
                        mensaje: nuevoEstado === 'entregado'
                          ? `${tipoMsg} listo para retirar!\nPaciente #${sol.numeroPaciente || ''} — ${sol.tejido || ''}\nRemito #${sol.remitoNumber || ''}`
                          : `Solicitud de ${tipoMsg} rechazada.\nPaciente #${sol.numeroPaciente || ''} — ${sol.tejido || ''}\nRemito #${sol.remitoNumber || ''}`,
                        fecha: new Date().toISOString(),
                        leida: false,
                        tipo: nuevoEstado === 'entregado' ? 'listo' : 'parcial'
                      };
                      db.saveNotification(notif).catch(console.error);

                      // Auto-facturar: agregar servicios al remito original
                      if (nuevoEstado === 'entregado' && (sol.tipo === 'profundizacion' || sol.tipo === 'servicio_adicional')) {
                        try {
                          const remitoOrig = remitos.find(r => (r as any).remitoNumber === sol.remitoNumber);
                          if (remitoOrig) {
                            const desc = sol.descripcion || '';
                            const biopsiaIdx = remitoOrig.biopsias.findIndex((b: any) => b.numero === sol.numeroPaciente);
                            if (biopsiaIdx >= 0) {
                              const biopsia = { ...remitoOrig.biopsias[biopsiaIdx] };
                              const sv = { ...(biopsia.servicios || {}) } as any;

                              if (sol.tipo === 'profundizacion') {
                                sv.profundizacion = (sv.profundizacion || 0) + 1;
                              } else {
                                if (desc.includes('Giemsa') || desc.includes('PAS') || desc.includes('Masson')) {
                                  const tCount = (desc.includes('Giemsa') ? 1 : 0) + (desc.includes('PAS') ? 1 : 0) + (desc.includes('Masson') ? 1 : 0);
                                  sv.giemsaPASMasson = (sv.giemsaPASMasson || 0) + tCount;
                                }
                                const ihqMatch = desc.match(/Vidrios IHQ ×(\d+)/);
                                if (ihqMatch) sv.corteBlancoIHQ = (sv.corteBlancoIHQ || 0) + parseInt(ihqMatch[1]);
                                const blancoMatch = desc.match(/Vidrios Blanco ×(\d+)/);
                                if (blancoMatch) sv.corteBlanco = (sv.corteBlanco || 0) + parseInt(blancoMatch[1]);
                              }

                              biopsia.servicios = sv;

                              // Verificar si el remito es del mismo mes o de uno anterior
                              const now = new Date();
                              const remitoFecha = new Date(remitoOrig.fecha);
                              const mismoMes = remitoFecha.getMonth() === now.getMonth() && remitoFecha.getFullYear() === now.getFullYear();

                              if (mismoMes) {
                                // MISMO MES: agregar al remito original
                                const updatedBiopsias = [...remitoOrig.biopsias];
                                updatedBiopsias[biopsiaIdx] = biopsia;
                                const updatedRemito = { ...remitoOrig, biopsias: updatedBiopsias, modificadoPorSolicitud: true, modificadoAt: now.toISOString() };
                                const updatedRemitos = remitos.map(r => r.id === remitoOrig.id ? updatedRemito : r);
                                setRemitos(updatedRemitos as any);
                                localStorage.setItem('adminRemitos', JSON.stringify(updatedRemitos));
                                db.saveRemito(updatedRemito).catch(console.error);
                              } else {
                                // MES ANTERIOR: crear remito nuevo en el mes actual
                                const mesOriginal = remitoFecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                                const tipoLabel = sol.tipo === 'profundizacion' ? 'Profundización' : 'Servicio adicional';
                                const nuevoRemito: any = {
                                  id: `SOL_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                                  labCode: (remitoOrig as any).labCode || '',
                                  medico: remitoOrig.medico,
                                  email: remitoOrig.email,
                                  doctorEmail: (remitoOrig as any).doctorEmail || remitoOrig.email,
                                  fecha: now.toISOString(),
                                  timestamp: now.toISOString(),
                                  hospital: remitoOrig.hospital,
                                  estado: 'pendiente',
                                  biopsias: [biopsia],
                                  esServicioAdicional: true,
                                  esProfundizacion: sol.tipo === 'profundizacion',
                                  remitoOriginalId: remitoOrig.id,
                                  remitoOriginalFecha: remitoOrig.fecha,
                                  notaServicioAdicional: `${tipoLabel} por solicitud médico - original de ${mesOriginal}`,
                                  modificadoPorSolicitud: true,
                                  remitoNumber: `SOL${Date.now().toString().slice(-6)}`,
                                };
                                const updatedRemitos = [...remitos, nuevoRemito];
                                setRemitos(updatedRemitos as any);
                                localStorage.setItem('adminRemitos', JSON.stringify(updatedRemitos));
                                db.saveRemito(nuevoRemito).catch(console.error);
                              }
                            }
                          }
                        } catch (e) {
                          console.error('Error auto-facturando solicitud:', e);
                        }
                      }
                    }
                  };

                  // Buscar nombre del médico desde los remitos
                  const getMedicoName = (email: string) => {
                    const r = remitos.find(rem => rem.email?.toLowerCase() === email?.toLowerCase());
                    return r ? r.medico : email;
                  };

                  if (solicitudesAdmin.length === 0) {
                    return (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center py-8">
                          <Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                          <p className="text-gray-400 text-sm">No hay solicitudes</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Pendientes y en proceso */}
                      {solsPendientes.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            Pendientes
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{solsPendientes.length}</span>
                          </h3>
                          <div className="space-y-2">
                            {solsPendientes.map((sol: any) => (
                              <div key={sol.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tipoBadge(sol.tipo)}`}>{tipoLabel(sol.tipo)}</span>
                                  <span className="text-sm font-bold text-gray-800">Pac. #{sol.numeroPaciente}</span>
                                  <span className="text-xs text-gray-500">Remito #{sol.remitoNumber}</span>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-auto ${estadoBadge(sol.estado)}`}>{estadoLabel(sol.estado)}</span>
                                </div>
                                <div className="text-sm text-gray-700 mb-1">
                                  <strong>Dr/a. {getMedicoName(sol.doctorEmail)}</strong>
                                  {sol.solicitadoPor && !sol.solicitadoPor.startsWith('Dr') && <span className="text-amber-600 ml-1">({sol.solicitadoPor})</span>}
                                </div>
                                <div className="text-xs text-gray-500 mb-1">
                                  {new Date(sol.solicitadoAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })}
                                </div>
                                {sol.cassetteLabels && sol.cassetteLabels.length > 0 && (
                                  <div className="text-xs text-gray-600 mb-1">Cassettes: <strong>{sol.cassetteLabels.join(', ')}</strong></div>
                                )}
                                {sol.descripcion && <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 mb-2">{sol.descripcion}</p>}
                                <div className="flex gap-2 mt-2">
                                  {sol.tipo === 'taco' && sol.id?.startsWith('SOL_TACO_') ? (
                                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 font-semibold">
                                      📦 Se entrega automáticamente al marcar el remito como Listo
                                    </div>
                                  ) : (
                                    <>
                                      {sol.estado === 'pendiente' && (
                                        <>
                                          <button onClick={() => handleUpdateSolicitud(sol, 'en_proceso')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold">En proceso</button>
                                          <button onClick={() => { if (confirm('¿Rechazar esta solicitud?')) handleUpdateSolicitud(sol, 'rechazado'); }} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold">Rechazar</button>
                                        </>
                                      )}
                                      {sol.estado === 'en_proceso' && (
                                        <button onClick={() => handleUpdateSolicitud(sol, 'entregado')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold">✓ Marcar Entregado</button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Historial */}
                      {solsHistorial.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold text-gray-500 mb-2">Historial ({solsHistorial.length})</h3>
                          <div className="space-y-2">
                            {solsHistorial.map((sol: any) => (
                              <div key={sol.id} className={`border rounded-lg p-3 ${sol.estado === 'entregado' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${tipoBadge(sol.tipo)}`}>{tipoLabel(sol.tipo)}</span>
                                    <span className="text-sm font-semibold">#{sol.numeroPaciente}</span>
                                    <span className="text-xs text-gray-500">Rem. #{sol.remitoNumber}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${estadoBadge(sol.estado)}`}>{estadoLabel(sol.estado)}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  <strong>Dr/a. {getMedicoName(sol.doctorEmail)}</strong>
                                  {sol.solicitadoPor && !sol.solicitadoPor.startsWith('Dr') && <span className="text-amber-600 ml-1">({sol.solicitadoPor})</span>}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Solicitado: {new Date(sol.solicitadoAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })}
                                  {sol.entregadoAt && <> · Entregado: {new Date(sol.entregadoAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })}</>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {currentView === 'buscador-tacos' && (() => {
            const buscarTaco = () => {
              if (!tacoBusqueda.trim()) return;
              const q = tacoBusqueda.trim().toLowerCase();
              setTacoBuscado(true);
              const results: any[] = [];

              // Buscar en solicitudes de tipo "taco" entregadas
              solicitudesAdmin.filter(s => s.tipo === 'taco' && s.estado === 'entregado').forEach(sol => {
                const labels = (sol.cassetteLabels || []).map((l: string) => l.toLowerCase());
                if (labels.some((l: string) => l.includes(q))) {
                  const medicoName = remitos.find(r => r.email?.toLowerCase() === sol.doctorEmail?.toLowerCase())?.medico || sol.doctorEmail;
                  results.push({
                    tipo: 'entregado',
                    medico: medicoName,
                    fecha: sol.entregadoAt,
                    paciente: sol.numeroPaciente,
                    remito: sol.remitoNumber,
                    cassettes: labels.filter((l: string) => l.includes(q)),
                    entregadoPor: sol.entregadoPor,
                  });
                }
              });

              // Buscar en biopsias de todos los remitos (cassettesNumbers)
              remitos.forEach(remito => {
                remito.biopsias.forEach((b: any) => {
                  const cassetteNums = (b.cassettesNumbers || []).map((c: any) => `${c.base}-${c.suffix}`.toLowerCase());
                  if (cassetteNums.some((cn: string) => cn.includes(q))) {
                    const yaEntregado = results.find(r => r.tipo === 'entregado' && r.remito === (remito as any).remitoNumber && r.paciente === b.numero);
                    if (!yaEntregado) {
                      results.push({
                        tipo: 'en_laboratorio',
                        medico: remito.medico,
                        fecha: remito.fecha,
                        paciente: b.numero,
                        remito: (remito as any).remitoNumber,
                        cassettes: cassetteNums.filter((cn: string) => cn.includes(q)),
                        tejido: b.tissueType || b.type,
                      });
                    }
                  }
                });
              });

              setTacoResultados(results);
            };

            return (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex-shrink-0 px-5 pt-4 pb-3">
                <h2 className="text-lg font-bold text-gray-900">Buscar Taco / Cassette</h2>
                <p className="text-xs text-gray-400 mb-4">Ingresá el número de taco o cassette para rastrear su ubicación</p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tacoBusqueda}
                    onChange={e => { setTacoBusqueda(e.target.value); setTacoBuscado(false); }}
                    onKeyDown={e => e.key === 'Enter' && buscarTaco()}
                    placeholder="Ej: BX26-001, A1, 3..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <button
                    onClick={buscarTaco}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
                  >
                    <Search size={16} /> Buscar
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4">
                {tacoBuscado && tacoResultados.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-400 text-sm">No se encontró ningún cassette con "{tacoBusqueda}"</p>
                  </div>
                )}

                {tacoResultados.length > 0 && (
                  <div className="space-y-3 mt-3">
                    {tacoResultados.map((r: any, i: number) => (
                      <div key={i} className={`p-4 rounded-xl border ${r.tipo === 'entregado' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${r.tipo === 'entregado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {r.tipo === 'entregado' ? '✅ Entregado al médico' : '🏥 En el laboratorio'}
                          </span>
                          <span className="text-xs text-gray-500">Remito #{r.remito}</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">Dr/a. {r.medico}</div>
                        <div className="text-xs text-gray-600 mt-1">Paciente: {r.paciente}</div>
                        {r.tejido && <div className="text-xs text-gray-500">Tejido: {r.tejido}</div>}
                        <div className="text-xs text-gray-500 mt-1">
                          Cassettes encontrados: <strong>{r.cassettes.join(', ')}</strong>
                        </div>
                        {r.tipo === 'entregado' && r.fecha && (
                          <div className="text-xs text-green-700 mt-1 font-semibold">
                            Entregado el {new Date(r.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {r.entregadoPor && ` por ${r.entregadoPor}`}
                          </div>
                        )}
                        {r.tipo === 'en_laboratorio' && (
                          <div className="text-xs text-blue-700 mt-1 font-semibold">
                            Ingresado el {new Date(r.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {currentView === 'analytics' && (() => {
            const totalFacturado = remitos.reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
            let totalCobrado = 0;
            try { totalCobrado = JSON.parse(localStorage.getItem('doctorPayments') || '[]').reduce((s: number, p: any) => s + (p.monto || 0), 0); } catch {}
            const totalDeuda = Math.max(0, totalFacturado - totalCobrado);

            return (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 px-5 pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Cobros</h2>
                    <p className="text-xs text-gray-400">Control de pagos por médico</p>
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: 'FACTURADO', value: '$' + totalFacturado.toLocaleString(), bg: '#0f172a' },
                    { label: 'COBRADO', value: '$' + totalCobrado.toLocaleString(), bg: '#059669' },
                    { label: 'DEUDA', value: '$' + totalDeuda.toLocaleString(), bg: totalDeuda > 0 ? '#dc2626' : '#059669' },
                  ].map((k, i) => (
                    <div key={i} style={{ backgroundColor: k.bg }} className="rounded-xl p-3 text-white text-center">
                      <div className="text-xl font-bold">{k.value}</div>
                      <div className="text-xs opacity-70">{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Filtros */}
                <div className="flex gap-2">
                  {[
                    { key: 'todos', label: 'Todos' },
                    { key: 'deudores', label: 'Con deuda' },
                    { key: 'al_dia', label: 'Al día' }
                  ].map(f => (
                    <button key={f.key} onClick={() => setCobrosFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        cobrosFilter === f.key
                          ? (f.key === 'deudores' ? 'bg-red-600 text-white border-red-600' : f.key === 'al_dia' ? 'bg-green-600 text-white border-green-600' : 'bg-blue-600 text-white border-blue-600')
                          : (f.key === 'deudores' ? 'bg-white text-red-600 border-red-200 hover:border-red-400' : f.key === 'al_dia' ? 'bg-white text-green-600 border-green-200 hover:border-green-400' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')
                      }`}>{f.label}</button>
                  ))}
                </div>
              </div>

              {/* Tabla */}
              <div className="flex-1 overflow-auto px-5 pb-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="sticky top-0">
                      <tr style={{ background: '#0f172a' }}>
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-white/70 uppercase">Médico</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">Rem.</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">Pac.</th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">Total</th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">Pagado</th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">Debe</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-white/70 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicos.filter((medico) => {
                        if (cobrosFilter === 'todos') return true;
                        const rm = remitos.filter(r => r.medico === medico);
                        const tot = rm.reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
                        let pag = 0;
                        try { pag = JSON.parse(localStorage.getItem('doctorPayments') || '[]').filter((p: any) => p.medico === medico).reduce((s: number, p: any) => s + (p.monto || 0), 0); } catch {}
                        const debe = Math.max(0, tot - pag);
                        if (cobrosFilter === 'deudores') return debe > 0;
                        if (cobrosFilter === 'al_dia') return debe === 0;
                        return true;
                      }).map((medico) => {
                        const remitosM = remitos.filter(r => r.medico === medico);
                        const totalM = remitosM.reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
                        const pacientes = remitosM.reduce((s, r) => s + r.biopsias.length, 0);
                        let pagadoM = 0;
                        try { const payments = JSON.parse(localStorage.getItem('doctorPayments') || '[]'); pagadoM = payments.filter((p: any) => p.medico === medico).reduce((s: number, p: any) => s + (p.monto || 0), 0); } catch {}
                        const debeM = Math.max(0, totalM - pagadoM);

                        const centrosM = [...new Set(remitosM.map(r => r.hospital).filter(Boolean))];
                        return (<React.Fragment key={medico}>
                          <tr className={`border-b border-gray-50 hover:bg-blue-50/20 ${debeM > 0 ? 'bg-red-50/30' : ''}`}>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {medico.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-gray-900">Dr/a. {medico}</div>
                                  {centrosM.length > 0 && (
                                    <div className="text-xs text-blue-500">{centrosM.join(' · ')}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center text-xs font-bold text-gray-600">{remitosM.length}</td>
                            <td className="py-2.5 px-3 text-center text-xs font-bold text-gray-600">{pacientes}</td>
                            <td className="py-2.5 px-3 text-right text-xs font-bold text-gray-900">${totalM.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right text-xs font-bold text-green-700">${pagadoM.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`text-xs font-bold ${debeM > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {debeM > 0 ? '$' + debeM.toLocaleString() : 'Al día'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => { setPaymentModal({ open: true, medico, deuda: debeM }); setPaymentForm({ monto: '', metodo: 'efectivo', fecha: new Date().toISOString().split('T')[0] }); }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold">+ Pago</button>
                                <button onClick={() => setShowPaymentHistory(showPaymentHistory === medico ? null : medico)}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
                                  {showPaymentHistory === medico ? '▲' : '▼'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {showPaymentHistory === medico && (
                            <tr>
                              <td colSpan={7} className="py-2 px-4" style={{ background: '#f8fafc' }}>
                                {centrosM.length > 1 && (
                                  <div className="mb-3">
                                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Desglose por centro</div>
                                    <div className="flex gap-2 flex-wrap">
                                      {centrosM.map((c, ci) => {
                                        const rmC = remitosM.filter(r => r.hospital === c);
                                        const totC = rmC.reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
                                        return (
                                          <div key={ci} className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs">
                                            <span className="font-semibold text-blue-600">{c}</span>
                                            <span className="text-gray-400 mx-1">·</span>
                                            <span className="font-bold text-gray-900">${totC.toLocaleString()}</span>
                                            <span className="text-gray-400 ml-1">({rmC.length} rem.)</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Historial de pagos</div>
                                {(() => {
                                  let payments: any[] = [];
                                  try { payments = JSON.parse(localStorage.getItem('doctorPayments') || '[]').filter((p: any) => p.medico === medico); } catch {}
                                  return payments.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">Sin pagos registrados</p>
                                  ) : (
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                      {payments.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-100 text-xs">
                                          <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900">${p.monto?.toLocaleString()}</span>
                                            <span className="text-gray-400">{p.metodo === 'transferencia' ? 'Transferencia' : 'Efectivo'}</span>
                                          </div>
                                          <span className="text-gray-400">{new Date(p.fecha).toLocaleDateString('es-AR')}</span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>);
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botón recordatorio de deuda (configurable) */}
              {(() => {
                const hoy = new Date();
                const diaRecordatorio = (configuracion as any).diaRecordatorioDeuda || 15;
                if (hoy.getDate() < diaRecordatorio) return null;
                const deudores: { medico: string; email: string; deuda: number }[] = [];
                medicos.forEach(medico => {
                  const rm = remitos.filter(r => r.medico === medico);
                  const tot = rm.reduce((s, r) => s + calcularTotalRemito(r.biopsias), 0);
                  let pag = 0;
                  try { pag = JSON.parse(localStorage.getItem('doctorPayments') || '[]').filter((p: any) => p.medico === medico).reduce((s: number, p: any) => s + (p.monto || 0), 0); } catch {}
                  const debe = Math.max(0, tot - pag);
                  if (debe > 0) {
                    const emailDoc = rm[0]?.email || '';
                    deudores.push({ medico, email: emailDoc, deuda: debe });
                  }
                });
                if (deudores.length === 0) return null;
                const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toLocaleDateString('es-AR', { month: 'long' });
                return (
                  <div className="px-5 pb-3">
                    <button onClick={async () => {
                      const labNombre = labConfig.nombre || 'Laboratorio';
                      const confirmar = confirm(`¿Enviar recordatorio de deuda a ${deudores.length} médico(s)?`);
                      if (!confirmar) return;
                      try {
                        const { sendEmail, isEmailConfigured } = await import('../utils/emailService');
                        if (!isEmailConfigured()) { alert('EmailJS no está configurado. Andá a Configuración → Email.'); return; }
                        let enviados = 0;
                        for (const d of deudores) {
                          if (!d.email) continue;
                          try {
                            await sendEmail({
                              toEmail: d.email,
                              toName: `Dr/a. ${d.medico}`,
                              subject: `Recordatorio de pago pendiente — ${labNombre}`,
                              messageHtml: `<div style="font-family:Georgia,'Times New Roman',serif;max-width:600px;margin:0 auto;padding:30px;color:#1a1a1a;line-height:1.7;">
                                <div style="border-bottom:2px solid #1e3a5f;padding-bottom:16px;margin-bottom:24px;">
                                  <h2 style="color:#1e3a5f;margin:0;font-size:18px;">Recordatorio de Saldo Pendiente</h2>
                                  <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Ref: Servicios de ${mesAnterior}</p>
                                </div>
                                <p>Estimado/a <strong>Dr./Dra. ${d.medico}</strong>,</p>
                                <p>${(configuracion as any).mensajeRecordatorioDeuda || 'Nos dirigimos a usted a fin de recordarle que, al día de la fecha, registra un saldo pendiente correspondiente al período del mes anterior por los servicios brindados por nuestro laboratorio.'}</p>
                                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
                                  <p style="font-size:12px;color:#64748b;margin:0 0 6px;">Saldo pendiente — ${mesAnterior}</p>
                                  <span style="font-size:32px;font-weight:bold;color:#dc2626;">$${d.deuda.toLocaleString()}</span>
                                </div>
                                <p>Le solicitamos tenga a bien regularizar dicha situación a la mayor brevedad posible. Una vez efectuado el pago, le agradecemos enviar el comprobante correspondiente a esta misma dirección de correo, a fin de poder actualizar nuestros registros.</p>
                                <p>Quedamos a su disposición ante cualquier consulta o aclaración que considere necesaria.</p>
                                <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0;">
                                  <p style="margin:0;">Sin otro particular, lo saludamos atentamente.</p>
                                  <p style="margin:16px 0 0;font-weight:700;color:#1e3a5f;">Administración</p>
                                  <p style="margin:2px 0;font-weight:700;font-size:16px;">${labNombre}</p>
                                  ${labConfig.direccion ? '<p style="margin:2px 0;font-size:13px;color:#64748b;">' + labConfig.direccion + '</p>' : ''}
                                  ${labConfig.telefono ? '<p style="margin:2px 0;font-size:13px;color:#64748b;">Tel: ' + labConfig.telefono + '</p>' : ''}
                                  ${labConfig.email ? '<p style="margin:2px 0;font-size:13px;color:#64748b;">' + labConfig.email + '</p>' : ''}
                                </div>
                              </div>`,
                              fromName: labNombre,
                            });
                            enviados++;
                            await new Promise(r => setTimeout(r, 500));
                          } catch {}
                        }
                        alert(`✅ Recordatorio enviado a ${enviados} de ${deudores.length} médico(s).`);
                      } catch (e: any) { alert('Error: ' + (e.message || 'Verificá la configuración de email')); }
                    }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                      <Mail size={16} />
                      Enviar recordatorio de deuda a {deudores.length} médico(s) — mes de {mesAnterior}
                    </button>
                  </div>
                );
              })()}

              {/* Modal de registro de pago */}
              {paymentModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Registrar Pago</h3>
                    <p className="text-sm text-gray-500 mb-4">{paymentModal.medico} — Deuda: <span className="font-bold text-red-600">${paymentModal.deuda.toLocaleString()}</span></p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                        <input type="number" value={paymentForm.monto}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, monto: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-green-500"
                          placeholder="0" min="0" autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['efectivo', 'transferencia'].map(m => (
                            <button key={m} onClick={() => setPaymentForm(prev => ({ ...prev, metodo: m }))}
                              className={`py-3 rounded-lg text-sm font-semibold border-2 transition-all ${
                                paymentForm.metodo === m
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {m === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del pago</label>
                        <input type="date" value={paymentForm.fecha}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, fecha: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setPaymentModal({ open: false, medico: '', deuda: 0 })}
                        className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
                      >Cancelar</button>
                      <button
                        onClick={() => {
                          const monto = Number(paymentForm.monto);
                          if (!monto || monto <= 0) { alert('Ingrese un monto válido'); return; }
                          const payments = JSON.parse(localStorage.getItem('doctorPayments') || '[]');
                          const newPayment = {
                            id: `PAY_${Date.now()}`,
                            medico: paymentModal.medico,
                            monto,
                            metodo: paymentForm.metodo,
                            fecha: paymentForm.fecha ? paymentForm.fecha + 'T12:00:00' : new Date().toISOString(),
                            registradoPor: 'Admin'
                          };
                          payments.push(newPayment);
                          localStorage.setItem('doctorPayments', JSON.stringify(payments));
                          db.savePayment(newPayment).catch(console.error);
                          setPaymentModal({ open: false, medico: '', deuda: 0 });
                          setRemitos([...remitos]);
                        }}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
                      >Registrar Pago</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
export default AdminPanel;
