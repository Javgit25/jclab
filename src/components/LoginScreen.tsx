import React, { useState, useCallback, useEffect } from 'react';
import { Shield, AlertCircle, Lock, Mail, UserPlus, LogIn, Key } from 'lucide-react';
import { DoctorInfo, RegisteredDoctor } from '../types';
import { VirtualKeyboard as VirtualKeyboardType } from '../types';
import { VirtualKeyboard } from './VirtualKeyboard';
import { db } from '../lib/database';

interface LoginScreenProps {
  onLogin: (doctorInfo: DoctorInfo) => void;
  onGoToAdmin: () => void;
  onGoToSuperAdmin?: () => void;
}

const getRegisteredDoctors = (): RegisteredDoctor[] => {
  try { return JSON.parse(localStorage.getItem('registeredDoctors') || '[]'); }
  catch { return []; }
};

const saveRegisteredDoctors = (doctors: RegisteredDoctor[]) => {
  localStorage.setItem('registeredDoctors', JSON.stringify(doctors));
};

const findDoctorByEmail = (email: string): RegisteredDoctor | undefined => {
  return getRegisteredDoctors().find(d => d.email.toLowerCase() === email.toLowerCase());
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGoToAdmin, onGoToSuperAdmin }) => {
  const savedEmail = localStorage.getItem('lastDoctorEmail') || '';
  const savedDoctor = savedEmail ? findDoctorByEmail(savedEmail) : null;
  const [mode, setMode] = useState<'email' | 'login' | 'register' | 'recover'>(savedDoctor ? 'login' : 'email');
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [labCode, setLabCode] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [existingDoctor, setExistingDoctor] = useState<RegisteredDoctor | null>(savedDoctor);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [loginModal, setLoginModal] = useState<{ open: boolean; nombre: string; expectedPassword: string; loginFn: (nombre: string) => void } | null>(null);
  const [loginModalPassword, setLoginModalPassword] = useState('');

  // Sincronizar datos desde Supabase después del montaje
  useEffect(() => {
    let cancelled = false;
    const syncFromDb = async () => {
      try {
        // Pre-cargar labs para validación de código al registrar (esperar resultado)
        await db.getLabs().catch(() => {});
        const freshDoctors = await db.getDoctors();
        if (!cancelled && freshDoctors.length > 0) {
          // getDoctors() ya actualiza localStorage internamente
          // Re-check si el doctor actual sigue existiendo con datos frescos
          if (savedEmail) {
            const fresh = freshDoctors.find(
              (d: any) => d.email.toLowerCase() === savedEmail.toLowerCase()
            );
            if (fresh && !existingDoctor) {
              setExistingDoctor(fresh);
              setMode('login');
            }
          }
        }
      } catch {}
    };
    syncFromDb();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Teclado virtual
  const [keyboard, setKeyboard] = useState<VirtualKeyboardType>({
    isOpen: false, type: 'full', targetField: '', targetValue: ''
  });

  const openKeyboard = (field: string, currentValue: string) => {
    setKeyboard({ isOpen: true, type: 'full', targetField: field, targetValue: currentValue });
  };

  const handleVirtualKeyPress = (key: string) => {
    let newValue = keyboard.targetValue;
    if (key === 'BACKSPACE' || key === 'backspace') {
      newValue = newValue.slice(0, -1);
    } else if (key === 'SPACE' || key === 'space') {
      newValue += ' ';
    } else {
      newValue += key;
    }
    setKeyboard(prev => ({ ...prev, targetValue: newValue }));

    // Actualizar campo correspondiente
    const f = keyboard.targetField;
    if (f === 'email') { setEmail(newValue.toLowerCase()); setErrors({}); }
    else if (f === 'password') { setPassword(newValue); setErrors({}); }
    else if (f === 'firstName') { setFirstName(newValue.charAt(0).toUpperCase() + newValue.slice(1).toLowerCase()); }
    else if (f === 'lastName') { setLastName(newValue.charAt(0).toUpperCase() + newValue.slice(1).toLowerCase()); }
    else if (f === 'hospitalName') { setHospitalName(newValue); }
    else if (f === 'labCode') { setLabCode(newValue.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6)); }
    else if (f === 'whatsapp') { setWhatsapp(newValue.replace(/\D/g, '')); }
    else if (f === 'confirmPassword') { setConfirmPassword(newValue); }
    else if (f === 'newPassword') { setNewPassword(newValue); }
    else if (f === 'loginModalPassword') { setLoginModalPassword(newValue); setErrors({}); }
  };

  const closeKeyboard = () => setKeyboard(prev => ({ ...prev, isOpen: false }));

  const checkEmail = useCallback(() => {
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrors({ email: 'Ingrese un email válido' });
      return;
    }
    setErrors({});
    localStorage.setItem('lastDoctorEmail', email.trim().toLowerCase());
    const doctor = findDoctorByEmail(email.trim());
    if (doctor) { setExistingDoctor(doctor); setMode('login'); }
    else { setExistingDoctor(null); setMode('register'); }
  }, [email]);

  const [showUserSelect, setShowUserSelect] = useState(false);
  const [ayudantePassword, setAyudantePassword] = useState('');

  // Multi-centro: estado para selección de centro médico
  const [pendingCargadoPor, setPendingCargadoPor] = useState<string | null>(null);
  const [showCentroSelect, setShowCentroSelect] = useState(false);

  // Obtener lista de hospitales del doctor
  const getHospitales = (doctor: RegisteredDoctor): string[] => {
    const list = (doctor as any).hospitales || [];
    if (list.length > 0) return list.filter((h: string) => h && h.trim());
    if (doctor.hospital && doctor.hospital.trim()) return [doctor.hospital];
    return [];
  };

  // Ejecutar login final con centro seleccionado
  const doLogin = useCallback(async (cargadoPor: string, hospital: string) => {
    if (!existingDoctor) return;
    setIsSubmitting(true); setErrors({});
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      onLogin({
        id: existingDoctor.id,
        name: `${existingDoctor.firstName} ${existingDoctor.lastName}`,
        firstName: existingDoctor.firstName, lastName: existingDoctor.lastName,
        hospital, email: existingDoctor.email,
        selectedDate: new Date().toDateString(), loginDate: new Date().toDateString(),
        cargadoPor
      });
    } catch { setErrors({ general: 'Error al iniciar sesión' }); }
    finally { setIsSubmitting(false); }
  }, [existingDoctor, onLogin]);

  // Intentar login: si hay múltiples centros, mostrar selección
  const tryLogin = useCallback((cargadoPor: string) => {
    if (!existingDoctor) return;
    const hospitales = getHospitales(existingDoctor);
    if (hospitales.length > 1) {
      setPendingCargadoPor(cargadoPor);
      setShowCentroSelect(true);
    } else {
      doLogin(cargadoPor, hospitales[0] || existingDoctor.hospital || '');
    }
  }, [existingDoctor, doLogin]);

  const handleLogin = useCallback(async () => {
    if (isSubmitting || !existingDoctor) return;
    if (!password) { setErrors({ password: 'Ingrese su contraseña' }); return; }

    // Verificar si es contraseña del médico
    if (password === existingDoctor.password) {
      const ayudantes = (existingDoctor as any).ayudantes || [];
      if (ayudantes.filter((a: any) => a.activo).length > 0) {
        // Tiene ayudantes: mostrar selección de usuario
        setShowUserSelect(true);
        return;
      }
      // No tiene ayudantes: login directo como médico (o selección de centro)
      tryLogin(`Dr/a. ${existingDoctor.firstName} ${existingDoctor.lastName}`);
      return;
    }

    // Verificar si es contraseña de un ayudante
    const ayudantes = (existingDoctor as any).ayudantes || [];
    const ayudante = ayudantes.find((a: any) => a.activo && a.password === password);
    if (ayudante) {
      tryLogin(ayudante.nombre);
      return;
    }

    setErrors({ password: 'Contraseña incorrecta' });
  }, [existingDoctor, password, isSubmitting, tryLogin]);

  const loginAsUser = useCallback(async (userName: string) => {
    if (!existingDoctor) return;
    tryLogin(userName);
  }, [existingDoctor, tryLogin]);

  const handleRegister = useCallback(async () => {
    if (isSubmitting) return;
    const newErrors: {[key: string]: string} = {};
    if (!firstName.trim() || firstName.trim().length < 2) newErrors.firstName = 'Mínimo 2 caracteres';
    if (!lastName.trim() || lastName.trim().length < 2) newErrors.lastName = 'Mínimo 2 caracteres';
    if (!labCode.trim()) {
      newErrors.labCode = 'Ingresá el código del laboratorio';
    } else {
      // Verificar que el código exista - consultar Supabase directo
      try {
        let labs: any[] = [];
        // Primero intentar localStorage (ya precargado en useEffect)
        try { labs = JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]'); } catch {}
        // Si no hay en caché, consultar Supabase
        if (labs.length === 0) {
          try { labs = await db.getLabs(); } catch {}
        }
        const codeUpper = labCode.trim().toUpperCase();
        const labExists = labs.some((l: any) => l.labCode === codeUpper && l.estado !== 'suspendido');
        if (!labExists) {
          // Último intento: consultar Supabase fresco (por si el caché estaba vacío)
          try { labs = await db.getLabs(); } catch {}
          const labExistsRetry = labs.some((l: any) => l.labCode === codeUpper && l.estado !== 'suspendido');
          if (!labExistsRetry) newErrors.labCode = 'Código no válido o laboratorio suspendido';
        }
      } catch { newErrors.labCode = 'Error al verificar código'; }
    }
    if (!password || password.length < 4) newErrors.password = 'Mínimo 4 caracteres';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsSubmitting(true); setErrors({});
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const hospitalTrimmed = hospitalName.trim() || '';
      const newDoctor: RegisteredDoctor = {
        id: `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        firstName: firstName.trim(), lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        hospital: hospitalTrimmed,
        hospitales: hospitalTrimmed ? [hospitalTrimmed] : [],
        whatsapp: whatsapp.trim(),
        labCode: labCode.trim().toUpperCase(),
        password, registeredAt: new Date().toISOString(), profileChanges: []
      };
      const doctors = getRegisteredDoctors();
      doctors.push(newDoctor);
      saveRegisteredDoctors(doctors);
      db.saveDoctor(newDoctor);

      // Actualizar medicosActivos del laboratorio
      try {
        const labs = JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]');
        const updatedLabs = labs.map((l: any) => {
          if (l.labCode === newDoctor.labCode) {
            const count = doctors.filter((d: any) => d.labCode === l.labCode).length;
            return { ...l, medicosActivos: count };
          }
          return l;
        });
        localStorage.setItem('superAdmin_laboratories', JSON.stringify(updatedLabs));
        const updatedLab = updatedLabs.find((l: any) => l.labCode === newDoctor.labCode);
        if (updatedLab) db.saveLab(updatedLab);
      } catch {}

      onLogin({
        id: newDoctor.id, name: `${newDoctor.firstName} ${newDoctor.lastName}`,
        firstName: newDoctor.firstName, lastName: newDoctor.lastName,
        hospital: newDoctor.hospital, email: newDoctor.email,
        selectedDate: new Date().toDateString(), loginDate: new Date().toDateString()
      });
    } catch { setErrors({ general: 'Error al registrar' }); }
    finally { setIsSubmitting(false); }
  }, [firstName, lastName, hospitalName, email, password, confirmPassword, onLogin, isSubmitting]);

  const handleRecoverPassword = useCallback(() => {
    if (!newPassword || newPassword.length < 4) {
      setErrors({ newPassword: 'Mínimo 4 caracteres' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    const doctors = getRegisteredDoctors();
    const idx = doctors.findIndex(d => d.email.toLowerCase() === email.toLowerCase());
    if (idx >= 0) {
      doctors[idx].password = newPassword;
      doctors[idx].profileChanges.push({
        field: 'password', oldValue: '***', newValue: '***',
        changedAt: new Date().toISOString()
      });
      saveRegisteredDoctors(doctors);
      db.saveDoctor(doctors[idx]);
      setRecoverySuccess(true);
      setTimeout(() => {
        setMode('login');
        setExistingDoctor(doctors[idx]);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setRecoverySuccess(false);
      }, 1500);
    }
  }, [email, newPassword, confirmPassword]);

  const handleKeyPressNative = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      if (mode === 'email') checkEmail();
      else if (mode === 'login') handleLogin();
      else if (mode === 'register') handleRegister();
      else if (mode === 'recover') handleRecoverPassword();
    }
  };

  const goBack = () => {
    setMode('email'); setPassword(''); setConfirmPassword(''); setNewPassword('');
    setErrors({}); setExistingDoctor(null); setRecoverySuccess(false);
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
      errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div className="h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-2 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl p-3 w-full max-w-md h-fit max-h-[95vh] overflow-y-auto">
        {/* Logo - Grande y prominente */}
        <div className="text-center mb-2">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-1 border-2 border-blue-200 shadow-sm">
            <img
              src={`${import.meta.env.BASE_URL}assets/biopsytracker_logo_final.svg`}
              alt="BiopsyTracker Logo"
              className="w-full mx-auto"
              style={{
                maxHeight: mode === 'email' ? '240px' : '140px',
                transition: 'max-height 0.3s ease',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}
            />
          </div>
        </div>

        {/* Paso 1: Email */}
        {mode === 'email' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">Ingrese su email para continuar</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail size={14} className="inline mr-1" /> Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email" value={email}
                onChange={(e) => { setEmail(e.target.value.toLowerCase()); setErrors({}); }}
                onFocus={() => openKeyboard('email', email)} onClick={() => openKeyboard('email', email)} inputMode="none" readOnly
                onKeyPress={handleKeyPressNative}
                className={inputClass('email')}
                placeholder="doctor@hospital.com"
                autoComplete="email"
              />
              {errors.email && (
                <div className="flex items-center mt-1 text-red-600 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" /> {errors.email}
                </div>
              )}
            </div>

            <button onClick={checkEmail} disabled={!email.trim() || !email.includes('@')}
              className={`w-full font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 text-base ${
                email.trim() && email.includes('@')
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Continuar</span>
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500 text-xs">o</span></div>
            </div>

            <button onClick={onGoToAdmin}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Shield size={18} /><span className="text-sm">Panel de Administrador</span>
            </button>
          </div>
        )}

        {/* Paso 2a: Login */}
        {mode === 'login' && existingDoctor && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-800">
                Dr/a. {existingDoctor.firstName} {existingDoctor.lastName}
              </div>
              <div className="text-xs text-blue-600">{existingDoctor.email}</div>
            </div>

            {/* Si tiene ayudantes: mostrar botones directamente */}
            {((existingDoctor as any).ayudantes || []).filter((a: any) => a.activo).length > 0 ? (
              <div className="space-y-2">
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600">Seleccione usuario e ingrese su clave</p>
                </div>

                {/* Doctor principal */}
                <button
                  onClick={() => {
                    setLoginModalPassword('');
                    setLoginModal({ open: true, nombre: `Dr/a. ${existingDoctor.firstName} ${existingDoctor.lastName}`, expectedPassword: existingDoctor.password, loginFn: loginAsUser });
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 text-base shadow-lg"
                >
                  <LogIn size={18} />
                  <span>Dr/a. {existingDoctor.firstName} {existingDoctor.lastName}</span>
                  <Lock size={14} className="ml-1 opacity-50" />
                </button>

                {/* Ayudantes */}
                {((existingDoctor as any).ayudantes || [])
                  .filter((a: any) => a.activo)
                  .map((a: any) => (
                    <button key={a.id}
                      onClick={() => {
                        setLoginModalPassword('');
                        setLoginModal({ open: true, nombre: a.nombre, expectedPassword: a.password, loginFn: loginAsUser });
                      }}
                      disabled={isSubmitting}
                      className="w-full bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium py-3 px-4 rounded-lg border border-purple-200 transition-all flex items-center justify-center space-x-2 text-base"
                    >
                      <LogIn size={18} />
                      <span>{a.nombre}</span>
                      <Lock size={14} className="ml-1 opacity-50" />
                    </button>
                  ))}

                <div className="flex justify-between">
                  <button onClick={goBack} className="text-sm text-gray-500 hover:text-gray-700 py-1">← Otro email</button>
                  <button onClick={() => { setMode('recover'); setErrors({}); setNewPassword(''); setConfirmPassword(''); }}
                    className="text-sm text-blue-500 hover:text-blue-700 py-1 flex items-center gap-1">
                    <Key size={12} /> Olvidé mi contraseña
                  </button>
                </div>
              </div>
            ) : (
              /* Sin ayudantes: contraseña normal */
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Lock size={14} className="inline mr-1" /> Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                      onFocus={() => openKeyboard('password', password)} onClick={() => openKeyboard('password', password)} inputMode="none" readOnly
                      onKeyPress={handleKeyPressNative}
                      className={inputClass('password')}
                      placeholder="Ingrese su contraseña"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center mt-1 text-red-600 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" /> {errors.password}
                    </div>
                  )}
                </div>

                <button onClick={handleLogin} disabled={!password || isSubmitting}
                  className={`w-full font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 text-base ${
                    password && !isSubmitting ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /><span>Ingresando...</span></>
                  ) : (
                    <><LogIn size={18} /><span>Ingresar</span></>
                  )}
                </button>

                <div className="flex justify-between">
                  <button onClick={goBack} className="text-sm text-gray-500 hover:text-gray-700 py-1">← Otro email</button>
                  <button onClick={() => { setMode('recover'); setErrors({}); setNewPassword(''); setConfirmPassword(''); }}
                    className="text-sm text-blue-500 hover:text-blue-700 py-1 flex items-center gap-1">
                    <Key size={12} /> Olvidé mi contraseña
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Paso 2b: Registro */}
        {mode === 'register' && (
          <div className="space-y-1.5">
            <div className="bg-green-50 border border-green-200 rounded-lg p-1.5 text-center">
              <UserPlus size={14} className="inline mr-1 text-green-600" />
              <span className="text-xs font-medium text-green-800">Nuevo registro</span>
              <span className="text-xs text-green-600 ml-1">({email})</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Nombre *</label>
                <input type="text" value={firstName}
                  onChange={(e) => { const v = e.target.value; setFirstName(v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()); if (errors.firstName) setErrors(prev => ({...prev, firstName: ''})); }}
                  onFocus={() => openKeyboard('firstName', firstName)} onClick={() => openKeyboard('firstName', firstName)} inputMode="none" readOnly
                  onKeyPress={handleKeyPressNative}
                  className={inputClass('firstName')} placeholder="Nombre"
                  style={{ padding: '6px 10px' }}
                />
                {errors.firstName && <div className="text-red-600 text-xs">{errors.firstName}</div>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Apellido *</label>
                <input type="text" value={lastName}
                  onChange={(e) => { const v = e.target.value; setLastName(v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()); if (errors.lastName) setErrors(prev => ({...prev, lastName: ''})); }}
                  onFocus={() => openKeyboard('lastName', lastName)} onClick={() => openKeyboard('lastName', lastName)} inputMode="none" readOnly
                  onKeyPress={handleKeyPressNative}
                  className={inputClass('lastName')} placeholder="Apellido"
                  style={{ padding: '6px 10px' }}
                />
                {errors.lastName && <div className="text-red-600 text-xs">{errors.lastName}</div>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Hospital <span className="text-gray-400">(opc.)</span></label>
                <input type="text" value={hospitalName}
                  onChange={(e) => { const v = e.target.value; setHospitalName(v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()); }}
                  onFocus={() => openKeyboard('hospitalName', hospitalName)} onClick={() => openKeyboard('hospitalName', hospitalName)} inputMode="none" readOnly
                  onKeyPress={handleKeyPressNative}
                  className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Hospital o clínica"
                  style={{ padding: '6px 10px' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Cód. laboratorio *</label>
                <input type="text" value={labCode}
                  onChange={(e) => setLabCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onFocus={() => openKeyboard('labCode', labCode)} onClick={() => openKeyboard('labCode', labCode)} inputMode="none" readOnly
                  onKeyPress={handleKeyPressNative}
                  className={inputClass('labCode')}
                  placeholder="A1B2C3"
                  maxLength={6}
                  style={{ padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'monospace', fontWeight: '700' }}
                />
                {errors.labCode && <div className="text-red-600 text-xs">{errors.labCode}</div>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">WhatsApp <span className="text-gray-400">(sin 54 9)</span></label>
              <input type="tel" value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                onFocus={() => openKeyboard('whatsapp', whatsapp)} onClick={() => openKeyboard('whatsapp', whatsapp)} inputMode="none" readOnly
                onKeyPress={handleKeyPressNative}
                className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ej: 1155667788"
                style={{ padding: '6px 10px' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Contraseña *</label>
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({...prev, password: ''})); }}
                  onFocus={() => openKeyboard('password', password)} onClick={() => openKeyboard('password', password)} inputMode="none" readOnly
                  onKeyPress={handleKeyPressNative}
                  className={inputClass('password')} placeholder="Mín. 4 caract."
                  style={{ padding: '6px 10px' }}
                />
                {errors.password && <div className="text-red-600 text-xs">{errors.password}</div>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Confirmar *</label>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({...prev, confirmPassword: ''})); }}
                  onFocus={() => openKeyboard('confirmPassword', confirmPassword)} onClick={() => openKeyboard('confirmPassword', confirmPassword)} inputMode="none" readOnly
                  onKeyPress={handleKeyPressNative}
                  className={inputClass('confirmPassword')} placeholder="Repetir"
                  style={{ padding: '6px 10px' }}
                />
                {errors.confirmPassword && <div className="text-red-600 text-xs">{errors.confirmPassword}</div>}
              </div>
            </div>

            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="w-3 h-3" />
              <span className="text-xs text-gray-500">Mostrar contraseñas</span>
            </label>

            <button onClick={handleRegister} disabled={isSubmitting}
              className={`w-full font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 ${
                !isSubmitting ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /><span className="text-sm">Registrando...</span></>
              ) : (
                <><UserPlus size={16} /><span className="text-sm">Registrarse e Ingresar</span></>
              )}
            </button>

            <button onClick={goBack} className="w-full text-sm text-gray-500 hover:text-gray-700 py-1">← Usar otro email</button>
          </div>
        )}

        {/* Recuperación de contraseña */}
        {mode === 'recover' && (
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <Key size={18} className="inline mr-1 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Recuperar contraseña</span>
              <div className="text-xs text-yellow-600 mt-1">{email}</div>
            </div>

            {recoverySuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-green-700 font-medium">Contraseña actualizada correctamente</div>
                <div className="text-xs text-green-600 mt-1">Redirigiendo al login...</div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                  <input type={showPassword ? 'text' : 'password'} value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrors({}); }}
                    onFocus={() => openKeyboard('newPassword', newPassword)} onClick={() => openKeyboard('newPassword', newPassword)} inputMode="none" readOnly
                    onKeyPress={handleKeyPressNative}
                    className={inputClass('newPassword')} placeholder="Mínimo 4 caracteres"
                  />
                  {errors.newPassword && <div className="text-red-600 text-xs mt-0.5">{errors.newPassword}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}); }}
                    onFocus={() => openKeyboard('confirmPassword', confirmPassword)} onClick={() => openKeyboard('confirmPassword', confirmPassword)} inputMode="none" readOnly
                    onKeyPress={handleKeyPressNative}
                    className={inputClass('confirmPassword')} placeholder="Repita la contraseña"
                  />
                  {errors.confirmPassword && <div className="text-red-600 text-xs mt-0.5">{errors.confirmPassword}</div>}
                </div>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="w-3 h-3" />
                  <span className="text-xs text-gray-500">Mostrar contraseñas</span>
                </label>

                <button onClick={handleRecoverPassword}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Key size={18} /><span className="text-sm">Cambiar Contraseña</span>
                </button>
              </>
            )}

            <button onClick={goBack} className="w-full text-sm text-gray-500 hover:text-gray-700 py-1">← Volver al inicio</button>
          </div>
        )}

        <div className="mt-2 text-center">
          <p className="text-xs text-gray-400">
            {(() => { try { const c = JSON.parse(localStorage.getItem('superAdmin_config') || '{}'); return (c.appNombre || 'BiopsyTracker') + ' v' + (c.appVersion || '2.5.0'); } catch { return 'BiopsyTracker v2.5.0'; } })()}
            {onGoToSuperAdmin && (
              <span onClick={onGoToSuperAdmin} className="ml-2 cursor-pointer hover:text-gray-600" style={{ userSelect: 'none' }}>
                 | Super Admin
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Teclado Virtual */}
      {/* Modal de contraseña para doctor/ayudantes */}
      {loginModal?.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Contraseña de {loginModal.nombre}</h3>
            </div>
            <div className="p-5">
              <div className="relative mb-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginModalPassword}
                  onFocus={() => openKeyboard('loginModalPassword', loginModalPassword)}
                  onClick={() => openKeyboard('loginModalPassword', loginModalPassword)}
                  inputMode="none" readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Ingrese contraseña"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.loginModal && (
                <div className="text-red-600 text-sm mb-3 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.loginModal}
                </div>
              )}
            </div>
            <div className="flex gap-2 p-5 border-t border-gray-200">
              <button onClick={() => { setLoginModal(null); setLoginModalPassword(''); setErrors({}); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
                Cancelar
              </button>
              <button onClick={() => {
                if (loginModalPassword === loginModal.expectedPassword) {
                  setLoginModal(null);
                  setLoginModalPassword('');
                  loginModal.loginFn(loginModal.nombre);
                } else {
                  setErrors({ loginModal: 'Contraseña incorrecta' });
                }
              }}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">
                Ingresar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de selección de centro médico */}
      {showCentroSelect && existingDoctor && pendingCargadoPor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Seleccione centro médico</h3>
              <p className="text-sm text-gray-500 mt-1">Dr/a. {existingDoctor.firstName} {existingDoctor.lastName}</p>
            </div>
            <div className="p-5 space-y-2">
              {getHospitales(existingDoctor).map((h, i) => (
                <button key={i}
                  onClick={() => {
                    setShowCentroSelect(false);
                    doLogin(pendingCargadoPor, h);
                  }}
                  className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium rounded-xl border border-blue-200 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-base">{h}</span>
                </button>
              ))}
            </div>
            <div className="p-5 border-t border-gray-200">
              <button onClick={() => { setShowCentroSelect(false); setPendingCargadoPor(null); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {keyboard.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-t-2xl shadow-2xl">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                {keyboard.targetField === 'email' && 'Ingrese su email'}
                {keyboard.targetField === 'password' && 'Ingrese su contraseña'}
                {keyboard.targetField === 'firstName' && 'Ingrese su nombre'}
                {keyboard.targetField === 'lastName' && 'Ingrese su apellido'}
                {keyboard.targetField === 'hospitalName' && 'Ingrese hospital'}
                {keyboard.targetField === 'confirmPassword' && 'Confirme contraseña'}
                {keyboard.targetField === 'newPassword' && 'Nueva contraseña'}
                {keyboard.targetField === 'loginModalPassword' && 'Ingrese contraseña'}
              </h3>
              <button onClick={closeKeyboard} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            <VirtualKeyboard
              keyboard={keyboard}
              onKeyPress={handleVirtualKeyPress}
              onConfirm={closeKeyboard}
              onSwitchType={(type) => setKeyboard(prev => ({ ...prev, type }))}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
