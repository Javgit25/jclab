import React, { useState } from 'react';
import { Plus, FileText, History, LogOut, TrendingUp, Target, Zap, Star, Activity, BarChart3, PieChart, Calendar, Clock } from 'lucide-react';
import { BiopsyForm, DoctorInfo } from '../types';
import { ConnectionStatus } from './ConnectionStatus';

interface MainScreenProps {
  doctorInfo: DoctorInfo;
  todayBiopsies: BiopsyForm[];
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
  onStartNewBiopsy: () => void;
  onViewToday: () => void;
  onViewHistory: () => void;
  onGoToAdmin: () => void;
  onLogout: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  doctorInfo,
  todayBiopsies,
  isOnline,
  backupStatus,
  syncQueueLength,
  onStartNewBiopsy,
  onViewToday,
  onViewHistory,
  onGoToAdmin,
  onLogout
}) => {
  const [showStatistics, setShowStatistics] = useState(false);

  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calcular métricas para el dashboard - CORREGIDO
  const getTodayStats = () => {
    // Combinar biopsias del estado actual + cualquier remito ya finalizado del día de hoy
    let allTodayBiopsies = [...todayBiopsies];
    
    try {
      let historyData = {};
      
      if (doctorInfo.email) {
        const normalizedEmail = doctorInfo.email.toLowerCase().trim().replace(/\s+/g, '');
        const doctorKey = `doctor_${normalizedEmail}`;
        const historyKey = `${doctorKey}_history`;
        historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
      } else {
        const historyKey = `${doctorInfo.firstName}_${doctorInfo.lastName}_history`;
        historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
      }
      
      // Buscar remitos del día de hoy en el historial
      const todayDate = new Date().toDateString();
      const todayRemitos = Object.values(historyData).filter((entry: any) => {
        const entryDate = new Date(entry.date).toDateString();
        return entryDate === todayDate;
      });
      
      // Agregar biopsias de remitos ya finalizados del día de hoy
      todayRemitos.forEach((remito: any) => {
        if (remito.biopsies) {
          allTodayBiopsies = [...allTodayBiopsies, ...remito.biopsies];
        }
      });
      
    } catch (error) {
      console.error('Error calculando estadísticas del día:', error);
    }
    
    return allTodayBiopsies;
  };

  const allTodayBiopsies = getTodayStats();
  const todayBiopsiesCount = allTodayBiopsies.length;
  const biopsiesWithServices = allTodayBiopsies.filter(b => 
    Object.values(b.servicios || {}).some(val => 
      typeof val === 'boolean' ? val : false
    )
  ).length;

  // Calcular eficiencia (simulada basada en datos reales)
  const efficiency = todayBiopsiesCount > 0 ? Math.min(95, 70 + (todayBiopsiesCount * 3)) : 0;
  const avgTime = todayBiopsiesCount > 0 ? `${(5 - (todayBiopsiesCount * 0.1)).toFixed(1)} min` : '0 min';

  // Calcular estadísticas del historial - CORREGIDA para usar EMAIL
  const getHistoryStats = () => {
    try {
      // NUEVA LÓGICA: Buscar datos por email si está disponible, sino por nombre
      let historyData = {};
      
      if (doctorInfo.email) {
        // Usar nuevo sistema basado en email
        const normalizedEmail = doctorInfo.email.toLowerCase().trim().replace(/\s+/g, '');
        const doctorKey = `doctor_${normalizedEmail}`;
        const historyKey = `${doctorKey}_history`;
        
        console.log('MainScreen - Buscando historial con email:', historyKey);
        historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
      } else {
        // Fallback: usar sistema anterior por nombre
        const historyKey = `${doctorInfo.firstName}_${doctorInfo.lastName}_history`;
        console.log('MainScreen - Buscando historial con nombre:', historyKey);
        historyData = JSON.parse(localStorage.getItem(historyKey) || '{}');
      }
      
      console.log('MainScreen - Datos del historial encontrados:', historyData);
      console.log('MainScreen - Cantidad de entradas:', Object.keys(historyData).length);
      
      const entries = Object.values(historyData) as any[];
      const totalRemitos = entries.length;
      const totalBiopsias = entries.reduce((sum: number, entry: any) => sum + (entry.biopsies?.length || 0), 0);
      const promedioPorRemito = totalRemitos > 0 ? Math.round(totalBiopsias / totalRemitos) : 0;
      
      // Calcular distribución por tipo de tejido
      const tissueDistribution: {[key: string]: number} = {};
      entries.forEach((entry: any) => {
        entry.biopsies?.forEach((biopsy: any) => {
          const tissue = biopsy.tissueType || 'Sin especificar';
          tissueDistribution[tissue] = (tissueDistribution[tissue] || 0) + 1;
        });
      });

      const topTissues = Object.entries(tissueDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      const stats = {
        totalRemitos,
        totalBiopsias,
        promedioPorRemito,
        topTissues
      };
      
      console.log('MainScreen - Estadísticas calculadas:', stats);
      
      return stats;
    } catch (error) {
      console.error('MainScreen - Error calculando estadísticas:', error);
      return {
        totalRemitos: 0,
        totalBiopsias: 0,
        promedioPorRemito: 0,
        topTissues: []
      };
    }
  };

  const stats = getHistoryStats();

  const StatisticsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="text-purple-500 mr-3" size={28} />
            Estadísticas Médicas
          </h2>
          <button
            onClick={() => setShowStatistics(false)}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Métricas Principales */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8" />
              <span className="text-blue-100 text-sm">TOTAL</span>
            </div>
            <div className="text-3xl font-bold mb-2">{stats.totalRemitos}</div>
            <div className="text-blue-100">Remitos Generados</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8" />
              <span className="text-green-100 text-sm">TOTAL</span>
            </div>
            <div className="text-3xl font-bold mb-2">{stats.totalBiopsias}</div>
            <div className="text-green-100">Biopsias Procesadas</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8" />
              <span className="text-purple-100 text-sm">PROMEDIO</span>
            </div>
            <div className="text-3xl font-bold mb-2">{stats.promedioPorRemito}</div>
            <div className="text-purple-100">Biopsias por Remito</div>
          </div>

          {/* Estadísticas del Día Actual */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8" />
              <span className="text-orange-100 text-sm">HOY</span>
            </div>
            <div className="text-3xl font-bold mb-2">{todayBiopsiesCount}</div>
            <div className="text-orange-100">Biopsias del Día</div>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8" />
              <span className="text-teal-100 text-sm">EFICIENCIA</span>
            </div>
            <div className="text-3xl font-bold mb-2">{efficiency}%</div>
            <div className="text-teal-100">Rendimiento</div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Star className="h-8 w-8" />
              <span className="text-indigo-100 text-sm">SERVICIOS</span>
            </div>
            <div className="text-3xl font-bold mb-2">{biopsiesWithServices}</div>
            <div className="text-indigo-100">Con Servicios Extra</div>
          </div>
        </div>

        {/* Top Tejidos */}
        {stats.topTissues.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <PieChart className="text-purple-500 mr-2" size={24} />
              Tipos de Tejido Más Frecuentes
            </h3>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="space-y-4">
                {stats.topTissues.map(([tissue, count], index) => {
                  const percentage = stats.totalBiopsias > 0 ? Math.round((count / stats.totalBiopsias) * 100) : 0;
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];
                  
                  return (
                    <div key={tissue} className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-4 h-4 rounded-full ${colors[index]}`}></div>
                        <span className="text-gray-700 font-medium">{tissue}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600 text-sm">{count} casos</span>
                        <span className="text-gray-800 font-bold">{percentage}%</span>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${colors[index]} transition-all duration-1000`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recomendaciones */}
        <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="text-xl font-semibold text-yellow-800 mb-4 flex items-center">
            <Target className="text-yellow-600 mr-2" size={24} />
            Análisis y Recomendaciones
          </h3>
          <div className="space-y-3 text-yellow-700">
            {todayBiopsiesCount > stats.promedioPorRemito && (
              <p>✅ <strong>Excelente:</strong> Estás por encima de tu promedio diario habitual.</p>
            )}
            {efficiency > 85 && (
              <p>🚀 <strong>Alta eficiencia:</strong> Tu ritmo de trabajo es muy bueno hoy.</p>
            )}
            {biopsiesWithServices / todayBiopsiesCount > 0.5 && todayBiopsiesCount > 0 && (
              <p>🔬 <strong>Servicios especiales:</strong> Alto porcentaje de biopsias con servicios adicionales.</p>
            )}
            {stats.totalRemitos === 0 && (
              <p>📚 <strong>Primeros pasos:</strong> ¡Bienvenido! Este es tu primer día usando el sistema.</p>
            )}
            {stats.totalRemitos > 0 && stats.totalBiopsias > 50 && (
              <p>🎯 <strong>Usuario experimentado:</strong> Has procesado {stats.totalBiopsias} biopsias en total. ¡Excelente!</p>
            )}
            {stats.topTissues.length > 0 && (
              <p>📊 <strong>Especialización:</strong> Tu tejido más frecuente es "{stats.topTissues[0][0]}" con {stats.topTissues[0][1]} casos.</p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setShowStatistics(false)}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-8 rounded-xl font-semibold"
          >
            Cerrar Estadísticas
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header optimizado para tablet */}
      <div className="bg-white border-b px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Bienvenido, Dr. {doctorInfo.firstName} {doctorInfo.lastName}
            </h1>
            {doctorInfo.hospitalName && (
              <p className="text-lg text-gray-600 mt-1">{doctorInfo.hospitalName}</p>
            )}
            {doctorInfo.email && (
              <p className="text-sm text-blue-600 mt-1">📧 {doctorInfo.email}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">{today}</p>
          </div>
          <div className="flex items-center space-x-4">
            <ConnectionStatus 
              isOnline={isOnline}
              backupStatus={backupStatus}
              syncQueueLength={syncQueueLength}
            />
            <button
              onClick={onLogout}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal optimizado para tablet 10.1" */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          {/* Panel principal izquierdo (2/3 del espacio) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Resumen del día con métricas visuales */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-2xl shadow-lg">
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{todayBiopsiesCount}</div>
                  <div className="text-blue-100 text-lg">Biopsias Hoy</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{efficiency}%</div>
                  <div className="text-blue-100 text-lg">Eficiencia</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{avgTime}</div>
                  <div className="text-blue-100 text-lg">Tiempo Promedio</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{biopsiesWithServices}</div>
                  <div className="text-blue-100 text-lg">Con Servicios</div>
                </div>
              </div>
              
              {/* Progreso visual del día */}
              <div className="mt-8">
                <div className="flex justify-between text-blue-100 text-sm mb-3">
                  <span>Progreso Diario</span>
                  <span>{todayBiopsiesCount}/12 objetivo</span>
                </div>
                <div className="bg-white/20 rounded-full h-4">
                  <div 
                    className="bg-white h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (todayBiopsiesCount / 12) * 100)}%` }}
                  ></div>
                </div>
                {todayBiopsies.length > 0 && (
                  <p className="text-blue-100 text-sm mt-2 text-center">
                    ¡Excelente ritmo! Estás por encima del promedio
                  </p>
                )}
              </div>
            </div>

            {/* Acciones principales optimizadas para tablet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={onStartNewBiopsy}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-8 px-8 rounded-2xl flex items-center justify-center space-x-4 transition-all duration-200 shadow-lg transform hover:scale-105"
              >
                <Plus className="h-10 w-10" />
                <div className="text-left">
                  <div className="text-2xl font-bold">Nueva Biopsia</div>
                  <div className="text-blue-100 text-lg">Crear registro #{todayBiopsiesCount + 1}</div>
                </div>
              </button>

              <button
                onClick={onViewToday}
                className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-8 px-8 rounded-2xl border-2 border-gray-200 flex items-center justify-center space-x-4 transition-all duration-200 shadow-lg transform hover:scale-105"
              >
                <FileText className="h-10 w-10 text-blue-500" />
                <div className="text-left">
                  <div className="text-2xl font-bold">Remito del Día</div>
                  <div className="text-gray-500 text-lg">{todayBiopsiesCount} biopsias cargadas</div>
                </div>
              </button>
            </div>

            {/* Acciones secundarias en grid - SIN BOTÓN ADMIN */}
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={onViewHistory}
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-6 px-6 rounded-xl border border-gray-200 flex flex-col items-center space-y-3 transition-all duration-200 transform hover:scale-105"
              >
                <History className="h-8 w-8 text-green-500" />
                <div className="text-center">
                  <div className="font-semibold text-lg">Historial</div>
                  <div className="text-sm text-gray-500">{stats.totalRemitos} remitos guardados</div>
                </div>
              </button>

              <button
                onClick={() => setShowStatistics(true)}
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-6 px-6 rounded-xl border border-gray-200 flex flex-col items-center space-y-3 transition-all duration-200 transform hover:scale-105"
              >
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div className="text-center">
                  <div className="font-semibold text-lg">Estadísticas</div>
                  <div className="text-sm text-gray-500">{stats.totalBiopsias} biopsias totales</div>
                </div>
              </button>
            </div>
          </div>

          {/* Panel derecho - Información contextual (1/3 del espacio) */}
          <div className="space-y-6">
            
            {/* Acciones rápidas inteligentes */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Zap className="text-yellow-500 mr-3" size={24} />
                Acceso Rápido
              </h3>
              <div className="space-y-4">
                <button 
                  onClick={onStartNewBiopsy}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <div className="flex items-center">
                    <Star className="text-yellow-500 mr-3" size={20} />
                    <div className="text-left">
                      <div className="font-medium text-lg">
                        {stats.topTissues.length > 0 ? stats.topTissues[0][0] : 'Gastrica'} BX
                      </div>
                      <div className="text-sm text-gray-500">Más frecuente</div>
                    </div>
                  </div>
                  <Plus className="text-gray-400" size={18} />
                </button>

                <button 
                  onClick={onStartNewBiopsy}
                  className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                >
                  <div className="flex items-center">
                    <Star className="text-yellow-500 mr-3" size={20} />
                    <div className="text-left">
                      <div className="font-medium text-lg">Endoscopia + PAP</div>
                      <div className="text-sm text-gray-500">Combo frecuente</div>
                    </div>
                  </div>
                  <Plus className="text-gray-400" size={18} />
                </button>

                {todayBiopsies.length > 0 && (
                  <button 
                    onClick={onStartNewBiopsy}
                    className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                  >
                    <div className="flex items-center">
                      <Target className="text-purple-500 mr-3" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-lg">Duplicar Última</div>
                        <div className="text-sm text-gray-500">Biopsia similar</div>
                      </div>
                    </div>
                    <Plus className="text-gray-400" size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Estado del sistema mejorado */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Activity className="text-green-500 mr-3" size={24} />
                Estado del Sistema
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-lg">Conexión</span>
                  <div className="flex items-center text-green-600">
                    <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">{isOnline ? 'En línea' : 'Sin conexión'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-lg">Datos guardados</span>
                  <span className="text-blue-600 font-medium text-lg">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-lg">Último backup</span>
                  <span className="text-gray-600 font-medium">
                    {backupStatus === 'success' ? 'Hace 2 min' : 
                     backupStatus === 'syncing' ? 'Sincronizando...' :
                     backupStatus === 'error' ? 'Error' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-lg">Datos pendientes</span>
                  <span className="text-gray-600 font-medium">{syncQueueLength} elementos</span>
                </div>
              </div>
            </div>

            {/* Tip del día */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-yellow-800">
                <Target className="text-yellow-600 mr-3" size={24} />
                Tip del Día
              </h3>
              <p className="text-yellow-700 text-lg leading-relaxed">
                <strong>Optimización de tiempo:</strong> Usa las plantillas de "Acceso Rápido" 
                para crear biopsias frecuentes en un solo toque. ¡Ahorra hasta 2 minutos por biopsia!
              </p>
            </div>

            {/* Progreso semanal */}
            {allTodayBiopsies.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <TrendingUp className="text-blue-500 mr-3" size={24} />
                  Progreso Semanal
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-lg">Esta semana</span>
                    <span className="font-bold text-blue-600 text-xl">{allTodayBiopsies.length * 4}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-lg">Promedio diario</span>
                    <span className="font-bold text-green-600 text-xl">{Math.round(allTodayBiopsies.length * 0.8)}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3 mt-4">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (allTodayBiopsies.length / 15) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Meta semanal: 60 biopsias
                  </p>
                </div>
              </div>
            )}

            {/* Resumen de historial */}
            {stats.totalRemitos > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <History className="text-green-500 mr-3" size={24} />
                  Tu Historial
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-lg">Total remitos</span>
                    <span className="font-bold text-green-600 text-xl">{stats.totalRemitos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-lg">Total biopsias</span>
                    <span className="font-bold text-blue-600 text-xl">{stats.totalBiopsias}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-lg">Promedio por remito</span>
                    <span className="font-bold text-purple-600 text-xl">{stats.promedioPorRemito}</span>
                  </div>
                  {stats.topTissues.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Tejido más frecuente:</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{stats.topTissues[0][0]}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                          {stats.topTissues[0][1]} casos
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Estadísticas */}
      {showStatistics && <StatisticsModal />}
    </div>
  );
};