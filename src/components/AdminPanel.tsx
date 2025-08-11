import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, FileText, Settings, DollarSign, Calendar, Download, Edit, Save, X, Plus, Trash2, 
  Eye, EyeOff, Lock, Search, Filter, TrendingUp, AlertTriangle, BarChart3, Activity,
  Clock, CheckCircle, XCircle, RefreshCw, Bell, Target, Zap, Award
} from 'lucide-react';

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
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [currentView, setCurrentView] = useState('dashboard');
  const [remitos, setRemitos] = useState<AdminRemito[]>([]);
  const [medicos, setMedicos] = useState<string[]>([]);
  const [filtroMedico, setFiltroMedico] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('este-mes');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [editingRemito, setEditingRemito] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRemitos, setSelectedRemitos] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  useEffect(() => {
    loadAdminData();
    generateNotifications();
  }, []);

  const loadAdminData = () => {
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
                const adminRemito: AdminRemito = {
                  id: entry.id || `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  medico: entry.doctorInfo.name || 'Médico no especificado',
                  email: entry.doctorInfo.email || 'email@ejemplo.com',
                  fecha: entry.date || entry.timestamp || new Date().toISOString(),
                  hospital: entry.doctorInfo.hospital || 'Hospital no especificado',
                  estado: 'pendiente' as const,
                  biopsias: entry.biopsies.map((biopsy: any) => ({
                    numero: biopsy.number || 'N/A',
                    tejido: biopsy.tissueType || 'No especificado',
                    tipo: biopsy.type || 'Biopsia',
                    cassettes: parseInt(biopsy.cassettes) || 1,
                    trozos: parseInt(biopsy.pieces) || 1,
                    desclasificar: biopsy.declassify || 'No',
                    servicios: {
                      cassetteNormal: biopsy.servicios?.cassetteUrgente ? 0 : (parseInt(biopsy.cassettes) || 1),
                      cassetteUrgente: biopsy.servicios?.cassetteUrgente ? (parseInt(biopsy.cassettes) || 1) : 0,
                      profundizacion: 0, // No hay equivalente directo
                      pap: biopsy.servicios?.pap ? (biopsy.papQuantity || 1) : 0,
                      papUrgente: biopsy.servicios?.papUrgente ? (biopsy.papQuantity || 1) : 0,
                      citologia: biopsy.servicios?.citologia ? (biopsy.citologiaQuantity || 1) : 0,
                      citologiaUrgente: biopsy.servicios?.citologiaUrgente ? (biopsy.citologiaQuantity || 1) : 0,
                      corteBlanco: biopsy.servicios?.corteBlancoComun ? (biopsy.servicios.corteBlancoComunQuantity || 1) : 0,
                      corteBlancoIHQ: biopsy.servicios?.corteBlancoIHQ ? (biopsy.servicios.corteBlancoIHQQuantity || 1) : 0,
                      giemsaPASMasson: biopsy.servicios?.giemsaPASMasson ? 1 : 0
                    },
                    papQuantity: biopsy.papQuantity || 0,
                    citologiaQuantity: biopsy.citologiaQuantity || 0
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
      
      // Si no hay datos reales, intentar cargar datos del admin panel previos
      if (allRemitos.length === 0) {
        const savedRemitos = localStorage.getItem('adminRemitos');
        if (savedRemitos) {
          const parsedRemitos = JSON.parse(savedRemitos);
          allRemitos = [...parsedRemitos];
        }
      }
      
      // Si aún no hay datos, generar datos de prueba
      if (allRemitos.length === 0) {
        console.log('⚠️ No se encontraron datos reales, generando datos de prueba');
        generateDemoData();
        return;
      }
      
      // Eliminar duplicados por ID
      const remitosUnicos = allRemitos.filter((remito, index, self) => 
        index === self.findIndex(r => r.id === remito.id)
      );
      
      setRemitos(remitosUnicos);
      const medicosUnicos = [...new Set(remitosUnicos.map(r => r.medico))];
      setMedicos(medicosUnicos);
      
      console.log('✅ Datos cargados exitosamente:', remitosUnicos.length, 'remitos de', medicosUnicos.length, 'médicos');

      const savedConfig = localStorage.getItem('adminConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfiguracion(prev => ({ ...prev, ...parsedConfig }));
      }
    } catch (error) {
      console.error('❌ Error cargando datos del administrador:', error);
      // En caso de error, generar datos de prueba
      generateDemoData();
    }
  };

  const generateDemoData = () => {
    const demoRemitos: AdminRemito[] = [
      {
        id: 'demo-1',
        medico: 'Dr. Juan García',
        email: 'garcia@hospital.com',
        fecha: new Date().toISOString(),
        hospital: 'Hospital Central Buenos Aires',
        estado: 'pendiente',
        biopsias: [
          {
            numero: 'B001',
            tejido: 'Gastrica',
            tipo: 'BX',
            cassettes: 2,
            trozos: 3,
            desclasificar: 'N/A',
            servicios: {
              cassetteNormal: 2,
              cassetteUrgente: 0,
              profundizacion: 1,
              pap: 0,
              papUrgente: 0,
              citologia: 0,
              citologiaUrgente: 0,
              corteBlanco: 0,
              corteBlancoIHQ: 0,
              giemsaPASMasson: 0
            },
            papQuantity: 0,
            citologiaQuantity: 0
          }
        ]
      },
      {
        id: 'demo-2',
        medico: 'Dra. María López',
        email: 'lopez@clinica.com',
        fecha: new Date(Date.now() - 86400000).toISOString(),
        hospital: 'Clínica San José',
        estado: 'facturado',
        biopsias: [
          {
            numero: 'P001',
            tejido: 'PAP',
            tipo: 'PAP',
            cassettes: 0,
            trozos: 0,
            desclasificar: 'N/A',
            servicios: {
              cassetteNormal: 0,
              cassetteUrgente: 0,
              profundizacion: 0,
              pap: 3,
              papUrgente: 0,
              citologia: 0,
              citologiaUrgente: 0,
              corteBlanco: 0,
              corteBlancoIHQ: 0,
              giemsaPASMasson: 0
            },
            papQuantity: 3,
            citologiaQuantity: 0
          }
        ]
      },
      {
        id: 'demo-3',
        medico: 'Dr. Carlos Rodríguez',
        email: 'rodriguez@medico.com',
        fecha: new Date(Date.now() - 2 * 86400000).toISOString(),
        hospital: 'Instituto Médico Integral',
        estado: 'pendiente',
        biopsias: [
          {
            numero: 'C001',
            tejido: 'Citología',
            tipo: 'CITO',
            cassettes: 0,
            trozos: 0,
            desclasificar: 'N/A',
            servicios: {
              cassetteNormal: 0,
              cassetteUrgente: 0,
              profundizacion: 0,
              pap: 0,
              papUrgente: 0,
              citologia: 2,
              citologiaUrgente: 0,
              corteBlanco: 0,
              corteBlancoIHQ: 0,
              giemsaPASMasson: 0
            },
            papQuantity: 0,
            citologiaQuantity: 2
          }
        ]
      }
    ];
    
    setRemitos(demoRemitos);
    const medicosUnicos = [...new Set(demoRemitos.map(r => r.medico))];
    setMedicos(medicosUnicos);
    localStorage.setItem('adminRemitos', JSON.stringify(demoRemitos));
    console.log('🧪 Datos de prueba generados:', medicosUnicos);
  };

  const generateNotifications = () => {
    const notificaciones: Notification[] = [
      {
        id: '1',
        tipo: 'warning',
        titulo: 'Remitos Pendientes',
        mensaje: 'Hay 5 remitos pendientes de facturación desde hace más de 7 días',
        fecha: new Date(),
        leida: false
      },
      {
        id: '2',
        tipo: 'success',
        titulo: 'Meta Alcanzada',
        mensaje: 'Se ha superado la meta mensual de facturación',
        fecha: new Date(Date.now() - 86400000),
        leida: false
      }
    ];
    setNotifications(notificaciones);
  };

  const refreshData = () => {
    loadAdminData();
    generateNotifications();
    setSelectedRemitos([]);
    console.log('🔄 Datos actualizados');
  };

  const resetToDemo = () => {
    if (confirm('🔄 ¿Desea restablecer los datos a los ejemplos de demostración?\n\nEsto eliminará todos los datos actuales.')) {
      localStorage.removeItem('adminRemitos');
      generateDemoData();
      console.log('🧪 Datos restablecidos a demostración');
    }
  };

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

  const handleLogin = () => {
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('❌ Credenciales incorrectas. Intente con:\nUsuario: admin\nContraseña: admin123');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '' });
    setCurrentView('dashboard');
    onGoBack();
  };

  const calcularTotalBiopsia = (biopsia: AdminBiopsia) => {
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
    
    // Cálculo de cassettes
    if (totalCassettes > 0) {
      if (esCassetteUrgente) {
        // TODOS los cassettes son urgentes
        total += totalCassettes * configuracion.precioCassetteUrgente;
      } else {
        // Primer cassette normal, el resto profundización
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
    
    // Cálculo de Citología
    const citologiaCantidad = biopsia.citologiaQuantity || 0;
    const esCitologiaUrgente = (servicios.citologiaUrgente || 0) > 0;
    if (citologiaCantidad > 0) {
      if (esCitologiaUrgente) {
        // TODAS las citologías son urgentes
        total += citologiaCantidad * configuracion.precioCitologiaUrgente;
      } else {
        // TODAS las citologías son normales
        total += citologiaCantidad * configuracion.precioCitologia;
      }
    }
    
    // Otros estudios
    total += (servicios.corteBlanco || 0) * configuracion.precioCorteBlanco;
    total += (servicios.corteBlancoIHQ || 0) * configuracion.precioCorteBlancoIHQ;
    
    const giemsaCount = typeof servicios.giemsaPASMasson === 'number' 
      ? servicios.giemsaPASMasson 
      : (servicios.giemsaPASMasson ? 1 : 0);
    total += giemsaCount * configuracion.precioGiemsaPASMasson;
    
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
      return updated;
    });
  };

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

  const exportarFacturacionMedico = (medico: string) => {
    const remitosDelMedico = remitos.filter(r => r.medico === medico);
    const fechaActual = new Date().toLocaleDateString('es-AR');
    
    const totalGeneral = remitosDelMedico.reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0);
    const totalPendiente = remitosDelMedico.filter(r => r.estado === 'pendiente').reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0);
    const totalFacturado = remitosDelMedico.filter(r => r.estado === 'facturado').reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0);
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Facturación - ${medico}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .empresa-info { font-size: 14px; opacity: 0.9; }
        .medico-info { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 25px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #64748b; font-size: 14px; }
        .pendiente { color: #f59e0b; }
        .facturado { color: #10b981; }
        .total { color: #3b82f6; }
        .tabla-container { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 25px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f1f5f9; padding: 15px; text-align: left; font-weight: 600; color: #374151; }
        td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; }
        .tipo-bx { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .tipo-pq { background: #fed7aa; color: #c2410c; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .tipo-pap { background: #fce7f3; color: #be185d; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .tipo-cito { background: #ede9fe; color: #7c3aed; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .estudio-detalle { font-size: 11px; line-height: 1.3; }
        .urgente-tag { color: #dc2626; font-weight: 600; }
        .servicio-tag { color: #7c3aed; }
        .estandar-tag { color: #10b981; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🔬 BiopsyTracker Lab</div>
        <div class="empresa-info">
          Av. Principal 123, Buenos Aires<br>
          Tel: +54 11 1234-5678 | Email: admin@biopsytracker.com
        </div>
      </div>
      
      <div class="medico-info">
        <h1 style="margin: 0 0 10px 0; color: #1f2937;">Reporte de Facturación</h1>
        <h2 style="margin: 0 0 15px 0; color: #3b82f6;">Dr/a. ${medico}</h2>
        <p style="color: #64748b; margin: 0;">Período completo - ${fechaActual}</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value total">$${totalGeneral.toLocaleString()}</div>
          <div class="stat-label">Total General</div>
        </div>
        <div class="stat-card">
          <div class="stat-value facturado">$${totalFacturado.toLocaleString()}</div>
          <div class="stat-label">Ya Facturado</div>
        </div>
        <div class="stat-card">
          <div class="stat-value pendiente">$${totalPendiente.toLocaleString()}</div>
          <div class="stat-label">Pendiente</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${remitosDelMedico.length}</div>
          <div class="stat-label">Total Remitos</div>
        </div>
      </div>
      
      <div class="tabla-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>N° Biopsia</th>
              <th>Tejido</th>
              <th>Tipo</th>
              <th>Cassettes</th>
              <th>Estudio Completo</th>
              <th>Subtotal</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${remitosDelMedico.map(remito => 
              remito.biopsias.map(biopsia => {
                // Aplicar la misma lógica de tipos que en el panel
                const getTipoForHTML = (tipo: string, tejido: string) => {
                  if (tejido === 'PAP') {
                    return { nombre: 'PAP', clase: 'tipo-pap' };
                  }
                  if (tejido === 'Citología') {
                    return { nombre: 'CITO', clase: 'tipo-cito' };
                  }
                  // Para biopsias, detectar si es PQ o BX basado en el tipo original
                  if (tipo.toLowerCase().includes('pq') || tipo.toLowerCase().includes('pequena') || tipo.toLowerCase().includes('pequeña')) {
                    return { nombre: 'PQ', clase: 'tipo-pq' };
                  }
                  // Por defecto es BX
                  return { nombre: 'BX', clase: 'tipo-bx' };
                };
                
                // Generar detalle del estudio completo
                const getEstudioCompleto = (biopsia: AdminBiopsia) => {
                  const detalles = [];
                  
                  // Verificar servicios urgentes
                  const urgentes = [];
                  if (biopsia.servicios.cassetteUrgente > 0) urgentes.push(`Cassette Urgente (${biopsia.servicios.cassetteUrgente})`);
                  if (biopsia.servicios.papUrgente > 0) urgentes.push(`PAP Urgente (${biopsia.servicios.papUrgente})`);
                  if (biopsia.servicios.citologiaUrgente > 0) urgentes.push(`Citología Urgente (${biopsia.servicios.citologiaUrgente})`);
                  
                  if (urgentes.length > 0) {
                    detalles.push('<span style="color: #dc2626; font-weight: 600;">🚨 ' + urgentes.join(', ') + '</span>');
                  }
                  
                  // Servicios adicionales
                  const servicios = [];
                  if (biopsia.servicios.corteBlancoIHQ > 0) servicios.push(`Corte IHQ (${biopsia.servicios.corteBlancoIHQ})`);
                  if (biopsia.servicios.corteBlanco > 0) servicios.push(`Corte Común (${biopsia.servicios.corteBlanco})`);
                  if (biopsia.servicios.giemsaPASMasson > 0) servicios.push('Giemsa/PAS/Masson');
                  if (biopsia.servicios.profundizacion > 0) servicios.push(`Profundización (${biopsia.servicios.profundizacion})`);
                  
                  if (servicios.length > 0) {
                    detalles.push('<span style="color: #7c3aed;">🔧 ' + servicios.join(', ') + '</span>');
                  }
                  
                  // Si no hay servicios especiales
                  if (detalles.length === 0) {
                    detalles.push('<span style="color: #10b981;">✅ Estudio Estándar</span>');
                  }
                  
                  return detalles.join('<br>');
                };
                
                const tipoInfo = getTipoForHTML(biopsia.tipo, biopsia.tejido);
                const estudioCompleto = getEstudioCompleto(biopsia);
                
                return `
                  <tr>
                    <td>${new Date(remito.fecha).toLocaleDateString('es-AR')}</td>
                    <td><strong>${biopsia.numero}</strong></td>
                    <td>${biopsia.tejido}</td>
                    <td><span class="${tipoInfo.clase}">${tipoInfo.nombre}</span></td>
                    <td>${tipoInfo.nombre === 'PAP' || tipoInfo.nombre === 'CITO' ? '-' : biopsia.cassettes}</td>
                    <td style="font-size: 12px; line-height: 1.4;">${estudioCompleto}</td>
                    <td><strong>$${calcularTotalBiopsia(biopsia).toLocaleString()}</strong></td>
                    <td><span class="${remito.estado}">${remito.estado === 'facturado' ? 'Facturado' : 'Pendiente'}</span></td>
                  </tr>
                `;
              }).join('')
            ).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>Reporte generado automáticamente por BiopsyTracker el ${fechaActual}</p>
        <p>Este documento es confidencial y está destinado únicamente para el uso del destinatario.</p>
      </div>
    </body>
    </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Completo_${medico.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/assets/biopsytracker_logo_final.svg" 
                alt="BiopsyTracker Logo" 
                className="w-64 h-16 mx-auto"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel Administrador</h1>
            <p className="text-gray-600">BiopsyTracker Professional</p>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mt-4">
              <p className="text-sm text-gray-700">🔒 Acceso restringido para administradores</p>
            </div>
          </div>
          
          <div className="space-y-6">
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
            
            <button
              onClick={handleLogin}
              disabled={!loginForm.username || !loginForm.password}
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
          
          <div className="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800 text-center">
              <strong>Demo:</strong> Usuario: admin | Contraseña: admin123
            </p>
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
              <span className="text-xl font-bold">BiopsyTracker</span>
              <p className="text-xs text-slate-300">Professional Admin</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard', desc: 'Vista general' },
              { id: 'remitos', icon: FileText, label: 'Gestión de Remitos', desc: 'Administrar remitos' },
              { id: 'facturacion', icon: DollarSign, label: 'Facturación', desc: 'Reportes financieros' },
              { id: 'analytics', icon: TrendingUp, label: 'Analytics', desc: 'Análisis avanzado' },
              { id: 'configuracion', icon: Settings, label: 'Configuración', desc: 'Configurar sistema' }
            ].map(({ id, icon: Icon, label, desc }) => (
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
                  <div className="text-left">
                    <span className={`font-medium ${currentView === id ? 'text-white' : 'text-slate-200'}`}>
                      {label}
                    </span>
                    <p className={`text-xs ${currentView === id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {desc}
                    </p>
                  </div>
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
                  <p className="text-gray-600">Gestión Central - BiopsyTracker Professional</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={toggleNotifications}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Bell size={20} />
                    {notifications.filter(n => !n.leida).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications.filter(n => !n.leida).length}
                      </span>
                    )}
                  </button>
                  
                  {/* Panel de Notificaciones */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No hay notificaciones
                          </div>
                        ) : (
                          notifications.map(notification => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                !notification.leida ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  notification.tipo === 'warning' ? 'bg-yellow-500' :
                                  notification.tipo === 'success' ? 'bg-green-500' :
                                  notification.tipo === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                }`} />
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {notification.titulo}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.mensaje}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {notification.fecha.toLocaleDateString()} {notification.fecha.toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="text-xs text-blue-600 font-medium">
                                  Click para ver →
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={onGoBack} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <ArrowLeft size={16} />
                  <span>Volver a la App</span>
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">Administrador</p>
                    <p className="text-xs text-gray-500">Sesión activa</p>
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
          {currentView === 'dashboard' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h2>
                  <p className="text-gray-600">Visión general del rendimiento del laboratorio</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={refreshData}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <RefreshCw size={16} />
                    <span>Actualizar</span>
                  </button>
                  <button 
                    onClick={resetToDemo}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Target size={16} />
                    <span>Reset Demo</span>
                  </button>
                  <button onClick={() => exportarExcel()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Download size={16} />
                    <span>Exportar Dashboard</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Remitos</p>
                      <p className="text-3xl font-bold">{remitos.length}</p>
                      <p className="text-blue-100 text-xs mt-1">Sistema activo</p>
                    </div>
                    <div className="bg-blue-400/30 p-3 rounded-lg">
                      <FileText size={24} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-medium">Pendientes</p>
                      <p className="text-3xl font-bold">{remitos.filter(r => r.estado === 'pendiente').length}</p>
                      <p className="text-yellow-100 text-xs mt-1">Por procesar</p>
                    </div>
                    <div className="bg-yellow-400/30 p-3 rounded-lg">
                      <Clock size={24} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Facturado</p>
                      <p className="text-3xl font-bold">
                        ${remitos.filter(r => r.estado === 'facturado').reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0).toLocaleString()}
                      </p>
                      <p className="text-green-100 text-xs mt-1">Completado</p>
                    </div>
                    <div className="bg-green-400/30 p-3 rounded-lg">
                      <DollarSign size={24} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Por Facturar</p>
                      <p className="text-3xl font-bold">
                        ${remitos.filter(r => r.estado === 'pendiente').reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0).toLocaleString()}
                      </p>
                      <p className="text-purple-100 text-xs mt-1">En proceso</p>
                    </div>
                    <div className="bg-purple-400/30 p-3 rounded-lg">
                      <Target size={24} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Últimos Remitos Recibidos</h3>
                {remitos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No hay remitos disponibles</p>
                    <p className="text-sm">Los remitos de los médicos aparecerán aquí automáticamente</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Médico</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Hospital</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Biopsias</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {remitos.slice(-8).reverse().map(remito => (
                          <tr key={remito.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">{remito.medico}</p>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{remito.hospital}</td>
                            <td className="py-3 px-4 text-gray-600">{new Date(remito.fecha).toLocaleDateString('es-AR')}</td>
                            <td className="py-3 px-4 text-gray-600">{remito.biopsias.length}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-green-600">${calcularTotalRemito(remito.biopsias).toLocaleString()}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                remito.estado === 'facturado'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {remito.estado === 'facturado' ? 'Facturado' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'remitos' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Remitos</h2>
                  <p className="text-gray-600">Administración completa de remitos del sistema</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => exportarExcel()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Download size={16} />
                    <span>Exportar CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Filter className="mr-2" size={20} />
                    Filtros
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Médico</label>
                    <select value={filtroMedico} onChange={(e) => setFiltroMedico(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="todos">Todos los médicos</option>
                      {medicos.map(medico => (
                        <option key={medico} value={medico}>{medico}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="todos">Todos los estados</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="facturado">Facturados</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Búsqueda</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Buscar por médico, hospital, número de biopsia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {(() => {
                // Aplicar filtros
                let remitosFiltrados = remitos;
                
                console.log('🔍 Aplicando filtros:', {
                  totalRemitos: remitos.length,
                  filtroMedico,
                  filtroEstado,
                  searchTerm: searchTerm.trim()
                });
                
                // Filtro por médico
                if (filtroMedico !== 'todos') {
                  remitosFiltrados = remitosFiltrados.filter(r => r.medico === filtroMedico);
                  console.log('👨‍⚕️ Después de filtro médico:', remitosFiltrados.length);
                }
                
                // Filtro por estado
                if (filtroEstado !== 'todos') {
                  remitosFiltrados = remitosFiltrados.filter(r => r.estado === filtroEstado);
                  console.log('📋 Después de filtro estado:', remitosFiltrados.length);
                }
                
                // Filtro por búsqueda (mejorado)
                if (searchTerm.trim()) {
                  const searchLower = searchTerm.toLowerCase().trim();
                  const beforeFilter = remitosFiltrados.length;
                  remitosFiltrados = remitosFiltrados.filter(r => {
                    // Buscar en médico
                    const medicoMatch = r.medico.toLowerCase().includes(searchLower);
                    
                    // Buscar en hospital
                    const hospitalMatch = r.hospital.toLowerCase().includes(searchLower);
                    
                    // Buscar en email
                    const emailMatch = r.email?.toLowerCase().includes(searchLower);
                    
                    // Buscar en biopsias
                    const biopsiaMatch = r.biopsias.some(b => 
                      b.numero.toLowerCase().includes(searchLower) ||
                      b.tejido.toLowerCase().includes(searchLower) ||
                      b.tipo.toLowerCase().includes(searchLower) ||
                      b.desclasificar?.toLowerCase().includes(searchLower)
                    );
                    
                    const match = medicoMatch || hospitalMatch || emailMatch || biopsiaMatch;
                    if (match) {
                      console.log('✅ Match encontrado en:', r.medico, {medicoMatch, hospitalMatch, emailMatch, biopsiaMatch});
                    }
                    return match;
                  });
                  console.log('🔍 Después de filtro búsqueda:', beforeFilter, '→', remitosFiltrados.length);
                }
                
                console.log('📊 Remitos finales filtrados:', remitosFiltrados.length);
                
                return remitosFiltrados.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      {remitos.length === 0 ? 'No hay remitos' : 'No se encontraron remitos'}
                    </h3>
                    <p className="text-gray-500">
                      {remitos.length === 0 
                        ? 'Los remitos aparecerán aquí cuando los médicos los envíen' 
                        : 'Intenta ajustar los filtros para encontrar los remitos que buscas'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {remitosFiltrados.map(remito => (
                    <div key={remito.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{remito.medico}</h3>
                          <p className="text-gray-600">{remito.hospital} - {new Date(remito.fecha).toLocaleDateString('es-AR')}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">${calcularTotalRemito(remito.biopsias).toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{remito.biopsias.length} biopsias</p>
                          </div>
                          <button
                            onClick={() => cambiarEstadoRemito(remito.id, remito.estado === 'pendiente' ? 'facturado' : 'pendiente')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              remito.estado === 'facturado'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                          >
                            {remito.estado === 'facturado' ? 'Facturado' : 'Pendiente'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2">Número</th>
                              <th className="text-left py-2">Tejido</th>
                              <th className="text-left py-2">Tipo</th>
                              <th className="text-left py-2">Cassettes</th>
                              <th className="text-left py-2">PAP</th>
                              <th className="text-left py-2">Citología</th>
                              <th className="text-left py-2">Otros Estudios</th>
                              <th className="text-right py-2">Subtotal</th>
                              <th className="text-center py-2">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {remito.biopsias.map((biopsia, index) => {
                              const isEditing = editingRemito === `${remito.id}_${index}`;
                              
                              if (isEditing) {
                                // Modo edición: mostrar solo campos con datos
                                return (
                                  <tr key={index} className="border-b border-gray-200 bg-blue-50">
                                    <td colSpan={8} className="py-4">
                                      <EdicionInteligente 
                                        biopsia={biopsia} 
                                        index={index} 
                                        remito={remito} 
                                      />
                                      <div className="flex justify-end gap-2 mt-3">
                                        <button
                                          onClick={() => {
                                            localStorage.setItem('adminRemitos', JSON.stringify(remitos));
                                            setEditingRemito(null);
                                          }}
                                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                        >
                                          <Save size={14} />
                                          Guardar
                                        </button>
                                        <button
                                          onClick={() => {
                                            loadAdminData();
                                            setEditingRemito(null);
                                          }}
                                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                        >
                                          <X size={14} />
                                          Cancelar
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }
                              
                              // Modo vista normal
                              return (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-2 font-bold text-blue-600">#{biopsia.numero}</td>
                                  <td className="py-2">{biopsia.tejido}</td>
                                  <td className="py-2">
                                    {(() => {
                                      const getTipoDisplay = (tipo: string, tejido: string) => {
                                        if (tejido === 'PAP') {
                                          return { nombre: 'PAP', color: 'bg-pink-100 text-pink-800' };
                                        }
                                        if (tejido === 'Citología') {
                                          return { nombre: 'CITO', color: 'bg-purple-100 text-purple-800' };
                                        }
                                        // Para biopsias, detectar si es PQ o BX basado en el tipo original
                                        if (tipo.toLowerCase().includes('pq') || tipo.toLowerCase().includes('pequena') || tipo.toLowerCase().includes('pequeña')) {
                                          return { nombre: 'PQ', color: 'bg-orange-100 text-orange-800' };
                                        }
                                        // Por defecto es BX
                                        return { nombre: 'BX', color: 'bg-green-100 text-green-800' };
                                      };
                                      
                                      const tipoInfo = getTipoDisplay(biopsia.tipo, biopsia.tejido);
                                      
                                      return (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${tipoInfo.color} border`}>
                                          {tipoInfo.nombre}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="py-2">
                                    <div className="space-y-1">
                                      {(() => {
                                        // Solo mostrar cassettes para BX y PQ
                                        if (biopsia.tejido === 'PAP' || biopsia.tejido === 'Citología') {
                                          return <span className="text-gray-400">-</span>;
                                        }
                                        
                                        return (
                                          <>
                                            <span className="font-medium">{biopsia.cassettes}</span>
                                            {(biopsia.servicios?.cassetteUrgente || 0) > 0 && (
                                              <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                                URGENTE (24hs)
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td className="py-2">
                                    <div className="space-y-1">
                                      {(biopsia.papQuantity || 0) > 0 && (
                                        <div className={`text-xs px-2 py-1 rounded ${
                                          (biopsia.servicios?.papUrgente || 0) > 0 
                                            ? 'bg-red-100 text-red-800' 
                                            : 'bg-pink-100 text-pink-800'
                                        }`}>
                                          PAP: {biopsia.papQuantity} {(biopsia.servicios?.papUrgente || 0) > 0 ? '(URGENTES)' : ''}
                                        </div>
                                      )}
                                      {!(biopsia.papQuantity || 0) && (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2">
                                    <div className="space-y-1">
                                      {(biopsia.citologiaQuantity || 0) > 0 && (
                                        <div className={`text-xs px-2 py-1 rounded ${
                                          (biopsia.servicios?.citologiaUrgente || 0) > 0 
                                            ? 'bg-red-100 text-red-800' 
                                            : 'bg-purple-100 text-purple-800'
                                        }`}>
                                          CITO: {biopsia.citologiaQuantity} {(biopsia.servicios?.citologiaUrgente || 0) > 0 ? '(URGENTES)' : ''}
                                        </div>
                                      )}
                                      {!(biopsia.citologiaQuantity || 0) && (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2">
                                    <div className="space-y-1">
                                      {(biopsia.servicios?.corteBlanco || 0) > 0 && (
                                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                                          Corte Blanco: {biopsia.servicios.corteBlanco}
                                        </div>
                                      )}
                                      {(biopsia.servicios?.corteBlancoIHQ || 0) > 0 && (
                                        <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                                          IHQ: {biopsia.servicios.corteBlancoIHQ}
                                        </div>
                                      )}
                                      {(biopsia.servicios?.giemsaPASMasson || 0) > 0 && (
                                        <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                                          Giemsa/PAS: {biopsia.servicios.giemsaPASMasson}
                                        </div>
                                      )}
                                      {!(biopsia.servicios?.corteBlanco || 0) && 
                                       !(biopsia.servicios?.corteBlancoIHQ || 0) && 
                                       !(biopsia.servicios?.giemsaPASMasson || 0) && (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 text-right font-bold text-green-600">
                                    ${calcularTotalBiopsia(biopsia).toLocaleString()}
                                  </td>
                                  <td className="py-2 text-center">
                                    <button
                                      onClick={() => setEditingRemito(`${remito.id}_${index}`)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg text-xs flex items-center gap-1 mx-auto"
                                      title="Editar biopsia"
                                    >
                                      <Edit size={12} />
                                      Editar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Resumen de Estudios del Remito */}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Resumen de Estudios</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(() => {
                            const totales = remito.biopsias.reduce((acc, biopsia) => {
                              // Solo contar cassettes para BX y PQ (no PAP ni Citología)
                              if (biopsia.tejido !== 'PAP' && biopsia.tejido !== 'Citología') {
                                acc.cassettes += biopsia.cassettes || 0;
                              }
                              
                              // PAP: si están marcados como urgentes, todas son urgentes, sino normales
                              const esPapUrgente = (biopsia.servicios?.papUrgente || 0) > 0;
                              if (esPapUrgente) {
                                acc.papUrgente += biopsia.papQuantity || 0;
                              } else {
                                acc.papNormal += biopsia.papQuantity || 0;
                              }
                              
                              // Citología: si están marcadas como urgentes, todas son urgentes, sino normales
                              const esCitologiaUrgente = (biopsia.servicios?.citologiaUrgente || 0) > 0;
                              if (esCitologiaUrgente) {
                                acc.citologiaUrgente += biopsia.citologiaQuantity || 0;
                              } else {
                                acc.citologiaNormal += biopsia.citologiaQuantity || 0;
                              }
                              
                              acc.corteBlanco += biopsia.servicios?.corteBlanco || 0;
                              acc.corteBlancoIHQ += biopsia.servicios?.corteBlancoIHQ || 0;
                              acc.giemsaPASMasson += biopsia.servicios?.giemsaPASMasson || 0;
                              return acc;
                            }, {
                              cassettes: 0,
                              papNormal: 0,
                              papUrgente: 0,
                              citologiaNormal: 0,
                              citologiaUrgente: 0,
                              corteBlanco: 0,
                              corteBlancoIHQ: 0,
                              giemsaPASMasson: 0
                            });

                            return (
                              <>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-600">{totales.cassettes}</div>
                                  <div className="text-xs text-gray-600">Cassettes</div>
                                </div>
                                {(totales.papNormal + totales.papUrgente) > 0 && (
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{totales.papNormal + totales.papUrgente}</div>
                                    <div className="text-xs text-gray-600">PAP Total</div>
                                    <div className="text-xs text-gray-500">
                                      {totales.papNormal > 0 && `${totales.papNormal} normal`}
                                      {totales.papNormal > 0 && totales.papUrgente > 0 && ', '}
                                      {totales.papUrgente > 0 && `${totales.papUrgente} urgente`}
                                    </div>
                                  </div>
                                )}
                                {(totales.citologiaNormal + totales.citologiaUrgente) > 0 && (
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{totales.citologiaNormal + totales.citologiaUrgente}</div>
                                    <div className="text-xs text-gray-600">Citología Total</div>
                                    <div className="text-xs text-gray-500">
                                      {totales.citologiaNormal > 0 && `${totales.citologiaNormal} normal`}
                                      {totales.citologiaNormal > 0 && totales.citologiaUrgente > 0 && ', '}
                                      {totales.citologiaUrgente > 0 && `${totales.citologiaUrgente} urgente`}
                                    </div>
                                  </div>
                                )}
                                {(totales.corteBlanco + totales.corteBlancoIHQ + totales.giemsaPASMasson) > 0 && (
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                      {totales.corteBlanco + totales.corteBlancoIHQ + totales.giemsaPASMasson}
                                    </div>
                                    <div className="text-xs text-gray-600">Estudios Especiales</div>
                                    <div className="text-xs text-gray-500">
                                      {totales.corteBlanco > 0 && `${totales.corteBlanco} corte blanco`}
                                      {totales.corteBlanco > 0 && (totales.corteBlancoIHQ > 0 || totales.giemsaPASMasson > 0) && ', '}
                                      {totales.corteBlancoIHQ > 0 && `${totales.corteBlancoIHQ} IHQ`}
                                      {totales.corteBlancoIHQ > 0 && totales.giemsaPASMasson > 0 && ', '}
                                      {totales.giemsaPASMasson > 0 && `${totales.giemsaPASMasson} giemsa/PAS`}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()}
            </div>
          )}

          {currentView === 'facturacion' && (
            <div className="h-full flex flex-col p-3 overflow-hidden">
              {/* Header super compacto */}
              <div className="flex-shrink-0 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    💰 Facturación
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {medicos.length} médicos
                    </span>
                  </h2>
                  <div className="text-sm font-bold text-green-600">
                    Total: ${remitos.reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0).toLocaleString()}
                  </div>
                </div>
                
                {/* Resumen general ultra compacto */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-blue-50 p-1.5 rounded text-center border">
                    <div className="text-sm font-bold text-blue-700">{remitos.length}</div>
                    <div className="text-xs text-blue-600">Remitos</div>
                  </div>
                  <div className="bg-purple-50 p-1.5 rounded text-center border">
                    <div className="text-sm font-bold text-purple-700">{remitos.reduce((acc, r) => acc + r.biopsias.length, 0)}</div>
                    <div className="text-xs text-purple-600">Biopsias</div>
                  </div>
                  <div className="bg-yellow-50 p-1.5 rounded text-center border">
                    <div className="text-sm font-bold text-yellow-700">
                      ${remitos.filter(r => r.estado === 'pendiente').reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-yellow-600">Pendiente</div>
                  </div>
                  <div className="bg-green-50 p-1.5 rounded text-center border">
                    <div className="text-sm font-bold text-green-700">
                      ${remitos.filter(r => r.estado === 'facturado').reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600">Facturado</div>
                  </div>
                </div>
              </div>

              {/* Grid de médicos que ocupa el espacio restante */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                {medicos.map((medico, index) => {
                  const remitosDelMedico = remitos.filter(r => r.medico === medico);
                  const pendientes = remitosDelMedico.filter(r => r.estado === 'pendiente');
                  const facturados = remitosDelMedico.filter(r => r.estado === 'facturado');
                  const totalPendiente = pendientes.reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0);
                  const totalFacturado = facturados.reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0);
                  const totalGeneral = totalPendiente + totalFacturado;
                  const porcentajeFacturado = Math.round(totalFacturado / (totalGeneral || 1) * 100);
                  
                  return (
                    <div key={medico} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                      {/* Header del médico - ultra compacto */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {medico.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-gray-900">Dr/a. {medico}</h3>
                            <p className="text-xs text-gray-500">{remitosDelMedico.length} remitos</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => exportarFacturacionMedico(medico)} 
                            className="bg-blue-500 hover:bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs flex items-center space-x-1"
                            title="Exportar HTML"
                          >
                            <Download size={8} />
                            <span>HTML</span>
                          </button>
                          <button 
                            onClick={() => exportarExcel(medico)} 
                            className="bg-green-500 hover:bg-green-600 text-white px-1.5 py-0.5 rounded text-xs flex items-center space-x-1"
                            title="Exportar CSV"
                          >
                            <Download size={8} />
                            <span>CSV</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Estadísticas ultra compactas */}
                      <div className="grid grid-cols-3 gap-1 mb-2">
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-1 text-center">
                          <div className="text-xs font-bold text-yellow-700">${totalPendiente.toLocaleString()}</div>
                          <div className="text-xs text-yellow-600">Pendiente</div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-1 text-center">
                          <div className="text-xs font-bold text-green-700">${totalFacturado.toLocaleString()}</div>
                          <div className="text-xs text-green-600">Facturado</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded p-1 text-center">
                          <div className="text-xs font-bold text-blue-700">${totalGeneral.toLocaleString()}</div>
                          <div className="text-xs text-blue-600">Total</div>
                        </div>
                      </div>

                      {/* Barra de progreso mini */}
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span className="font-medium">{porcentajeFacturado}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${porcentajeFacturado}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          )}

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
                      alert('✅ Configuración guardada exitosamente');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Guardar Cambios</span>
                  </button>
                  <button 
                    onClick={() => {
                      const defaultConfig = {
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
                      };
                      setConfiguracion(defaultConfig);
                      alert('⚠️ Configuración restaurada a valores por defecto');
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <RefreshCw size={16} />
                    <span>Restaurar Defaults</span>
                  </button>
                </div>
              </div>

              {/* Configuración de Precios */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="mr-2 text-green-600" size={20} />
                  Configuración de Precios
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 border-b border-gray-200 pb-2">Servicios Básicos</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cassette Normal</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={configuracion.precioCassette}
                          onChange={(e) => setConfiguracion(prev => ({ ...prev, precioCassette: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cassette Urgente (24hs)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={configuracion.precioCassetteUrgente}
                          onChange={(e) => setConfiguracion(prev => ({ ...prev, precioCassetteUrgente: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profundización</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={configuracion.precioProfundizacion}
                          onChange={(e) => setConfiguracion(prev => ({ ...prev, precioProfundizacion: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 border-b border-gray-200 pb-2">Citología y PAP</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PAP Normal</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={configuracion.precioPAP}
                          onChange={(e) => setConfiguracion(prev => ({ ...prev, precioPAP: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PAP Urgente</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={configuracion.precioPAPUrgente}
                          onChange={(e) => setConfiguracion(prev => ({ ...prev, precioPAPUrgente: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Citología Normal</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={configuracion.precioCitologia}
                          onChange={(e) => setConfiguracion(prev => ({ ...prev, precioCitologia: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Citología Urgente</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={configuracion.precioCitologiaUrgente}
                          onChange={(e) => setConfiguracion(prev => ({ ...prev, precioCitologiaUrgente: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 border-b border-gray-200 pb-2">Técnicas Especiales</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Corte en Blanco</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={configuracion.precioCorteBlanco}
                          onChange={(e) => setConfiguracion(prev => ({ ...prev, precioCorteBlanco: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Corte en Blanco IHQ</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={configuracion.precioCorteBlancoIHQ}
                          onChange={(e) => setConfiguracion(prev => ({ ...prev, precioCorteBlancoIHQ: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Giemsa/PAS/Masson</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={configuracion.precioGiemsaPASMasson}
                          onChange={(e) => setConfiguracion(prev => ({ ...prev, precioGiemsaPASMasson: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
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

              {/* Configuraciones del Sistema */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Settings className="mr-2 text-blue-600" size={20} />
                    Configuraciones Generales
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notificaciones automáticas</label>
                        <p className="text-xs text-gray-500">Alertas por remitos pendientes</p>
                      </div>
                      <button className="bg-green-500 rounded-full w-12 h-6 flex items-center transition-colors">
                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-7 transition-transform"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Backup automático</label>
                        <p className="text-xs text-gray-500">Respaldo diario de datos</p>
                      </div>
                      <button className="bg-green-500 rounded-full w-12 h-6 flex items-center transition-colors">
                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-7 transition-transform"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Modo de prueba</label>
                        <p className="text-xs text-gray-500">Para testing y demos</p>
                      </div>
                      <button className="bg-gray-300 rounded-full w-12 h-6 flex items-center transition-colors">
                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-1 transition-transform"></div>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Días para alertas de pendientes</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="3">3 días</option>
                        <option value="5">5 días</option>
                        <option value="7" selected>7 días</option>
                        <option value="10">10 días</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Formato de fecha preferido</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="es-AR" selected>DD/MM/YYYY (Argentina)</option>
                        <option value="en-US">MM/DD/YYYY (Estados Unidos)</option>
                        <option value="iso">YYYY-MM-DD (ISO)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Activity className="mr-2 text-green-600" size={20} />
                    Estado del Sistema
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-green-800">Base de Datos</p>
                          <p className="text-xs text-green-600">Conexión estable</p>
                        </div>
                      </div>
                      <CheckCircle className="text-green-600" size={20} />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-green-800">Almacenamiento</p>
                          <p className="text-xs text-green-600">85% disponible</p>
                        </div>
                      </div>
                      <CheckCircle className="text-green-600" size={20} />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-yellow-800">Backup</p>
                          <p className="text-xs text-yellow-600">Último: hace 2 horas</p>
                        </div>
                      </div>
                      <AlertTriangle className="text-yellow-600" size={20} />
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Acciones del Sistema</h4>
                    <div className="space-y-2">
                      <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                        Respaldar Base de Datos
                      </button>
                      <button className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                        Limpiar Logs del Sistema
                      </button>
                      <button className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                        Reiniciar Configuración
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de la Aplicación */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="mr-2 text-blue-600" size={20} />
                  Información de la Aplicación
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">BiopsyTracker Professional</h4>
                    <p className="text-sm text-gray-600">Versión 2.1.0</p>
                    <p className="text-xs text-gray-500">Última actualización: 15/06/2025</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Licencia</h4>
                    <p className="text-sm text-gray-600">Profesional Ilimitada</p>
                    <p className="text-xs text-gray-500">Válida hasta: 31/12/2025</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Soporte</h4>
                    <p className="text-sm text-gray-600">support@biopsytracker.com</p>
                    <p className="text-xs text-gray-500">+54 11 1234-5678</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'analytics' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Analytics Avanzado</h2>
                  <p className="text-gray-600">Análisis profundo del rendimiento del laboratorio</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={generateInsights}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <TrendingUp size={16} />
                    <span>Generar Insights</span>
                  </button>
                  <button 
                    onClick={exportAnalytics}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Download size={16} />
                    <span>Exportar Analytics</span>
                  </button>
                </div>
              </div>

              {/* Métricas Clave */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm font-medium">Crecimiento Mensual</p>
                      <p className="text-3xl font-bold">+23.5%</p>
                      <p className="text-indigo-100 text-xs mt-1">vs mes anterior</p>
                    </div>
                    <TrendingUp size={32} className="text-indigo-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Satisfacción</p>
                      <p className="text-3xl font-bold">94.2%</p>
                      <p className="text-emerald-100 text-xs mt-1">índice de calidad</p>
                    </div>
                    <Award size={32} className="text-emerald-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Tiempo Promedio</p>
                      <p className="text-3xl font-bold">2.3</p>
                      <p className="text-orange-100 text-xs mt-1">días por remito</p>
                    </div>
                    <Clock size={32} className="text-orange-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-100 text-sm font-medium">Eficiencia</p>
                      <p className="text-3xl font-bold">87%</p>
                      <p className="text-cyan-100 text-xs mt-1">objetivo: 85%</p>
                    </div>
                    <Zap size={32} className="text-cyan-200" />
                  </div>
                </div>
              </div>

              {/* Análisis por Médico */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Análisis de Rendimiento por Médico</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Médico</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Remitos</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Biopsias</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Facturación</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Eficiencia</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Tendencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicos.map((medico, index) => {
                        const remitosDelMedico = remitos.filter(r => r.medico === medico);
                        const total = remitosDelMedico.reduce((sum, r) => sum + calcularTotalRemito(r.biopsias), 0);
                        const biopsias = remitosDelMedico.reduce((sum, r) => sum + r.biopsias.length, 0);
                        const eficiencia = Math.random() * 30 + 70; // Simulado
                        const tendencia = Math.random() > 0.5 ? 'up' : 'down';
                        return (
                          <tr key={medico} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-blue-400 to-purple-500'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="font-medium text-gray-900">{medico}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                {remitosDelMedico.length}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center text-gray-700">{biopsias}</td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-bold text-green-600">${total.toLocaleString()}</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                                eficiencia > 85 ? 'bg-green-100 text-green-800' : 
                                eficiencia > 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {eficiencia.toFixed(1)}%
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {tendencia === 'up' ? (
                                <TrendingUp className="text-green-500 mx-auto" size={20} />
                              ) : (
                                <TrendingUp className="text-red-500 mx-auto transform rotate-180" size={20} />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights y Recomendaciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <Target className="mr-2" size={20} />
                    Insights Clave
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-sm text-blue-800">
                        <strong>Peak de actividad:</strong> Los martes registran 40% más remitos que el promedio semanal
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm text-blue-800">
                        <strong>Servicios estrella:</strong> Las técnicas especiales han crecido 65% este trimestre
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <p className="text-sm text-blue-800">
                        <strong>Oportunidad:</strong> 15% de remitos podrían optimizarse con servicios adicionales
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <Zap className="mr-2" size={20} />
                    Recomendaciones
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm text-green-800">
                        <strong>Automatización:</strong> Implementar recordatorios automáticos para remitos pendientes
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-sm text-green-800">
                        <strong>Capacitación:</strong> Ofrecer training sobre técnicas especiales a médicos con bajo uso
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <p className="text-sm text-green-800">
                        <strong>Incentivos:</strong> Crear programa de bonificaciones por volumen y calidad
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas Adicionales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Tipo</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Biopsias (BX)</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Citologías</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <span className="text-sm font-medium">25%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Urgencias vs Normal</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Servicio Normal</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Urgente 24hs</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Estados de Facturación</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Facturado</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ 
                            width: `${(remitos.filter(r => r.estado === 'facturado').length / remitos.length) * 100}%` 
                          }}></div>
                        </div>
                        <span className="text-sm font-medium">
                          {remitos.length > 0 ? Math.round((remitos.filter(r => r.estado === 'facturado').length / remitos.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pendiente</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ 
                            width: `${(remitos.filter(r => r.estado === 'pendiente').length / remitos.length) * 100}%` 
                          }}></div>
                        </div>
                        <span className="text-sm font-medium">
                          {remitos.length > 0 ? Math.round((remitos.filter(r => r.estado === 'pendiente').length / remitos.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminPanel;
