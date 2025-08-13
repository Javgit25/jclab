import React, { useState } from 'react';
import { ArrowLeft, Printer, Calendar, FileText, Trash2 } from 'lucide-react';
import { BiopsyForm, DoctorInfo, HistoryEntry } from '../types';
import { serviciosAdicionales, giemsaOptions } from '../constants/services';
import { getPrinterConfig, isPrinterConfigured, sendToPrinter, showPrintDialog } from '../utils/printer';

interface HistoryScreenProps {
  doctorInfo: DoctorInfo;
  historyEntries: HistoryEntry[];
  isOnline: boolean;
  backupStatus: 'synced' | 'pending' | 'error';
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; entryId: string | null }>({
    isOpen: false,
    entryId: null
  });

  const [showRemito, setShowRemito] = useState<{ isOpen: boolean; entry: HistoryEntry | null }>({
    isOpen: false,
    entry: null
  });

  // Estado para el proceso de impresión
  const [printStatus, setPrintStatus] = useState<{
    isLoading: boolean;
    message: string;
    type: 'idle' | 'success' | 'error';
  }>({
    isLoading: false,
    message: '',
    type: 'idle'
  });

  // Función para obtener servicios activos de una biopsia
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

  // Función mejorada para imprimir
  const handlePrintRemito = async () => {
    if (!showRemito.entry) return;

    const printerConfig = getPrinterConfig();
    const hasConfiguredPrinter = isPrinterConfigured();

    if (hasConfiguredPrinter) {
      // Mostrar opciones de impresión
      const useNetworkPrinter = window.confirm(
        `Impresora configurada: ${printerConfig.name || 'Sin nombre'} (${printerConfig.ip})\n\n` +
        '¿Desea imprimir directamente a la impresora de red?\n\n' +
        'Seleccione "Aceptar" para impresión directa o "Cancelar" para usar el navegador.'
      );

      if (useNetworkPrinter) {
        await handleNetworkPrint();
        return;
      }
    }

    // Imprimir usando el navegador (método tradicional)
    handleBrowserPrint();
  };

  // Función para imprimir directamente a impresora de red
  const handleNetworkPrint = async () => {
    if (!showRemito.entry) return;

    setPrintStatus({ isLoading: true, message: 'Enviando a impresora...', type: 'idle' });

    try {
      const printerConfig = getPrinterConfig();
      
      // Generar contenido HTML del remito para envío a impresora
      const remitoContent = generateRemitoHTML(showRemito.entry);
      
      // Enviar a impresora usando la utilidad
      const result = await sendToPrinter(remitoContent, printerConfig);
      
      if (result.success) {
        setPrintStatus({ 
          isLoading: false, 
          message: result.message, 
          type: 'success' 
        });
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setPrintStatus({ isLoading: false, message: '', type: 'idle' });
        }, 3000);
      } else {
        setPrintStatus({ 
          isLoading: false, 
          message: result.message, 
          type: 'error' 
        });
        
        // Mostrar opción de usar navegador como fallback
        setTimeout(() => {
          if (window.confirm('¿Desea intentar imprimir usando el navegador?')) {
            handleBrowserPrint();
          }
          setPrintStatus({ isLoading: false, message: '', type: 'idle' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error en impresión de red:', error);
      setPrintStatus({ 
        isLoading: false, 
        message: 'Error inesperado al imprimir', 
        type: 'error' 
      });
      
      setTimeout(() => {
        setPrintStatus({ isLoading: false, message: '', type: 'idle' });
      }, 3000);
    }
  };

  // Función para imprimir usando el navegador
  const handleBrowserPrint = () => {
    if (!showRemito.entry) return;

    const remitoContent = generateRemitoHTML(showRemito.entry);
    showPrintDialog(remitoContent);
  };

  // Función para generar HTML del remito
  const generateRemitoHTML = (entry: HistoryEntry): string => {
    const doctor = entry.doctorInfo;
    
    return `<!DOCTYPE html>
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
        
        .info-section {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-box {
            flex: 1;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            background: #f8fafc;
        }
        
        .info-box h3 {
            color: #2d3748;
            font-size: 10pt;
            font-weight: 700;
            margin-bottom: 10px;
            text-decoration: underline;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 6px;
            font-size: 8pt;
        }
        
        .info-label {
            font-weight: 600;
            color: #4a5568;
            min-width: 70px;
            margin-right: 10px;
        }
        
        .info-value {
            flex: 1;
            color: #1a202c;
        }
        
        .biopsies-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 7pt;
        }
        
        .biopsies-table th {
            background: #2d3748;
            color: white;
            padding: 8px 4px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #4a5568;
        }
        
        .biopsies-table td {
            padding: 6px 4px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        
        .biopsies-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .services-list {
            font-size: 6pt;
            line-height: 1.2;
        }
        
        .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            gap: 40px;
        }
        
        .signature-box {
            flex: 1;
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #2d3748;
            height: 40px;
            margin-bottom: 8px;
        }
        
        .signature-box p {
            font-size: 8pt;
            margin-bottom: 2px;
        }
        
        @media print {
            body { background: white !important; }
            .header { background: #2d3748 !important; }
        }
    </style>
</head>
<body>
    <!-- Header con logo y título -->
    <div class="header">
        <div class="header-content">
            <h1 class="app-name">BIOPSY TRACKER</h1>
            <p class="app-subtitle">Sistema de Gestión de Muestras Médicas</p>
        </div>
        
        <div class="doc-info">
            <div class="doc-title">REMITO DE LABORATORIO</div>
            <div class="doc-number">N° ${entry.id}</div>
        </div>
    </div>

    <!-- Información del médico y del laboratorio -->
    <div class="info-section">
        <div class="info-box">
            <h3>DATOS DEL MÉDICO</h3>
            <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">${doctor.name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${doctor.email}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Hospital:</span>
                <span class="info-value">${doctor.hospital}</span>
            </div>
        </div>
        
        <div class="info-box">
            <h3>DATOS DEL REMITO</h3>
            <div class="info-row">
                <span class="info-label">ID Remito:</span>
                <span class="info-value">${entry.id}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Muestras:</span>
                <span class="info-value">${entry.biopsies.length}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${new Date(entry.date).toLocaleDateString('es-AR')}</span>
            </div>
        </div>
    </div>

    <!-- Tabla de biopsias -->
    <table class="biopsies-table">
        <thead>
            <tr>
                <th style="width: 8%">#</th>
                <th style="width: 15%">CASSETTE</th>
                <th style="width: 20%">TIPO DE TEJIDO</th>
                <th style="width: 12%">CANTIDAD</th>
                <th style="width: 10%">TROZOS</th>
                <th style="width: 35%">SERVICIOS SOLICITADOS</th>
            </tr>
        </thead>
        <tbody>
            ${entry.biopsies.map((biopsy, index) => {
              const services = [];
              
              // Recopilar servicios usando la estructura correcta
              if (biopsy.servicios.cassetteUrgente) services.push('• Cassette Urgente');
              if (biopsy.servicios.pap) services.push('• PAP');
              if (biopsy.servicios.papUrgente) services.push('• PAP Urgente');
              if (biopsy.servicios.citologia) services.push('• Citología');
              if (biopsy.servicios.citologiaUrgente) services.push('• Citología Urgente');
              if (biopsy.servicios.corteBlancoIHQ) services.push(`• Corte Blanco IHQ (${biopsy.servicios.corteBlancoIHQQuantity})`);
              if (biopsy.servicios.corteBlancoComun) services.push(`• Corte Blanco Común (${biopsy.servicios.corteBlancoComunQuantity})`);
              if (biopsy.servicios.giemsaPASMasson) {
                const total = biopsy.servicios.giemsaPASMassonTotal || 0;
                if (total > 0) services.push(`• Giemsa/PAS/Masson (${total})`);
              }
              
              const cassetteNumbers = biopsy.cassettesNumbers?.map(c => `${c.base}${c.suffix}`).join(', ') || 'N/A';
              
              return `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td><strong>${cassetteNumbers}</strong></td>
                    <td>${biopsy.tissueType}</td>
                    <td>${biopsy.cassettes}</td>
                    <td>${biopsy.pieces || 'N/A'}</td>
                    <td>
                        <div class="services-list">
                            ${services.join('<br>')}
                        </div>
                    </td>
                </tr>
              `;
            }).join('')}
        </tbody>
    </table>

    <!-- Footer con firmas -->
    <div class="footer">
        <div class="signature-box">
            <div class="signature-line"></div>
            <p><strong>Firma del Médico</strong></p>
            <p>Dr. ${doctor.name}</p>
        </div>
        
        <div class="signature-box">
            <div class="signature-line"></div>
            <p><strong>Recibido por Laboratorio</strong></p>
            <p>Fecha: ____________</p>
        </div>
    </div>
</body>
</html>`;
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

  const handlePrint = (entry: HistoryEntry) => {
    const remitoContent = generateRemitoHTML(entry);
    showPrintDialog(remitoContent);
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
        {/* Header con botones */}
        <div style={{
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
          
          {/* Status de impresión */}
          {printStatus.message && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              background: printStatus.type === 'success' ? '#dcfce7' : printStatus.type === 'error' ? '#fee2e2' : '#f3f4f6',
              color: printStatus.type === 'success' ? '#16a34a' : printStatus.type === 'error' ? '#dc2626' : '#374151',
              border: `1px solid ${printStatus.type === 'success' ? '#bbf7d0' : printStatus.type === 'error' ? '#fecaca' : '#d1d5db'}`
            }}>
              {printStatus.isLoading && '⏳ '}
              {printStatus.message}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handlePrintRemito}
              disabled={printStatus.isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: printStatus.isLoading 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: printStatus.isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {printStatus.isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Imprimiendo...
                </>
              ) : (
                <>
                  <Printer size={16} />
                  Imprimir
                </>
              )}
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
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.6'
        }}>
          <div dangerouslySetInnerHTML={{ __html: generateRemitoHTML(showRemito.entry).replace(/<!DOCTYPE html>[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*?<\/html>/, '') }} />
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
                  transition: 'all 0.3s ease'
                }}>
                  {/* Header del remito */}
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
                            {new Date(entry.date).toLocaleDateString('es-AR')}
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
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Printer size={16} />
                        Ver e Imprimir
                      </button>
                      
                      <button
                        onClick={() => handleDelete(entry.id)}
                        style={{
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          padding: '12px',
                          borderRadius: '10px',
                          color: '#dc2626',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
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

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm.isOpen && (
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
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px'
            }}>
              Confirmar eliminación
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              ¿Está seguro que desea eliminar este remito? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, entryId: null })}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
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
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
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
