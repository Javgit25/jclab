import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, FileText, Settings, DollarSign, Calendar, Download, Edit, Save, X, Plus, Trash2, Eye, EyeOff, Lock } from 'lucide-react';

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

export const AdminPanel: React.FC<AdminPanelProps> = ({ onGoBack }) => {
  // Estados para autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // Estados principales
  const [currentView, setCurrentView] = useState('dashboard');
  const [remitos, setRemitos] = useState<AdminRemito[]>([]);
  const [medicos, setMedicos] = useState<string[]>([]);
  const [filtroMedico, setFiltroMedico] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('este-mes');
  
  // Estados para configuración
  const [configuracion, setConfiguracion] = useState<Configuracion>({
    precioCassette: 150,
    precioCassetteUrgente: 200,
    precioProfundizacion: 120,
    precioPAP: 80,
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
  
  // Estados para edición
  const [editingRemito, setEditingRemito] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Cargar datos al inicializar
  useEffect(() => {
    loadAdminData();
  }, []);

  // Función para cargar datos del administrador
  const loadAdminData = () => {
    try {
      // Cargar remitos
      const savedRemitos = localStorage.getItem('adminRemitos');
      if (savedRemitos) {
        const parsedRemitos = JSON.parse(savedRemitos);
        setRemitos(parsedRemitos);
        
        // Extraer lista única de médicos
        const medicosUnicos = [...new Set(parsedRemitos.map((r: AdminRemito) => r.medico))];
        setMedicos(medicosUnicos);
      }

      // Cargar configuración
      const savedConfig = localStorage.getItem('adminConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfiguracion(prev => ({ ...prev, ...parsedConfig }));
      }
    } catch (error) {
      console.error('Error cargando datos del administrador:', error);
    }
  };

  // Función de login
  const handleLogin = () => {
    // Credenciales de ejemplo - en producción esto sería más seguro
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('❌ Credenciales incorrectas. Intente con:\nUsuario: admin\nContraseña: admin123');
    }
  };

  // Función de logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '' });
    setCurrentView('dashboard');
    onGoBack();
  };

  // Calcular el total de un remito con los nuevos precios
  const calcularTotalRemito = (biopsias: AdminBiopsia[]) => {
    return biopsias.reduce((total, biopsia) => {
      const servicios = biopsia.servicios || {};
      
      const costos = (servicios.cassetteNormal || 0) * configuracion.precioCassette +
                    (servicios.cassetteUrgente || 0) * configuracion.precioCassetteUrgente +
                    (servicios.profundizacion || 0) * configuracion.precioProfundizacion +
                    (servicios.pap || 0) * configuracion.precioPAP +
                    (servicios.papUrgente || 0) * configuracion.precioPAPUrgente +
                    (servicios.citologia || 0) * configuracion.precioCitologia +
                    (servicios.citologiaUrgente || 0) * configuracion.precioCitologiaUrgente +
                    (servicios.corteBlanco || 0) * configuracion.precioCorteBlanco +
                    (servicios.corteBlancoIHQ || 0) * configuracion.precioCorteBlancoIHQ +
                    (servicios.giemsaPASMasson || 0) * configuracion.precioGiemsaPASMasson;
      
      return total + costos;
    }, 0);
  };

  // Calcular el total de una biopsia individual
  const calcularTotalBiopsia = (biopsia: AdminBiopsia) => {
    const servicios = biopsia.servicios || {};
    
    return (servicios.cassetteNormal || 0) * configuracion.precioCassette +
           (servicios.cassetteUrgente || 0) * configuracion.precioCassetteUrgente +
           (servicios.profundizacion || 0) * configuracion.precioProfundizacion +
           (servicios.pap || 0) * configuracion.precioPAP +
           (servicios.papUrgente || 0) * configuracion.precioPAPUrgente +
           (servicios.citologia || 0) * configuracion.precioCitologia +
           (servicios.citologiaUrgente || 0) * configuracion.precioCitologiaUrgente +
           (servicios.corteBlanco || 0) * configuracion.precioCorteBlanco +
           (servicios.corteBlancoIHQ || 0) * configuracion.precioCorteBlancoIHQ +
           (servicios.giemsaPASMasson || 0) * configuracion.precioGiemsaPASMasson;
  };

  // Filtrar remitos según los filtros activos
  const remitosFiltrados = remitos.filter(remito => {
    const filtroMedicoOk = filtroMedico === 'todos' || remito.medico === filtroMedico;
    
    let filtroFechaOk = true;
    const fechaRemito = new Date(remito.fecha);
    const hoy = new Date();
    
    if (filtroFecha === 'hoy') {
      filtroFechaOk = fechaRemito.toDateString() === hoy.toDateString();
    } else if (filtroFecha === 'esta-semana') {
      const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
      filtroFechaOk = fechaRemito >= inicioSemana;
    } else if (filtroFecha === 'este-mes') {
      filtroFechaOk = fechaRemito.getMonth() === hoy.getMonth() && fechaRemito.getFullYear() === hoy.getFullYear();
    }
    
    return filtroMedicoOk && filtroFechaOk;
  });

  // Función para editar servicios de biopsia
  const editarServicioBiopsia = (remitoId: string, biopsiaIndex: number, servicio: string, valor: string) => {
    setRemitos(prev => prev.map(remito => {
      if (remito.id === remitoId) {
        const nuevasBiopsias = [...remito.biopsias];
        if (!nuevasBiopsias[biopsiaIndex].servicios) {
          nuevasBiopsias[biopsiaIndex].servicios = {
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
        }
        (nuevasBiopsias[biopsiaIndex].servicios as any)[servicio] = parseInt(valor) || 0;
        
        const updatedRemito = { ...remito, biopsias: nuevasBiopsias };
        
        // Guardar en localStorage
        const allRemitos = prev.map(r => r.id === remitoId ? updatedRemito : r);
        localStorage.setItem('adminRemitos', JSON.stringify(allRemitos));
        
        return updatedRemito;
      }
      return remito;
    }));
  };

  // Función para cambiar estado de remito
  const cambiarEstadoRemito = (remitoId: string, nuevoEstado: 'pendiente' | 'facturado') => {
    setRemitos(prev => {
      const updated = prev.map(remito => 
        remito.id === remitoId ? { ...remito, estado: nuevoEstado } : remito
      );
      localStorage.setItem('adminRemitos', JSON.stringify(updated));
      return updated;
    });
  };

  // Función para exportar a Excel
  const exportarExcel = (medicoFiltro: string | null = null) => {
    const remitosFiltro = medicoFiltro 
      ? remitos.filter(r => r.medico === medicoFiltro)
      : remitosFiltrados;
      
    let csvContent = 'Médico,Fecha,Hospital,Número Biopsia,Tejido,Tipo,Cassette Normal,Cassette Urgente,Profundización,PAP,PAP Urgente,Citología,Citología Urgente,Corte Blanco,Corte Blanco IHQ,Giemsa/PAS/Masson,Desclasificar,Total Biopsia,Total Remito\n';
    
    remitosFiltro.forEach(remito => {
      const totalRemito = calcularTotalRemito(remito.biopsias);
      
      remito.biopsias.forEach(biopsia => {
        const totalBiopsia = calcularTotalBiopsia(biopsia);
        const servicios = biopsia.servicios || {};
        
        csvContent += [
          remito.medico,
          remito.fecha,
          remito.hospital,
          biopsia.numero,
          biopsia.tejido,
          biopsia.tipo,
          servicios.cassetteNormal || 0,
          servicios.cassetteUrgente || 0,
          servicios.profundizacion || 0,
          servicios.pap || 0,
          servicios.papUrgente || 0,
          servicios.citologia || 0,
          servicios.citologiaUrgente || 0,
          servicios.corteBlanco || 0,
          servicios.corteBlancoIHQ || 0,
          servicios.giemsaPASMasson || 0,
          biopsia.desclasificar,
          `${totalBiopsia}`,
          `${totalRemito}`
        ].join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `remitos_${medicoFiltro || 'todos'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Panel de Administrador</h1>
            <p className="text-gray-600 mt-2">BiopsyTracker - Acceso Restringido</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingrese su usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Ingrese su contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={!loginForm.username || !loginForm.password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </button>
            
            <button
              onClick={onGoBack}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Volver a la App</span>
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              <strong>Demo:</strong> Usuario: admin | Contraseña: admin123
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Header del panel
  const Header = () => (
    <div className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Panel de Administrador</h1>
            <p className="text-gray-600">BiopsyTracker - Gestión Central</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onGoBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Volver a la App</span>
            </button>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">Administrador</p>
              <p className="text-xs text-gray-500">Sesión activa</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Lock size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Navegación lateral
  const Sidebar = () => (
    <div className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <FileText className="text-blue-400" size={24} />
          <span className="text-xl font-bold">BiopsyTracker</span>
        </div>
        
        <nav className="space-y-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <FileText size={20} />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setCurrentView('remitos')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'remitos' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <Users size={20} />
            <span>Gestión de Remitos</span>
          </button>
          
          <button
            onClick={() => setCurrentView('facturacion')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'facturacion' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <DollarSign size={20} />
            <span>Facturación</span>
          </button>
          
          <button
            onClick={() => setCurrentView('configuracion')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'configuracion' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <Settings size={20} />
            <span>Configuración</span>
          </button>
        </nav>
      </div>
    </div>
  );

  // Vista Dashboard
  const DashboardView = () => {
    const totalRemitos = remitos.length;
    const remitosPendientes = remitos.filter(r => r.estado === 'pendiente').length;
    const totalFacturado = remitos
      .filter(r => r.estado === 'facturado')
      .reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0);
    const totalPendiente = remitos
      .filter(r => r.estado === 'pendiente')
      .reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0);

    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Resumen General</h2>
        
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Remitos</p>
                <p className="text-2xl font-bold text-blue-800">{totalRemitos}</p>
              </div>
              <FileText className="text-blue-400" size={32} />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-800">{remitosPendientes}</p>
              </div>
              <Calendar className="text-yellow-400" size={32} />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Facturado</p>
                <p className="text-2xl font-bold text-green-800">${totalFacturado}</p>
              </div>
              <DollarSign className="text-green-400" size={32} />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Por Facturar</p>
                <p className="text-2xl font-bold text-purple-800">${totalPendiente}</p>
              </div>
              <Users className="text-purple-400" size={32} />
            </div>
          </div>
        </div>

        {/* Últimos remitos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Últimos Remitos Recibidos</h3>
          {remitos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay remitos disponibles</p>
              <p className="text-sm">Los remitos de los médicos aparecerán aquí automáticamente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {remitos.slice(-5).reverse().map(remito => (
                <div key={remito.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{remito.medico}</p>
                    <p className="text-sm text-gray-600">{remito.hospital} - {remito.biopsias.length} biopsias</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${calcularTotalRemito(remito.biopsias)}</p>
                    <p className="text-xs text-gray-500">{new Date(remito.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Vista Gestión de Remitos
  const RemitosView = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Remitos</h2>
        <button
          onClick={() => exportarExcel()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          disabled={remitos.length === 0}
        >
          <Download size={16} />
          <span>Exportar Todo</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Médico</label>
            <select
              value={filtroMedico}
              onChange={(e) => setFiltroMedico(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los médicos</option>
              {medicos.map(medico => (
                <option key={medico} value={medico}>{medico}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <select
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="hoy">Hoy</option>
              <option value="esta-semana">Esta semana</option>
              <option value="este-mes">Este mes</option>
              <option value="todos">Todos</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <span className="text-sm text-gray-600">
              Mostrando {remitosFiltrados.length} remitos
            </span>
          </div>
        </div>
      </div>

      {/* Lista de remitos */}
      {remitosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No hay remitos que mostrar</h3>
          <p className="text-gray-500">
            {remitos.length === 0 
              ? "Los remitos de los médicos aparecerán aquí automáticamente cuando finalicen sus remitos diarios."
              : "Ajusta los filtros para ver más remitos."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {remitosFiltrados.map(remito => (
            <div key={remito.id} className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{remito.medico}</h3>
                    <p className="text-sm text-gray-600">{remito.hospital} - {new Date(remito.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">${calcularTotalRemito(remito.biopsias)}</p>
                      <p className="text-sm text-gray-500">{remito.biopsias.length} biopsias</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingRemito(editingRemito === remito.id ? null : remito.id)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          editingRemito === remito.id 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {editingRemito === remito.id ? <X size={16} /> : <Edit size={16} />}
                      </button>
                      <button
                        onClick={() => cambiarEstadoRemito(remito.id, remito.estado === 'pendiente' ? 'facturado' : 'pendiente')}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          remito.estado === 'facturado'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {remito.estado === 'facturado' ? 'Facturado' : 'Pendiente'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detalle de biopsias */}
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2">Número</th>
                        <th className="text-left py-2">Tejido</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Cassettes</th>
                        <th className="text-left py-2">Desclasificar</th>
                        <th className="text-right py-2">Subtotal</th>
                        {editingRemito === remito.id && <th className="text-center py-2">Servicios</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {remito.biopsias.map((biopsia, index) => (
                        <React.Fragment key={index}>
                          <tr className="border-b border-gray-100">
                            <td className="py-2">{biopsia.numero}</td>
                            <td className="py-2">{biopsia.tejido}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                biopsia.tipo === 'BX' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {biopsia.tipo}
                              </span>
                            </td>
                            <td className="py-2">{biopsia.cassettes}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                biopsia.desclasificar === 'Sí' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {biopsia.desclasificar}
                              </span>
                            </td>
                            <td className="py-2 text-right font-medium">
                              ${calcularTotalBiopsia(biopsia)}
                            </td>
                            {editingRemito === remito.id && (
                              <td className="py-2 text-center">
                                <button
                                  onClick={() => setEditingRemito(editingRemito === `${remito.id}-${index}` ? null : `${remito.id}-${index}`)}
                                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs"
                                >
                                  {editingRemito === `${remito.id}-${index}` ? 'Cerrar' : 'Editar'}
                                </button>
                              </td>
                            )}
                          </tr>
                          
                          {/* Panel de edición de servicios */}
                          {editingRemito === `${remito.id}-${index}` && (
                            <tr>
                              <td colSpan={7} className="py-4 bg-blue-50">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cassette Normal</label>
                                    <input
                                      type="number"
                                      value={biopsia.servicios?.cassetteNormal || 0}
                                      onChange={(e) => editarServicioBiopsia(remito.id, index, 'cassetteNormal', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                      min="0"
                                    />
                                    <p className="text-xs text-gray-500">${configuracion.precioCassette} c/u</p>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cassette Urgente 24hs</label>
                                    <input
                                      type="number"
                                      value={biopsia.servicios?.cassetteUrgente || 0}
                                      onChange={(e) => editarServicioBiopsia(remito.id, index, 'cassetteUrgente', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                      min="0"
                                    />
                                    <p className="text-xs text-gray-500">${configuracion.precioCassetteUrgente} c/u</p>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">PAP</label>
                                    <input
                                      type="number"
                                      value={biopsia.servicios?.pap || 0}
                                      onChange={(e) => editarServicioBiopsia(remito.id, index, 'pap', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                      min="0"
                                    />
                                    <p className="text-xs text-gray-500">${configuracion.precioPAP} c/u</p>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Citología</label>
                                    <input
                                      type="number"
                                      value={biopsia.servicios?.citologia || 0}
                                      onChange={(e) => editarServicioBiopsia(remito.id, index, 'citologia', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                      min="0"
                                    />
                                    <p className="text-xs text-gray-500">${configuracion.precioCitologia} c/u</p>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Corte Blanco IHQ</label>
                                    <input
                                      type="number"
                                      value={biopsia.servicios?.corteBlancoIHQ || 0}
                                      onChange={(e) => editarServicioBiopsia(remito.id, index, 'corteBlancoIHQ', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                      min="0"
                                    />
                                    <p className="text-xs text-gray-500">${configuracion.precioCorteBlancoIHQ} c/u</p>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Giemsa/PAS/Masson</label>
                                    <input
                                      type="number"
                                      value={biopsia.servicios?.giemsaPASMasson || 0}
                                      onChange={(e) => editarServicioBiopsia(remito.id, index, 'giemsaPASMasson', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                      min="0"
                                    />
                                    <p className="text-xs text-gray-500">${configuracion.precioGiemsaPASMasson} c/u</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Vista Facturación
  const FacturacionView = () => {
    const facturasPorMedico = medicos.map(medico => {
      const remitosDelMedico = remitos.filter(r => r.medico === medico);
      const pendientes = remitosDelMedico.filter(r => r.estado === 'pendiente');
      const facturados = remitosDelMedico.filter(r => r.estado === 'facturado');
      
      return {
        medico,
        totalPendiente: pendientes.reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0),
        totalFacturado: facturados.reduce((total, remito) => total + calcularTotalRemito(remito.biopsias), 0),
        cantidadPendientes: pendientes.length,
        cantidadFacturados: facturados.length
      };
    });

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Facturación por Médico</h2>
          <button
            onClick={() => exportarExcel()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            disabled={remitos.length === 0}
          >
            <Download size={16} />
            <span>Exportar Facturación</span>
          </button>
        </div>

        {facturasPorMedico.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No hay datos de facturación</h3>
            <p className="text-gray-500">
              Los datos de facturación aparecerán aquí cuando los médicos envíen sus remitos.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {facturasPorMedico.map(factura => (
              <div key={factura.medico} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{factura.medico}</h3>
                    <p className="text-sm text-gray-600">
                      {factura.cantidadPendientes + factura.cantidadFacturados} remitos totales
                    </p>
                  </div>
                  <button
                    onClick={() => exportarExcel(factura.medico)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm"
                  >
                    <Download size={14} />
                    <span>Exportar</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-600 text-sm font-medium">Por Facturar</p>
                        <p className="text-2xl font-bold text-yellow-800">${factura.totalPendiente}</p>
                        <p className="text-xs text-yellow-600">{factura.cantidadPendientes} remitos</p>
                      </div>
                      <Calendar className="text-yellow-400" size={32} />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Ya Facturado</p>
                        <p className="text-2xl font-bold text-green-800">${factura.totalFacturado}</p>
                        <p className="text-xs text-green-600">{factura.cantidadFacturados} remitos</p>
                      </div>
                      <DollarSign className="text-green-400" size={32} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Vista Configuración
  const ConfiguracionView = () => {
    const [editingConfig, setEditingConfig] = useState(false);
    const [tempConfig, setTempConfig] = useState(configuracion);
    const [nuevoTejido, setNuevoTejido] = useState('');

    const guardarConfiguracion = () => {
      setConfiguracion(tempConfig);
      localStorage.setItem('adminConfig', JSON.stringify(tempConfig));
      setEditingConfig(false);
      alert('✅ Configuración guardada exitosamente');
    };

    const cancelarEdicion = () => {
      setTempConfig(configuracion);
      setEditingConfig(false);
    };

    const agregarTejido = () => {
      if (nuevoTejido.trim() && !tempConfig.tiposTejido.includes(nuevoTejido.trim())) {
        setTempConfig(prev => ({
          ...prev,
          tiposTejido: [...prev.tiposTejido, nuevoTejido.trim()]
        }));
        setNuevoTejido('');
      }
    };

    const eliminarTejido = (tejido: string) => {
      setTempConfig(prev => ({
        ...prev,
        tiposTejido: prev.tiposTejido.filter(t => t !== tejido)
      }));
    };

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h2>
          {editingConfig ? (
            <div className="flex space-x-2">
              <button
                onClick={guardarConfiguracion}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Save size={16} />
                <span>Guardar</span>
              </button>
              <button
                onClick={cancelarEdicion}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <X size={16} />
                <span>Cancelar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingConfig(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Edit size={16} />
              <span>Editar Configuración</span>
            </button>
          )}
        </div>

        {/* Configuración de Precios */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración de Precios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { key: 'precioCassette', label: 'Precio por Cassette ($)' },
              { key: 'precioCassetteUrgente', label: 'Cassette Urgente 24hs ($)' },
              { key: 'precioProfundizacion', label: 'Profundización/Adicionales ($)' },
              { key: 'precioPAP', label: 'PAP ($)' },
              { key: 'precioPAPUrgente', label: 'PAP Urgente 24hs ($)' },
              { key: 'precioCitologia', label: 'Citología ($)' },
              { key: 'precioCitologiaUrgente', label: 'Citología Urgente 24hs ($)' },
              { key: 'precioCorteBlanco', label: 'Corte en Blanco ($)' },
              { key: 'precioCorteBlancoIHQ', label: 'Corte Blanco IHQ ($)' },
              { key: 'precioGiemsaPASMasson', label: 'Giemsa/PAS/Masson ($)' }
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                </label>
                {editingConfig ? (
                  <input
                    type="number"
                    value={(tempConfig as any)[key]}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                ) : (
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-lg font-medium">
                    ${(configuracion as any)[key]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Configuración de Tipos de Tejido */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Tipos de Tejido Disponibles ({tempConfig.tiposTejido.length})
          </h3>
          
          {editingConfig && (
            <div className="mb-4">
              <div className="flex space-x-2">
                             // Desde la línea 990 en adelante - reemplaza el código incompleto:

                                             <input
                                               type="text"
                                               value={nuevoTejido}
                                               onChange={(e) => setNuevoTejido(e.target.value)}
                                               placeholder="Nuevo tipo de tejido"
                                               className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                             />
                                             <button
                                               onClick={agregarTejido}
                                               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                                             >
                                               <Plus size={16} />
                                               <span>Agregar</span>
                                             </button>
                                           </div>
                                         </div>
                                       )}
                                       
                                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                         {tempConfig.tiposTejido.map(tejido => (
                                           <div key={tejido} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                             <span className="text-sm">{tejido}</span>
                                             {editingConfig && (
                                               <button
                                                 onClick={() => eliminarTejido(tejido)}
                                                 className="text-red-500 hover:text-red-700 ml-2"
                                               >
                                                 <Trash2 size={14} />
                                               </button>
                                             )}
                                           </div>
                                         ))}
                                       </div>
                                     </div>

                                     {/* Información del Sistema */}
                                     <div className="bg-white rounded-lg shadow p-6">
                                       <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Sistema</h3>
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div>
                                           <p className="text-sm text-gray-600 mb-2">Versión del Sistema</p>
                                           <p className="text-lg font-medium">BiopsyTracker v1.0</p>
                                         </div>
                                         <div>
                                           <p className="text-sm text-gray-600 mb-2">Última Actualización</p>
                                           <p className="text-lg font-medium">Junio 2025</p>
                                         </div>
                                         <div>
                                           <p className="text-sm text-gray-600 mb-2">Total de Remitos</p>
                                           <p className="text-lg font-medium">{remitos.length}</p>
                                         </div>
                                         <div>
                                           <p className="text-sm text-gray-600 mb-2">Médicos Registrados</p>
                                           <p className="text-lg font-medium">{medicos.length}</p>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 );
                               };

                               // Renderizado principal
                               return (
                                 <div className="min-h-screen bg-gray-100 flex">
                                   <Sidebar />
                                   <div className="flex-1 flex flex-col">
                                     <Header />
                                     <div className="flex-1 overflow-auto">
                                       {currentView === 'dashboard' && <DashboardView />}
                                       {currentView === 'remitos' && <RemitosView />}
                                       {currentView === 'facturacion' && <FacturacionView />}
                                       {currentView === 'configuracion' && <ConfiguracionView />}
                                     </div>
                                   </div>
                                 </div>
                               );
                             };
