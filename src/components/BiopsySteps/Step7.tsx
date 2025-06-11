import React from 'react';
import { ArrowLeft, Save, FileText, Eye } from 'lucide-react';
import { BiopsyForm } from '../../types';
import { serviciosAdicionales, giemsaOptions } from '../../constants/services';

interface Step7Props {
  biopsyForm: BiopsyForm;
  onObservationsChange: (value: string) => void;
  onSave: () => void;
  onPrev: () => void;
  onFinishDailyReport: () => void;
  onOpenVirtualKeyboard: (type: 'numeric' | 'full', field: string, currentValue?: string) => void;
}

export const Step7: React.FC<Step7Props> = ({
  biopsyForm,
  onObservationsChange,
  onSave,
  onPrev,
  onFinishDailyReport,
  onOpenVirtualKeyboard
}) => {
  // Debug: Verificar que las funciones se reciben correctamente
  React.useEffect(() => {
    console.log('Step7 - Props recibidas:');
    console.log('- biopsyForm:', biopsyForm);
    console.log('- onSave:', typeof onSave);
    console.log('- onFinishDailyReport:', typeof onFinishDailyReport);
    console.log('- biopsyForm.number:', biopsyForm.number);
    console.log('- biopsyForm.tissueType:', biopsyForm.tissueType);
  }, [biopsyForm, onSave, onFinishDailyReport]);

  const handleSave = () => {
    console.log('Step7 - Botón Guardar Biopsia presionado');
    console.log('Step7 - Biopsia a guardar:', biopsyForm);
    onSave();
  };

  const handleFinishDaily = () => {
    console.log('Step7 - Botón Finalizar Remito presionado');
    console.log('Step7 - Biopsia actual que se incluirá:', biopsyForm);
    onFinishDailyReport();
  };

  const handleObservationsClick = () => {
    console.log('Step7 - Abriendo teclado para observaciones');
    onOpenVirtualKeyboard('full', 'observations', biopsyForm.observations);
  };

  // Función para obtener servicios activos con formato correcto
  const getServiciosActivos = () => {
    const serviciosActivos: string[] = [];
    if (biopsyForm.servicios) {
      Object.entries(biopsyForm.servicios).forEach(([key, value]) => {
        if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
          const servicio = serviciosAdicionales.find(s => s.key === key);
          if (servicio) {
            let servicioLabel = servicio.label;
            
            // Agregar cantidad para cortes en blanco
            if (key === 'corteBlancoIHQ') {
              const quantity = biopsyForm.servicios.corteBlancoIHQQuantity || 1;
              servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
            } else if (key === 'corteBlancoComun') {
              const quantity = biopsyForm.servicios.corteBlancoComunQuantity || 1;
              servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
            }
            
            // Agregar sub-opciones de Giemsa si están seleccionadas
            if (key === 'giemsaPASMasson' && biopsyForm.servicios.giemsaOptions) {
              const giemsaSelected = Object.entries(biopsyForm.servicios.giemsaOptions)
                .filter(([_, selected]) => selected)
                .map(([optionKey, _]) => {
                  const option = giemsaOptions.find(opt => opt.key === optionKey);
                  return option ? option.label : optionKey;
                });
              
              if (giemsaSelected.length > 0) {
                servicioLabel = `${giemsaSelected.join(', ')}`;
              }
            }
            
            serviciosActivos.push(servicioLabel);
          }
        }
      });
    }
    return serviciosActivos;
  };

  // Función para obtener números de cassettes formateados
  const getCassettesNumbers = () => {
    if (!biopsyForm.cassettesNumbers || biopsyForm.cassettesNumbers.length === 0) {
      return [biopsyForm.number];
    }
    
    return biopsyForm.cassettesNumbers.map((cassette, index) => {
      if (typeof cassette === 'string') {
        return cassette;
      }
      if (index === 0) {
        return cassette.base;
      } else {
        return `${cassette.base}/${cassette.suffix || index}`;
      }
    });
  };

  // Función para obtener el tipo de tejido completo
  const getTissueTypeDisplay = () => {
    if (biopsyForm.tissueType === 'Endoscopia' && biopsyForm.endoscopiaSubTypes && biopsyForm.endoscopiaSubTypes.length > 0) {
      return `${biopsyForm.tissueType} (${biopsyForm.endoscopiaSubTypes.join(', ')})`;
    }
    return biopsyForm.tissueType;
  };

  const serviciosActivos = getServiciosActivos();
  const cassettesNumbers = getCassettesNumbers();

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Eye className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Resumen Final</h3>
            <p className="text-sm text-gray-600">Revisa y confirma los datos antes de guardar</p>
          </div>
        </div>

        {/* Vista previa de la biopsia */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-medium">Número de Biopsia</p>
              <p className="text-lg font-bold text-blue-600">#{biopsyForm.number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Tipo</p>
              <p className="text-lg font-bold text-purple-600">{biopsyForm.type}</p>
            </div>
          </div>

          {/* Tejido */}
          <div>
            <p className="text-xs text-gray-600 font-medium mb-1">Tipo de Tejido</p>
            <p className="text-sm font-medium text-gray-800">{getTissueTypeDisplay()}</p>
          </div>

          {/* Cassettes y trozos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-medium">Cassettes</p>
              <p className="text-sm font-medium text-gray-800">{biopsyForm.cassettes}</p>
            </div>
            {biopsyForm.pieces && (
              <div>
                <p className="text-xs text-gray-600 font-medium">Trozos</p>
                <p className="text-sm font-medium text-gray-800">{biopsyForm.pieces}</p>
              </div>
            )}
          </div>

          {/* Números de cassettes */}
          {cassettesNumbers.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 font-medium mb-2">Números de Cassettes</p>
              <div className="flex flex-wrap gap-2">
                {cassettesNumbers.map((number, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {number}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Desclasificar */}
          {biopsyForm.declassify && biopsyForm.declassify !== 'No' && (
            <div>
              <p className="text-xs text-gray-600 font-medium">Desclasificar</p>
              <p className="text-sm font-medium text-orange-600">{biopsyForm.declassify}</p>
            </div>
          )}

          {/* Servicios adicionales */}
          {serviciosActivos.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 font-medium mb-2">Servicios Adicionales</p>
              <div className="space-y-1">
                {serviciosActivos.map((servicio, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-purple-700 font-medium">{servicio}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Observaciones */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones (Opcional)
          </label>
          <div 
            onClick={handleObservationsClick}
            className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            {biopsyForm.observations ? (
              <p className="text-gray-800 text-sm">{biopsyForm.observations}</p>
            ) : (
              <p className="text-gray-500 text-sm italic">Toca aquí para agregar observaciones...</p>
            )}
          </div>
        </div>
      </div>

      {/* Información importante */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">ℹ️ Información importante:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Guardar Biopsia:</strong> Guarda esta biopsia y continúa agregando más</li>
          <li>• <strong>Finalizar Remito:</strong> Guarda esta biopsia y completa el remito del día</li>
          <li>• Puedes modificar cualquier dato volviendo a los pasos anteriores</li>
        </ul>
      </div>

      {/* Botones de acción */}
      <div className="space-y-3">
        {/* Botón para guardar solo esta biopsia */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>💾 Guardar Biopsia</span>
        </button>

        {/* Botón para finalizar remito del día */}
        <button
          onClick={handleFinishDaily}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <FileText className="h-5 w-5" />
          <span>📋 Guardar Biopsia y Finalizar Remito del Día</span>
        </button>

        {/* Botón para volver */}
        <button
          onClick={onPrev}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>← Volver a Servicios</span>
        </button>
      </div>

      {/* Resumen final */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="text-center">
          <h4 className="font-semibold text-gray-800 mb-2">📋 Resumen</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Biopsia</p>
              <p className="font-bold text-gray-800">#{biopsyForm.number}</p>
            </div>
            <div>
              <p className="text-gray-600">Cassettes</p>
              <p className="font-bold text-gray-800">{biopsyForm.cassettes}</p>
            </div>
            <div>
              <p className="text-gray-600">Servicios</p>
              <p className="font-bold text-gray-800">{serviciosActivos.length}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            📅 {new Date().toLocaleDateString('es-AR')} • 🕐 {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
};