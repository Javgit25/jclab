import React, { useState } from 'react';
import { ArrowLeft, Printer, Mail, Calendar, FileText, Trash2 } from 'lucide-react';
import { BiopsyForm, DoctorInfo } from '../types';
import { ConnectionStatus } from './ConnectionStatus';
import { serviciosAdicionales, giemsaOptions } from '../constants/services';

// Tipo temporal para HistoryEntry (simplificado)
interface HistoryEntry {
  id: string;
  date: string;
  timestamp: string;
  biopsies: BiopsyForm[];
}

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
      Object.entries(biopsy.servicios).forEach(([key, value]) => {
        if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
          const servicio = serviciosAdicionales.find(s => s.key === key);
          if (servicio) {
            let servicioLabel = servicio.label;
            
            // Manejo especial para Giemsa/PAS/Masson
            if (key === 'giemsaPASMasson' && biopsy.servicios.giemsaOptions) {
              const giemsaSelected = Object.entries(biopsy.servicios.giemsaOptions)
                .filter(([_, selected]) => selected)
                .map(([optionKey, _]) => {
                  const option = giemsaOptions.find(opt => opt.key === optionKey);
                  return option ? option.label : optionKey;
                });
              
              if (giemsaSelected.length > 0) {
                servicioLabel = giemsaSelected.join(', ');
              } else {
                return;
              }
            }
            // Agregar cantidad para cortes en blanco
            else if (key === 'corteBlancoIHQ') {
              const quantity = biopsy.servicios.corteBlancoIHQQuantity || 1;
              servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
            } else if (key === 'corteBlancoComun') {
              const quantity = biopsy.servicios.corteBlancoComunQuantity || 1;
              servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
            }
            
            serviciosActivos.push(servicioLabel);
          }
        }
      });
    }
    
    return serviciosActivos;
  };

  const handlePrint = (entry: HistoryEntry) => {
    console.log('🖨️ Generando remito profesional para entry:', entry.id);
    
    // Crear HTML profesional para el remito
    const remitoHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Remito de Biopsias - ${entry.id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            margin: 15mm;
            size: A4;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #1a1a1a;
            background: white;
            font-size: 11pt;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
        }
        
        .letterhead {
            text-align: center;
            margin-bottom: 25px;
            padding: 20px;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        }
        
        .clinic-logo {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .clinic-name {
            font-size: 22pt;
            font-weight: 700;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .clinic-subtitle {
            font-size: 14pt;
            margin-bottom: 12px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .remito-title {
            font-size: 16pt;
            font-weight: 700;
            background: rgba(255, 255, 255, 0.15);
            padding: 8px 20px;
            border-radius: 20px;
            display: inline-block;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .document-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border-left: 5px solid #3b82f6;
        }
        
        .info-section {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .section-title {
            font-size: 11pt;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            align-items: center;
        }
        
        .info-label {
            font-weight: 600;
            color: #64748b;
            font-size: 10pt;
        }
        
        .info-value {
            font-weight: 600;
            color: #1e293b;
            font-size: 10pt;
            text-align: right;
        }
        
        .biopsies-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }
        
        .biopsies-table th {
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: 700;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #1e3a8a;
        }
        
        .biopsies-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
            font-size: 9pt;
            text-align: center;
        }
        
        .biopsies-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .biopsy-number {
            font-weight: 700;
            color: #1e40af;
            font-size: 10pt;
            background: #dbeafe;
            padding: 4px 8px;
            border-radius: 4px;
        }
        
        .tissue-type {
            font-weight: 600;
            color: #1e293b;
            text-align: left;
        }
        
        .quantity-cell {
            font-weight: 700;
            color: #059669;
            font-size: 10pt;
        }
        
        .services-badge {
            background: #e0e7ff;
            color: #3730a3;
            padding: 3px 6px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
            display: inline-block;
            margin: 1px;
            border: 1px solid #c7d2fe;
        }
        
        .urgent-badge {
            background: #fef2f2;
            color: #dc2626;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 700;
            border: 1px solid #fecaca;
        }
        
        .normal-badge {
            background: #f0fdf4;
            color: #166534;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
            border: 1px solid #bbf7d0;
        }
        
        .summary-section {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #bae6fd;
            margin-bottom: 25px;
        }
        
        .summary-title {
            font-size: 14pt;
            font-weight: 700;
            color: #0c4a6e;
            margin-bottom: 15px;
            text-align: center;
            text-transform: uppercase;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        
        .summary-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e0f2fe;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .summary-number {
            font-size: 18pt;
            font-weight: 700;
            color: #0c4a6e;
            margin-bottom: 5px;
            display: block;
        }
        
        .summary-label {
            font-size: 8pt;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        .instructions-section {
            background: #fefce8;
            border: 2px solid #facc15;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
        }
        
        .instructions-title {
            font-size: 11pt;
            font-weight: 700;
            color: #a16207;
            margin-bottom: 10px;
        }
        
        .instructions-list {
            font-size: 9pt;
            color: #713f12;
            line-height: 1.6;
        }
        
        .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
            margin-top: 30px;
            page-break-inside: avoid;
        }
        
        .signature-box {
            text-align: center;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .signature-line {
            border-bottom: 2px solid #64748b;
            margin-bottom: 8px;
            height: 30px;
        }
        
        .signature-label {
            font-size: 8pt;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 8pt;
            page-break-inside: avoid;
        }
        
        @media print {
            body { 
                margin: 0; 
                padding: 10mm;
                font-size: 10pt;
            }
            .no-print { display: none !important; }
            .letterhead { page-break-inside: avoid; }
            .signature-section { page-break-inside: avoid; }
            .footer { page-break-inside: avoid; }
            * { color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <!-- Professional Letterhead -->
    <div class="letterhead">
        <div class="clinic-logo">⚕</div>
        <div class="clinic-name">Laboratorio de Anatomía Patológica</div>
        <div class="clinic-subtitle">${entry.doctorInfo?.hospital || doctorInfo?.hospital || 'Centro Médico Especializado'}</div>
        <div class="remito-title">📋 REMITO DE BIOPSIAS</div>
    </div>

    <!-- Document Information -->
    <div class="document-info">
        <div class="info-section">
            <div class="section-title">👨‍⚕️ Información del Médico</div>
            <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">Dr/a. ${entry.doctorInfo?.name || doctorInfo?.name || 'No especificado'}</span>
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
        
        <div class="info-section">
            <div class="section-title">📅 Información del Remito</div>
            <div class="info-row">
                <span class="info-label">Número:</span>
                <span class="info-value">#${entry.id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${new Date(entry.date).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Hora:</span>
                <span class="info-value">${new Date(entry.timestamp).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
            </div>
        </div>
    </div>

    <!-- Biopsies Table -->
    <table class="biopsies-table">
        <thead>
            <tr>
                <th style="width: 8%">N°</th>
                <th style="width: 12%">Tipo</th>
                <th style="width: 30%">Tejido/Procedimiento</th>
                <th style="width: 15%">Cantidad</th>
                <th style="width: 25%">Servicios Especiales</th>
                <th style="width: 10%">Prioridad</th>
            </tr>
        </thead>
        <tbody>
            ${entry.biopsies?.map((biopsy: any, index: number) => {
              // Determinar servicios activos
              const serviciosActivos = [];
              if (biopsy.serviciosEspeciales) {
                if (biopsy.serviciosEspeciales.cassetteUrgente) serviciosActivos.push('Cassette Urgente');
                if (biopsy.serviciosEspeciales.papUrgente) serviciosActivos.push('PAP Urgente');
                if (biopsy.serviciosEspeciales.citologiaUrgente) serviciosActivos.push('Citología Urgente');
                if (biopsy.serviciosEspeciales.corteBlancoIHQ) serviciosActivos.push('Corte Blanco IHQ');
                if (biopsy.serviciosEspeciales.corteBlancoComun) serviciosActivos.push('Corte Blanco Común');
                if (biopsy.serviciosEspeciales.giemsaPASMasson) {
                  const opciones = [];
                  if (biopsy.serviciosEspeciales.giemsaOptions?.giemsa) opciones.push('Giemsa');
                  if (biopsy.serviciosEspeciales.giemsaOptions?.pas) opciones.push('PAS');
                  if (biopsy.serviciosEspeciales.giemsaOptions?.masson) opciones.push('Masson');
                  if (opciones.length > 0) serviciosActivos.push(`Tinciones: ${opciones.join(', ')}`);
                }
              }
              
              const isUrgent = serviciosActivos.some(s => s.includes('Urgente'));
              
              return `
                <tr>
                    <td><span class="biopsy-number">${biopsy.number || index + 1}</span></td>
                    <td style="font-weight: 600;">${biopsy.type || 'BIOPSIA'}</td>
                    <td class="tissue-type">${biopsy.tissueType || 'No especificado'}${
                      biopsy.tissueType === 'Endoscopia' && biopsy.endoscopiaSubTypes?.length > 0
                        ? `<br><small style="font-size: 8pt; color: #64748b;">(${biopsy.endoscopiaSubTypes.join(', ')})</small>`
                        : ''
                    }</td>
                    <td class="quantity-cell">
                        ${
                          biopsy.tissueType === 'PAP' 
                            ? `${biopsy.papQuantity || 0} vidrios`
                            : biopsy.tissueType === 'Citología' 
                              ? `${biopsy.citologiaQuantity || 0} vidrios`
                              : `${biopsy.cassettes || 1} cassettes`
                        }
                    </td>
                    <td style="text-align: left; padding-left: 12px;">
                        ${serviciosActivos.length > 0 
                          ? serviciosActivos.map(s => `<span class="services-badge">${s}</span>`).join(' ')
                          : '<span style="color: #6b7280; font-style: italic;">Sin servicios adicionales</span>'
                        }
                    </td>
                    <td>
                        ${isUrgent 
                          ? '<span class="urgent-badge">🚨 URGENTE</span>'
                          : '<span class="normal-badge">✓ NORMAL</span>'
                        }
                    </td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="6" style="text-align: center; color: #6b7280; font-style: italic; padding: 20px;">No hay biopsias registradas en este remito</td></tr>'}
        </tbody>
    </table>

    <!-- Summary Section -->
    <div class="summary-section">
        <div class="summary-title">📊 Resumen Estadístico del Remito</div>
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-number">${entry.biopsies?.length || 0}</span>
                <div class="summary-label">Total Biopsias</div>
            </div>
            <div class="summary-item">
                <span class="summary-number">${
                  entry.biopsies?.reduce((sum: number, biopsy: any) => 
                    sum + (biopsy.cassettes || 0), 0) || 0
                }</span>
                <div class="summary-label">Total Cassettes</div>
            </div>
            <div class="summary-item">
                <span class="summary-number">${
                  entry.biopsies?.reduce((sum: number, biopsy: any) => 
                    sum + (biopsy.papQuantity || 0) + (biopsy.citologiaQuantity || 0), 0) || 0
                }</span>
                <div class="summary-label">Total Vidrios</div>
            </div>
            <div class="summary-item">
                <span class="summary-number">${
                  entry.biopsies?.filter((biopsy: any) => 
                    biopsy.serviciosEspeciales && Object.values(biopsy.serviciosEspeciales).some(v => 
                      typeof v === 'boolean' ? v : false
                    )
                  ).length || 0
                }</span>
                <div class="summary-label">Con Servicios</div>
            </div>
        </div>
    </div>

    <!-- Instructions Section -->
    <div class="instructions-section">
        <div class="instructions-title">⚠️ Instrucciones Importantes</div>
        <ul class="instructions-list">
            <li><strong>Conservar este remito</strong> junto con las muestras hasta la entrega de resultados</li>
            <li><strong>Verificar</strong> que todas las muestras estén debidamente identificadas y rotuladas</li>
            <li><strong>Contactar inmediatamente</strong> al laboratorio en caso de urgencias o consultas</li>
            <li><strong>Estudios urgentes</strong> serán procesados en 24-48 horas hábiles</li>
            <li><strong>Estudios normales</strong> serán procesados en 5-7 días hábiles</li>
        </ul>
    </div>

    <!-- Signature Section -->
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Firma del Médico Solicitante</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Sello y Matrícula Profesional</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Recepción Laboratorio</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p><strong>Remito generado automáticamente por BiopsyTracker</strong></p>
        <p>Fecha de generación: ${new Date().toLocaleString('es-AR')} | Código: ${entry.id.slice(-8).toUpperCase()}</p>
        <p style="margin-top: 8px; font-size: 7pt;">
            Este documento es válido únicamente cuando está acompañado de las muestras correspondientes
        </p>
    </div>

    <!-- Print Controls -->
    <div class="no-print" style="position: fixed; top: 20px; left: 20px; z-index: 1000; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e2e8f0;">
        <button onclick="window.print(); return false;" 
                style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; border: none; padding: 12px 24px; 
                       border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); margin-right: 10px;">
            🖨️ IMPRIMIR REMITO
        </button>
        <button onclick="window.close(); return false;" 
                style="background: #6b7280; color: white; border: none; padding: 12px 24px; 
                       border-radius: 8px; font-weight: 600; cursor: pointer;">
            ✕ CERRAR
        </button>
    </div>
</body>
</html>`;

    // Abrir en nueva ventana para imprimir
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes');
      if (printWindow) {
        printWindow.document.write(remitoHTML);
        printWindow.document.close();
        
        // Esperar a que se cargue y luego enfocar
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
          }, 500);
        };
        
        console.log('✅ Remito profesional generado exitosamente');
      } else {
        console.warn('⚠️ No se pudo abrir ventana de impresión');
        alert('Por favor, permite las ventanas emergentes para generar el remito de impresión.');
      }
    } catch (error) {
      console.error('❌ Error al generar remito:', error);
      alert('Error al generar el remito. Intenta nuevamente o contacta soporte técnico.');
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
                          {entry.biopsies.filter(b => getServiciosActivos(b).length > 0).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview de biopsias */}
                  {entry.biopsies.length > 0 && (
                    <div style={{
                      background: '#f0f9ff',
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '16px'
                    }}>
                      <p style={{
                        fontSize: '12px',
                        color: '#1e40af',
                        fontWeight: '600',
                        margin: '0 0 12px 0'
                      }}>📋 Biopsias incluidas:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {entry.biopsies.slice(0, 3).map((biopsy, index) => {
                          const serviciosActivos = getServiciosActivos(biopsy);
                          return (
                            <div key={index} style={{
                              background: 'white',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #e0f2fe'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                fontSize: '12px',
                                marginBottom: '4px'
                              }}>
                                <span style={{ color: '#1e40af', fontWeight: '600' }}>#{biopsy.number}</span>
                                <span style={{ color: '#0ea5e9' }}>{biopsy.type || '-'}</span>
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#0369a1',
                                marginBottom: '4px'
                              }}>
                                <span style={{ fontWeight: '600' }}>{biopsy.tissueType}</span>
                                {biopsy.tissueType === 'Endoscopia' && biopsy.endoscopiaSubTypes && biopsy.endoscopiaSubTypes.length > 0 && (
                                  <span style={{ color: '#0ea5e9' }}> ({biopsy.endoscopiaSubTypes.join(', ')})</span>
                                )}
                              </div>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px'
                              }}>
                                <span style={{ color: '#0369a1' }}>
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
                                  <span style={{ color: '#7c3aed' }}>
                                    🔧 {serviciosActivos.length} servicio{serviciosActivos.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              {serviciosActivos.length > 0 && (
                                <div style={{
                                  marginTop: '8px',
                                  paddingTop: '8px',
                                  borderTop: '1px solid #e0f2fe'
                                }}>
                                  <p style={{
                                    fontSize: '12px',
                                    color: '#7c3aed',
                                    margin: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }} title={serviciosActivos.join(', ')}>
                                    {serviciosActivos.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {entry.biopsies.length > 3 && (
                          <p style={{
                            fontSize: '12px',
                            color: '#0369a1',
                            textAlign: 'center',
                            margin: '8px 0 0 0'
                          }}>
                            ... y {entry.biopsies.length - 3} más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción optimizados para tablet */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handlePrint(entry)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <Printer size={16} />
                      Imprimir
                    </button>
                    
                    <button
                      onClick={() => handleEmail(entry)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Mail size={16} />
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
                        padding: '12px',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 12px 0'
            }}>
              Confirmar Eliminación
            </h3>
            <p style={{
              color: '#6B7280',
              margin: '0 0 24px 0'
            }}>
              ¿Estás seguro de que quieres eliminar este remito? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, entryId: null })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
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
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
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
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 12px 0'
            }}>
              Enviar por Email
            </h3>
            <p style={{
              color: '#6B7280',
              margin: '0 0 16px 0'
            }}>
              Ingresa la dirección de email para enviar el remito:
            </p>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="correo@ejemplo.com"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                marginBottom: '24px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEmailPopup({ isOpen: false, entry: null })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
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
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
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
