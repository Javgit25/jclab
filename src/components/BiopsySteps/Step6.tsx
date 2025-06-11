import React from 'react';
import { ArrowLeft, ArrowRight, Check, TestTube, Plus, Minus } from 'lucide-react';
import { BiopsyServices, GiemsaServices } from '../../types';
import { serviciosAdicionales } from '../../constants/services';

interface Step6Props {
  servicios: BiopsyServices;
  tissueType: string;
  onServicioChange: (servicioKey: keyof BiopsyServices) => void;
  onGiemsaOptionChange: (giemsaKey: keyof GiemsaServices) => void;
  onCorteBlancoQuantityChange: (type: 'ihq' | 'comun', quantity: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step6: React.FC<Step6Props> = ({
  servicios,
  tissueType,
  onServicioChange,
  onGiemsaOptionChange,
  onCorteBlancoQuantityChange,
  onNext,
  onPrev
}) => {
  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      red: isSelected 
        ? 'bg-red-100 border-red-500 text-red-700' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-red-50',
      purple: isSelected 
        ? 'bg-purple-100 border-purple-500 text-purple-700' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-purple-50',
      green: isSelected 
        ? 'bg-green-100 border-green-500 text-green-700' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50',
      orange: isSelected 
        ? 'bg-orange-100 border-orange-500 text-orange-700' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-orange-50',
      gray: isSelected 
        ? 'bg-gray-100 border-gray-500 text-gray-700' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
      blue: isSelected 
        ? 'bg-blue-100 border-blue-500 text-blue-700' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50',
      indigo: isSelected 
        ? 'bg-indigo-100 border-indigo-500 text-indigo-700' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-indigo-50'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  // Contador para servicios seleccionados (excluyendo cantidades y sub-opciones)
  const serviciosSeleccionados = Object.entries(servicios).filter(([key, value]) => 
    key !== 'giemsaOptions' && 
    key !== 'corteBlancoIHQQuantity' && 
    key !== 'corteBlancoComunQuantity' && 
    value === true
  ).length;

  // Componente para contador de cantidad
  const QuantityCounter = ({ 
    value, 
    onChange, 
    min = 1, 
    max = 20,
    label,
    unit = "vidrio"
  }: { 
    value: number; 
    onChange: (value: number) => void; 
    min?: number; 
    max?: number;
    label: string;
    unit?: string;
  }) => (
    <div className="mt-3 pt-3 border-t border-current border-opacity-20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}:</span>
        <div className="flex items-center space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (value > min) onChange(value - 1);
            }}
            disabled={value <= min}
            className="w-8 h-8 rounded-full bg-white bg-opacity-50 hover:bg-opacity-75 flex items-center justify-center disabled:opacity-30 transition-all"
          >
            <Minus size={16} />
          </button>
          
          <div className="bg-white bg-opacity-50 px-3 py-1 rounded-lg min-w-[80px] text-center">
            <span className="font-bold text-sm">{value}</span>
            <span className="text-xs ml-1">{unit}{value !== 1 ? 's' : ''}</span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (value < max) onChange(value + 1);
            }}
            disabled={value >= max}
            className="w-8 h-8 rounded-full bg-white bg-opacity-50 hover:bg-opacity-75 flex items-center justify-center disabled:opacity-30 transition-all"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="text-xs opacity-75 mt-1 text-center">
        Se cobra por unidad • Min: {min}, Max: {max}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <TestTube className="text-blue-600" size={28} />
          <h3 className="text-xl font-semibold text-gray-800">¿Este paciente necesita?</h3>
        </div>
        <p className="text-gray-600 mb-4">Seleccione los servicios adicionales requeridos</p>
        {serviciosSeleccionados > 0 && (
          <div className="bg-blue-50 px-4 py-2 rounded-lg inline-block">
            <span className="text-sm font-medium text-blue-800">
              {serviciosSeleccionados} servicio{serviciosSeleccionados !== 1 ? 's' : ''} seleccionado{serviciosSeleccionados !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Servicios básicos (sin contadores) */}
        {serviciosAdicionales
          .filter(servicio => !['corteBlancoIHQ', 'corteBlancoComun'].includes(servicio.key))
          .map((servicio) => {
            const IconComponent = servicio.icon;
            const isSelected = servicios[servicio.key];
            
            return (
              <button
                key={servicio.key}
                onClick={() => onServicioChange(servicio.key)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  getColorClasses(servicio.color, isSelected)
                } ${isSelected ? 'transform scale-[1.02] shadow-md' : ''}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-white border-current' 
                      : 'border-gray-400'
                  }`}>
                    {isSelected && <Check size={16} className="text-current" />}
                  </div>
                  
                  <div className="flex items-center space-x-3 flex-1">
                    <IconComponent size={24} className="text-current" />
                    <div>
                      <div className="font-semibold text-sm">{servicio.label}</div>
                      <div className="text-xs opacity-75">{servicio.description}</div>
                    </div>
                  </div>
                  
                  {(servicio.key.includes('urgente') || servicio.key === 'cassetteUrgente') && (
                    <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                      24HS
                    </div>
                  )}
                </div>
              </button>
            );
          })}

        {/* CORTE EN BLANCO PARA IHQ - CON CONTADOR */}
        <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
          getColorClasses('indigo', servicios.corteBlancoIHQ)
        } ${servicios.corteBlancoIHQ ? 'transform scale-[1.02] shadow-md' : ''}`}>
          <button
            onClick={() => onServicioChange('corteBlancoIHQ')}
            className="w-full text-left"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                servicios.corteBlancoIHQ 
                  ? 'bg-white border-current' 
                  : 'border-gray-400'
              }`}>
                {servicios.corteBlancoIHQ && <Check size={16} className="text-current" />}
              </div>
              
              <div className="flex items-center space-x-3 flex-1">
                <TestTube size={24} className="text-current" />
                <div>
                  <div className="font-semibold text-sm">CORTE EN BLANCO PARA IHQ</div>
                  <div className="text-xs opacity-75">Vidrios en blanco para inmunohistoquímica</div>
                </div>
              </div>
              
              <div className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
                POR UNIDAD
              </div>
            </div>
          </button>

          {servicios.corteBlancoIHQ && (
            <QuantityCounter
              value={servicios.corteBlancoIHQQuantity || 1}
              onChange={(quantity) => onCorteBlancoQuantityChange('ihq', quantity)}
              min={1}
              max={20}
              label="Cantidad de vidrios en blanco para IHQ"
            />
          )}
        </div>

        {/* CORTE EN BLANCO COMÚN - CON CONTADOR */}
        <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
          getColorClasses('purple', servicios.corteBlancoComun)
        } ${servicios.corteBlancoComun ? 'transform scale-[1.02] shadow-md' : ''}`}>
          <button
            onClick={() => onServicioChange('corteBlancoComun')}
            className="w-full text-left"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                servicios.corteBlancoComun 
                  ? 'bg-white border-current' 
                  : 'border-gray-400'
              }`}>
                {servicios.corteBlancoComun && <Check size={16} className="text-current" />}
              </div>
              
              <div className="flex items-center space-x-3 flex-1">
                <TestTube size={24} className="text-current" />
                <div>
                  <div className="font-semibold text-sm">CORTE EN BLANCO COMÚN</div>
                  <div className="text-xs opacity-75">Vidrios en blanco estándar</div>
                </div>
              </div>
              
              <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                POR UNIDAD
              </div>
            </div>
          </button>

          {servicios.corteBlancoComun && (
            <QuantityCounter
              value={servicios.corteBlancoComunQuantity || 1}
              onChange={(quantity) => onCorteBlancoQuantityChange('comun', quantity)}
              min={1}
              max={20}
              label="Cantidad de vidrios en blanco comunes"
            />
          )}
        </div>

        {/* GIEMSA/PAS/MASSON - MEJORADO CON SUB-OPCIONES */}
        <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
          getColorClasses('blue', servicios.giemsaPASMasson)
        } ${servicios.giemsaPASMasson ? 'transform scale-[1.02] shadow-md' : ''}`}>
          <button
            onClick={() => onServicioChange('giemsaPASMasson')}
            className="w-full text-left"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                servicios.giemsaPASMasson 
                  ? 'bg-white border-current' 
                  : 'border-gray-400'
              }`}>
                {servicios.giemsaPASMasson && <Check size={16} className="text-current" />}
              </div>
              
              <div className="flex items-center space-x-3 flex-1">
                <TestTube size={24} className="text-current" />
                <div>
                  <div className="font-semibold text-sm">GIEMSA / PAS / MASSON</div>
                  <div className="text-xs opacity-75">Técnicas de tinción especiales</div>
                </div>
              </div>
              
              {servicios.giemsaPASMasson && (
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  {[
                    servicios.giemsaOptions?.giemsa && 'GIEMSA',
                    servicios.giemsaOptions?.pas && 'PAS', 
                    servicios.giemsaOptions?.masson && 'MASSON'
                  ].filter(Boolean).join(' + ') || 'SELECCIONAR'}
                </div>
              )}
            </div>
          </button>

          {servicios.giemsaPASMasson && (
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <p className="text-sm font-medium mb-3 text-center">Seleccione las técnicas específicas:</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { 
                    key: 'giemsa' as keyof GiemsaServices, 
                    label: 'GIEMSA',
                    description: 'Tinción para células sanguíneas'
                  },
                  { 
                    key: 'pas' as keyof GiemsaServices, 
                    label: 'PAS',
                    description: 'Ácido peryódico de Schiff'
                  },
                  { 
                    key: 'masson' as keyof GiemsaServices, 
                    label: 'MASSON',
                    description: 'Tricrómica de Masson'
                  }
                ].map((option) => (
                  <label 
                    key={option.key} 
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all
                      ${servicios.giemsaOptions?.[option.key] 
                        ? 'bg-white bg-opacity-50 ring-2 ring-white ring-opacity-50' 
                        : 'hover:bg-white hover:bg-opacity-30'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={servicios.giemsaOptions?.[option.key] || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        onGiemsaOptionChange(option.key);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs opacity-75">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              
              {/* Indicador de selección múltiple */}
              <div className="mt-3 text-center">
                <span className="text-xs opacity-75">
                  ✨ Puede seleccionar una o varias técnicas según necesidad
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <TestTube size={20} className="text-blue-600 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-medium text-blue-800 mb-1">Información de facturación:</div>
            <ul className="text-blue-700 space-y-1 text-xs">
              <li>• <strong>Servicios básicos:</strong> Cargo fijo por servicio</li>
              <li>• <strong>Cortes en blanco:</strong> Se facturan por unidad/vidrio</li>
              <li>• <strong>Tinciones especiales:</strong> Se cobra cada técnica seleccionada</li>
              <li>• <strong>Servicios urgentes:</strong> Procesamiento en 24 horas</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onPrev}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Anterior</span>
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <span>Continuar</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};