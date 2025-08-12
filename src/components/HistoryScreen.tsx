import React, { useState } from 'react';
import { ArrowLeft, Printer, Calendar, FileText, Trash2 } from 'lucide-react';
import { BiopsyForm, DoctorInfo, HistoryEntry } from '../types';
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
  // Colores del diseño (siguiendo metodología de otros pasos)
  const colors = {
    primaryBlue: '#4F76F6',
    darkBlue: '#3B5BDB',
    lightBlue: '#7C9BFF',
    yellow: '#FFE066',
    green: '#51CF66',
    white: '#FFFFFF',
    lightGray: '#F8FAFC',
    darkGray: '#64748B'
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, entryId: string | null}>({
    isOpen: false,
    entryId: null
  });
  
  // Estado para mostrar el remito en la misma página
  const [showRemito, setShowRemito] = useState<{isOpen: boolean, entry: HistoryEntry | null}>({
    isOpen: false,
    entry: null
  });

  // Función para obtener servicios activos
  const getServiciosActivos = (biopsy: BiopsyForm): string[] => {
    const serviciosActivos: string[] = [];
    
    if (biopsy.servicios) {
      // Servicios urgentes
      if (biopsy.servicios.cassetteUrgente) {
        serviciosActivos.push('CASSETTE URGENTE');
      }
      if (biopsy.servicios.papUrgente) {
        serviciosActivos.push('PAP URGENTE');
      }
      if (biopsy.servicios.citologiaUrgente) {
        serviciosActivos.push('CITOLOGÍA URGENTE');
      }
      
      // Servicios de cortes
      if (biopsy.servicios.corteBlancoIHQ) {
        const quantity = biopsy.servicios.corteBlancoIHQQuantity || 1;
        serviciosActivos.push(`CORTE IHQ (${quantity})`);
      }
      if (biopsy.servicios.corteBlancoComun) {
        const quantity = biopsy.servicios.corteBlancoComunQuantity || 1;
        serviciosActivos.push(`CORTE COMÚN (${quantity})`);
      }
      
      // Servicios de tinción
      if (biopsy.servicios.giemsaPASMasson && biopsy.servicios.giemsaOptions) {
        const opciones = [];
        if (biopsy.servicios.giemsaOptions.giemsa) opciones.push('GIEMSA');
        if (biopsy.servicios.giemsaOptions.pas) opciones.push('PAS');  
        if (biopsy.servicios.giemsaOptions.masson) opciones.push('MASSON');
        if (opciones.length > 0) {
          serviciosActivos.push(opciones.join('/'));
        }
      }
    }
    
    return serviciosActivos;
  };

  // Función para determinar si una biopsia es urgente
  const isUrgentBiopsy = (biopsy: BiopsyForm): boolean => {
    if (!biopsy.servicios) return false;
    return !!(biopsy.servicios.cassetteUrgente || 
              biopsy.servicios.papUrgente || 
              biopsy.servicios.citologiaUrgente);
  };

  const handlePrint = (entry: HistoryEntry) => {
    console.log('🖨️ Generando remito con nuevo diseño para entry:', entry.id);
    
    // Crear HTML con diseño completamente nuevo
    const remitoHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Remito de Laboratorio - ${entry.id}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page { margin: 8mm; size: A4; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.3;
            color: #1a202c;
            background: white;
            font-size: 8pt;
        }
        
        .header {
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
            color: white;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 15px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .logo-section {
            flex: 0 0 auto;
        }
        
        .logo-container {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .logo-circle {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);
            border-radius: 50%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(79, 118, 246, 0.3);
        }
        
        .logo-cross-vertical {
            position: absolute;
            width: 4px;
            height: 20px;
            background: white;
            border-radius: 2px;
            z-index: 2;
        }
        
        .logo-cross-horizontal {
            position: absolute;
            width: 20px;
            height: 4px;
            background: white;
            border-radius: 2px;
            z-index: 2;
        }
        
        .header-content {
            flex: 1;
            text-align: center;
        }
        
        .app-name {
            font-size: 14pt;
            font-weight: 700;
            margin-bottom: 2px;
            letter-spacing: -0.3px;
        }
        
        .app-subtitle {
            font-size: 8pt;
            opacity: 0.85;
            margin-bottom: 0;
        }
        
        .doc-info {
            background: rgba(255,255,255,0.1);
            padding: 6px 12px;
            border-radius: 4px;
            flex: 0 0 auto;
        }
        
        .doc-title { font-size: 10pt; font-weight: 600; }
        .doc-number { font-size: 8pt; margin-top: 1px; }
        
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 15px;
        }
        
        .info-panel {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .panel-header {
            background: #f7fafc;
            padding: 6px 10px;
            font-weight: 600;
            font-size: 8pt;
            color: #2d3748;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .panel-body {
            padding: 8px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 7pt;
        }
        
        .info-label {
            color: #718096;
            font-weight: 500;
        }
        
        .info-value {
            color: #2d3748;
            font-weight: 600;
            text-align: right;
        }
        
        .samples-container {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        
        .samples-header {
            background: #2d3748;
            color: white;
            padding: 8px;
            font-weight: 600;
            font-size: 9pt;
        }
        
        .samples-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .samples-table th {
            background: #edf2f7;
            padding: 6px 4px;
            text-align: left;
            font-weight: 600;
            font-size: 7pt;
            color: #4a5568;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .samples-table td {
            padding: 6px 4px;
            border-bottom: 1px solid #f7fafc;
            font-size: 7pt;
            vertical-align: top;
        }
        
        .sample-type {
            font-weight: 600;
            color: #2d3748;
        }
        
        .service-pill {
            background: #e6fffa;
            color: #234e52;
            padding: 1px 4px;
            border-radius: 8px;
            font-size: 6pt;
            font-weight: 500;
            display: inline-block;
            margin: 1px;
            border: 1px solid #b2f5ea;
        }
        
        .urgent-pill {
            background: #fed7d7;
            color: #742a2a;
            border-color: #feb2b2;
            font-weight: 700;
            animation: pulse 2s infinite;
        }
        
        .normal-pill {
            background: #c6f6d5;
            color: #22543d;
            border-color: #9ae6b4;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .instructions {
            background: #fffaf0;
            border: 1px solid #fbd38d;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 12px;
        }
        
        .instructions h3 {
            color: #744210;
            font-size: 8pt;
            margin-bottom: 4px;
        }
        
        .instructions ul {
            color: #744210;
            font-size: 6pt;
            padding-left: 10px;
        }
        
        .instructions li {
            margin-bottom: 2px;
        }
        
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
        }
        
        .signature-box {
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #a0aec0;
            height: 25px;
            margin-bottom: 4px;
        }
        
        .signature-label {
            color: #718096;
            font-size: 6pt;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 6pt;
        }
        
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2d3748;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
        }
        
        @media print {
            .print-btn { display: none !important; }
            body { font-size: 7pt; margin: 0; padding: 0; }
            .header { margin-bottom: 8px; padding: 8px; }
            .content-grid { margin-bottom: 8px; gap: 8px; }
            .samples-container { margin-bottom: 8px; }
            .instructions { margin-bottom: 6px; padding: 6px; }
            .signatures { margin-top: 8px; gap: 15px; }
            .footer { margin-top: 8px; padding-top: 4px; }
            * { color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
        </div>
        <div class="header-content">
            <div class="app-name">
                <img src="/assets/biopsytracker_logo_final.svg" alt="BiopsyTracker" style="width: 400px; height: 100px; filter: brightness(0) invert(1); margin: 0 auto; display: block;" />
            </div>
            <div class="app-subtitle">Sistema de Gestión de Biopsias</div>
        </div>
        <div class="doc-info">
            <div class="doc-title">Remito de Laboratorio</div>
            <div class="doc-number">N° ${entry.id.slice(-8).toUpperCase()} • ${new Date(entry.date).toLocaleDateString('es-AR')}</div>
        </div>
    </div>

    <div class="content-grid">
        <div class="info-panel">
            <div class="panel-header">Médico</div>
            <div class="panel-body">
                <div class="info-row">
                    <span class="info-label">Dr/a:</span>
                    <span class="info-value">${entry.doctorInfo?.name || doctorInfo?.name || 'No especificado'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${entry.doctorInfo?.email || doctorInfo?.email || 'No especificado'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Hospital:</span>
                    <span class="info-value">${entry.doctorInfo?.hospital || doctorInfo?.hospital || 'No especificado'}</span>
                </div>
            </div>
        </div>
        
        <div class="info-panel">
            <div class="panel-header">Remito</div>
            <div class="panel-body">
                <div class="info-row">
                    <span class="info-label">Fecha:</span>
                    <span class="info-value">${new Date(entry.date).toLocaleDateString('es-AR')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Hora:</span>
                    <span class="info-value">${new Date(entry.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Muestras:</span>
                    <span class="info-value">${entry.biopsies?.length || 0}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="samples-container">
        <div class="samples-header">Detalle de Muestras</div>
        <table class="samples-table">
            <thead>
                <tr>
                    <th style="width: 5%">N°</th>
                    <th style="width: 10%">Tipo</th>
                    <th style="width: 28%">Muestra</th>
                    <th style="width: 8%">Cant.</th>
                    <th style="width: 8%">Trozos</th>
                    <th style="width: 28%">Servicios</th>
                    <th style="width: 8%">Estado</th>
                </tr>
            </thead>
            <tbody>
                ${entry.biopsies?.map((biopsy: any, index: number) => {
                  const serviciosActivos = getServiciosActivos(biopsy);
                  const isUrgent = isUrgentBiopsy(biopsy);
                  
                  // Determinar tipo abreviado
                  let tipoAbreviado = biopsy.type || 'BIOPSIA';
                  if (biopsy.tissueType === 'PAP') tipoAbreviado = 'PAP';
                  if (biopsy.tissueType === 'Citología') tipoAbreviado = 'CITO';
                  
                  // Formatear endoscopia en una línea
                  let tissueDisplay = biopsy.tissueType || 'No especificado';
                  if (biopsy.tissueType === 'Endoscopia' && biopsy.endoscopiaSubTypes && biopsy.endoscopiaSubTypes.length > 0) {
                    tissueDisplay = 'Endoscopia (' + biopsy.endoscopiaSubTypes.join(', ') + ')';
                  }
                  
                  return `
                    <tr>
                        <td style="text-align: center; font-weight: 700; color: #2d3748;">${biopsy.number || (index + 1)}</td>
                        <td><span class="sample-type">${tipoAbreviado}</span></td>
                        <td>${tissueDisplay}</td>
                        <td style="text-align: center; font-weight: 600;">
                            ${
                              biopsy.tissueType === 'PAP' 
                                ? (biopsy.papQuantity || 0) + ' vid'
                                : biopsy.tissueType === 'Citología' 
                                  ? (biopsy.citologiaQuantity || 0) + ' vid'
                                  : (biopsy.cassettes || 1) + ' cas'
                            }
                        </td>
                        <td style="text-align: center; font-weight: 600; color: #4a5568;">
                            ${
                              biopsy.tissueType === 'PAP' || biopsy.tissueType === 'Citología'
                                ? '-'
                                : (biopsy.pieces || 1)
                            }
                        </td>
                        <td>
                            ${serviciosActivos.length > 0 
                              ? serviciosActivos.map(s => '<span class="service-pill">' + s + '</span>').join(' ')
                              : '<span style="color: #a0aec0; font-style: italic; font-size: 6pt;">Ninguno</span>'
                            }
                        </td>
                        <td style="text-align: center;">
                            ${isUrgent 
                              ? '<span class="service-pill urgent-pill">URGENTE</span>'
                              : '<span class="service-pill normal-pill">NORMAL</span>'
                            }
                        </td>
                    </tr>
                  `;
                }).join('') || '<tr><td colspan="7" style="text-align: center; color: #a0aec0; font-style: italic; padding: 20px;">No hay muestras registradas</td></tr>'}
            </tbody>
        </table>
    </div>

    <div class="instructions">
        <h3>Instrucciones</h3>
        <ul>
            <li><strong>Verificar</strong> etiquetado correcto de muestras</li>
            <li><strong>Urgentes:</strong> 24-48h • <strong>Normales:</strong> 5-7 días</li>
            <li><strong>Consultas:</strong> Contactar con N° de remito</li>
        </ul>
    </div>

    <div class="signatures">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Firma Médico</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Recepción Lab</div>
        </div>
    </div>

    <div class="footer">
        <p><strong>BiopsyTracker</strong> - ${new Date().toLocaleString('es-AR')}</p>
    </div>

    <button class="print-btn" onclick="window.print(); setTimeout(() => window.close(), 100);">
        🖨️ Imprimir
    </button>
</body>
</html>`;

    // Abrir ventana de impresión
    try {
      const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
      if (printWindow) {
        printWindow.document.write(remitoHTML);
        printWindow.document.close();
        printWindow.focus();
        console.log('✅ Remito con nuevo diseño generado exitosamente');
      } else {
        alert('Por favor, permite las ventanas emergentes para generar el remito.');
      }
    } catch (error) {
      console.error('❌ Error al generar remito:', error);
      alert('Error al generar el remito. Intenta nuevamente.');
    }
  };

  const handleDelete = (entryId: string) => {
    setDeleteConfirm({ isOpen: true, entryId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.entryId) {
      onDeleteEntry(deleteConfirm.entryId);
      setDeleteConfirm({ isOpen: false, entryId: null });
    }
  };

  // Función para mostrar el remito en la misma página
  const handlePrintInPage = (entry: HistoryEntry) => {
    setShowRemito({ isOpen: true, entry });
  };

  // Función mejorada para imprimir
  const handlePrintRemito = () => {
    // Verificar si hay configuración de impresora
    const printerIP = localStorage.getItem('printer_ip');
    const printerPort = localStorage.getItem('printer_port') || '9100';
    
    if (printerIP && window.confirm('¿Desea imprimir directamente a la impresora configurada?')) {
      // Intentar imprimir directamente a la impresora de red
      handleNetworkPrint(printerIP, printerPort);
    } else {
      // Imprimir usando el navegador (método tradicional)
      handleBrowserPrint();
    }
  };

  // Función para imprimir directamente a impresora de red
  const handleNetworkPrint = async (ip: string, port: string) => {
    try {
      // Crear el contenido del remito para impresión directa
      const printContent = document.querySelector('.print-content');
      if (!printContent) {
        alert('Error: No se encontró el contenido del remito');
        return;
      }

      // Simular envío a impresora de red
      // En una implementación real, aquí se enviaría el documento a la impresora
      console.log(`Enviando a impresora: ${ip}:${port}`);
      alert(`Enviando remito a impresora ${ip}:${port}\n\nEn una tablet real, esto se conectaría directamente con la impresora de red.`);
      
    } catch (error) {
      console.error('Error al imprimir en red:', error);
      alert('Error al conectar con la impresora. Usando impresión del navegador...');
      handleBrowserPrint();
    }
  };

  // Función para imprimir usando el navegador
  const handleBrowserPrint = () => {
    // Pequeño delay para asegurar que el contenido esté renderizado
    setTimeout(() => {
      // Asegurar que el contenido sea visible
      const printContent = document.querySelector('.print-content');
      if (printContent) {
        (printContent as HTMLElement).style.visibility = 'visible';
        (printContent as HTMLElement).style.opacity = '1';
      }
      
      // Forzar un re-render antes de imprimir
      window.requestAnimationFrame(() => {
        window.print();
      });
    }, 100);
  };

  // Si está mostrando el remito, renderizar la vista completa del remito
  if (showRemito.isOpen && showRemito.entry) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'white',
        zIndex: 1000,
        overflow: 'auto'
      }}>
        {/* Estilos CSS para impresión */}
        <style>{`
          @media print {
            @page {
              margin: 0.5in !important;
              size: A4 !important;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              font-size: 11pt !important;
              line-height: 1.4 !important;
              font-family: Arial, sans-serif !important;
              color: #000 !important;
              background: white !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            .print-content {
              margin: 0 !important;
              padding: 0 !important;
              max-width: none !important;
              width: 100% !important;
              background: white !important;
              color: #000 !important;
              font-family: Arial, sans-serif !important;
            }
            
            h1, h2, h3, h4, h5, h6 {
              color: #000 !important;
              font-family: Arial, sans-serif !important;
              margin: 0 0 10px 0 !important;
            }
            
            h1 {
              font-size: 20pt !important;
              font-weight: bold !important;
            }
            
            h3 {
              font-size: 14pt !important;
              font-weight: bold !important;
            }
            
            h4 {
              font-size: 12pt !important;
              font-weight: bold !important;
            }
            
            .info-panel {
              border: 2px solid #000 !important;
              background: white !important;
              color: #000 !important;
              page-break-inside: avoid !important;
              margin-bottom: 15px !important;
              padding: 10px !important;
            }
            
            .biopsy-item {
              border: 1px solid #000 !important;
              background: white !important;
              color: #000 !important;
              page-break-inside: avoid !important;
              margin-bottom: 10px !important;
              padding: 8px !important;
            }
            
            div {
              background: white !important;
              color: #000 !important;
            }
            
            span {
              color: #000 !important;
              background: transparent !important;
            }
            
            p {
              color: #000 !important;
              margin: 5px 0 !important;
            }
            
            /* Forzar visibilidad del contenido */
            .print-content * {
              visibility: visible !important;
              opacity: 1 !important;
              color: #000 !important;
              background: white !important;
            }
            
            /* Grid responsive para impresión */
            .info-grid {
              display: block !important;
            }
            
            .info-grid > div {
              display: block !important;
              margin-bottom: 15px !important;
              width: 100% !important;
            }
          }
          
          @media screen {
            .print-content {
              font-family: Arial, sans-serif;
              color: #2d3748;
            }
          }
        `}</style>

        {/* Header con botones */}
        <div className="no-print" style={{
          position: 'sticky',
          top: 0,
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1001
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Remito #{showRemito.entry.id.slice(-8).toUpperCase()}
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handlePrintRemito}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Printer size={16} />
              Imprimir
            </button>
            <button
              onClick={() => setShowRemito({ isOpen: false, entry: null })}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Contenido del remito */}
        <div className="print-content" style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.6'
        }}>
          {/* Header del remito */}
          <div style={{
            textAlign: 'center',
            border: '2px solid #2d3748',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: '#f7fafc'
          }}>
            <h1 style={{
              fontSize: '24pt',
              fontWeight: '700',
              color: '#2d3748',
              margin: '0 0 5px 0'
            }}>
              BIOPSY TRACKER
            </h1>
            <p style={{
              fontSize: '11pt',
              color: '#4a5568',
              margin: '0 0 10px 0'
            }}>
              Sistema Profesional de Registro de Biopsias
            </p>
            <div style={{
              fontSize: '14pt',
              fontWeight: '600',
              color: '#2d3748'
            }}>
              Remito de Laboratorio #{showRemito.entry.id.slice(-8).toUpperCase()}
            </div>
            <div style={{
              fontSize: '11pt',
              color: '#4a5568',
              marginTop: '5px'
            }}>
              {new Date(showRemito.entry.date).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} • {new Date(showRemito.entry.timestamp).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Grid de información */}
          <div className="info-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div className="info-panel" style={{
              background: '#f7fafc',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#2d3748',
                fontSize: '14pt',
                marginBottom: '10px'
              }}>
                👨‍⚕️ Información Médica
              </h3>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                  Médico:
                </span>
                <span style={{ color: '#2d3748' }}>
                  Dr/a. {showRemito.entry.doctorInfo?.name || doctorInfo?.name || 'No especificado'}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                  Email:
                </span>
                <span style={{ color: '#2d3748' }}>
                  {showRemito.entry.doctorInfo?.email || doctorInfo?.email || 'No especificado'}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                  Hospital:
                </span>
                <span style={{ color: '#2d3748' }}>
                  {showRemito.entry.doctorInfo?.hospital || doctorInfo?.hospital || 'No especificado'}
                </span>
              </div>
            </div>

            <div className="info-panel" style={{
              background: '#f7fafc',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#2d3748',
                fontSize: '14pt',
                marginBottom: '10px'
              }}>
                📊 Resumen del Remito
              </h3>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                  Total muestras:
                </span>
                <span style={{ color: '#2d3748', fontWeight: '600' }}>
                  {showRemito.entry.biopsies?.length || 0}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                  Muestras urgentes:
                </span>
                <span style={{ color: '#2d3748', fontWeight: '600' }}>
                  {showRemito.entry.biopsies?.filter(b => isUrgentBiopsy(b)).length || 0}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                  Estado:
                </span>
                <span style={{ 
                  color: '#2d3748', 
                  fontWeight: '600',
                  background: '#e6fffa',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10pt'
                }}>
                  PROCESADO
                </span>
              </div>
            </div>
          </div>

          {/* Sección de biopsias */}
          <div style={{
            background: '#f7fafc',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14pt',
              marginBottom: '15px'
            }}>
              🔬 Detalles de las Biopsias
            </h3>
            {showRemito.entry.biopsies?.map((biopsy, index) => {
              const serviciosActivos = getServiciosActivos(biopsy);
              const isUrgent = isUrgentBiopsy(biopsy);
              
              return (
                <div key={index} className="biopsy-item" style={{
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  marginBottom: '12px',
                  borderRadius: '6px',
                  background: 'white'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{ margin: '0', fontSize: '12pt', fontWeight: '600' }}>
                      Biopsia #{biopsy.number || (index + 1)}
                    </h4>
                    {isUrgent && (
                      <span style={{
                        background: '#fed7d7',
                        color: '#9b2c2c',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '9pt',
                        fontWeight: '600'
                      }}>
                        URGENTE
                      </span>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                      Tipo de tejido:
                    </span>
                    <span style={{ color: '#2d3748' }}>
                      {biopsy.tissueType || 'No especificado'}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                      Tipo:
                    </span>
                    <span style={{ color: '#2d3748' }}>
                      {biopsy.type || 'Biopsia'}
                    </span>
                  </div>
                  
                  {/* Información de cassettes y trozos */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '6px',
                    background: '#f8fafc',
                    padding: '8px',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                        Cassettes:
                      </span>
                      <span style={{ color: '#2d3748', fontWeight: '600' }}>
                        {biopsy.tissueType === 'PAP' 
                          ? (biopsy.papQuantity || 0) + ' vidrios'
                          : biopsy.tissueType === 'Citología' 
                            ? (biopsy.citologiaQuantity || 0) + ' vidrios'
                            : (biopsy.cassettes || 1) + ' cassettes'
                        }
                      </span>
                    </div>
                    <div>
                      <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                        Trozos:
                      </span>
                      <span style={{ color: '#2d3748', fontWeight: '600' }}>
                        {biopsy.tissueType === 'PAP' || biopsy.tissueType === 'Citología'
                          ? 'N/A'
                          : (biopsy.pieces || 1) + ' trozos'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {biopsy.observations && (
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                        Observaciones:
                      </span>
                      <span style={{ color: '#2d3748' }}>
                        {biopsy.observations}
                      </span>
                    </div>
                  )}
                  
                  {serviciosActivos.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontWeight: '500', color: '#4a5568', marginRight: '8px' }}>
                        Servicios:
                      </span>
                      <div style={{ marginTop: '4px' }}>
                        {serviciosActivos.map((servicio, servicioIndex) => (
                          <span key={servicioIndex} style={{
                            background: '#e6fffa',
                            color: '#234e52',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '8pt',
                            marginRight: '4px',
                            marginBottom: '2px',
                            display: 'inline-block'
                          }}>
                            {servicio}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }) || (
              <p style={{ color: '#718096', fontStyle: 'italic' }}>
                No hay biopsias registradas
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '15px',
            textAlign: 'center',
            color: '#718096',
            fontSize: '9pt'
          }}>
            <p style={{ margin: '0 0 5px 0' }}>
              Documento generado por BiopsyTracker v2.3.0
            </p>
            <p style={{ margin: 0 }}>
              Código de verificación: {showRemito.entry.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Función para crear datos de prueba
  const createTestData = () => {
    const testEntry: HistoryEntry = {
      id: 'test-' + Date.now(),
      date: new Date().toLocaleDateString('es-ES'),
      timestamp: new Date().toISOString(),
      doctorInfo: doctorInfo,
      biopsies: [
        {
          number: '001',
          tissueType: 'Endoscopia',
          endoscopiaSubTypes: ['Duodeno', 'Estómago'],
          type: 'Biopsia múltiple',
          cassettes: '3',
          pieces: '6',
          cassettesNumbers: [
            { base: 'A', suffix: '001' },
            { base: 'A', suffix: '002' },
            { base: 'A', suffix: '003' }
          ],
          declassify: 'No',
          servicios: {
            cassetteUrgente: true,
            pap: false,
            papUrgente: false,
            citologia: false,
            citologiaUrgente: false,
            corteBlancoIHQ: true,
            corteBlancoIHQQuantity: 2,
            corteBlancoComun: false,
            corteBlancoComunQuantity: 0,
            giemsaPASMasson: true,
            giemsaOptions: {
              giemsa: true,
              pas: false,
              masson: true
            }
          },
          observations: 'Muestra con sospecha de malignidad',
          papQuantity: 0,
          papUrgente: false,
          citologiaQuantity: 0,
          citologiaUrgente: false
        },
        {
          number: '002',
          tissueType: 'PAP',
          endoscopiaSubTypes: [],
          type: 'PAP',
          cassettes: '0',
          pieces: '0',
          cassettesNumbers: [],
          declassify: 'No',
          servicios: {
            cassetteUrgente: false,
            pap: true,
            papUrgente: true,
            citologia: false,
            citologiaUrgente: false,
            corteBlancoIHQ: false,
            corteBlancoIHQQuantity: 0,
            corteBlancoComun: false,
            corteBlancoComunQuantity: 0,
            giemsaPASMasson: false,
            giemsaOptions: {
              giemsa: false,
              pas: false,
              masson: false
            }
          },
          observations: 'Control ginecológico de rutina',
          papQuantity: 2,
          papUrgente: true,
          citologiaQuantity: 0,
          citologiaUrgente: false
        },
        {
          number: '003',
          tissueType: 'Citología',
          endoscopiaSubTypes: [],
          type: 'Citología',
          cassettes: '0',
          pieces: '0',
          cassettesNumbers: [],
          declassify: 'No',
          servicios: {
            cassetteUrgente: false,
            pap: false,
            papUrgente: false,
            citologia: true,
            citologiaUrgente: true,
            corteBlancoIHQ: false,
            corteBlancoIHQQuantity: 0,
            corteBlancoComun: true,
            corteBlancoComunQuantity: 3,
            giemsaPASMasson: false,
            giemsaOptions: {
              giemsa: false,
              pas: false,
              masson: false
            }
          },
          observations: 'Análisis urgente solicitado',
          papQuantity: 0,
          papUrgente: false,
          citologiaQuantity: 1,
          citologiaUrgente: true
        }
      ]
    };

    handlePrint(testEntry);
  };

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
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 16px',
        flexShrink: 0,
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
        margin: '8px 12px 4px 12px',
        maxWidth: 'none',
        width: 'calc(100% - 24px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar style={{ height: '22px', width: '22px', color: 'white' }} />
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              lineHeight: '1.2'
            }}>Historial de remitos ({entries.length})</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onGoBack}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={16} />
              Inicio
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 12px 12px 12px'
      }}>
        {entries.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '24px 16px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <Calendar style={{ 
              height: '32px', 
              width: '32px', 
              color: '#9CA3AF',
              margin: '0 auto 12px auto'
            }} />
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#4B5563',
              margin: '0 0 8px 0'
            }}>
              No hay remitos
            </h3>
            <p style={{
              color: '#6B7280',
              margin: 0,
              fontSize: '14px'
            }}>
              Los remitos generados aparecerán aquí
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '16px'
          }}>
            {sortedEntries.map((entry) => {
              const urgentCount = entry.biopsies.filter(b => isUrgentBiopsy(b)).length;
              const totalServices = entry.biopsies.reduce((acc, b) => acc + getServiciosActivos(b).length, 0);
              const biopsyTypes = [...new Set(entry.biopsies.map(b => b.tissueType))].filter(Boolean);
              
              return (
                <div key={entry.id} style={{
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}>
                  {/* Header Premium */}
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '16px 20px',
                    color: 'white'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FileText style={{ height: '20px', width: '20px', color: 'white' }} />
                        </div>
                        <div>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            margin: '0 0 4px 0',
                            color: 'white'
                          }}>
                            Remito #{entry.id.slice(-8).toUpperCase()}
                          </h3>
                          <p style={{
                            fontSize: '14px',
                            margin: 0,
                            opacity: 0.9,
                            color: 'white'
                          }}>
                            {new Date(entry.date).toLocaleDateString('es-AR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'white'
                      }}>
                        {new Date(entry.timestamp).toLocaleTimeString('es-AR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div style={{ padding: '20px' }}>
                    {/* Estadísticas principales */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
                        padding: '12px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '1px solid #81d4fa'
                      }}>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#0277bd'
                        }}>
                          {entry.biopsies.length}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#0277bd',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          Muestras
                        </div>
                      </div>
                      
                      <div style={{
                        background: urgentCount > 0 
                          ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' 
                          : 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                        padding: '12px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: urgentCount > 0 ? '1px solid #ef5350' : '1px solid #66bb6a'
                      }}>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: urgentCount > 0 ? '#c62828' : '#2e7d32'
                        }}>
                          {urgentCount}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: urgentCount > 0 ? '#c62828' : '#2e7d32',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          Urgentes
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                        padding: '12px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '1px solid #ce93d8'
                      }}>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#7b1fa2'
                        }}>
                          {totalServices}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#7b1fa2',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          Servicios
                        </div>
                      </div>
                    </div>

                    {/* Tipos de muestras */}
                    <div style={{ marginBottom: '16px' }}>
                      <h5 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        🔬 Tipos de muestras
                      </h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {biopsyTypes.map((type, index) => (
                          <span key={index} style={{
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            color: '#0369a1',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: '1px solid #7dd3fc'
                          }}>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Preview de biopsias */}
                    <div style={{ marginBottom: '16px' }}>
                      <h5 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        📋 Detalle
                      </h5>
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        maxHeight: '120px',
                        overflowY: 'auto'
                      }}>
                        {entry.biopsies.slice(0, 3).map((biopsy, index) => (
                          <div key={index} style={{
                            padding: '8px 12px',
                            borderBottom: index < Math.min(entry.biopsies.length, 3) - 1 ? '1px solid #e2e8f0' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                background: isUrgentBiopsy(biopsy) ? '#fee2e2' : '#ecfdf5',
                                color: isUrgentBiopsy(biopsy) ? '#dc2626' : '#16a34a',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                #{biopsy.number || (index + 1)}
                              </span>
                              <span style={{
                                fontSize: '12px',
                                color: '#4b5563',
                                fontWeight: '500'
                              }}>
                                {biopsy.tissueType}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#6b7280',
                              display: 'flex',
                              gap: '8px'
                            }}>
                              <span>
                                {biopsy.tissueType === 'PAP' || biopsy.tissueType === 'Citología' ? 'V:' : 'C:'}
                                {biopsy.tissueType === 'PAP' 
                                  ? biopsy.papQuantity || 0
                                  : biopsy.tissueType === 'Citología' 
                                    ? biopsy.citologiaQuantity || 0
                                    : biopsy.cassettes || 1
                                }
                              </span>
                              {biopsy.tissueType !== 'PAP' && biopsy.tissueType !== 'Citología' && (
                                <span>T:{biopsy.pieces || 1}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {entry.biopsies.length > 3 && (
                          <div style={{
                            padding: '8px 12px',
                            textAlign: 'center',
                            fontSize: '11px',
                            color: '#6b7280',
                            fontStyle: 'italic',
                            background: '#f1f5f9'
                          }}>
                            +{entry.biopsies.length - 3} muestras más...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      marginTop: '16px'
                    }}>
                      <button
                        onClick={() => handlePrintInPage(entry)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          border: 'none',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        <Printer size={16} />
                        Ver e Imprimir
                      </button>
                      
                      <button
                        onClick={() => handleDelete(entry.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '10px',
                          color: 'white',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {deleteConfirm.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '320px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 12px 0'
            }}>
              Confirmar Eliminación
            </h3>
            <p style={{
              color: '#6B7280',
              margin: '0 0 20px 0',
              fontSize: '14px'
            }}>
              ¿Está seguro de que desea eliminar este remito? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, entryId: null })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
