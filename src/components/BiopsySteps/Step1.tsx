import React, { useEffect, useState } from 'react';

interface Step1Props {
  biopsyNumber: string;
  todayBiopsiesCount: number;
  todayBiopsies: any[]; // Para obtener el último número
  onBiopsyNumberChange: (value: string) => void;
  onNext: () => void;
  onFinishDailyReport: () => void;
  onOpenVirtualKeyboard: (type: 'numeric' | 'full', field: string, currentValue?: string) => void;
}

export const Step1: React.FC<Step1Props> = ({
  biopsyNumber,
  todayBiopsiesCount,
  todayBiopsies,
  onBiopsyNumberChange,
  onNext,
  onFinishDailyReport,
  onOpenVirtualKeyboard
}) => {
  const [smartSuggestion, setSmartSuggestion] = useState<string>('');

  // Generar sugerencia inteligente basada en la última biopsia
  useEffect(() => {
    if (todayBiopsies.length > 0) {
      const lastBiopsy = todayBiopsies[todayBiopsies.length - 1];
      const lastNumber = lastBiopsy.number;
      
      // Intentar extraer un número del final y incrementarlo
      const numberMatch = lastNumber.match(/(\d+)$/);
      if (numberMatch) {
        const baseNumber = parseInt(numberMatch[1]);
        const prefix = lastNumber.replace(/\d+$/, '');
        const nextNumber = baseNumber + 1;
        const suggestion = `${prefix}${nextNumber}`;
        setSmartSuggestion(suggestion);
      } else {
        // Si no hay número al final, agregar "1"
        setSmartSuggestion(`${lastNumber}1`);
      }
    } else {
      setSmartSuggestion('');
    }
  }, [todayBiopsies]);

  const handleKeyboardOpen = () => {
    onOpenVirtualKeyboard('numeric', 'biopsyNumber', biopsyNumber);
  };

  const canProceed = biopsyNumber.trim() !== '';

  const generateSuggestions = () => {
    const suggestions = [];
    
    // Primera sugerencia: auto-incremento inteligente (PRIORITARIO)
    if (smartSuggestion) {
      suggestions.push(smartSuggestion);
    }
    
    // Solo agregar otras sugerencias si no hay predicción inteligente
    if (!smartSuggestion) {
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      
      suggestions.push(
        `${todayBiopsiesCount + 1}`,
        `${dayOfYear}-${todayBiopsiesCount + 1}`,
        `B${today.getFullYear().toString().slice(-2)}${(todayBiopsiesCount + 1).toString().padStart(3, '0')}`,
        `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}-${todayBiopsiesCount + 1}`
      );
    }
    
    return suggestions.slice(0, 4);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Número de Biopsia
        </h3>
        <p className="text-gray-600">
          Ingresa el número de identificación de la biopsia
        </p>
      </div>

      {/* Información del día */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="text-center">
          <p className="text-blue-800 font-medium">
            📊 Biopsias del día: {todayBiopsiesCount}
          </p>
          <p className="text-blue-600 text-sm mt-1">
            Esta será la biopsia #{todayBiopsiesCount + 1}
          </p>
          {smartSuggestion && (
            <p className="text-blue-700 text-sm mt-2 font-medium">
              💡 Sugerencia: {smartSuggestion}
            </p>
          )}
        </div>
      </div>

      {/* Campo de número de biopsia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Número de Biopsia
        </label>
        <button
          onClick={handleKeyboardOpen}
          className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left min-h-[60px] flex items-center"
        >
          {biopsyNumber || (
            <span className="text-gray-400">Toca para ingresar número...</span>
          )}
        </button>
      </div>

      {/* Sugerencias de numeración */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">
          💡 Sugerencias de numeración:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {generateSuggestions().map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onBiopsyNumberChange(suggestion)}
              className={`p-3 rounded-lg border text-center transition-all min-h-[50px] ${
                biopsyNumber === suggestion
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : index === 0 && smartSuggestion === suggestion
                  ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm font-medium">
                {suggestion}
                {index === 0 && smartSuggestion === suggestion && (
                  <div className="text-xs text-green-600 mt-1">Siguiente</div>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mostrar número ingresado */}
      {biopsyNumber && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-800 font-medium">
              ✅ Número ingresado: {biopsyNumber}
            </span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="space-y-3 pt-4">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`w-full font-medium py-4 px-4 rounded-lg transition-colors text-lg ${
            canProceed
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continuar →
        </button>
      </div>

      {/* Instrucciones */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">📝 Instrucciones:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Usa un número único para cada biopsia</li>
          <li>• Puedes usar números, letras o combinaciones</li>
          <li>• Las sugerencias te ayudan con formatos comunes</li>
          <li>• El número se usará para identificar cassettes</li>
        </ul>
      </div>
    </div>
  );
};