import React from 'react';
import { ArrowLeft, Plus, FileText, Download } from 'lucide-react';
import { BiopsyForm, DoctorInfo } from '../types';
import { ConnectionStatus } from './ConnectionStatus';
import { serviciosAdicionales, giemsaOptions } from '../constants/services';

interface TodayListScreenProps {
  doctorInfo: DoctorInfo;
  todayBiopsies: BiopsyForm[];
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
  onGoBack: () => void;
  onStartNewBiopsy: () => void;
  onFinishDailyReport: () => void;
}

export const TodayListScreen: React.FC<TodayListScreenProps> = ({
  doctorInfo,
  todayBiopsies,
  isOnline,
  backupStatus,
  syncQueueLength,
  onGoBack,
  onStartNewBiopsy,
  onFinishDailyReport
}) => {
  // Debug: Agregar logs para diagnosticar
  React.useEffect(() => {
    console.log('TodayListScreen - doctorInfo:', doctorInfo);
    console.log('TodayListScreen - todayBiopsies:', todayBiopsies);
    console.log('TodayListScreen - todayBiopsies.length:', todayBiopsies?.length);
  }, [doctorInfo, todayBiopsies]);

  // Verificación de seguridad
  if (!doctorInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onGoBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Error</h2>
          </div>
        </div>
        <div className="max-w-md mx-auto p-4 text-center py-12">
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Error: Información del doctor no disponible
          </h3>
          <button
            onClick={onGoBack}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Asegurar que todayBiopsies sea un array
  const biopsies = todayBiopsies || [];

  // ✅ FUNCIÓN CORREGIDA PARA EVITAR DUPLICADOS DE GIEMSA
  const getServiciosDisplay = (biopsy: BiopsyForm) => {
    const serviciosActivos: string[] = [];
    if (biopsy.servicios) {
      Object.entries(biopsy.servicios).forEach(([key, value]) => {
        if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
          const servicio = serviciosAdicionales.find(s => s.key === key);
          if (servicio) {
            let servicioLabel = servicio.label;
            
            // ✅ MANEJO ESPECIAL PARA GIEMSA/PAS/MASSON CON SUBMENÚ
            if (key === 'giemsaPASMasson' && biopsy.servicios.giemsaOptions) {
              const giemsaSelected = Object.entries(biopsy.servicios.giemsaOptions)
                .filter(([_, selected]) => selected)
                .map(([optionKey, _]) => {
                  const option = giemsaOptions.find(opt => opt.key === optionKey);
                  return option ? option.label : optionKey;
                });
              
              if (giemsaSelected.length > 0) {
                // ✅ MOSTRAR SOLO LAS OPCIONES ESPECÍFICAS SELECCIONADAS
                servicioLabel = giemsaSelected.join(', ');
              } else {
                // Si no hay sub-opciones seleccionadas, no mostrar nada
                return;
              }
            }
            // ✅ AGREGAR CANTIDAD PARA CORTES EN BLANCO
            else if (key === 'corteBlancoIHQ') {
              const quantity = biopsy.servicios.corteBlancoIHQQuantity || 1;
              servicioLabel += ` (${quantity})`;
            } else if (key === 'corteBlancoComun') {
              const quantity = biopsy.servicios.corteBlancoComunQuantity || 1;
              servicioLabel += ` (${quantity})`;
            }
            
            serviciosActivos.push(servicioLabel);
          }
        }
      });
    }
    return serviciosActivos;
  };

  const getTissueTypeDisplay = (biopsy: BiopsyForm) => {
    if (biopsy.tissueType === 'Endoscopia' && biopsy.endoscopiaSubTypes && biopsy.endoscopiaSubTypes.length > 0) {
      return `${biopsy.tissueType} (${biopsy.endoscopiaSubTypes.join(', ')})`;
    }
    return biopsy.tissueType;
  };

  // ✅ FUNCIÓN PARA DETECTAR SI ES PAP O CITOLOGÍA
  const isPAPOrCitologia = (biopsy: BiopsyForm) => {
    return biopsy.tissueType === 'PAP' || biopsy.tissueType === 'Citología';
  };

  // ✅ FUNCIÓN PARA OBTENER SERVICIOS ESPECÍFICOS DE PAP/CITOLOGÍA
  const getPAPCitologiaServices = (biopsy: BiopsyForm) => {
    const services: string[] = [];
    
    if (biopsy.tissueType === 'PAP' && biopsy.papUrgente) {
      services.push('PAP Urgente');
    }
    
    if (biopsy.tissueType === 'Citología' && biopsy.citologiaUrgente) {
      services.push('Citología Urgente');
    }
    
    return services;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={onGoBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Remito del Día</h2>
              <p className="text-sm text-gray-600">
                {biopsies.length} {biopsies.length === 1 ? 'estudio cargado' : 'estudios cargados'}
              </p>
            </div>
          </div>
          <ConnectionStatus 
            isOnline={isOnline}
            backupStatus={backupStatus}
            syncQueueLength={syncQueueLength}
          />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {biopsies.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No hay estudios cargados hoy
            </h3>
            <p className="text-gray-500 mb-4">
              Comienza agregando tu primer estudio del día
            </p>
            <button
              onClick={onStartNewBiopsy}
              className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Estudio</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Botones de acción */}
            <div className="flex space-x-3 mb-6">
              <button
                onClick={onStartNewBiopsy}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Nuevo Estudio</span>
              </button>
              
              <button
                onClick={onFinishDailyReport}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Finalizar</span>
              </button>
            </div>

            {/* Lista de estudios */}
            <div className="space-y-4">
              {biopsies.map((biopsy, index) => {
                const isPapCitologia = isPAPOrCitologia(biopsy);
                const serviciosActivos = isPapCitologia ? getPAPCitologiaServices(biopsy) : getServiciosDisplay(biopsy);
                
                return (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    {/* ✅ HEADER DIFERENTE PARA PAP/CITOLOGÍA VS BIOPSIA */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          {isPapCitologia ? (
                            // ✅ FORMATO PARA PAP/CITOLOGÍA: "#BX25-002 - PAP"
                            <>
                              <h4 className="font-semibold text-gray-800">
                                #{biopsy.type}{biopsy.number} - {biopsy.tissueType}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {biopsy.timestamp ? new Date(biopsy.timestamp).toLocaleTimeString('es-AR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) : 'Sin hora'}
                              </p>
                            </>
                          ) : (
                            // ✅ FORMATO NORMAL PARA BIOPSIAS: "Biopsia #88"
                            <>
                              <h4 className="font-semibold text-gray-800">
                                Biopsia #{biopsy.number}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {biopsy.timestamp ? new Date(biopsy.timestamp).toLocaleTimeString('es-AR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) : 'Sin hora'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          biopsy.type === 'BX' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {biopsy.type}
                        </span>
                      </div>
                    </div>
                    
                    {/* ✅ INFORMACIÓN PRINCIPAL DIFERENTE PARA PAP/CITOLOGÍA */}
                    <div className="space-y-2 text-sm mb-3">
                      {isPapCitologia ? (
                        // ✅ FORMATO PAP/CITOLOGÍA: "Vidrios: 2"
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vidrios:</span>
                            <span className="font-medium">
                              {biopsy.tissueType === 'PAP' ? biopsy.papQuantity : biopsy.citologiaQuantity}
                            </span>
                          </div>
                          
                          {((biopsy.tissueType === 'PAP' && biopsy.papUrgente) || 
                            (biopsy.tissueType === 'Citología' && biopsy.citologiaUrgente)) && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Prioridad:</span>
                              <span className="font-medium text-orange-600">⚡ Urgente 24hs</span>
                            </div>
                          )}
                        </>
                      ) : (
                        // ✅ FORMATO NORMAL BIOPSIA: "Tejido:", "Cassettes:", etc.
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tejido:</span>
                            <span className="font-medium text-right max-w-[60%]">
                              {getTissueTypeDisplay(biopsy)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cassettes:</span>
                            <span className="font-medium">{biopsy.cassettes}</span>
                          </div>
                          
                          {biopsy.pieces && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Trozos:</span>
                              <span className="font-medium">{biopsy.pieces}</span>
                            </div>
                          )}
                          
                          {biopsy.declassify && biopsy.declassify !== 'No' && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Desclasificar:</span>
                              <span className="font-medium text-orange-600">{biopsy.declassify}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* ✅ NÚMEROS DE CASSETTES - SOLO PARA BIOPSIAS NORMALES */}
                    {!isPapCitologia && biopsy.cassettesNumbers && biopsy.cassettesNumbers.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-2">Números de cassettes:</p>
                        <div className="flex flex-wrap gap-1">
                          {biopsy.cassettesNumbers.map((cassette, cassIndex) => (
                            <span
                              key={cassIndex}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                            >
                              {typeof cassette === 'string' ? cassette : 
                               cassIndex === 0 ? cassette.base : 
                               `${cassette.base}/${cassette.suffix || cassIndex}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ✅ SERVICIOS ADICIONALES */}
                    {serviciosActivos.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-gray-600 mb-2">
                          🔧 {serviciosActivos.length} servicio{serviciosActivos.length !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-1">
                          {serviciosActivos.map((servicio, servIndex) => (
                            <div key={servIndex} className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              <span className="text-xs text-purple-700 font-medium">{servicio}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observaciones */}
                    {biopsy.observations && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-xs text-gray-600 mb-1">Observaciones:</p>
                        <p className="text-xs text-gray-700 italic">"{biopsy.observations}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Resumen final */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
              <div className="text-center">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Resumen del Día</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600">Total Estudios</p>
                    <p className="text-2xl font-bold text-blue-800">{biopsies.length}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Con Servicios</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {biopsies.filter(b => {
                        const isPapCit = isPAPOrCitologia(b);
                        if (isPapCit) {
                          return (b.tissueType === 'PAP' && b.papUrgente) || 
                                 (b.tissueType === 'Citología' && b.citologiaUrgente);
                        }
                        return Object.values(b.servicios || {}).some(val => 
                          typeof val === 'boolean' ? val : false
                        );
                      }).length}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  📅 {new Date().toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">ℹ️ Acciones disponibles:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Nuevo Estudio:</strong> Agregar otro estudio al remito</li>
                <li>• <strong>Finalizar:</strong> Guardar el remito en el historial</li>
                <li>• Puedes agregar tantos estudios como necesites</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};