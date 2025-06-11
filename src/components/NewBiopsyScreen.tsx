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
  onGoToMain: () => void;
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
  onGoToMain,
  onUpdateFrequentTissues
}) => {
  const [currentStep, setCurrentStep] = useState(1);
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
      }
    },
    observations: ''
  });

  const [virtualKeyboard, setVirtualKeyboard] = useState<VirtualKeyboardType>({
    isOpen: false,
    type: 'numeric',
    targetField: '',
    targetValue: ''
  });

  const [autoCompleteOptions, setAutoCompleteOptions] = useState<string[]>([]);

  const handleBiopsyChange = useCallback((field: keyof BiopsyForm, value: string | string[]) => {
    setBiopsyForm(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'cassettes') {
        const count = parseInt(value as string) || 0;
        if (count > 0 && prev.number) {
          const numbers: CassetteNumber[] = [];
          for (let i = 0; i < count; i++) {
            if (i === 0) {
              numbers.push({ base: prev.number, suffix: '' });
            } else {
              numbers.push({ base: prev.number, suffix: '' });
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
              numbers.push({ base: value as string, suffix: '' });
            } else {
              numbers.push({ base: value as string, suffix: '' });
            }
          }
          updated.cassettesNumbers = numbers;
        }
      }
      
      return updated;
    });
  }, []);

  const updateCassetteSuffix = useCallback((index: number, newSuffix: string) => {
    if (index === 0) return;
    
    setBiopsyForm(prev => {
      const updatedNumbers = [...prev.cassettesNumbers];
      updatedNumbers[index] = { 
        ...updatedNumbers[index], 
        suffix: newSuffix 
      };
      return { ...prev, cassettesNumbers: updatedNumbers };
    });
  }, []);

  const handleServicioChange = useCallback((servicioKey: keyof BiopsyServices) => {
    setBiopsyForm(prev => {
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
      }
      
      return updated;
    });
  }, []);

  const handleGiemsaOptionChange = useCallback((giemsaKey: keyof GiemsaServices) => {
    setBiopsyForm(prev => ({
      ...prev,
      servicios: {
        ...prev.servicios,
        giemsaOptions: {
          ...prev.servicios.giemsaOptions!,
          [giemsaKey]: !prev.servicios.giemsaOptions![giemsaKey]
        }
      }
    }));
  }, []);

  // Nueva función para manejar las cantidades de cortes en blanco
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

  // Nueva función para finalizar remito con la biopsia actual
  const finishDailyReportWithCurrentBiopsy = useCallback(() => {
    // SIEMPRE crear y guardar la biopsia actual, no importa si la función especial existe
    const finalCassettes = biopsyForm.cassettesNumbers.map((cassette, index) => {
      if (index === 0) {
        return cassette.base;
      } else {
        return `${cassette.base}/${cassette.suffix || index}`;
      }
    });
    
    const currentBiopsy: BiopsyForm = {
      ...biopsyForm,
      cassettesNumbers: finalCassettes as any,
      timestamp: new Date().toISOString(),
      date: new Date().toDateString()
    };
    
    onUpdateFrequentTissues(biopsyForm.tissueType);
    
    // Si existe la función especial, usarla; si no, usar la normal después de guardar
    if (onFinishDailyReportFromStep7) {
      console.log('NewBiopsyScreen - Usando función especial para finalizar con biopsia actual');
      onFinishDailyReportFromStep7(currentBiopsy);
    } else {
      console.log('NewBiopsyScreen - Función especial no disponible, guardando manualmente y finalizando');
      // Guardar la biopsia primero
      onSaveBiopsy(currentBiopsy);
      // Luego finalizar el remito
      onFinishDailyReport();
    }
  }, [biopsyForm, onFinishDailyReportFromStep7, onFinishDailyReport, onUpdateFrequentTissues, onSaveBiopsy]);

  const saveBiopsy = useCallback(() => {
    onUpdateFrequentTissues(biopsyForm.tissueType);
    
    const finalCassettes = biopsyForm.cassettesNumbers.map((cassette, index) => {
      if (index === 0) {
        return cassette.base;
      } else {
        return `${cassette.base}/${cassette.suffix || index}`;
      }
    });
    
    const newBiopsy: BiopsyForm = {
      ...biopsyForm,
      cassettesNumbers: finalCassettes as any,
      timestamp: new Date().toISOString(),
      date: new Date().toDateString()
    };
    
    onSaveBiopsy(newBiopsy);
    
    // Reset form
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
        }
      },
      observations: ''
    });
    setCurrentStep(1);
  }, [biopsyForm, onSaveBiopsy, onUpdateFrequentTissues]);

  const nextStep = useCallback(() => {
    // Lógica especial para saltar pasos en PAP/Citología
    if (currentStep === 2) {
      const isPapOrCitologia = biopsyForm.tissueType === 'PAP' || biopsyForm.tissueType === 'Citología';
      if (isPapOrCitologia) {
        // Saltar Step3 (BX/PQ) y ir directo a Step4 (materiales/vidrios)
        setCurrentStep(4);
        return;
      }
    }
    
    if (currentStep === 4) {
      const isPapOrCitologia = biopsyForm.tissueType === 'PAP' || biopsyForm.tissueType === 'Citología';
      if (isPapOrCitologia) {
        // Saltar Step5 (Desclasificar) y ir directo a Step6 (servicios)
        setCurrentStep(6);
        return;
      }
    }
    
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, biopsyForm.tissueType]);

  const prevStep = useCallback(() => {
    // Lógica especial para volver en PAP/Citología
    if (currentStep === 4) {
      const isPapOrCitologia = biopsyForm.tissueType === 'PAP' || biopsyForm.tissueType === 'Citología';
      if (isPapOrCitologia) {
        // Volver a Step2 (saltar Step3)
        setCurrentStep(2);
        return;
      }
    }
    
    if (currentStep === 6) {
      const isPapOrCitologia = biopsyForm.tissueType === 'PAP' || biopsyForm.tissueType === 'Citología';
      if (isPapOrCitologia) {
        // Volver a Step4 (saltar Step5)
        setCurrentStep(4);
        return;
      }
    }
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, biopsyForm.tissueType]);

  const ProgressBar = () => (
    <div className="bg-white border-b px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Nueva Biopsia</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Paso {currentStep} de 7</span>
            <span className="text-sm text-gray-400">•</span>
            <div className="bg-blue-100 px-3 py-1 rounded-full">
              <span className="text-sm font-semibold text-blue-800">
                Biopsia #{todayBiopsies.length + 1} del día
              </span>
            </div>
          </div>
        </div>
        <ConnectionStatus 
          isOnline={isOnline}
          backupStatus={backupStatus}
          syncQueueLength={syncQueueLength}
        />
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 7) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar />
      <div className="max-w-md mx-auto">
        {currentStep === 1 && (
          <Step1
            biopsyNumber={biopsyForm.number}
            todayBiopsiesCount={todayBiopsies.length}
            todayBiopsies={todayBiopsies}
            onBiopsyNumberChange={(value) => handleBiopsyChange('number', value)}
            onNext={nextStep}
            onFinishDailyReport={onFinishDailyReport}
            onOpenVirtualKeyboard={openVirtualKeyboard}
          />
        )}
        {currentStep === 2 && (
          <Step2
            tissueType={biopsyForm.tissueType}
            endoscopiaSubTypes={biopsyForm.endoscopiaSubTypes}
            frequentTissues={frequentTissues}
            onTissueTypeChange={(value) => handleBiopsyChange('tissueType', value)}
            onEndoscopiaSubTypesChange={(subTypes) => handleBiopsyChange('endoscopiaSubTypes', subTypes)}
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
        {currentStep === 3 && (
          <Step3
            type={biopsyForm.type}
            onTypeChange={(value) => handleBiopsyChange('type', value)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 4 && (
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
        {currentStep === 5 && (
          <Step5
            declassify={biopsyForm.declassify}
            onDeclassifyChange={(value) => handleBiopsyChange('declassify', value)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 6 && (
          <Step6
            servicios={biopsyForm.servicios}
            tissueType={biopsyForm.tissueType}
            onServicioChange={handleServicioChange}
            onGiemsaOptionChange={handleGiemsaOptionChange}
            onCorteBlancoQuantityChange={handleCorteBlancoQuantityChange}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
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
      
      <div className="fixed bottom-4 left-4">
        <button
          onClick={onGoToMain}
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 shadow transition-colors"
        >
          ← Inicio
        </button>
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