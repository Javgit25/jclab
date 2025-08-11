import React, { useState, useCallback } from 'react';
import { Users, User, Shield, AlertCircle } from 'lucide-react';
import { DoctorInfo, VirtualKeyboard as VirtualKeyboardType } from '../types';
import { VirtualKeyboard } from './VirtualKeyboard';

interface LoginScreenProps {
  onLogin: (doctorInfo: DoctorInfo) => void;
  onGoToAdmin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGoToAdmin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para el teclado virtual
  const [keyboard, setKeyboard] = useState<VirtualKeyboardType>({
    isOpen: false,
    type: 'full',
    targetField: '',
    targetValue: ''
  });

  // Función de validación
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Nombre es obligatorio
    if (!firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }

    // Apellido es obligatorio
    if (!lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    // Email es obligatorio y debe ser válido
    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Ingrese un email válido (ej: doctor@hospital.com)';
    } else if (email.trim().length < 5) {
      newErrors.email = 'El email debe tener al menos 5 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = useCallback(async () => {
    if (isSubmitting) return;

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const doctorInfo: DoctorInfo = {
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        hospital: hospitalName.trim() || 'No especificado',
        email: email.trim(),
        selectedDate: new Date().toDateString(),
        loginDate: new Date().toDateString()
      };

      // Simular un pequeño delay para mejor UX
      await new Promise(resolve => setTimeout(resolve, 300));

      onLogin(doctorInfo);
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error al iniciar sesión. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }, [firstName, lastName, hospitalName, email, onLogin, isSubmitting]);

  // Funciones para el teclado virtual
  const openKeyboard = (field: string) => {
    let currentValue = '';
    switch (field) {
      case 'firstName':
        currentValue = firstName;
        break;
      case 'lastName':
        currentValue = lastName;
        break;
      case 'hospitalName':
        currentValue = hospitalName;
        break;
      case 'email':
        currentValue = email;
        break;
    }
    
    setKeyboard({
      isOpen: true,
      type: 'full',
      targetField: field,
      targetValue: currentValue
    });
  };

  const handleKeyPress = (key: string) => {
    let newValue = keyboard.targetValue;
    
    if (key === 'BACKSPACE' || key === 'backspace') {
      newValue = newValue.slice(0, -1);
    } else if (key === 'SPACE' || key === 'space') {
      newValue += ' ';
    } else {
      // Agregar la tecla tal como viene (números, letras, símbolos)
      newValue += key;
    }
    
    // Actualizar el estado del teclado
    setKeyboard(prev => ({ ...prev, targetValue: newValue }));
    
    // ✅ NUEVO: Actualizar el campo correspondiente en tiempo real
    switch (keyboard.targetField) {
      case 'firstName':
        setFirstName(newValue);
        if (errors.firstName) {
          setErrors(prev => ({...prev, firstName: ''}));
        }
        break;
      case 'lastName':
        setLastName(newValue);
        if (errors.lastName) {
          setErrors(prev => ({...prev, lastName: ''}));
        }
        break;
      case 'hospitalName':
        setHospitalName(newValue);
        break;
      case 'email':
        setEmail(newValue);
        if (errors.email) {
          setErrors(prev => ({...prev, email: ''}));
        }
        break;
    }
  };

  const handleKeyboardConfirm = () => {
    // Ya no necesitamos actualizar los valores aquí porque se actualizan en tiempo real
    // Solo cerramos el teclado
    setKeyboard(prev => ({ ...prev, isOpen: false }));
  };

  const handleSwitchKeyboardType = (type: 'numeric' | 'full') => {
    setKeyboard(prev => ({ ...prev, type }));
  };

  // Manejar Enter key
  const handleKeyPressOriginal = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleLogin();
    }
  };

      const isFormValid = firstName.trim().length >= 2 && lastName.trim().length >= 2 && email.trim().length >= 5 && email.includes('@') && email.includes('.');

  return (
    <div className="h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-2 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl p-2 w-full max-w-md h-fit">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-3 border-2 border-blue-200 shadow-sm">
            <img 
              src="/assets/biopsytracker_logo_final.svg" 
              alt="BiopsyTracker Logo" 
              className="w-full max-w-sm h-32 mx-auto"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}
            />
          </div>
          <p className="text-sm text-gray-500">Complete los datos para acceder</p>
        </div>

        <div className="space-y-1">
          {/* Campo Nombre - OBLIGATORIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                // Capitalizar solo la primera letra
                const value = e.target.value;
                const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                setFirstName(capitalizedValue);
                if (errors.firstName) {
                  setErrors(prev => ({...prev, firstName: ''}));
                }
              }}
              onKeyPress={handleKeyPressOriginal}
              onFocus={() => openKeyboard('firstName')}
              style={{ textTransform: 'none' }}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.firstName 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
              placeholder="Ingrese su nombre"
              required
              autoComplete="given-name"
            />
            {errors.firstName && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.firstName}
              </div>
            )}
          </div>

          {/* Campo Apellido - OBLIGATORIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                // Capitalizar solo la primera letra
                const value = e.target.value;
                const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                setLastName(capitalizedValue);
                if (errors.lastName) {
                  setErrors(prev => ({...prev, lastName: ''}));
                }
              }}
              onKeyPress={handleKeyPressOriginal}
              onFocus={() => openKeyboard('lastName')}
              style={{ textTransform: 'none' }}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.lastName 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
              placeholder="Ingrese su apellido"
              required
              autoComplete="family-name"
            />
            {errors.lastName && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.lastName}
              </div>
            )}
          </div>

          {/* Campo Hospital - OPCIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital/Clínica <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => {
                // Capitalizar solo la primera letra
                const value = e.target.value;
                const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                setHospitalName(capitalizedValue);
              }}
              onKeyPress={handleKeyPressOriginal}
              onFocus={() => openKeyboard('hospitalName')}
              style={{ textTransform: 'none' }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Nombre del hospital o clínica"
              autoComplete="organization"
            />
          </div>

          {/* Campo Email - OBLIGATORIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                // Para email, mantener en minúsculas
                setEmail(e.target.value.toLowerCase());
                if (errors.email) {
                  setErrors(prev => ({...prev, email: ''}));
                }
              }}
              onKeyPress={handleKeyPressOriginal}
              onFocus={() => openKeyboard('email')}
              style={{ textTransform: 'none' }}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
              placeholder="doctor@hospital.com"
              required
              autoComplete="email"
            />
            {errors.email && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email}
              </div>
            )}
          </div>

          {/* Indicador de campos obligatorios - compacto */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <div className="flex items-center">
              <AlertCircle className="h-3 w-3 text-yellow-600 mr-1" />
              <span className="text-xs text-yellow-800">
                Los campos con <span className="text-red-500 font-medium">*</span> son obligatorios
              </span>
            </div>
          </div>

          {/* Botón de Login - ajustado */}
          <button
            onClick={handleLogin}
            disabled={!isFormValid || isSubmitting}
            className={`w-full font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 ${
              isFormValid && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">Ingresando...</span>
              </>
            ) : (
              <>
                <User size={18} />
                <span className="text-sm">Ingresar como Médico</span>
              </>
            )}
          </button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 text-xs">o</span>
            </div>
          </div>

          {/* Botón de Admin - ajustado */}
          <button
            onClick={onGoToAdmin}
            disabled={isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Shield size={18} />
            <span className="text-sm">Panel de Administrador</span>
          </button>
        </div>

        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            BiopsyTracker v1.0 • Sistema seguro y confiable
          </p>
        </div>

        {/* Teclado Virtual - Como overlay modal */}
        {keyboard.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
            <div className="bg-white w-full max-w-4xl rounded-t-2xl shadow-2xl">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {keyboard.targetField === 'firstName' && 'Ingrese su nombre'}
                  {keyboard.targetField === 'lastName' && 'Ingrese su apellido'}
                  {keyboard.targetField === 'hospitalName' && 'Ingrese hospital/clínica'}
                  {keyboard.targetField === 'email' && 'Ingrese su email'}
                </h3>
                <button
                  onClick={() => setKeyboard(prev => ({ ...prev, isOpen: false }))}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <VirtualKeyboard
                keyboard={keyboard}
                onKeyPress={handleKeyPress}
                onConfirm={handleKeyboardConfirm}
                onSwitchType={handleSwitchKeyboardType}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;