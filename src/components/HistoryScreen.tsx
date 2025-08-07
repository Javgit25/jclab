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

  const [emailPopup, setEmailPopup] = useState<{isOpen: boolean, entry: HistoryEntry | null}>({
    isOpen: false,
    entry: null
  });
  const [emailAddress, setEmailAddress] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, entryId: string | null}>({
    isOpen: false,
    entryId: null
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
            <div class="logo-container">
                <div class="logo-circle">
                    <div class="logo-cross-vertical"></div>
                    <div class="logo-cross-horizontal"></div>
                </div>
            </div>
        </div>
        <div class="header-content">
            <div class="app-name">BiopsyTracker</div>
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

  const handleEmail = (entry: HistoryEntry) => {
    setEmailPopup({ isOpen: true, entry });
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
        padding: '8px 12px',
        flexShrink: 0,
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
        margin: '8px 12px 4px 12px',
        maxWidth: 'none',
        width: 'calc(100% - 24px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar style={{ height: '20px', width: '20px', color: 'white' }} />
            <h1 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              lineHeight: '1.2'
            }}>Panel de Facturación ({entries.length})</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                padding: '6px 12px',
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
              ← Inicio
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '12px'
          }}>
            {sortedEntries.map((entry) => (
              <div key={entry.id} style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                {/* Header del remito */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0f4ff 0%, #e0edff 100%)',
                  padding: '12px 16px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText style={{ height: '18px', width: '18px', color: 'white' }} />
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0 0 4px 0'
                        }}>
                          {new Date(entry.date).toLocaleDateString('es-AR')}
                        </h4>
                        <p style={{
                          fontSize: '13px',
                          color: '#6B7280',
                          margin: 0
                        }}>
                          {entry.biopsies.length} biopsia{entry.biopsies.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
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

                {/* Contenido compacto */}
                <div style={{ padding: '12px 16px' }}>
                  {/* Stats compactas - inline */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px'
                  }}>
                    <span style={{ color: '#1f2937', fontWeight: '600' }}>
                      📊 {entry.biopsies.length}
                    </span>
                    <span style={{ color: '#7c3aed', fontWeight: '600' }}>
                      🔧 {entry.biopsies.filter(b => getServiciosActivos(b).length > 0).length}
                    </span>
                  </div>

                  {/* Preview compacto - solo primera biopsia */}
                  {entry.biopsies.length > 0 && (
                    <div style={{
                      background: '#f0f9ff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        background: 'white',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #e0f2fe',
                        fontSize: '13px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#1e40af', fontWeight: '600' }}>#{entry.biopsies[0].number}</span>
                            <span style={{ color: '#0369a1', fontWeight: '500', fontSize: '12px' }}>
                              {entry.biopsies[0].tissueType}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#0369a1', fontSize: '12px' }}>
                              {entry.biopsies[0].tissueType === 'PAP' || entry.biopsies[0].tissueType === 'Citología' ? 'V:' : 'C:'}
                              {entry.biopsies[0].tissueType === 'PAP' 
                                ? entry.biopsies[0].papQuantity 
                                : entry.biopsies[0].tissueType === 'Citología' 
                                  ? entry.biopsies[0].citologiaQuantity 
                                  : entry.biopsies[0].cassettes
                              }
                            </span>
                            {getServiciosActivos(entry.biopsies[0]).length > 0 && (
                              <span style={{ color: '#7c3aed', fontSize: '12px' }}>
                                +{getServiciosActivos(entry.biopsies[0]).length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {entry.biopsies.length > 1 && (
                        <p style={{
                          fontSize: '11px',
                          color: '#0369a1',
                          textAlign: 'center',
                          margin: '4px 0 0 0'
                        }}>
                          +{entry.biopsies.length - 1} más
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botones */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handlePrint(entry)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <Printer size={14} />
                      Imprimir
                    </button>
                    
                    <button
                      onClick={() => handleEmail(entry)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Mail size={14} />
                      Email
                    </button>
                    
                    <button
                      onClick={() => handleDelete(entry.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

      {/* Modal de email */}
      {emailPopup.isOpen && (
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
            maxWidth: '360px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 12px 0'
            }}>
              Enviar por Email
            </h3>
            <p style={{
              color: '#6B7280',
              margin: '0 0 16px 0',
              fontSize: '14px'
            }}>
              Ingrese la dirección de email de destino:
            </p>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="correo@ejemplo.com"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEmailPopup({ isOpen: false, entry: null })}
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
                onClick={() => {
                  console.log('Enviando email a:', emailAddress);
                  setEmailPopup({ isOpen: false, entry: null });
                  setEmailAddress('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}
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

export default HistoryScreen;
