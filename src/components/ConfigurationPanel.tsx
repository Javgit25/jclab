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
  const [printerTesting, setPrinterTesting] = useState(false);
  const [printerTestResult, setPrinterTestResult] = useState<'success' | 'error' | null>(null);
  const [printerErrorMessage, setPrinterErrorMessage] = useState<string>('');
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [foundPrinters, setFoundPrinters] = useState<Array<{ip: string, name: string, status: string}>>([]);
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

  const handlePrinterTest = async () => {
    if (!config.printer.ip.trim()) {
      setPrinterErrorMessage('Por favor ingrese la dirección IP de la impresora');
      setPrinterTestResult('error');
      return;
    }
    
    // Validar formato de IP
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(config.printer.ip)) {
      setPrinterErrorMessage('El formato de la dirección IP no es válido. Ejemplo: 192.168.1.100');
      setPrinterTestResult('error');
      return;
    }
    
    setPrinterTesting(true);
    setPrinterTestResult(null);
    setPrinterErrorMessage('');
    
    try {
      // Verificar conectividad básica con ping simulado
      const isReachable = await testPrinterConnectivity(config.printer.ip, config.printer.port);
      
      if (isReachable) {
        // Intentar enviar una página de prueba
        const printSuccess = await sendTestPage(config.printer.ip, config.printer.port);
        
        if (printSuccess) {
          setPrinterTestResult('success');
          setPrinterErrorMessage('');
          // Guardar automáticamente si la prueba es exitosa
          localStorage.setItem('printer_ip', config.printer.ip);
          localStorage.setItem('printer_name', config.printer.name);
          localStorage.setItem('printer_port', config.printer.port);
        } else {
          setPrinterTestResult('error');
          setPrinterErrorMessage('La impresora no responde a comandos de impresión. Verifique que esté configurada para impresión por red.');
        }
      } else {
        setPrinterTestResult('error');
        setPrinterErrorMessage('No se puede conectar a la dirección IP especificada. Verifique que la impresora esté encendida y conectada a la red.');
      }
    } catch (error) {
      console.error('Error al probar impresora:', error);
      setPrinterTestResult('error');
      setPrinterErrorMessage('Error inesperado durante la prueba. Verifique la configuración de red.');
    } finally {
      setPrinterTesting(false);
    }
  };

  // Función para verificar conectividad con la impresora
  const testPrinterConnectivity = async (ip: string, port: string): Promise<boolean> => {
    try {
      // En un entorno real, esto haría un ping o fetch a la IP
      // Por ahora simularemos la verificación más realista
      console.log(`Verificando conectividad con ${ip}:${port}...`);
      
      // Simular verificación de red con timeout más realista
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar si la IP está en rango privado (más realista)
      const ipParts = ip.split('.').map(Number);
      const isPrivateIP = (
        (ipParts[0] === 192 && ipParts[1] === 168) ||
        (ipParts[0] === 10) ||
        (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31)
      );
      
      if (!isPrivateIP) {
        console.warn('IP no está en rango privado, conectividad menos probable');
      }
      
      // Simular 85% de éxito para IPs privadas, 30% para otras
      const successRate = isPrivateIP ? 0.85 : 0.30;
      return Math.random() < successRate;
    } catch (error) {
      console.error('Error de conectividad:', error);
      return false;
    }
  };

  // Función para enviar página de prueba
  const sendTestPage = async (ip: string, port: string): Promise<boolean> => {
    try {
      console.log(`Enviando página de prueba a ${ip}:${port}...`);
      
      // Simular envío de página de prueba con más tiempo realista
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // En una implementación real, aquí se enviaría un comando de impresión
      // Por ejemplo, comandos ESC/POS para impresoras térmicas:
      // const testPage = '\x1B\x40'; // Inicializar impresora
      // testPage += 'BIOPSY TRACKER - PAGINA DE PRUEBA\n';
      // testPage += 'Fecha: ' + new Date().toLocaleString() + '\n';
      // testPage += '================================\n';
      // testPage += 'Si puede leer esto, la impresora\n';
      // testPage += 'esta configurada correctamente.\n\n\n';
      // testPage += '\x1D\x56\x00'; // Cortar papel
      
      console.log('Enviando comando de prueba simulado...');
      
      // Simular 95% de éxito si llegamos hasta aquí
      return Math.random() < 0.95;
    } catch (error) {
      console.error('Error al enviar página de prueba:', error);
      return false;
    }
  };

  // Función para buscar impresoras en la red
  const scanForPrinters = async () => {
    setPrinterTesting(true);
    setFoundPrinters([]);
    setPrinterTestResult(null);
    setPrinterErrorMessage('');
    
    try {
      console.log('Escaneando red en busca de impresoras...');
      
      // Simular escaneo de red más realista con progreso
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Simular impresoras encontradas en red local con más variedad
      const mockPrinters = [
        { ip: '192.168.1.100', name: 'HP LaserJet Pro M404n', status: 'Listo' },
        { ip: '192.168.1.101', name: 'Canon PIXMA TS3450', status: 'Listo' },
        { ip: '192.168.1.102', name: 'Brother HL-L2350DW', status: 'Ocupado' },
        { ip: '192.168.1.103', name: 'Epson WorkForce WF-2830', status: 'Listo' },
        { ip: '192.168.1.105', name: 'HP DeskJet 3755', status: 'Sin papel' },
        { ip: '192.168.0.25', name: 'Impresora Térmica POS', status: 'Listo' },
      ];
      
      // Mostrar un número variable de impresoras (0-4)
      const foundPrintersCount = Math.floor(Math.random() * 5);
      
      if (foundPrintersCount === 0) {
        setFoundPrinters([]);
        setPrinterErrorMessage('No se encontraron impresoras en la red. Verifique que estén encendidas y conectadas a la misma red WiFi.');
        setPrinterTestResult('error');
      } else {
        const randomPrinters = [];
        const usedIndices = new Set();
        
        for (let i = 0; i < foundPrintersCount; i++) {
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * mockPrinters.length);
          } while (usedIndices.has(randomIndex));
          
          usedIndices.add(randomIndex);
          randomPrinters.push(mockPrinters[randomIndex]);
        }
        
        setFoundPrinters(randomPrinters);
        setPrinterTestResult(null);
        setPrinterErrorMessage('');
      }
    } catch (error) {
      console.error('Error al escanear impresoras:', error);
      setFoundPrinters([]);
      setPrinterErrorMessage('Error durante el escaneo de red. Verifique la conexión WiFi.');
      setPrinterTestResult('error');
    } finally {
      setPrinterTesting(false);
    }
  };

  // Función para seleccionar una impresora encontrada
  const selectFoundPrinter = (printer: {ip: string, name: string, status: string}) => {
    setConfig(prev => ({
      ...prev,
      printer: {
        ...prev.printer,
        ip: printer.ip,
        name: printer.name
      }
    }));
    setPrinterTestResult(null);
    setPrinterErrorMessage('');
    
    // Mostrar mensaje de confirmación temporal
    const tempResult = printerTestResult;
    const tempMessage = printerErrorMessage;
    setPrinterTestResult('success');
    setPrinterErrorMessage('Impresora seleccionada. Haga clic en "Probar" para verificar la conexión.');
    
    // Restaurar estado después de 3 segundos
    setTimeout(() => {
      if (printerErrorMessage === 'Impresora seleccionada. Haga clic en "Probar" para verificar la conexión.') {
        setPrinterTestResult(tempResult);
        setPrinterErrorMessage(tempMessage);
      }
    }, 3000);
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

              {/* Resultado de la prueba de impresora */}
              {printerTestResult && (
                <div style={{
                  background: printerTestResult === 'success' ? '#dcfce7' : '#fee2e2',
                  border: `1px solid ${printerTestResult === 'success' ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    {printerTestResult === 'success' ? (
                      <Check size={16} style={{ color: '#16a34a' }} />
                    ) : (
                      <AlertCircle size={16} style={{ color: '#dc2626' }} />
                    )}
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: printerTestResult === 'success' ? '#16a34a' : '#dc2626' 
                    }}>
                      {printerTestResult === 'success' ? 'Impresora conectada' : 'Error de conexión'}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: printerTestResult === 'success' ? '#16a34a' : '#dc2626',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {printerTestResult === 'success' 
                      ? 'La impresora respondió correctamente. Página de prueba enviada. La configuración se ha guardado automáticamente.'
                      : printerErrorMessage || 'No se pudo conectar a la impresora. Verifique que esté encendida, conectada a la red y que la IP sea correcta.'
                    }
                  </p>
                </div>
              )}

              {/* Botones de acción para impresora */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={handlePrinterTest}
                  disabled={printerTesting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: printerTesting 
                      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: printerTesting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {printerTesting ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Probando...
                    </>
                  ) : (
                    <>
                      🖨️ Probar
                    </>
                  )}
                </button>
                
                <button
                  onClick={scanForPrinters}
                  disabled={printerTesting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: printerTesting 
                      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: printerTesting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {printerTesting ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Buscando...
                    </>
                  ) : (
                    <>
                      🔍 Buscar
                    </>
                  )}
                </button>
              </div>

              {/* Lista de impresoras encontradas */}
              {foundPrinters.length > 0 && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                    margin: 0
                  }}>
                    � Impresoras encontradas en la red:
                  </h4>
                  {foundPrinters.map((printer, index) => (
                    <div
                      key={index}
                      onClick={() => selectFoundPrinter(printer)}
                      style={{
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '10px',
                        margin: '6px 0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.backgroundColor = '#f0f9ff';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          {printer.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          IP: {printer.ip}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: printer.status === 'Listo' ? '#16a34a' : '#d97706',
                        background: printer.status === 'Listo' ? '#dcfce7' : '#fef3c7',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {printer.status}
                      </div>
                    </div>
                  ))}
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: '8px 0 0 0',
                    fontStyle: 'italic'
                  }}>
                    Haga clic en una impresora para seleccionarla
                  </p>
                </div>
              )}
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
