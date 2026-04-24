import React from 'react';
import { VirtualKeyboard as VirtualKeyboardType } from '../types';

interface VirtualKeyboardProps {
  keyboard: VirtualKeyboardType;
  onKeyPress: (key: string) => void;
  onConfirm: () => void;
  onSwitchType: (type: 'numeric' | 'full') => void;
  autoCompleteOptions?: string[];
  onSelectAutoComplete?: (option: string) => void;
  isShiftPressed?: boolean;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  keyboard,
  onKeyPress,
  onConfirm,
  onSwitchType,
  autoCompleteOptions = [],
  onSelectAutoComplete,
  isShiftPressed = false
}) => {
  // 🔧 FUNCIÓN MEJORADA: Selecciona sugerencia Y cierra teclado automáticamente
  const handleSelectAutoComplete = (option: string) => {
    console.log('🎹 VirtualKeyboard - Seleccionando sugerencia:', option);
    
    // Primero ejecutar la selección
    if (onSelectAutoComplete) {
      onSelectAutoComplete(option);
    }
    
    // Luego cerrar el teclado automáticamente
    setTimeout(() => {
      console.log('🎹 VirtualKeyboard - Cerrando teclado automáticamente');
      onConfirm();
    }, 150); // Pequeño delay para asegurar que se procese la selección
  };

  // Función inteligente para manejar letras con capitalización automática
  const handleLetterPress = (letter: string) => {
    // Para emails, siempre minúsculas
    if (keyboard.targetField === 'email') {
      onKeyPress(letter.toLowerCase());
      return;
    }

    // Para otros campos, capitalizar primera letra de cada palabra
    const currentValue = keyboard.targetValue;
    const isFirstChar = currentValue.length === 0;
    const isAfterSpace = currentValue.endsWith(' ');
    const isAfterPunctuation = /[.!?,:;-]\s*$/.test(currentValue);
    
    // Capitalizar si es primera letra, después de espacio o después de puntuación
    if (isFirstChar || isAfterSpace || isAfterPunctuation) {
      onKeyPress(letter.toUpperCase());
    } else {
      onKeyPress(letter.toLowerCase());
    }
  };

  if (keyboard.type === 'numeric') {
    // Campos de cantidad pura — no corresponden símbolos '.' ni '-'
    const countOnlyFields = ['papQuantity', 'citologiaQuantity', 'cassettes', 'pieces', 'ihqVidriosQty'];
    const isCountOnly = countOnlyFields.includes(keyboard.targetField);
    const numericKeys = isCountOnly
      ? [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['', '0', '']
        ]
      : [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['0', '.', '-']
        ];

    return (
      <div className="bg-white border-t border-gray-200 p-2">
        <div className="max-w-sm mx-auto">
          <div className="mb-2">
            <input
              type="text"
              value={keyboard.targetValue}
              readOnly
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg bg-gray-50 text-center font-mono"
              placeholder="Ingrese número..."
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {numericKeys.flat().map((key, i) => key === '' ? (
              <div key={`empty-${i}`} />
            ) : (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2.5 px-3 rounded-lg text-base transition-colors"
              >
                {key}
              </button>
            ))}
          </div>

          <div className={`grid ${isCountOnly ? 'grid-cols-3' : 'grid-cols-4'} gap-1.5`}>
            <button
              onClick={() => onKeyPress('backspace')}
              className="bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-2 rounded-lg transition-colors text-sm"
            >
              ← Borrar
            </button>
            <button
              onClick={() => onKeyPress('clear')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-2 rounded-lg transition-colors text-sm"
            >
              Limpiar
            </button>
            {!isCountOnly && (
              <button
                onClick={() => onSwitchType('full')}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-2 px-2 rounded-lg transition-colors text-sm"
              >
                ABC
              </button>
            )}
            <button
              onClick={onConfirm}
              className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-2 px-2 rounded-lg transition-colors text-sm"
            >
              ✓ OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Teclado completo - letras en minúsculas por defecto
  const letterRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const numberRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  
  // ✅ NUEVO: Fila de símbolos especiales para emails y otros usos
  const symbolRow = ['@', '.', '_', '-', '+', '=', '!', '?', ':', ';'];

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-3">
          <input
            type="text"
            value={keyboard.targetValue}
            readOnly
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg bg-gray-50 font-mono"
            placeholder="Escriba aquí..."
          />
        </div>

        {/* 🔧 PANEL DE SUGERENCIAS MEJORADO CON CIERRE AUTOMÁTICO */}
        {(keyboard.targetField === 'tissueType' || keyboard.targetField === 'ihqTejido') && autoCompleteOptions.length > 0 && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-800">
                💡 {autoCompleteOptions.length} sugerencia{autoCompleteOptions.length !== 1 ? 's' : ''} encontrada{autoCompleteOptions.length !== 1 ? 's' : ''}
              </p>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Toque para seleccionar
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {autoCompleteOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAutoComplete(option)}
                  className="text-left p-3 bg-white hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{option}</span>
                    <span className="text-xs text-blue-500">→</span>
                  </div>
                  {(option === 'PAP' || option === 'Citología') && (
                    <div className="text-xs text-blue-600 mt-1">
                      Requiere cantidad específica
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-blue-600 text-center">
              ✨ Se cerrará automáticamente al seleccionar
            </div>
          </div>
        )}

        <div className="grid grid-cols-10 gap-1 mb-2">
          {numberRow.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-2 rounded text-sm transition-colors"
            >
              {key}
            </button>
          ))}
        </div>

        {/* ✅ NUEVA: Fila de símbolos especiales */}
        <div className="grid grid-cols-10 gap-1 mb-2">
          {symbolRow.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold py-2 px-2 rounded text-sm transition-colors"
            >
              {key}
            </button>
          ))}
        </div>

        {letterRows.map((row, rowIndex) => (
          <div key={rowIndex} className={`grid gap-1 mb-2 ${
            rowIndex === 0 ? 'grid-cols-10' : 
            rowIndex === 1 ? 'grid-cols-9' : 'grid-cols-7'
          }`}>
            {row.map((key) => (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-3 px-2 rounded transition-colors"
              >
                {isShiftPressed ? key.toUpperCase() : key.toLowerCase()}
              </button>
            ))}
          </div>
        ))}

        <div className="grid grid-cols-5 gap-2 mt-3">
          <button
            onClick={() => onKeyPress('space')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-2 rounded-lg transition-colors text-sm"
          >
            Espacio
          </button>
          <button
            onClick={() => onKeyPress('backspace')}
            className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-3 px-2 rounded-lg transition-colors text-sm"
          >
            ← Borrar
          </button>
          <button
            onClick={() => onSwitchType('numeric')}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-3 px-2 rounded-lg transition-colors text-sm"
          >
            123
          </button>
          <button
            onClick={onConfirm}
            className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-3 px-2 rounded-lg transition-colors text-sm"
          >
            ✓ OK
          </button>
        </div>
      </div>
    </div>
  );
};
export default VirtualKeyboard;
