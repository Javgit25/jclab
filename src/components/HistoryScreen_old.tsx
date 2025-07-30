import React, { useState } from 'react';
import { ArrowLeft, Printer, Mail, Calendar, FileText, Trash2 } from 'lucide-react';
import { BiopsyForm, DoctorInfo, HistoryEntry } from '../types';
import { ConnectionStatus } from './ConnectionStatus';
import { serviciosAdicionales, giemsaOptions } from '../constants/services';

interface HistoryScreenProps {
  doctorInfo: DoctorInfo;
  historyEntries: HistoryEntry[];
  isOnline: boolean;
  backupStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncQueueLength: number;
  onGoBack: () => void;
  onDeleteEntry: (entryId: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  doctorInfo,
  historyEntries,
  isOnline,
  backupStatus,
  syncQueueLength,
  onGoBack,
  onDeleteEntry
}) => {
  const [emailPopup, setEmailPopup] = useState<{isOpen: boolean, entry: HistoryEntry | null}>({
    isOpen: false,
    entry: null
  });
  const [emailAddress, setEmailAddress] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, entryId: string | null}>({
    isOpen: false,
    entryId: null
  });

  // ✅ FUNCIÓN DE IMPRIMIR MEJORADA - FUERZA APERTURA DE VENTANA
  const handlePrint = (entry: HistoryEntry) => {
    console.log('🖨️ Iniciando impresión para entry:', entry.id);
    
    try {
      // Primero intentar con configuración más permisiva
      let printWindow = window.open('', 'printWindow', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (!printWindow || printWindow.closed) {
        console.log('⚠️ Primera tentativa falló, intentando método alternativo...');
        
        // Intentar con un nombre específico
        printWindow = window.open('about:blank', '_blank');
      }
      
      if (!printWindow || printWindow.closed) {
        console.log('⚠️ Segunda tentativa falló, usando iframe...');
        
        // Método 3: Usar iframe oculto
        const printContent = createPrintContent(entry);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.left = '-600px';
        iframe.style.top = '-600px';
        
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(printContent);
          iframeDoc.close();
          
          setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
          }, 500);
          
          console.log('✅ Usando método iframe para imprimir');
          return;
        }
      }
      
      if (printWindow && !printWindow.closed) {
        console.log('✅ Ventana de impresión abierta exitosamente');
        
        const printContent = createPrintContent(entry);
        
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Mejorar el timing de impresión
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            
            // No cerrar automáticamente para que el usuario pueda reimprimir
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close();
              }
            }, 2000);
          }, 300);
        };
        
        console.log('✅ Contenido escrito en ventana de impresión');
      } else {
        throw new Error('No se pudo abrir ventana de impresión');
      }
      
    } catch (error) {
      console.error('❌ Error al imprimir:', error);
      
      // Último recurso: mostrar instrucciones
      alert(`❌ Tu navegador está bloqueando ventanas emergentes.\n\n📝 INSTRUCCIONES:\n\n1. Permite ventanas emergentes para este sitio\n2. O usa Ctrl+P en esta página para imprimir\n3. O contacta soporte técnico\n\nError: ${error.message}`);
    }
  };

  // ✅ FUNCIÓN PARA CREAR CONTENIDO DE IMPRESIÓN MÁS ROBUSTO
  const createPrintContent = (entry: HistoryEntry): string => {
    const biopsyRows = entry.biopsies.map((biopsy, index) => {
      const servicios = getServiciosActivos(biopsy);
      
      // Escapar caracteres especiales
      const escape = (str: any) => {
        if (!str) return '';
        return String(str).replace(/[<>&"']/g, (c) => {
          const map: Record<string, string> = {'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'": '&#39;'};
          return map[c] || c;
        });
      };
      
      return `
        <tr style="page-break-inside: avoid;">
          <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">#${escape(biopsy.number)}</td>
          <td style="border: 1px solid #333; padding: 6px;">${escape(biopsy.tissueType)}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${escape(biopsy.type || '-')}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">
            ${biopsy.tissueType === 'PAP' ? (biopsy.papQuantity || 0) + ' vidrios' : 
              biopsy.tissueType === 'Citología' ? (biopsy.citologiaQuantity || 0) + ' vidrios' : 
              (biopsy.cassettes || 0) + ' cassettes'}
          </td>
          <td style="border: 1px solid #333; padding: 6px; font-size: 11px;">${escape(biopsy.pieces || '-')}</td>
          <td style="border: 1px solid #333; padding: 6px; font-size: 10px;">${escape(servicios.join(', ') || 'Ninguno')}</td>
          <td style="border: 1px solid #333; padding: 6px; font-size: 10px;">${escape(biopsy.observations || '-')}</td>
        </tr>
      `;
    }).join('');

    // ✅ FORMATEAR FECHA EN ESPAÑOL
    const formatDateInSpanish = (dateString: string) => {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('es-AR', options);
    };

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title></title>
  <style>
    @page { 
      margin: 15mm; 
      size: A4 landscape;
      /* ✅ ELIMINAR TODOS LOS HEADERS Y FOOTERS DEL NAVEGADOR */
      @top-left { content: ""; }
      @top-center { content: ""; }
      @top-right { content: ""; }
      @bottom-left { content: ""; }
      @bottom-center { content: ""; }
      @bottom-right { content: ""; }
    }
    
    body { 
      font-family: Arial, sans-serif; 
      font-size: 11px; 
      margin: 0; 
      padding: 0; 
      line-height: 1.3;
    }
    
    .header { 
      text-align: center; 
      margin-bottom: 20px; 
      border-bottom: 2px solid #333; 
      padding-bottom: 10px; 
      page-break-inside: avoid;
    }
    
    .header h1 { 
      margin: 0 0 5px 0; 
      font-size: 22px; 
      font-weight: bold;
      color: #333;
    }
    
    .header .system-name { 
      margin: 0 0 10px 0; 
      font-size: 16px; 
      color: #0066cc;
      font-weight: bold;
    }
    
    .header p { 
      margin: 4px 0; 
      font-size: 13px;
    }
    
    .info { 
      background-color: #f8f9fa; 
      padding: 10px; 
      margin-bottom: 15px; 
      border-radius: 4px;
      font-size: 12px;
      text-align: center;
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 10px;
      page-break-inside: auto;
      /* ✅ ASEGURAR BORDES COMPLETOS */
      border: 1px solid #333;
    }
    
    th { 
      background-color: #e9ecef; 
      border: 1px solid #333; 
      padding: 6px; 
      text-align: center; 
      font-weight: bold; 
      font-size: 9px;
      page-break-inside: avoid;
    }
    
    td {
      border: 1px solid #333;
      padding: 6px;
    }
    
    .print-btn { 
      margin: 15px 0; 
      text-align: center; 
      page-break-inside: avoid;
    }
    
    .print-btn button { 
      padding: 12px 24px; 
      font-size: 14px; 
      background: #007bff; 
      color: white; 
      border: none; 
      border-radius: 4px;
      cursor: pointer;
    }
    
    .print-btn button:hover {
      background: #0056b3;
    }
    
    .footer { 
      margin-top: 20px; 
      text-align: center; 
      font-size: 9px; 
      color: #666; 
      page-break-inside: avoid;
    }
    
    /* ✅ ELIMINACIÓN COMPLETA DE HEADERS/FOOTERS DEL NAVEGADOR */
    @media print { 
      .print-btn { display: none; }
      body { font-size: 10px; }
      th, td { font-size: 9px; padding: 4px; }
      
      /* Configuración avanzada de página */
      @page {
        margin-top: 10mm;
        margin-bottom: 10mm;
        margin-left: 15mm;
        margin-right: 15mm;
        
        /* Eliminar todos los contenidos automáticos */
        @top-left-corner { content: ""; }
        @top-left { content: ""; }
        @top-center { content: ""; }
        @top-right { content: ""; }
        @top-right-corner { content: ""; }
        @bottom-left-corner { content: ""; }
        @bottom-left { content: ""; }
        @bottom-center { content: ""; }
        @bottom-right { content: ""; }
        @bottom-right-corner { content: ""; }
        @left-top { content: ""; }
        @left-middle { content: ""; }
        @left-bottom { content: ""; }
        @right-top { content: ""; }
        @right-middle { content: ""; }
        @right-bottom { content: ""; }
      }
      
      /* Ocultar elementos automáticos del navegador */
      body::before,
      body::after,
      html::before,
      html::after {
        content: "" !important;
        display: none !important;
      }
      
      /* Resetear cualquier contenido automático */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>REMITO DE BIOPSIAS</h1>
    <p class="system-name">BiopsyTracker</p>
    <p><strong>Dr. ${doctorInfo.firstName} ${doctorInfo.lastName}</strong></p>
    ${doctorInfo.hospitalName ? `<p>${doctorInfo.hospitalName}</p>` : ''}
    <p>Fecha: <strong>${formatDateInSpanish(entry.date)}</strong></p>
  </div>
  
  <div class="info">
    <strong>Total de biopsias:</strong> ${entry.biopsies.length} | 
    <strong>Con servicios adicionales:</strong> ${entry.biopsies.filter(b => getServiciosActivos(b).length > 0).length}
  </div>
  
  <div class="print-btn">
    <button onclick="window.print(); return false;">🖨️ IMPRIMIR REMITO</button>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 10%;">N° Biopsia</th>
        <th style="width: 20%;">Tipo de Tejido</th>
        <th style="width: 8%;">Tipo</th>
        <th style="width: 12%;">Cantidad</th>
        <th style="width: 8%;">Trozos</th>
        <th style="width: 22%;">Servicios</th>
        <th style="width: 20%;">Observaciones</th>
      </tr>
    </thead>
    <tbody>
      ${biopsyRows}
    </tbody>
  </table>

  <div class="footer">
    <p>BiopsyTracker</p>
  </div>
  
  <script>
    // ✅ CONFIGURACIÓN COMPLETA PARA ELIMINAR HEADERS/FOOTERS
    window.onload = function() {
      window.focus();
      
      // Limpiar completamente el título y URL
      document.title = '';
      
      // Configurar impresión sin headers
      if (window.print) {
        // Intentar ocultar URL del documento
        Object.defineProperty(document, 'URL', {
          value: '',
          writable: false
        });
        
        // Limpiar referrer
        Object.defineProperty(document, 'referrer', {
          value: '',
          writable: false
        });
      }
    };
    
    // Función adicional para configuración de impresión
    window.addEventListener('beforeprint', function() {
      document.title = '';
    });
  </script>
</body>
</html>`;
  };

  // ✅ FUNCIÓN DE ELIMINAR MEJORADA CON POPUP PERSONALIZADO
  const handleDelete = (entryId: string) => {
    console.log('🗑️ Solicitando confirmación para eliminar ID:', entryId);
    setDeleteConfirm({ isOpen: true, entryId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.entryId) return;
    
    console.log('🗑️ Confirmando eliminación para ID:', deleteConfirm.entryId);
    
    try {
      await onDeleteEntry(deleteConfirm.entryId);
      setDeleteConfirm({ isOpen: false, entryId: null });
      console.log('✅ Remito eliminado exitosamente');
      
      // Mostrar confirmación visual
      alert('✅ Remito eliminado del historial');
      
    } catch (error) {
      console.error('❌ Error al eliminar:', error);
      alert(`Error al eliminar el remito: ${error.message}`);
    }
  };

  const cancelDelete = () => {
    console.log('❌ Eliminación cancelada por el usuario');
    setDeleteConfirm({ isOpen: false, entryId: null });
  };

  // Función para obtener servicios activos
  const getServiciosActivos = (biopsy: BiopsyForm): string[] => {
    const serviciosActivos: string[] = [];
    
    if (!biopsy.servicios) return serviciosActivos;

    if (biopsy.tissueType === 'PAP') {
      if (biopsy.papUrgente) {
        serviciosActivos.push('PAP Urgente');
      } else if (biopsy.papQuantity && biopsy.papQuantity > 0) {
        serviciosActivos.push('PAP');
      }
      return serviciosActivos;
    }

    if (biopsy.tissueType === 'Citología') {
      if (biopsy.citologiaUrgente) {
        serviciosActivos.push('Citología Urgente');
      } else if (biopsy.citologiaQuantity && biopsy.citologiaQuantity > 0) {
        serviciosActivos.push('Citología');
      }
      return serviciosActivos;
    }

    Object.entries(biopsy.servicios).forEach(([key, value]) => {
      if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
        const servicio = serviciosAdicionales.find(s => s.key === key);
        if (servicio) {
          let servicioLabel = servicio.label;
          
          if (key === 'corteBlancoIHQ') {
            const quantity = biopsy.servicios.corteBlancoIHQQuantity || 1;
            servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
          } else if (key === 'corteBlancoComun') {
            const quantity = biopsy.servicios.corteBlancoComunQuantity || 1;
            servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
          }
          
          if (key === 'giemsaPASMasson' && biopsy.servicios.giemsaOptions) {
            const giemsaSelected = Object.entries(biopsy.servicios.giemsaOptions)
              .filter(([_, selected]) => selected)
              .map(([optionKey, _]) => {
                const option = giemsaOptions.find(opt => opt.key === optionKey);
                return option ? option.label : optionKey;
              });
            
            if (giemsaSelected.length > 0) {
              servicioLabel = giemsaSelected.join(', ');
            }
          }
          
          serviciosActivos.push(servicioLabel);
        }
      }
    });

    return serviciosActivos;
  };

  // Función para email
  const handleEmail = (entry: HistoryEntry) => {
    console.log('📧 Abriendo popup de email para entry:', entry.id);
    setEmailPopup({ isOpen: true, entry });
  };

  // Función para generar CSV
  const generateCSV = (biopsies: BiopsyForm[], doctorInfo: DoctorInfo, date: string) => {
    const headers = [
      'Número de Biopsia',
      'Tipo de Tejido',
      'Tipo (BX/PQ)',
      'Cantidad Cassettes',
      'Servicios Adicionales',
      'Observaciones'
    ];

    const csvContent = [
      `Remito del día - Dr. ${doctorInfo.firstName} ${doctorInfo.lastName}`,
      `Fecha: ${date}`,
      `Total de biopsias: ${biopsies.length}`,
      '',
      headers.join(','),
      ...biopsies.map(biopsy => {
        const serviciosActivos = getServiciosActivos(biopsy);
        return [
          biopsy.number,
          `"${biopsy.tissueType}"`,
          biopsy.type || '-',
          biopsy.tissueType === 'PAP' ? biopsy.papQuantity : 
          biopsy.tissueType === 'Citología' ? biopsy.citologiaQuantity : 
          biopsy.cassettes,
          `"${serviciosActivos.join(', ')}"`,
          `"${biopsy.observations || ''}"`
        ].join(',');
      })
    ].join('\n');

    return csvContent;
  };

  const confirmSendEmail = () => {
    if (!emailAddress || !emailPopup.entry) return;

    try {
      const csvContent = generateCSV(emailPopup.entry.biopsies, doctorInfo, emailPopup.entry.date);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const subject = `Remito de Biopsias - Dr. ${doctorInfo.firstName} ${doctorInfo.lastName} - ${emailPopup.entry.date}`;
      const body = `Adjunto remito del día ${emailPopup.entry.date} con ${emailPopup.entry.biopsies.length} biopsias.\n\nDr. ${doctorInfo.firstName} ${doctorInfo.lastName}${doctorInfo.hospitalName ? `\n${doctorInfo.hospitalName}` : ''}`;

      const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Remito_${doctorInfo.firstName}_${doctorInfo.lastName}_${emailPopup.entry.date.replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setEmailPopup({ isOpen: false, entry: null });
      setEmailAddress('');

      alert(`📧 Email preparado para enviar a: ${emailAddress}\n\n💾 El archivo CSV también se descargó.`);
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      alert('Error al preparar el email. Por favor, intenta nuevamente.');
    }
  };

  if (!doctorInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center space-x-3">
            <button onClick={onGoBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Error</h2>
          </div>
        </div>
        <div className="max-w-md mx-auto p-4 text-center py-12">
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Error: Información del doctor no disponible
          </h3>
          <button onClick={onGoBack} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const entries = historyEntries || [];
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header Compacto y Limpio - MISMA METODOLOGÍA */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 16px',
        flexShrink: 0,
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
        margin: '16px 16px 8px 16px',
        maxWidth: 'none',
        width: 'calc(100% - 32px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px',
              borderRadius: '12px',
              position: 'relative',
              backdropFilter: 'blur(10px)'
            }}>
              <Calendar style={{ height: '20px', width: '20px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>Historial de Remitos</h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
              }}>
                {entries.length} remito{entries.length !== 1 ? 's' : ''} guardado{entries.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Navegación integrada en el header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ConnectionStatus 
              isOnline={isOnline}
              backupStatus={backupStatus}
              syncQueueLength={syncQueueLength}
            />
            <button
              onClick={onGoBack}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ArrowLeft size={16} />
              Volver
            </button>
          </div>
        </div>
      </div>

      {/* Título principal fuera del box - MISMA METODOLOGÍA */}
      <div style={{ 
        padding: '8px 24px 8px 24px',
        flexShrink: 0
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: 0,
          textAlign: 'left'
        }}>
          Remitos Guardados
        </h2>
      </div>

      {/* Contenido principal con scroll */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 24px 24px 24px'
      }}>
        {entries.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            padding: '48px 24px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <Calendar style={{ 
                height: '48px', 
                width: '48px', 
                color: '#9CA3AF',
                margin: '0 auto'
              }} />
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#4B5563',
              margin: '0 0 12px 0'
            }}>
              No hay remitos en el historial
            </h3>
            <p style={{
              color: '#6B7280',
              margin: '0 0 24px 0',
              fontSize: '16px'
            }}>
              Los remitos finalizados aparecerán aquí
            </p>
            <button 
              onClick={onGoBack}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
            >
              Volver al Inicio
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '20px'
          }}>
            {sortedEntries.map((entry) => (
              <div key={entry.id} style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                {/* Header del remito */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0f4ff 0%, #e0edff 100%)',
                  padding: '20px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText style={{ height: '24px', width: '24px', color: 'white' }} />
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0 0 4px 0'
                        }}>
                          Remito del {new Date(entry.date).toLocaleDateString('es-AR')}
                        </h4>
                        <p style={{
                          fontSize: '14px',
                          color: '#6B7280',
                          margin: 0
                        }}>
                          {entry.biopsies.length} biopsia{entry.biopsies.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        fontSize: '12px',
                        color: '#9CA3AF',
                        margin: 0
                      }}>
                        {new Date(entry.timestamp).toLocaleTimeString('es-AR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contenido del remito */}
                <div style={{ padding: '20px' }}>
                  {/* Estadísticas */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      fontSize: '14px'
                    }}>
                      <div>
                        <p style={{ color: '#6B7280', margin: '0 0 4px 0' }}>Total Biopsias</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                          {entry.biopsies.length}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#6B7280', margin: '0 0 4px 0' }}>Con Servicios</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                          {entry.biopsies.filter((b: any) => getServiciosActivos(b).length > 0).length}
                        </p>
                      </div>
                    </div>
                  </div>

                {/* Preview de biopsias */}
                {entry.biopsies.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <p className="text-xs text-blue-800 font-medium mb-2">📋 Biopsias incluidas:</p>
                    <div className="space-y-1">
                      {entry.biopsies.slice(0, 3).map((biopsy, index) => {
                        const serviciosActivos = getServiciosActivos(biopsy);
                        return (
                          <div key={index} className="bg-white p-2 rounded border">
                            <div className="flex justify-between items-start text-xs mb-1">
                              <span className="text-blue-700 font-medium">#{biopsy.number}</span>
                              <span className="text-blue-500">{biopsy.type || '-'}</span>
                            </div>
                            <div className="text-xs text-blue-600 mb-1">
                              <span className="font-medium">{biopsy.tissueType}</span>
                              {biopsy.tissueType === 'Endoscopia' && biopsy.endoscopiaSubTypes && biopsy.endoscopiaSubTypes.length > 0 && (
                                <span className="text-blue-500"> ({biopsy.endoscopiaSubTypes.join(', ')})</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-blue-600">
                                {biopsy.tissueType === 'PAP' || biopsy.tissueType === 'Citología' ? 'Vidrios' : 'Cassettes'}: 
                                <strong>
                                  {biopsy.tissueType === 'PAP' 
                                    ? biopsy.papQuantity 
                                    : biopsy.tissueType === 'Citología' 
                                      ? biopsy.citologiaQuantity 
                                      : biopsy.cassettes
                                  }
                                </strong>
                              </span>
                              {serviciosActivos.length > 0 && (
                                <span className="text-purple-600">🔧 {serviciosActivos.length} servicio{serviciosActivos.length !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                            {serviciosActivos.length > 0 && (
                              <div className="mt-1 pt-1 border-t border-blue-100">
                                <p className="text-xs text-purple-700 truncate" title={serviciosActivos.join(', ')}>
                                  {serviciosActivos.join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {entry.biopsies.length > 3 && (
                        <p className="text-xs text-blue-600 text-center mt-2">
                          ... y {entry.biopsies.length - 3} más
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ✅ BOTONES MEJORADOS */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePrint(entry)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                    type="button"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir</span>
                  </button>
                  
                  <button
                    onClick={() => handleEmail(entry)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                    type="button"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </button>
                  
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg transition-colors"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ POPUP DE CONFIRMACIÓN DE ELIMINAR PERSONALIZADO */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                ¿Eliminar Remito?
              </h3>
              <p className="text-sm text-gray-600">
                Esta acción no se puede deshacer. El remito será eliminado permanentemente del historial.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors font-medium"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                type="button"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Email */}
      {emailPopup.isOpen && emailPopup.entry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📧 Enviar por Email
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Remito del {new Date(emailPopup.entry.date).toLocaleDateString('es-AR')}
              </p>
              <p className="text-xs text-gray-500">
                {emailPopup.entry.biopsies.length} biopsia{emailPopup.entry.biopsies.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de Email:
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="ejemplo@email.com"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setEmailPopup({ isOpen: false, entry: null })}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSendEmail}
                disabled={!emailAddress}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  emailAddress
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                type="button"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};