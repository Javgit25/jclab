// Utilidades para manejo de configuración de impresora

export interface PrinterConfig {
  ip: string;
  name: string;
  port: string;
}

// Obtener configuración de impresora del localStorage
export const getPrinterConfig = (): PrinterConfig => {
  return {
    ip: localStorage.getItem('printer_ip') || '',
    name: localStorage.getItem('printer_name') || '',
    port: localStorage.getItem('printer_port') || '9100'
  };
};

// Verificar si hay una impresora configurada
export const isPrinterConfigured = (): boolean => {
  const config = getPrinterConfig();
  return config.ip.trim() !== '';
};

// Validar formato de dirección IP
export const isValidIP = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

// Función simulada para enviar documento a impresora de red
export const sendToPrinter = async (content: string, printerConfig: PrinterConfig): Promise<{ success: boolean; message: string }> => {
  try {
    if (!printerConfig.ip.trim()) {
      return { success: false, message: 'No hay impresora configurada' };
    }

    if (!isValidIP(printerConfig.ip)) {
      return { success: false, message: 'Dirección IP de impresora no válida' };
    }

    console.log(`Enviando documento a impresora ${printerConfig.name} (${printerConfig.ip}:${printerConfig.port})`);
    console.log('Contenido del documento:', content.substring(0, 200) + '...');

    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // En una implementación real, aquí se enviaría el contenido a la impresora
    // usando comandos específicos del fabricante (ESC/POS, PCL, etc.)
    
    // Por ejemplo, para impresoras ESC/POS:
    // const escPos = '\x1B\x40'; // Reset
    // escPos += '\x1B\x61\x01'; // Centrar texto
    // escPos += content;
    // escPos += '\x1D\x56\x00'; // Cortar papel
    
    // fetch(`http://${printerConfig.ip}:${printerConfig.port}/print`, {
    //   method: 'POST',
    //   body: escPos
    // });

    // Simular resultado de impresión (90% éxito)
    const success = Math.random() > 0.1;
    
    if (success) {
      return { 
        success: true, 
        message: `Documento enviado exitosamente a ${printerConfig.name}` 
      };
    } else {
      return { 
        success: false, 
        message: `Error al comunicarse con la impresora ${printerConfig.name}. Verifique que esté encendida y conectada a la red.` 
      };
    }
  } catch (error) {
    console.error('Error al enviar a impresora:', error);
    return { 
      success: false, 
      message: 'Error inesperado al intentar imprimir. Verifique la configuración de red.' 
    };
  }
};

// Función para mostrar diálogo de impresión
export const showPrintDialog = (content: string): void => {
  // Crear ventana temporal para impresión
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Remito - BiopsyTracker</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white; 
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
            }
            .remito-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="remito-container">
            ${content}
          </div>
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="
              padding: 10px 20px; 
              background: #4F76F6; 
              color: white; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer;
              margin-right: 10px;
            ">
              🖨️ Imprimir
            </button>
            <button onclick="window.close()" style="
              padding: 10px 20px; 
              background: #6b7280; 
              color: white; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer;
            ">
              Cerrar
            </button>
          </div>
          <script>
            // Auto-imprimir si es requerido
            // window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
