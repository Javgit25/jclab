import React, { useState } from 'react';
import { Settings, Printer, Wifi, X, Check, AlertCircle } from 'lucide-react';
import { VirtualKeyboard } from './VirtualKeyboard';
import { VirtualKeyboard as VirtualKeyboardType } from '../types';

interface ConfigurationPanelProps {
  onConfigSaved?: () => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onConfigSaved
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'printer' | 'wifi'>('printer');
  const [wifiTesting, setWifiTesting] = useState(false);
  const [wifiTestResult, setWifiTestResult] = useState<'success' | 'error' | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [config, setConfig] = useState({
    printer: {
      ip: localStorage.getItem('printer_ip') || '',
      name: localStorage.getItem('printer_name') || '',
      port: localStorage.getItem('printer_port') || '9100'
    },
    wifi: {
      ssid: localStorage.getItem('wifi_ssid') || '',
      password: localStorage.getItem('wifi_password') || '',
      autoConnect: localStorage.getItem('wifi_auto_connect') === 'true'
    }
  });

  const [keyboard, setKeyboard] = useState<VirtualKeyboardType>({
    isOpen: false,
    type: 'full',
    targetField: '',
    targetValue: ''
  });

  const handleSaveConfig = () => {
    // Guardar configuración de impresora
    localStorage.setItem('printer_ip', config.printer.ip);
    localStorage.setItem('printer_name', config.printer.name);
    localStorage.setItem('printer_port', config.printer.port);
    
    // Guardar configuración de WiFi
    localStorage.setItem('wifi_ssid', config.wifi.ssid);
    localStorage.setItem('wifi_password', config.wifi.password);
    localStorage.setItem('wifi_auto_connect', config.wifi.autoConnect.toString());

    // Mostrar confirmación
    alert('Configuración guardada correctamente');
    setIsOpen(false);
    
    if (onConfigSaved) {
      onConfigSaved();
    }
  };

  const handlePrinterTest = () => {
    if (!config.printer.ip) {
      alert('Por favor ingrese la IP de la impresora');
      return;
    }
    
    // Simular test de impresora
    alert(`Enviando página de prueba a ${config.printer.ip}:${config.printer.port}`);
  };

  const handleWifiConnect = async () => {
    if (!config.wifi.ssid) {
      alert('Por favor ingrese el nombre de la red WiFi');
      return;
    }
    
    setWifiTesting(true);
    setWifiTestResult(null);
    
    // Simular verificación de WiFi con timeout
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simular 70% de éxito
          if (Math.random() > 0.3) {
            resolve(true);
          } else {
            reject(new Error('Error de conexión'));
          }
        }, 2000);
      });
      
      setWifiTestResult('success');
      // Guardar automáticamente si la conexión es exitosa
      localStorage.setItem('wifi_ssid', config.wifi.ssid);
      localStorage.setItem('wifi_password', config.wifi.password);
      localStorage.setItem('wifi_auto_connect', config.wifi.autoConnect.toString());
      
    } catch (error) {
      setWifiTestResult('error');
    } finally {
      setWifiTesting(false);
    }
  };

  // Funciones del teclado virtual
  const openKeyboard = (field: string, currentValue: string) => {
    setKeyboard({
      isOpen: true,
      type: 'full',
      targetField: field,
      targetValue: currentValue
    });
  };

  const closeKeyboard = () => {
    setKeyboard(prev => ({ ...prev, isOpen: false }));
  };

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setKeyboard(prev => ({
        ...prev,
        targetValue: prev.targetValue.slice(0, -1)
      }));
    } else if (key === 'clear') {
      setKeyboard(prev => ({
        ...prev,
        targetValue: ''
      }));
    } else if (key === 'space') {
      setKeyboard(prev => ({
        ...prev,
        targetValue: prev.targetValue + ' '
      }));
    } else if (key === 'shift') {
      setIsShiftPressed(!isShiftPressed);
    } else {
      let finalKey = key;
      
      // Aplicar mayúsculas/minúsculas para letras
      if (key.match(/[a-zA-Z]/)) {
        finalKey = isShiftPressed ? key.toUpperCase() : key.toLowerCase();
        // Resetear shift después de presionar una letra
        setIsShiftPressed(false);
      }
      
      setKeyboard(prev => ({
        ...prev,
        targetValue: prev.targetValue + finalKey
      }));
    }
  };

  const handleKeyboardConfirm = () => {
    const { targetField, targetValue } = keyboard;
    
    if (targetField.startsWith('printer_')) {
      const field = targetField.replace('printer_', '');
      setConfig(prev => ({
        ...prev,
        printer: {
          ...prev.printer,
          [field]: targetValue
        }
      }));
    } else if (targetField.startsWith('wifi_')) {
      const field = targetField.replace('wifi_', '');
      setConfig(prev => ({
        ...prev,
        wifi: {
          ...prev.wifi,
          [field]: targetValue
        }
      }));
    }
    
    closeKeyboard();
  };

  const switchKeyboardType = (type: 'numeric' | 'full') => {
    setKeyboard(prev => ({ ...prev, type }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 10px',
          backgroundColor: 'rgba(59, 130, 246, 0.9)', // Fondo azul más sólido
          border: 'none',
          borderRadius: '6px',
          color: 'white', // Texto blanco sobre fondo azul
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          opacity: 1,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 1)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }}
      >
        <Settings size={14} />
        Config
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '500px',
        height: 'auto',
        maxHeight: 'none',
        overflow: 'visible',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#2d3748',  // Color oscuro más legible
          padding: '20px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={24} style={{ color: 'white' }} />
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'white' }}>
              Configuración del Sistema
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>



        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('printer')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              backgroundColor: activeTab === 'printer' ? '#f3f4f6' : 'transparent',
              borderBottom: activeTab === 'printer' ? '2px solid #667eea' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === 'printer' ? '#667eea' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Printer size={16} />
            Impresora
          </button>
          <button
            onClick={() => setActiveTab('wifi')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              backgroundColor: activeTab === 'wifi' ? '#f3f4f6' : 'transparent',
              borderBottom: activeTab === 'wifi' ? '2px solid #667eea' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === 'wifi' ? '#667eea' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Wifi size={16} />
            WiFi
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', flex: 1, minHeight: 0 }}>
          {activeTab === 'printer' && (
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Printer size={18} />
                Configuración de Impresora
              </h3>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Nombre de la Impresora
                </label>
                <input
                  type="text"
                  value={config.printer.name}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    printer: { ...prev.printer, name: e.target.value }
                  }))}
                  onFocus={() => openKeyboard('printer_name', config.printer.name)}
                  placeholder="Ej: Impresora Principal"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Dirección IP
                </label>
                <input
                  type="text"
                  value={config.printer.ip}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    printer: { ...prev.printer, ip: e.target.value }
                  }))}
                  onFocus={() => openKeyboard('printer_ip', config.printer.ip)}
                  placeholder="192.168.1.100"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Puerto
                </label>
                <input
                  type="text"
                  value={config.printer.port}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    printer: { ...prev.printer, port: e.target.value }
                  }))}
                  onFocus={() => openKeyboard('printer_port', config.printer.port)}
                  placeholder="9100"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <AlertCircle size={16} style={{ color: '#2563eb' }} />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af' }}>
                    Información
                  </span>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#1e40af',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Asegúrese de que la impresora esté conectada a la misma red WiFi y que tenga habilitada la impresión por red.
                </p>
              </div>

              <button
                onClick={handlePrinterTest}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                🖨️ Probar Impresora
              </button>
            </div>
          )}

          {activeTab === 'wifi' && (
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Wifi size={18} />
                Configuración de WiFi
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Nombre de la Red (SSID)
                </label>
                <input
                  type="text"
                  value={config.wifi.ssid}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    wifi: { ...prev.wifi, ssid: e.target.value }
                  }))}
                  onFocus={() => openKeyboard('wifi_ssid', config.wifi.ssid)}
                  placeholder="Nombre de la red WiFi"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={config.wifi.password}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    wifi: { ...prev.wifi, password: e.target.value }
                  }))}
                  onFocus={() => openKeyboard('wifi_password', config.wifi.password)}
                  placeholder="Contraseña de la red"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <input
                  type="checkbox"
                  checked={config.wifi.autoConnect}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    wifi: { ...prev.wifi, autoConnect: e.target.checked }
                  }))}
                  style={{ width: '16px', height: '16px' }}
                />
                <label style={{
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  Conectar automáticamente al iniciar
                </label>
              </div>

              {/* Resultado de la verificación WiFi */}
              {wifiTestResult && (
                <div style={{
                  background: wifiTestResult === 'success' ? '#dcfce7' : '#fee2e2',
                  border: `1px solid ${wifiTestResult === 'success' ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    {wifiTestResult === 'success' ? (
                      <Check size={16} style={{ color: '#16a34a' }} />
                    ) : (
                      <AlertCircle size={16} style={{ color: '#dc2626' }} />
                    )}
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: wifiTestResult === 'success' ? '#16a34a' : '#dc2626' 
                    }}>
                      {wifiTestResult === 'success' ? 'Conexión exitosa' : 'Error de conexión'}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: wifiTestResult === 'success' ? '#16a34a' : '#dc2626',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {wifiTestResult === 'success' 
                      ? 'La conexión WiFi se estableció correctamente. La configuración se ha guardado automáticamente.'
                      : 'No se pudo conectar a la red WiFi. Verifique el nombre de la red y la contraseña.'
                    }
                  </p>
                </div>
              )}

              <div style={{
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <AlertCircle size={16} style={{ color: '#d97706' }} />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#92400e' }}>
                    Importante
                  </span>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#92400e',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  La aplicación puede funcionar sin conexión a internet. Los datos se guardarán localmente y se sincronizarán cuando haya conexión.
                </p>
              </div>

              <button
                onClick={handleWifiConnect}
                disabled={wifiTesting}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: wifiTesting 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: wifiTesting ? 'not-allowed' : 'pointer',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {wifiTesting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Verificando conexión...
                  </>
                ) : (
                  <>
                    📶 Conectar a WiFi
                  </>
                )}
              </button>

              {/* CSS para la animación de carga */}
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* Botones de acción */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveConfig}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Check size={16} />
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Teclado Virtual */}
      {keyboard.isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              {keyboard.targetField.includes('wifi') ? 'WiFi' : 'Impresora'} - {keyboard.targetField.replace(/^(wifi_|printer_)/, '')}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsShiftPressed(!isShiftPressed)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: isShiftPressed ? '#3b82f6' : '#e5e7eb',
                  color: isShiftPressed ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {isShiftPressed ? 'ABC' : 'abc'}
              </button>
              <button
                onClick={closeKeyboard}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✕ Cerrar
              </button>
            </div>
          </div>
          <VirtualKeyboard
            keyboard={keyboard}
            onKeyPress={handleKeyPress}
            onConfirm={handleKeyboardConfirm}
            onSwitchType={switchKeyboardType}
            isShiftPressed={isShiftPressed}
          />
        </div>
      )}
    </div>
  );
};

export default ConfigurationPanel;
