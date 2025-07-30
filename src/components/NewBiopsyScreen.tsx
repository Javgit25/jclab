import React, { useState, useCallback } from 'react';
import { BiopsyForm, DoctorInfo, VirtualKeyboard as VirtualKeyboardType, BiopsyServices, CassetteNumber, GiemsaServices } from '../types';
import { VirtualKeyboard } from './VirtualKeyboard';
import { ConnectionStatus } from './ConnectionStatus';
import { Step1 } from './BiopsySteps/Step1';
import { Step2 } from './BiopsySteps/Step2';
import { Step3 } from './BiopsySteps/Step3';
import { Step4 } from './BiopsySteps/Step4';
import { Step5 } from './BiopsySteps/Step5';
import { Step6 } from './BiopsySteps/Step6';
import { Step7 } from './BiopsySteps/Step7';
import { tissueTypes } from '../constants/services';

interface NewBiopsyScreenProps {
  doctorInfo: DoctorInfo;
  todayBiopsies: BiopsyForm[];
  frequentTissues: string[];
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
  onSaveBiopsy: (biopsy: BiopsyForm) => void;
  onFinishDailyReport: () => void;
  onFinishDailyReportFromStep7?: (currentBiopsy: BiopsyForm) => void;
  onUpdateFrequentTissues: (tissue: string) => void;
}

export const NewBiopsyScreen: React.FC<NewBiopsyScreenProps> = ({
  doctorInfo,
  todayBiopsies,
  frequentTissues,
  isOnline,
  backupStatus,
  syncQueueLength,
  onSaveBiopsy,
  onFinishDailyReport,
  onFinishDailyReportFromStep7,
  onUpdateFrequentTissues
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // ✅ ESTADO COMPLETAMENTE ACTUALIZADO CON TODOS LOS CAMPOS OBLIGATORIOS
  const [biopsyForm, setBiopsyForm] = useState<BiopsyForm>({
    number: '',
    tissueType: '',
    endoscopiaSubTypes: [],
    type: '',
    cassettes: '',
    pieces: '',
    cassettesNumbers: [],
    declassify: '',
    servicios: {
      cassetteUrgente: false,
      pap: false,
      papUrgente: false,
      citologia: false,
      citologiaUrgente: false,
      corteBlancoIHQ: false,
      corteBlancoIHQQuantity: 1,
      corteBlancoComun: false,
      corteBlancoComunQuantity: 1,
      giemsaPASMasson: false,
      giemsaOptions: {
        giemsa: false,
        pas: false,
        masson: false
      },
      // ✅ NUEVO CAMPO TEMPORAL PARA GUARDAR EL TOTAL
      giemsaPASMassonTotal: 0
    },
    observations: '',
    // ✅ CAMPOS OBLIGATORIOS AGREGADOS:
    papQuantity: 0,        // Cantidad de PAP
    papUrgente: false,     // Si PAP es urgente
    citologiaQuantity: 0,  // Cantidad de vidrios de citología
    citologiaUrgente: false // Si citología es urgente
  });

  const [virtualKeyboard, setVirtualKeyboard] = useState<VirtualKeyboardType>({
    isOpen: false,
    type: 'numeric',
    targetField: '',
    targetValue: ''
  });

  const [autoCompleteOptions, setAutoCompleteOptions] = useState<string[]>([]);

  // ✅ FUNCIÓN ACTUALIZADA CON LÓGICA MEJORADA PARA PAP/CITOLOGÍA
  const handleBiopsyChange = useCallback((field: keyof BiopsyForm, value: string | string[]) => {
    setBiopsyForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // ✅ LÓGICA MEJORADA: Resetear cantidades cuando cambia el tipo de tejido
      if (field === 'tissueType') {
        if (value !== 'PAP') {
          updated.papQuantity = 0;
          updated.papUrgente = false;
        }
        if (value !== 'Citología') {
          updated.citologiaQuantity = 0;
          updated.citologiaUrgente = false;
        }
      }
      
      // Lógica existente para cassettes...
      if (field === 'cassettes') {
        const count = parseInt(value as string) || 0;
        if (count > 0 && prev.number) {
          const numbers: CassetteNumber[] = [];
          for (let i = 0; i < count; i++) {
            if (i === 0) {
              // El primer cassette es el número original sin sufijo
              numbers.push({ base: prev.number, suffix: '' });
            } else {
              // Los cassettes adicionales tienen sufijo correlativo empezando desde 1
              numbers.push({ base: prev.number, suffix: i.toString() });
            }
          }
          updated.cassettesNumbers = numbers;
        } else {
          updated.cassettesNumbers = [];
        }
      }
      
      if (field === 'number' && prev.cassettes) {
        const count = parseInt(prev.cassettes) || 0;
        if (count > 0 && value) {
          const numbers: CassetteNumber[] = [];
          for (let i = 0; i < count; i++) {
            if (i === 0) {
              // El primer cassette es el número original sin sufijo
              numbers.push({ base: value as string, suffix: '' });
            } else {
              // Los cassettes adicionales tienen sufijo correlativo empezando desde 1
              numbers.push({ base: value as string, suffix: i.toString() });
            }
          }
          updated.cassettesNumbers = numbers;
        }
      }
      
      return updated;
    });
  }, []);

  // ✅ FUNCIÓN PARA MANEJAR CANTIDAD DE PAP
  const handlePapQuantityChange = useCallback((quantity: number) => {
    setBiopsyForm(prev => ({
      ...prev,
      papQuantity: quantity
    }));
  }, []);

  // ✅ NUEVA FUNCIÓN: Manejar urgencia de PAP
  const handlePapUrgenteChange = useCallback((urgente: boolean) => {
    setBiopsyForm(prev => ({
      ...prev,
      papUrgente: urgente
    }));
  }, []);

  // ✅ FUNCIÓN PARA MANEJAR CANTIDAD DE CITOLOGÍA
  const handleCitologiaQuantityChange = useCallback((quantity: number) => {
    setBiopsyForm(prev => ({
      ...prev,
      citologiaQuantity: quantity
    }));
  }, []);

  // ✅ NUEVA FUNCIÓN: Manejar urgencia de Citología
  const handleCitologiaUrgenteChange = useCallback((urgente: boolean) => {
    setBiopsyForm(prev => ({
      ...prev,
      citologiaUrgente: urgente
    }));
  }, []);

  const updateCassetteSuffix = useCallback((index: number, newSuffix: string) => {
    setBiopsyForm(prev => {
      const updatedNumbers = [...prev.cassettesNumbers];
      updatedNumbers[index] = { 
        ...updatedNumbers[index], 
        suffix: newSuffix 
      };
      return { ...prev, cassettesNumbers: updatedNumbers };
    });
  }, []);

  // ✅ FUNCIÓN MEJORADA PARA MANEJAR SERVICIOS (filtrar PAP/Citología si ya están configurados)
  const handleServicioChange = useCallback((servicioKey: keyof BiopsyServices) => {
    setBiopsyForm(prev => {
      // ✅ PREVENIR CAMBIOS EN PAP/CITOLOGÍA SI YA ESTÁN CONFIGURADOS EN STEP 2
      if (prev.tissueType === 'PAP' && (servicioKey === 'pap' || servicioKey === 'papUrgente')) {
        return prev; // No hacer nada, ya está configurado en Step 2
      }
      if (prev.tissueType === 'Citología' && (servicioKey === 'citologia' || servicioKey === 'citologiaUrgente')) {
        return prev; // No hacer nada, ya está configurado en Step 2
      }
      
      const updated = {
        ...prev,
        servicios: {
          ...prev.servicios,
          [servicioKey]: !prev.servicios[servicioKey]
        }
      };
      
      // Si se desactiva giemsaPASMasson, limpiar las sub-opciones
      if (servicioKey === 'giemsaPASMasson' && !updated.servicios.giemsaPASMasson) {
        updated.servicios.giemsaOptions = {
          giemsa: false,
          pas: false,
          masson: false
        };
        // ✅ RESETEAR TAMBIÉN EL TOTAL
        updated.servicios.giemsaPASMassonTotal = 0;
      }
      
      return updated;
    });
  }, []);

  // ✅ FUNCIÓN CORREGIDA: Eliminar dependencias para evitar stale closure
  const handleGiemsaOptionChange = useCallback((giemsaKey: keyof GiemsaServices) => {
    setBiopsyForm(prev => {
      const currentOptions = prev.servicios.giemsaOptions || {};
      const newOptions = {
        ...currentOptions,
        [giemsaKey]: !currentOptions[giemsaKey]
      };
      
      // ✅ CALCULAR EL TOTAL AQUÍ
      const totalTecnicas = Object.values(newOptions).filter(Boolean).length;
      
      console.log('🔬 Cambio en técnica GIEMSA:', {
        tecnica: giemsaKey,
        estado: !currentOptions[giemsaKey],
        nuevasOpciones: newOptions,
        totalTecnicas
      });
      
      return {
        ...prev,
        servicios: {
          ...prev.servicios,
          giemsaOptions: newOptions,
          // ✅ ACTIVAR GIEMSA SI HAY TÉCNICAS SELECCIONADAS
          giemsaPASMasson: totalTecnicas > 0,
          // ✅ GUARDAR EL TOTAL INMEDIATAMENTE
          giemsaPASMassonTotal: totalTecnicas
        }
      };
    });
  }, []); // ✅ ARRAY VACÍO - Solo usa setBiopsyForm que es estable

  // ✅ FUNCIÓN CORREGIDA: También esta
  const handleGiemsaTotalChange = useCallback((total: number) => {
    console.log('🧪 Total de técnicas GIEMSA actualizado desde Step6:', total);
    
    setBiopsyForm(prev => ({
      ...prev,
      servicios: {
        ...prev.servicios,
        giemsaPASMasson: total > 0,
        giemsaPASMassonTotal: total
      }
    }));
  }, []); // ✅ ARRAY VACÍO

  const handleCorteBlancoQuantityChange = useCallback((type: 'ihq' | 'comun', quantity: number) => {
    setBiopsyForm(prev => ({
      ...prev,
      servicios: {
        ...prev.servicios,
        [`corteBlanco${type === 'ihq' ? 'IHQ' : 'Comun'}Quantity`]: quantity
      }
    }));
  }, []);

  const updateAutoComplete = useCallback((value: string) => {
    if (!value || value.length < 2) {
      setAutoCompleteOptions([]);
      return;
    }

    const allTissues = [
      ...tissueTypes,
      ...frequentTissues
    ];

    const uniqueTissues = [...new Set(allTissues)];
    const filtered = uniqueTissues
      .filter(tissue => 
        tissue.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 8)
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(value.toLowerCase());
        const bStarts = b.toLowerCase().startsWith(value.toLowerCase());
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      });

    setAutoCompleteOptions(filtered);
  }, [frequentTissues]);

  const openVirtualKeyboard = useCallback((type: 'numeric' | 'full', field: string, currentValue = '') => {
    setVirtualKeyboard({
      isOpen: true,
      type: type,
      targetField: field,
      targetValue: currentValue
    });
  }, []);

  const closeVirtualKeyboard = useCallback(() => {
    setVirtualKeyboard({
      isOpen: false,
      type: 'numeric',
      targetField: '',
      targetValue: ''
    });
  }, []);

  const handleVirtualKeyPress = useCallback((key: string) => {
    const currentValue = virtualKeyboard.targetValue;
    let newValue = currentValue;

    if (key === 'backspace') {
      newValue = currentValue.slice(0, -1);
    } else if (key === 'space') {
      newValue = currentValue + ' ';
    } else if (key === 'clear') {
      newValue = '';
    } else {
      newValue = currentValue + key;
    }

    setVirtualKeyboard(prev => ({
      ...prev,
      targetValue: newValue
    }));

    // Manejar diferentes campos
    if (virtualKeyboard.targetField === 'biopsyNumber') {
      handleBiopsyChange('number', newValue);
    } else if (virtualKeyboard.targetField === 'tissueType') {
      handleBiopsyChange('tissueType', newValue);
      updateAutoComplete(newValue);
    } else if (virtualKeyboard.targetField === 'observations') {
      handleBiopsyChange('observations', newValue);
    } else if (virtualKeyboard.targetField === 'cassettes') {
      handleBiopsyChange('cassettes', newValue);
    } else if (virtualKeyboard.targetField === 'pieces') {
      handleBiopsyChange('pieces', newValue);
    } else if (virtualKeyboard.targetField.startsWith('cassetteSuffix_')) {
      const index = parseInt(virtualKeyboard.targetField.split('_')[1]);
      updateCassetteSuffix(index, newValue);
    }
  }, [virtualKeyboard.targetValue, virtualKeyboard.targetField, handleBiopsyChange, updateAutoComplete, updateCassetteSuffix]);

  const selectAutoComplete = useCallback((suggestion: string) => {
    if (virtualKeyboard.targetField === 'tissueType') {
      handleBiopsyChange('tissueType', suggestion);
      setVirtualKeyboard(prev => ({ ...prev, targetValue: suggestion }));
      onUpdateFrequentTissues(suggestion);
      setAutoCompleteOptions([]);
    }
  }, [virtualKeyboard.targetField, handleBiopsyChange, onUpdateFrequentTissues]);

  // ✅ FUNCIÓN CORREGIDA PARA GENERAR BIOPSIA FINAL CON CÁLCULO CORRECTO DE GIEMSA
  const generateFinalBiopsy = useCallback((): BiopsyForm => {
    // ✅ LÓGICA AUTOMÁTICA PARA PAP Y CITOLOGÍA
    const updatedServicios = { ...biopsyForm.servicios };
    
    // Si es PAP, configurar automáticamente los servicios
    if (biopsyForm.tissueType === 'PAP') {
      updatedServicios.pap = biopsyForm.papQuantity > 0;
      updatedServicios.papUrgente = biopsyForm.papUrgente && biopsyForm.papQuantity > 0;
    }
    
    // Si es Citología, configurar automáticamente los servicios
    if (biopsyForm.tissueType === 'Citología') {
      updatedServicios.citologia = biopsyForm.citologiaQuantity > 0;
      updatedServicios.citologiaUrgente = biopsyForm.citologiaUrgente && biopsyForm.citologiaQuantity > 0;
    }

    // ✅ CORRECCIÓN PRINCIPAL: Calcular correctamente las técnicas GIEMSA
    if (updatedServicios.giemsaOptions) {
      // ✅ USAR EL TOTAL YA CALCULADO O CALCULAR DE NUEVO
      const giemsaCount = (updatedServicios as any).giemsaPASMassonTotal || 
                          Object.values(updatedServicios.giemsaOptions).filter(Boolean).length;
      
      console.log('🧪 Calculando técnicas GIEMSA en generateFinalBiopsy:', {
        giemsaOptions: updatedServicios.giemsaOptions,
        totalGuardado: (updatedServicios as any).giemsaPASMassonTotal,
        totalCalculado: Object.values(updatedServicios.giemsaOptions).filter(Boolean).length,
        giemsaCountFinal: giemsaCount
      });
      
      // ✅ GUARDAR COMO NÚMERO (ESTA ES LA LÍNEA CLAVE)
      updatedServicios.giemsaPASMasson = giemsaCount as any;
    } else {
      updatedServicios.giemsaPASMasson = 0 as any;
    }

    const finalCassettes = biopsyForm.cassettesNumbers.map((cassette, index) => {
      if (index === 0) {
        return cassette.base;
      } else {
        return `${cassette.base}/${cassette.suffix || index}`;
      }
    });
    
    const finalBiopsy = {
      ...biopsyForm,
      servicios: updatedServicios,
      cassettesNumbers: finalCassettes as any,
      timestamp: new Date().toISOString(),
      date: new Date().toDateString()
    };

    console.log('💾 Biopsia final generada:', {
      numero: finalBiopsy.number,
      giemsaPASMasson: finalBiopsy.servicios.giemsaPASMasson,
      giemsaOptions: finalBiopsy.servicios.giemsaOptions,
      esNumero: typeof finalBiopsy.servicios.giemsaPASMasson === 'number',
      valorFinal: finalBiopsy.servicios.giemsaPASMasson
    });

    return finalBiopsy;
  }, [biopsyForm]);

  const finishDailyReportWithCurrentBiopsy = useCallback(() => {
    const currentBiopsy = generateFinalBiopsy();
    onUpdateFrequentTissues(biopsyForm.tissueType);
    
    if (onFinishDailyReportFromStep7) {
      console.log('NewBiopsyScreen - Usando función especial para finalizar con biopsia actual');
      onFinishDailyReportFromStep7(currentBiopsy);
    } else {
      console.log('NewBiopsyScreen - Función especial no disponible, guardando manualmente y finalizando');
      onSaveBiopsy(currentBiopsy);
      onFinishDailyReport();
    }
  }, [generateFinalBiopsy, onFinishDailyReportFromStep7, onFinishDailyReport, onUpdateFrequentTissues, onSaveBiopsy, biopsyForm.tissueType]);

  // ✅ FUNCIÓN ACTUALIZADA PARA GUARDAR BIOPSIA CON RESET COMPLETO
  const saveBiopsy = useCallback(() => {
    onUpdateFrequentTissues(biopsyForm.tissueType);
    const newBiopsy = generateFinalBiopsy();
    onSaveBiopsy(newBiopsy);
    
    // ✅ RESET COMPLETO CON TODOS LOS CAMPOS
    setBiopsyForm({
      number: '',
      tissueType: '',
      endoscopiaSubTypes: [],
      type: '',
      cassettes: '',
      pieces: '',
      cassettesNumbers: [],
      declassify: '',
      servicios: {
        cassetteUrgente: false,
        pap: false,
        papUrgente: false,
        citologia: false,
        citologiaUrgente: false,
        corteBlancoIHQ: false,
        corteBlancoIHQQuantity: 1,
        corteBlancoComun: false,
        corteBlancoComunQuantity: 1,
        giemsaPASMasson: false,
        giemsaOptions: {
          giemsa: false,
          pas: false,
          masson: false
        },
        // ✅ RESET DEL NUEVO CAMPO
        giemsaPASMassonTotal: 0
      },
      observations: '',
      // ✅ RESET DE LOS NUEVOS CAMPOS:
      papQuantity: 0,
      papUrgente: false,
      citologiaQuantity: 0,
      citologiaUrgente: false
    });
    setCurrentStep(1);
  }, [biopsyForm.tissueType, generateFinalBiopsy, onSaveBiopsy, onUpdateFrequentTissues]);

  // ✅ FUNCIÓN HELPER PARA DETERMINAR SI ES PAP O CITOLOGÍA
  const isPapOrCitologia = useCallback(() => {
    return biopsyForm.tissueType === 'PAP' || biopsyForm.tissueType === 'Citología';
  }, [biopsyForm.tissueType]);

  // ✅ FUNCIÓN MEJORADA PARA VALIDACIÓN Y NAVEGACIÓN CON FLUJO ESPECIAL
  const nextStep = useCallback(() => {
    console.log('🚀 nextStep called', { currentStep, tissueType: biopsyForm.tissueType, isPapOrCitologia: isPapOrCitologia() });
    
    // ✅ VALIDACIONES ESPECÍFICAS POR STEP
    if (currentStep === 2) {
      // Validar PAP
      if (biopsyForm.tissueType === 'PAP' && (!biopsyForm.papQuantity || biopsyForm.papQuantity <= 0)) {
        alert('❌ Error: Debe especificar la cantidad de PAP mayor a 0');
        return;
      }
      
      // Validar Citología
      if (biopsyForm.tissueType === 'Citología' && (!biopsyForm.citologiaQuantity || biopsyForm.citologiaQuantity <= 0)) {
        alert('❌ Error: Debe especificar la cantidad de vidrios de citología mayor a 0');
        return;
      }
      
      // ✅ FLUJO ESPECIAL: PAP/Citología van directo a Step 7 (confirmación)
      if (isPapOrCitologia()) {
        console.log('🎯 Flujo especial: PAP/Citología va directo a Step 7');
        setCurrentStep(7);
        return;
      }
    }
    
    if (currentStep === 4) {
      const isPapOrCitologiaFlow = isPapOrCitologia();
      if (isPapOrCitologiaFlow) {
        // Saltar Step5 (Desclasificar) y ir directo a Step6 (servicios)
        setCurrentStep(6);
        return;
      }
    }
    
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, biopsyForm.tissueType, biopsyForm.papQuantity, biopsyForm.citologiaQuantity, isPapOrCitologia]);

  const prevStep = useCallback(() => {
    console.log('⬅️ prevStep called', { currentStep, tissueType: biopsyForm.tissueType, isPapOrCitologia: isPapOrCitologia() });
    
    // ✅ FLUJO ESPECIAL: Si estamos en Step 7 y es PAP/Citología, volver a Step 2
    if (currentStep === 7 && isPapOrCitologia()) {
      console.log('🎯 Flujo especial: Desde Step 7 PAP/Citología volver a Step 2');
      setCurrentStep(2);
      return;
    }
    
    // Lógica especial para volver en PAP/Citología (caso normal)
    if (currentStep === 4) {
      const isPapOrCitologiaFlow = isPapOrCitologia();
      if (isPapOrCitologiaFlow) {
        // Volver a Step2 (saltar Step3)
        setCurrentStep(2);
        return;
      }
    }
    
    if (currentStep === 6) {
      const isPapOrCitologiaFlow = isPapOrCitologia();
      if (isPapOrCitologiaFlow) {
        // Volver a Step4 (saltar Step5)
        setCurrentStep(4);
        return;
      }
    }
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, biopsyForm.tissueType, isPapOrCitologia]);

  return (
    <div className="h-screen bg-gray-50">
      <div className="h-full w-full">
        {currentStep === 1 && (
          <Step1
            biopsyNumber={biopsyForm.number}
            todayBiopsiesCount={todayBiopsies.length}
            todayBiopsies={todayBiopsies}
            onBiopsyNumberChange={(value) => handleBiopsyChange('number', value)}
            onNext={nextStep}
            onFinishDailyReport={onFinishDailyReport}
          />
        )}
        
        {/* ✅ STEP2 COMPLETAMENTE ACTUALIZADO CON TODAS LAS PROPS */}
        {currentStep === 2 && (
          <Step2
            tissueType={biopsyForm.tissueType}
            endoscopiaSubTypes={biopsyForm.endoscopiaSubTypes}
            frequentTissues={frequentTissues}
            // ✅ PROPS OBLIGATORIAS PARA PAP Y CITOLOGÍA:
            papQuantity={biopsyForm.papQuantity}
            papUrgente={biopsyForm.papUrgente}
            citologiaQuantity={biopsyForm.citologiaQuantity}
            citologiaUrgente={biopsyForm.citologiaUrgente}
            onTissueTypeChange={(value) => handleBiopsyChange('tissueType', value)}
            onEndoscopiaSubTypesChange={(subTypes) => handleBiopsyChange('endoscopiaSubTypes', subTypes)}
            // ✅ FUNCIONES OBLIGATORIAS PARA PAP Y CITOLOGÍA:
            onPapQuantityChange={handlePapQuantityChange}
            onPapUrgenteChange={handlePapUrgenteChange}
            onCitologiaQuantityChange={handleCitologiaQuantityChange}
            onCitologiaUrgenteChange={handleCitologiaUrgenteChange}
            onNext={nextStep}
            onPrev={prevStep}
            onUpdateFrequentTissues={onUpdateFrequentTissues}
            onOpenVirtualKeyboard={openVirtualKeyboard}
            onCloseVirtualKeyboard={closeVirtualKeyboard}
            autoCompleteOptions={autoCompleteOptions}
            onSelectAutoComplete={selectAutoComplete}
            keyboardValue={virtualKeyboard.targetValue}
          />
        )}
        
        {/* ✅ STEP 3 - NO SE MUESTRA PARA PAP/CITOLOGÍA */}
        {currentStep === 3 && !isPapOrCitologia() && (
          <Step3
            type={biopsyForm.type}
            onTypeChange={(value) => handleBiopsyChange('type', value)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {/* ✅ STEP 4 - SOLO SE MUESTRA PARA CASOS NORMALES */}
        {currentStep === 4 && !isPapOrCitologia() && (
          <Step4
            cassettes={biopsyForm.cassettes}
            pieces={biopsyForm.pieces}
            cassettesNumbers={biopsyForm.cassettesNumbers}
            tissueType={biopsyForm.tissueType}
            onCassettesChange={(value) => handleBiopsyChange('cassettes', value)}
            onPiecesChange={(value) => handleBiopsyChange('pieces', value)}
            onUpdateCassetteSuffix={updateCassetteSuffix}
            onNext={nextStep}
            onPrev={prevStep}
            onOpenVirtualKeyboard={openVirtualKeyboard}
          />
        )}
        
        {/* ✅ STEP 5 - NO SE MUESTRA PARA PAP/CITOLOGÍA */}
        {currentStep === 5 && !isPapOrCitologia() && (
          <Step5
            declassify={biopsyForm.declassify}
            onDeclassifyChange={(value) => handleBiopsyChange('declassify', value)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {/* ✅ STEP 6 - NO SE MUESTRA PARA PAP/CITOLOGÍA - CON PROP CORREGIDA */}
        {currentStep === 6 && !isPapOrCitologia() && (
          <Step6
            servicios={biopsyForm.servicios}
            tissueType={biopsyForm.tissueType}
            onServicioChange={handleServicioChange}
            onGiemsaOptionChange={handleGiemsaOptionChange}
            onGiemsaTotalChange={handleGiemsaTotalChange} // ✅ NUEVA PROP AGREGADA
            onCorteBlancoQuantityChange={handleCorteBlancoQuantityChange}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {/* ✅ STEP 7 - SE MUESTRA PARA TODOS */}
        {currentStep === 7 && (
          <Step7
            biopsyForm={biopsyForm}
            onObservationsChange={(value) => handleBiopsyChange('observations', value)}
            onSave={saveBiopsy}
            onPrev={prevStep}
            onFinishDailyReport={finishDailyReportWithCurrentBiopsy}
            onOpenVirtualKeyboard={openVirtualKeyboard}
          />
        )}
      </div>
      {virtualKeyboard.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="w-full">
            <VirtualKeyboard
              keyboard={virtualKeyboard}
              onKeyPress={handleVirtualKeyPress}
              onConfirm={closeVirtualKeyboard}
              onSwitchType={(type) => setVirtualKeyboard(prev => ({ ...prev, type }))}
              autoCompleteOptions={autoCompleteOptions}
              onSelectAutoComplete={selectAutoComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
};