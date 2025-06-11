import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CassetteNumber } from '../../types';

interface Step4Props {
  cassettes: string;
  pieces: string;
  cassettesNumbers: CassetteNumber[];
  tissueType: string;
  onCassettesChange: (value: string) => void;
  onPiecesChange: (value: string) => void;
  onUpdateCassetteSuffix: (index: number, newSuffix: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenVirtualKeyboard: (type: 'numeric' | 'full', field: string, currentValue?: string) => void;
}

export const Step4: React.FC<Step4Props> = ({
  cassettes,
  pieces,
  cassettesNumbers,
  tissueType,
  onCassettesChange,
  onPiecesChange,
  onUpdateCassetteSuffix,
  onNext,
  onPrev,
  onOpenVirtualKeyboard
}) => {
  // Determinar si es PAP o Citología para manejo especial
  const isPapOrCitologia = tissueType === 'PAP' || tissueType === 'Citología';
  const materialType = isPapOrCitologia ? 'Vidrios' : 'Cassettes';

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Cantidad de Material</h3>
        <p className="text-gray-600">Ingrese las cantidades correspondientes</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad de {materialType}
          </label>
          <input
            type="number"
            value={cassettes}
            onChange={(e) => onCassettesChange(e.target.value)}
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            placeholder="0"
            min="1"
            max="999"
          />
        </div>

        {/* Solo mostrar trozos si NO es PAP/Citología */}
        {!isPapOrCitologia && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad de Trozos
            </label>
            <input
              type="number"
              value={pieces}
              onChange={(e) => onPiecesChange(e.target.value)}
              className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              placeholder="0"
              min="1"
              max="999"
            />
          </div>
        )}

        {/* Solo mostrar numeración si NO es PAP/Citología */}
        {!isPapOrCitologia && parseInt(cassettes) > 1 && cassettesNumbers.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-blue-800 mb-3">
              Numeración de Cassettes:
            </label>
            <div className="space-y-3">
              {cassettesNumbers.map((cassette, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-sm text-blue-700 w-20">
                    Cassette {index + 1}:
                  </span>
                  {index === 0 ? (
                    <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded border text-sm font-mono">
                      {cassette.base} (original)
                    </span>
                  ) : (
                    <div className="flex items-center space-x-1 flex-1">
                      <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded border text-sm font-mono">
                        {cassette.base}/
                      </span>
                      <input
                        type="text"
                        value={cassette.suffix}
                        onChange={(e) => onUpdateCassetteSuffix(index, e.target.value)}
                        className="px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono w-20"
                        placeholder={index.toString()}
                        maxLength={10}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información específica para PAP/Citología */}
        {isPapOrCitologia && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800 mb-2">ℹ️ Información para {tissueType}:</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Cada vidrio se procesa individualmente</li>
              <li>• No requiere numeración especial de cassettes</li>
              <li>• Se puede solicitar procesamiento urgente en el siguiente paso</li>
            </ul>
          </div>
        )}
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
          disabled={!cassettes || parseInt(cassettes) < 1 || (!isPapOrCitologia && (!pieces || parseInt(pieces) < 1))}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <span>Continuar</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};