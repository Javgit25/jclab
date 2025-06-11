import React, { useState, useCallback } from 'react';
import { Users, User, Shield, AlertCircle } from 'lucide-react';
import { DoctorInfo } from '../types';

interface LoginScreenProps {
  onLogin: (doctorInfo: DoctorInfo) => void;
  onGoToAdmin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGoToAdmin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        hospitalName: hospitalName.trim() || undefined,
        email: email.trim(), // Email ahora es obligatorio
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

  // Manejar Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleLogin();
    }
  };

      const isFormValid = firstName.trim().length >= 2 && lastName.trim().length >= 2 && email.trim().length >= 5 && email.includes('@') && email.includes('.');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">BiopsyTracker</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestión de Biopsias</p>
          <p className="text-sm text-gray-500 mt-1">Complete los datos para acceder</p>
        </div>

        <div className="space-y-4">
          {/* Campo Nombre - OBLIGATORIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) {
                  setErrors(prev => ({...prev, firstName: ''}));
                }
              }}
              onKeyPress={handleKeyPress}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) {
                  setErrors(prev => ({...prev, lastName: ''}));
                }
              }}
              onKeyPress={handleKeyPress}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hospital/Clínica <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Nombre del hospital o clínica"
              autoComplete="organization"
            />
          </div>

          {/* Campo Email - OBLIGATORIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors(prev => ({...prev, email: ''}));
                }
              }}
              onKeyPress={handleKeyPress}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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

          {/* Indicador de campos obligatorios */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Los campos marcados con <span className="text-red-500 font-medium">*</span> son obligatorios
              </span>
            </div>
          </div>

          {/* Botón de Login */}
          <button
            onClick={handleLogin}
            disabled={!isFormValid || isSubmitting}
            className={`w-full font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 ${
              isFormValid && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Ingresando...</span>
              </>
            ) : (
              <>
                <User size={20} />
                <span>Ingresar como Médico</span>
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>

          {/* Botón de Admin */}
          <button
            onClick={onGoToAdmin}
            disabled={isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Shield size={20} />
            <span>Panel de Administrador</span>
          </button>
        </div>

        {/* Información del sistema */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Características:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Gestión offline de biopsias</li>
            <li>• Generación automática de remitos</li>
            <li>• Historial completo de pacientes</li>
            <li>• Exportación a CSV e impresión</li>
            <li>• Sincronización automática</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Versión 1.0 • Sistema seguro y confiable
          </p>
        </div>
      </div>
    </div>
  );
};