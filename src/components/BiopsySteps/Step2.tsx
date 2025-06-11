import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Search, Stethoscope, Microscope, Eye, Heart, Brain, Star, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { tissueTypes } from '../../constants/services';

interface Step2Props {
  tissueType: string;
  endoscopiaSubTypes: string[];
  frequentTissues: string[];
  onTissueTypeChange: (value: string) => void;
  onEndoscopiaSubTypesChange: (subTypes: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
  onUpdateFrequentTissues: (tissue: string) => void;
  onOpenVirtualKeyboard: (type: 'numeric' | 'full', field: string, currentValue: string) => void;
  onCloseVirtualKeyboard: () => void;
  autoCompleteOptions: string[];
  onSelectAutoComplete: (suggestion: string) => void;
  keyboardValue: string;
}

export const Step2: React.FC<Step2Props> = ({
  tissueType,
  endoscopiaSubTypes,
  frequentTissues,
  onTissueTypeChange,
  onEndoscopiaSubTypesChange,
  onNext,
  onPrev,
  onUpdateFrequentTissues,
  onOpenVirtualKeyboard,
  onCloseVirtualKeyboard,
  autoCompleteOptions,
  onSelectAutoComplete,
  keyboardValue
}) => {
  const [showEndoscopiaMenu, setShowEndoscopiaMenu] = useState(false);
  const [showAllTissues, setShowAllTissues] = useState(false);

  // Sub-opciones para Endoscopia organizadas por categorías
  const endoscopiaCategories = {
    'Digestivo': [
      { value: 'Esófago', icon: '🔴', color: 'red' },
      { value: 'Estómago', icon: '🟠', color: 'orange' },
      { value: 'Duodeno', icon: '🟡', color: 'yellow' },
      { value: 'Íleon', icon: '🟢', color: 'green' },
      { value: 'Colon', icon: '🔵', color: 'blue' },
      { value: 'Recto', icon: '🟣', color: 'purple' }
    ],
    'Respiratorio': [
      { value: 'Bronquio', icon: '🫁', color: 'cyan' },
      { value: 'Laringe', icon: '🗣️', color: 'teal' }
    ],
    'Ginecológico': [
      { value: 'Cuello uterino', icon: '🌸', color: 'pink' },
      { value: 'Vagina', icon: '🌺', color: 'rose' },
      { value: 'Vulva', icon: '🌷', color: 'fuchsia' }
    ]
  };

  // Tipos de tejido organizados por especialidad
  const organizedTissues = {
    'Más Frecuentes': frequentTissues.length > 0 ? frequentTissues : ['Gastrica', 'Endometrio', 'Endoscopia', 'Piel'],
    'Digestivo': ['Gastrica', 'Esofagica', 'Duodenal', 'Colonica', 'Hepatica'],
    'Ginecológico': ['PAP', 'Endometrio', 'Ovario', 'Cuello uterino', 'Mama'],
    'Dermatológico': ['Piel', 'Nevus', 'Melanoma', 'Queratosis'],
    'Otros': ['Tiroides', 'Próstata', 'Riñón', 'Vejiga', 'Hueso']
  };

  const handleEndoscopiaSubTypeToggle = (subType: string) => {
    const currentSubTypes = endoscopiaSubTypes || [];
    if (currentSubTypes.includes(subType)) {
      onEndoscopiaSubTypesChange(currentSubTypes.filter(type => type !== subType));
    } else {
      onEndoscopiaSubTypesChange([...currentSubTypes, subType]);
    }
  };

  const handleTissueSelect = (tissue: string) => {
    onTissueTypeChange(tissue);
    onUpdateFrequentTissues(tissue);
    
    // Mostrar submenu si es endoscopia
    if (tissue === 'Endoscopia') {
      setShowEndoscopiaMenu(true);
    } else {
      setShowEndoscopiaMenu(false);
      onEndoscopiaSubTypesChange([]);
    }
  };

  // Efecto para mostrar automáticamente el menú de endoscopia
  useEffect(() => {
    if (tissueType === 'Endoscopia') {
      setShowEndoscopiaMenu(true);
    }
  }, [tissueType]);

  const isPAPSelected = tissueType === 'PAP';
  const isEndoscopiaSelected = tissueType === 'Endoscopia';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header mejorado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-4">
            <Microscope className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">Tipo de Tejido</h3>
          <p className="text-lg text-gray-600">Seleccione o escriba el tipo de tejido para análisis</p>
        </div>

        {/* Campo de búsqueda con teclado digital */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            Buscar o escribir tipo de tejido
          </label>
          <div className="relative">
            <input
              type="text"
              value={keyboardValue || tissueType}
              readOnly
              className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-lg pr-16"
              placeholder="Ej: Gastrica, PAP, Endoscopia..."
              list="allTissueTypes"
            />
            <button
              onClick={() => onOpenVirtualKeyboard('full', 'tissueType', tissueType)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-all shadow-md"
              title="Abrir teclado virtual"
            >
              <Search className="h-6 w-6" />
            </button>
            <datalist id="allTissueTypes">
              {tissueTypes.map((tissue, index) => (
                <option key={index} value={tissue} />
              ))}
            </datalist>
          </div>
          
          {/* AutoComplete dinámico */}
          {autoCompleteOptions.length > 0 && (
            <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {autoCompleteOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelectAutoComplete(option);
                    handleTissueSelect(option);
                  }}
                  className="w-full p-3 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800">{option}</span>
                </button>
              ))}
            </div>
          )}
          
          <p className="text-sm text-gray-500 mt-2 text-center">
            💡 Toque el botón de búsqueda para usar el teclado virtual
          </p>
        </div>

        {/* Tejidos organizados por categorías */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-semibold text-gray-800">Selección Rápida por Categoría</h4>
            <button
              onClick={() => setShowAllTissues(!showAllTissues)}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              {showAllTissues ? 'Ocultar' : 'Ver todos'}
              {showAllTissues ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(organizedTissues).map(([category, tissues]) => (
              <div key={category} className={`${!showAllTissues && category !== 'Más Frecuentes' ? 'hidden' : ''}`}>
                <h5 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  {category === 'Más Frecuentes' && <Star className="h-5 w-5 text-yellow-500 mr-2" />}
                  {category === 'Digestivo' && <Heart className="h-5 w-5 text-red-500 mr-2" />}
                  {category === 'Ginecológico' && <Eye className="h-5 w-5 text-pink-500 mr-2" />}
                  {category === 'Dermatológico' && <Stethoscope className="h-5 w-5 text-purple-500 mr-2" />}
                  {category === 'Otros' && <Brain className="h-5 w-5 text-indigo-500 mr-2" />}
                  {category}
                </h5>
                <div className="space-y-2">
                  {tissues.map((tissue, index) => (
                    <button
                      key={index}
                      onClick={() => handleTissueSelect(tissue)}
                      className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all duration-200 ${
                        tissueType === tissue
                          ? 'bg-blue-500 border-blue-500 text-white shadow-lg transform scale-105'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{tissue}</span>
                        {tissueType === tissue && <Check className="h-5 w-5" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menú especial para PAP */}
        {isPAPSelected && (
          <div className="mb-8 animate-pulse">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-8 rounded-2xl shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <Eye className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold">PAP - Papanicolaou</h4>
                  <p className="text-pink-100 text-lg">Citología cervical para detección temprana</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 rounded-xl p-6">
                  <h5 className="font-semibold text-lg mb-2">📋 Características</h5>
                  <ul className="text-pink-100 space-y-1">
                    <li>• Muestra cervical</li>
                    <li>• Procesamiento especial</li>
                    <li>• Tinción Papanicolaou</li>
                  </ul>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <h5 className="font-semibold text-lg mb-2">⚡ Opciones</h5>
                  <ul className="text-pink-100 space-y-1">
                    <li>• Rutina (72 hs)</li>
                    <li>• Urgente (24 hs)</li>
                    <li>• Con HPV</li>
                  </ul>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <h5 className="font-semibold text-lg mb-2">📊 Resultados</h5>
                  <ul className="text-pink-100 space-y-1">
                    <li>• Sistema Bethesda</li>
                    <li>• Clasificación ASCUS</li>
                    <li>• Reporte detallado</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menú profesional para Endoscopia */}
        {isEndoscopiaSelected && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-8 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Microscope className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold">Endoscopia - Múltiples Sitios</h4>
                    <p className="text-blue-100 text-lg">Seleccione todos los sitios donde se tomaron muestras</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEndoscopiaMenu(!showEndoscopiaMenu)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {showEndoscopiaMenu ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                </button>
              </div>

              {showEndoscopiaMenu && (
                <div className="space-y-8">
                  {Object.entries(endoscopiaCategories).map(([category, options]) => (
                    <div key={category}>
                      <h5 className="text-xl font-semibold mb-4 flex items-center">
                        {category === 'Digestivo' && <Heart className="h-6 w-6 mr-2" />}
                        {category === 'Respiratorio' && <Heart className="h-6 w-6 mr-2" />}
                        {category === 'Ginecológico' && <Eye className="h-6 w-6 mr-2" />}
                        Sistema {category}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {options.map((option) => {
                          const isSelected = endoscopiaSubTypes?.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleEndoscopiaSubTypeToggle(option.value)}
                              className={`p-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                                isSelected
                                  ? 'bg-white text-blue-600 border-white shadow-lg transform scale-105'
                                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{option.icon}</span>
                                <div className="text-left">
                                  <div className="font-semibold text-lg">{option.value}</div>
                                  {isSelected && (
                                    <div className="flex items-center text-sm">
                                      <Check className="h-4 w-4 mr-1" />
                                      Seleccionado
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Resumen de selecciones */}
                  {endoscopiaSubTypes && endoscopiaSubTypes.length > 0 && (
                    <div className="mt-8 bg-white/10 rounded-xl p-6">
                      <h5 className="text-xl font-semibold mb-4">✅ Sitios Seleccionados ({endoscopiaSubTypes.length})</h5>
                      <div className="flex flex-wrap gap-3">
                        {endoscopiaSubTypes.map((subType, index) => (
                          <div
                            key={index}
                            className="bg-white text-blue-600 px-4 py-2 rounded-full font-medium flex items-center space-x-2"
                          >
                            <span>{subType}</span>
                            <button
                              onClick={() => handleEndoscopiaSubTypeToggle(subType)}
                              className="hover:bg-red-100 rounded-full p-1 transition-colors"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-4 bg-green-500/20 rounded-lg border border-green-300">
                        <p className="text-green-100 font-medium">
                          💡 Se crearán cassettes separados para cada sitio seleccionado
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Indicador de selección actual */}
        {tissueType && (
          <div className="mb-8">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h5 className="text-xl font-semibold text-green-800">Tejido Seleccionado</h5>
                  <p className="text-lg text-green-700">
                    {tissueType}
                    {isEndoscopiaSelected && endoscopiaSubTypes && endoscopiaSubTypes.length > 0 && (
                      <span className="ml-2 text-green-600">
                        ({endoscopiaSubTypes.length} sitio{endoscopiaSubTypes.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </p>
                  {isEndoscopiaSelected && endoscopiaSubTypes && endoscopiaSubTypes.length > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Sitios: {endoscopiaSubTypes.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de navegación mejorados */}
        <div className="flex space-x-4">
          <button
            onClick={onPrev}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-5 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg"
          >
            <ArrowLeft size={24} />
            <span className="text-lg">Anterior</span>
          </button>
          <button
            onClick={onNext}
            disabled={!tissueType.trim() || (tissueType === 'Endoscopia' && (!endoscopiaSubTypes || endoscopiaSubTypes.length === 0))}
            className="flex-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-5 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg disabled:cursor-not-allowed"
          >
            <span className="text-lg">Continuar</span>
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};