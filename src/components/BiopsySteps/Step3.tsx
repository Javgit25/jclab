import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Step3Props {
  type: string;
  onTypeChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3: React.FC<Step3Props> = ({
  type,
  onTypeChange,
  onNext,
  onPrev
}) => {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Tipo de Procedimiento</h3>
        <p className="text-gray-600">Seleccione el tipo de procedimiento</p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={() => onTypeChange('BX')}
          className={`w-full p-6 rounded-lg border-2 text-left transition-colors ${
            type === 'BX'
              ? 'bg-blue-100 border-blue-500 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="text-lg font-semibold">BX - Biopsia</div>
          <div className="text-sm text-gray-600">Muestra de tejido para análisis</div>
        </button>

        <button
          onClick={() => onTypeChange('PQ')}
          className={`w-full p-6 rounded-lg border-2 text-left transition-colors ${
            type === 'PQ'
              ? 'bg-blue-100 border-blue-500 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="text-lg font-semibold">PQ - Pieza Quirúrgica</div>
          <div className="text-sm text-gray-600">Muestra quirúrgica completa</div>
        </button>
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
          disabled={!type}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <span>Continuar</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};