import React from 'react';
import { Save, FileText, Eye, ChevronLeft } from 'lucide-react';
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
  // onObservationsChange, // No se usa directamente, se maneja por el teclado virtual
  onSave,
  onPrev,
  onFinishDailyReport,
  onOpenVirtualKeyboard
}) => {
  // Determinar si es PAP o Citología
  const isPAPSelected = biopsyForm.tissueType === 'PAP';
  const isCitologiaSelected = biopsyForm.tissueType === 'Citología';
  const isPapOrCitologia = isPAPSelected || isCitologiaSelected;

  // Textos dinámicos
  const getTitle = () => {
    if (isPAPSelected) return 'Vista Previa de los PAP';
    if (isCitologiaSelected) return 'Vista Previa de las Citologías';
    return 'Vista Previa de la Biopsia';
  };

  const getGiemsaText = () => {
    if (biopsyForm.servicios?.giemsaOptions) {
      const selected = Object.entries(biopsyForm.servicios.giemsaOptions)
        .filter(([_, isSelected]) => isSelected)
        .map(([key, _]) => {
          const option = giemsaOptions.find(opt => opt.key === key);
          return option ? option.label : key;
        });
      return selected.length > 0 ? selected.join(', ') : 'No especificado';
    }
    return 'No especificado';
  };

  const getMaterialText = () => {
    if (isPapOrCitologia) {
      if (isPAPSelected) {
        return `${biopsyForm.papQuantity} vidrio${biopsyForm.papQuantity > 1 ? 's' : ''} PAP`;
      } else {
        return `${biopsyForm.citologiaQuantity} vidrio${biopsyForm.citologiaQuantity > 1 ? 's' : ''} citología`;
      }
    } else {
      const cassettes = parseInt(biopsyForm.cassettes) || 0;
      const pieces = parseInt(biopsyForm.pieces) || 0;
      let text = `${cassettes} cassette${cassettes > 1 ? 's' : ''}`;
      if (pieces > 0) {
        text += ` • ${pieces} trozo${pieces > 1 ? 's' : ''}`;
      }
      return text;
    }
  };

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header Compacto y Limpio */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 16px',
        flexShrink: 0,
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
        margin: '16px 16px 8px 16px',
        maxWidth: 'none',
        width: 'calc(100% - 32px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px',
              borderRadius: '12px',
              position: 'relative',
              backdropFilter: 'blur(10px)'
            }}>
              <Eye style={{ height: '20px', width: '20px', color: 'white' }} />
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(34, 197, 94, 0.4)'
              }}>
                7
              </div>
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Resumen Final</h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>Confirma todos los datos</p>
            </div>
          </div>
          
          {/* Navegación integrada en el header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onPrev}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <button
              onClick={onSave}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Save size={16} />
              Guardar
            </button>
            <button
              onClick={onFinishDailyReport}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FileText size={16} />
              Finalizar
            </button>
          </div>
        </div>
      </div>

      {/* Título principal */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-3xl font-bold text-gray-800">{getTitle()}</h2>
      </div>

      {/* Contenido principal */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Grid de datos principales */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Información básica */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Eye size={20} />
                Información Básica
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-blue-700">Número</label>
                  <p className="text-gray-800 font-semibold">#{biopsyForm.number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-700">Tipo de Tejido</label>
                  <p className="text-gray-800 font-semibold">
                    {biopsyForm.tissueType === 'Endoscopia' && biopsyForm.endoscopiaSubTypes?.length > 0
                      ? `${biopsyForm.tissueType} (${biopsyForm.endoscopiaSubTypes.join(', ')})`
                      : biopsyForm.tissueType}
                  </p>
                </div>
                {!isPapOrCitologia && (
                  <div>
                    <label className="text-sm font-medium text-blue-700">Tipo</label>
                    <p className="text-gray-800 font-semibold">{biopsyForm.type}</p>
                  </div>
                )}
                {!isPapOrCitologia && biopsyForm.declassify && biopsyForm.declassify !== 'No desclasificar' && (
                  <div>
                    <label className="text-sm font-medium text-blue-700">Desclasificar</label>
                    <p className="text-amber-600 font-semibold">{biopsyForm.declassify}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Material y procesamiento */}
            <div className="bg-indigo-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-indigo-800 mb-3">Material</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-indigo-700">Cantidad</label>
                  <p className="text-gray-800 font-semibold">{getMaterialText()}</p>
                </div>
                {isPapOrCitologia && (
                  <div>
                    <label className="text-sm font-medium text-indigo-700">Tiempo Giemsa</label>
                    <p className="text-gray-800 font-semibold">{getGiemsaText()}</p>
                  </div>
                )}
                {biopsyForm.cassettesNumbers && biopsyForm.cassettesNumbers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-indigo-700">Números de Cassettes</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {biopsyForm.cassettesNumbers.map((cassette, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm font-medium"
                        >
                          {cassette.base}{cassette.suffix}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Servicios adicionales */}
          {(() => {
            const serviciosActivos: string[] = [];
            
            if (biopsyForm.servicios) {
              Object.entries(biopsyForm.servicios).forEach(([key, value]) => {
                if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
                  const servicio = serviciosAdicionales.find(s => s.key === key);
                  if (servicio) {
                    let servicioLabel = servicio.label;
                    
                    // Manejo especial para Giemsa/PAS/Masson
                    if (key === 'giemsaPASMasson' && biopsyForm.servicios.giemsaOptions) {
                      const giemsaSelected = Object.entries(biopsyForm.servicios.giemsaOptions)
                        .filter(([_, selected]) => selected)
                        .map(([optionKey, _]) => {
                          const option = giemsaOptions.find(opt => opt.key === optionKey);
                          return option ? option.label : optionKey;
                        });
                      
                      if (giemsaSelected.length > 0) {
                        servicioLabel = giemsaSelected.join(', ');
                      } else {
                        return;
                      }
                    }
                    // Agregar cantidad para cortes en blanco
                    else if (key === 'corteBlancoIHQ') {
                      const quantity = biopsyForm.servicios.corteBlancoIHQQuantity || 1;
                      servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
                    } else if (key === 'corteBlancoComun') {
                      const quantity = biopsyForm.servicios.corteBlancoComunQuantity || 1;
                      servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
                    }
                    
                    serviciosActivos.push(servicioLabel);
                  }
                }
              });
            }
            
            return serviciosActivos.length > 0 ? (
              <div className="bg-green-50 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Servicios Adicionales</h3>
                <div className="flex flex-wrap gap-2">
                  {serviciosActivos.map((servicio, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium"
                    >
                      {servicio}
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Observaciones */}
          <div className="bg-amber-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-amber-800 mb-3">Observaciones</h3>
            <div
              onClick={() => onOpenVirtualKeyboard('full', 'observations', biopsyForm.observations)}
              className="w-full min-h-[120px] p-4 bg-white border-2 border-amber-200 rounded-xl cursor-pointer active:border-amber-400 transition-colors"
            >
              {biopsyForm.observations ? (
                <p className="text-gray-800 whitespace-pre-wrap">{biopsyForm.observations}</p>
              ) : (
                <p className="text-gray-400 italic">Toque aquí para agregar observaciones...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step7_old2;
