import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Step5Props {
  declassify: string;
  onDeclassifyChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step5: React.FC<Step5Props> = ({
  declassify,
  onDeclassifyChange,
  onNext,
  onPrev
}) => {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">¿Desclasificar?</h3>
        <p className="text-gray-600">Indique si requiere desclasificación</p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={() => onDeclassifyChange('Sí')}
          className={`w-full p-6 rounded-lg border-2 text-center transition-colors ${
            declassify === 'Sí'
              ? 'bg-green-100 border-green-500 text-green-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="text-lg font-semibold">Sí</div>
          <div className="text-sm text-gray-600">Requiere desclasificación</div>
        </button>

        <button
          onClick={() => onDeclassifyChange('No')}
          className={`w-full p-6 rounded-lg border-2 text-center transition-colors ${
            declassify === 'No'
              ? 'bg-red-100 border-red-500 text-red-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="text-lg font-semibold">No</div>
          <div className="text-sm text-gray-600">No requiere desclasificación</div>
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
          disabled={!declassify}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <span>Continuar</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};