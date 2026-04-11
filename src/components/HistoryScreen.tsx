import React, { useState } from 'react';
import { ArrowLeft, Printer, Calendar, FileText, Trash2, Send, CheckCircle, Edit2, X, Plus, Save, Activity, Clock } from 'lucide-react';
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
  onUpdateEntry?: (entry: HistoryEntry) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  doctorInfo,
  historyEntries,
  isOnline,
  backupStatus,
  syncQueueLength,
  onGoBack,
  onDeleteEntry,
  onUpdateEntry
}) => {
  // Limpiar notificaciones de "revisado sin cambios" (legacy)
  useState(() => {
    try {
      const notifs = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
      const cleaned = notifs.filter((n: any) => !n.mensaje?.includes('revisado sin cambios') && !n.mensaje?.includes('Remito revisado'));
      if (cleaned.length !== notifs.length) {
        localStorage.setItem('doctorNotifications', JSON.stringify(cleaned));
      }
    } catch {}
  });

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
        <div style="flex: 0 0 auto; margin-right: 12px;">
            <img src="${window.location.pathname.replace(/\/[^/]*$/, '/') + 'assets/biopsytracker_logo_final.svg'}" alt="Logo" style="height: 40px; filter: brightness(0) invert(1);" />
        </div>
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

  // Estado de edición de remitos
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);

  const handleEditEntry = (entry: HistoryEntry) => {
    setEditingEntry(JSON.parse(JSON.stringify(entry)));
  };

  const handleRemoveBiopsy = (biopsyIndex: number) => {
    if (!editingEntry) return;
    if (editingEntry.biopsies.length <= 1) {
      alert('El remito debe tener al menos una biopsia.');
      return;
    }
    const updated = {
      ...editingEntry,
      biopsies: editingEntry.biopsies.filter((_, i) => i !== biopsyIndex)
    };
    setEditingEntry(updated);
  };

  const handleEditBiopsyField = (biopsyIndex: number, field: string, value: any) => {
    if (!editingEntry) return;
    const updatedBiopsies = [...editingEntry.biopsies];
    (updatedBiopsies[biopsyIndex] as any)[field] = value;
    setEditingEntry({ ...editingEntry, biopsies: updatedBiopsies });
  };

  const handleSaveEdit = () => {
    if (!editingEntry || !onUpdateEntry) return;

    // Log de cambios
    const changeLog = {
      editedAt: new Date().toISOString(),
      editedBy: doctorInfo.name
    };
    console.log('Remito editado:', changeLog, editingEntry);

    onUpdateEntry(editingEntry);

    // Si fue enviado, sincronizar con adminRemitos
    if (sentRemitos[editingEntry.id]) {
      try {
        const adminRemitos = JSON.parse(localStorage.getItem('adminRemitos') || '[]');
        const idx = adminRemitos.findIndex((r: any) =>
          r.doctorEmail === editingEntry.doctorInfo.email &&
          r.fecha === editingEntry.date
        );
        if (idx >= 0) {
          adminRemitos[idx].biopsias = editingEntry.biopsies.map((b: BiopsyForm) => ({
            numero: b.number,
            tejido: b.tissueType,
            tipo: b.type,
            cassettes: parseInt(b.cassettes) || 0,
            trozos: parseInt(b.pieces) || 0,
            desclasificar: b.declassify === 'Sí' ? 'Sí' : 'No',
            servicios: {
              cassetteNormal: parseInt(b.cassettes) || 0,
              cassetteUrgente: b.servicios?.cassetteUrgente ? 1 : 0,
              profundizacion: 0,
              pap: b.servicios?.pap ? 1 : 0,
              papUrgente: b.servicios?.papUrgente ? 1 : 0,
              citologia: b.servicios?.citologia ? 1 : 0,
              citologiaUrgente: b.servicios?.citologiaUrgente ? 1 : 0,
              corteBlanco: b.servicios?.corteBlancoComun ? (b.servicios.corteBlancoComunQuantity || 1) : 0,
              corteBlancoIHQ: b.servicios?.corteBlancoIHQ ? (b.servicios.corteBlancoIHQQuantity || 1) : 0,
              giemsaPASMasson: b.servicios?.giemsaPASMasson ? 1 : 0
            },
            papQuantity: b.papQuantity || 0,
            citologiaQuantity: b.citologiaQuantity || 0
          }));
          localStorage.setItem('adminRemitos', JSON.stringify(adminRemitos));
        }
      } catch (e) {
        console.error('Error sincronizando edición con admin:', e);
      }
    }

    setEditingEntry(null);
    alert('Remito actualizado correctamente.');
  };

  // Estado de envío de remitos
  const [sentRemitos, setSentRemitos] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('sentRemitos') || '{}');
    } catch { return {}; }
  });

  const handleSendToLab = (entry: HistoryEntry) => {
    // Actualizar estado local
    const updated = { ...sentRemitos, [entry.id]: new Date().toISOString() };
    setSentRemitos(updated);
    localStorage.setItem('sentRemitos', JSON.stringify(updated));

    // Actualizar en adminRemitos para que el técnico/admin lo vea
    try {
      const adminRemitos = JSON.parse(localStorage.getItem('adminRemitos') || '[]');
      const idx = adminRemitos.findIndex((r: any) =>
        r.doctorEmail === entry.doctorInfo.email &&
        r.fecha === entry.date
      );
      if (idx >= 0) {
        adminRemitos[idx].estadoEnvio = 'enviado';
        adminRemitos[idx].enviadoAt = new Date().toISOString();
      }
      localStorage.setItem('adminRemitos', JSON.stringify(adminRemitos));
    } catch (e) {
      console.error('Error actualizando adminRemitos:', e);
    }

    alert('Remito enviado al laboratorio correctamente.');
  };

  const isRemitoSent = (entryId: string) => !!sentRemitos[entryId];

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

  const entries = historyEntries || [];
  const sortedEntries = [...entries].sort((a, b) => {
    const tA = new Date(a.timestamp || a.date).getTime() || 0;
    const tB = new Date(b.timestamp || b.date).getTime() || 0;
    return tB - tA;
  });

  // Paginación
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(sortedEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = sortedEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
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
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Lista de remitos - estilo profesional */}
            {paginatedEntries.map((entry) => {
              const urgentCount = entry.biopsies.filter(b => isUrgentBiopsy(b)).length;
              const isModified = (() => {
                try {
                  const n = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
                  const entryRN = (entry as any).remitoNumber;
                  // Solo matchear por remitoNumber o ID exacto, no por fecha/cantidad
                  return n.filter((x: any) => x.tipo !== 'listo' && x.tipo !== 'parcial').some((x: any) => {
                    if (x.remitoId === entry.id) return true;
                    // Match por remitoNumber del admin remito
                    if (entryRN && x.remitoId) {
                      try {
                        const adminRemitos = JSON.parse(localStorage.getItem('adminRemitos') || '[]');
                        const adminRemito = adminRemitos.find((r: any) => r.id === x.remitoId);
                        if (adminRemito && (adminRemito as any).remitoNumber === entryRN) return true;
                      } catch {}
                    }
                    return false;
                  });
                } catch { return false; }
              })();
              const totalBX = entry.biopsies.filter(b => b.type !== 'PQ' && b.tissueType !== 'PAP' && b.tissueType !== 'Citología').length;
              const totalPQ = entry.biopsies.filter(b => b.type === 'PQ').length;
              const totalPAP = entry.biopsies.reduce((s, b) => s + (b.papQuantity || 0), 0);
              const totalCito = entry.biopsies.reduce((s, b) => s + (b.citologiaQuantity || 0), 0);

              return (
                <div key={entry.id} style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}>
                  {/* Header del remito */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
                    padding: '10px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>
                        Remito #{((entry as any).remitoNumber || entry.id.slice(-6).toUpperCase())}
                      </span>
                      {isModified && (
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#fbbf24', background: 'rgba(251,191,36,0.2)', padding: '2px 6px', borderRadius: '4px' }}>MODIFICADO</span>
                      )}
                      {urgentCount > 0 && (
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#fca5a5', background: 'rgba(252,165,165,0.2)', padding: '2px 6px', borderRadius: '4px' }}>URGENTE</span>
                      )}
                      {(entry as any).cargadoPor && (
                        <span style={{ fontSize: '9px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                          Cargado por: {(entry as any).cargadoPor}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                        {new Date(entry.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}{new Date(entry.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div style={{ padding: '10px 14px' }}>
                    {/* Mini KPIs del remito */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      {[
                        { label: 'Muestras', val: entry.biopsies.length, color: '#1e40af' },
                        ...(totalBX > 0 ? [{ label: 'BX', val: totalBX, color: '#0369a1' }] : []),
                        ...(totalPQ > 0 ? [{ label: 'PQ', val: totalPQ, color: '#0c4a6e' }] : []),
                        ...(totalPAP > 0 ? [{ label: 'PAP', val: totalPAP, color: '#4338ca' }] : []),
                        ...(totalCito > 0 ? [{ label: 'Cito', val: totalCito, color: '#475569' }] : []),
                      ].map((k, i) => (
                        <div key={i} style={{
                          background: k.color, color: 'white', borderRadius: '6px',
                          padding: '4px 10px', fontSize: '11px', fontWeight: '600',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                          <span style={{ opacity: 0.7 }}>{k.label}</span>
                          <span style={{ fontWeight: '700' }}>{k.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Detalle de modificaciones del laboratorio */}
                    {isModified && (() => {
                      try {
                        const allNotifs = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
                        const entryTimestamp2 = entry.timestamp || entry.date;
                        const entryBiopsyCount2 = entry.biopsies.length;
                        const adminRemitos = JSON.parse(localStorage.getItem('adminRemitos') || '[]');
                        const remitoNotifs = allNotifs
                          .filter((n: any) => {
                            if (n.tipo === 'listo' || n.tipo === 'parcial') return false;
                            if (n.remitoId === entry.id) return true;
                            const entryRN2 = (entry as any).remitoNumber;
                            if (entryRN2 && n.remitoId) {
                              const ar = adminRemitos.find((r: any) => r.id === n.remitoId);
                              if (ar && (ar as any).remitoNumber === entryRN2) return true;
                            }
                            return false;
                          })
                          .sort((a: any, b: any) => new Date(b.fecha || b.date).getTime() - new Date(a.fecha || a.date).getTime());
                        if (remitoNotifs.length === 0) return null;
                        return (
                          <div style={{
                            borderRadius: '8px', marginBottom: '10px', overflow: 'hidden',
                            border: '1px solid #fde68a'
                          }}>
                            {/* Header */}
                            <div style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                              <Edit2 size={12} color="white" />
                              <span style={{ fontSize: '10px', fontWeight: '700', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Modificado por el laboratorio ({remitoNotifs.length} {remitoNotifs.length === 1 ? 'vez' : 'veces'})
                              </span>
                            </div>
                            {/* Lista de cambios */}
                            <div style={{ background: '#fffbeb' }}>
                              {remitoNotifs.map((notif: any, ni: number) => (
                                <div key={ni} style={{
                                  padding: '8px 10px',
                                  borderBottom: ni < remitoNotifs.length - 1 ? '1px solid #fef3c7' : 'none'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#92400e' }}>
                                      Modificación {remitoNotifs.length > 1 ? `#${remitoNotifs.length - ni}` : ''}
                                    </span>
                                    <span style={{ fontSize: '9px', color: '#b45309' }}>
                                      {new Date(notif.fecha || notif.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#78350f', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                                    {notif.mensaje || 'Remito revisado por el laboratorio'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } catch {}
                      return null;
                    })()}

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handlePrintInPage(entry)} style={{
                        background: '#1e40af', color: 'white', border: 'none', padding: '6px 14px',
                        borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <FileText size={12} /> Ver
                      </button>
                      <button onClick={() => handleDelete(entry.id)} style={{
                        background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0',
                        padding: '6px 8px', borderRadius: '6px', cursor: 'pointer'
                      }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Controles de paginación */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 0',
            marginTop: '8px'
          }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db',
                background: currentPage === 1 ? '#f3f4f6' : 'white',
                color: currentPage === 1 ? '#9ca3af' : '#374151',
                cursor: currentPage === 1 ? 'default' : 'pointer',
                fontWeight: '600', fontSize: '14px'
              }}
            >
              ← Anterior
            </button>
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Página {currentPage} de {totalPages} ({sortedEntries.length} remitos)
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db',
                background: currentPage === totalPages ? '#f3f4f6' : 'white',
                color: currentPage === totalPages ? '#9ca3af' : '#374151',
                cursor: currentPage === totalPages ? 'default' : 'pointer',
                fontWeight: '600', fontSize: '14px'
              }}
            >
              Siguiente →
            </button>
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

      {/* Modal de Edición de Remito */}
      {editingEntry && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '16px 16px 0 0'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                Editar Remito
              </h3>
              <button onClick={() => setEditingEntry(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px'
              }}>
                <X size={20} color="#6b7280" />
              </button>
            </div>

            {/* Contenido */}
            <div style={{ padding: '16px 20px' }}>
              {isRemitoSent(editingEntry.id) && (
                <div style={{
                  background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px',
                  padding: '10px 12px', marginBottom: '16px', fontSize: '13px', color: '#92400e'
                }}>
                  Este remito ya fue enviado. Los cambios se sincronizarán con el laboratorio.
                </div>
              )}

              {editingEntry.biopsies.map((biopsy, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px',
                  marginBottom: '12px', background: '#fafafa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#374151' }}>
                      Biopsia #{index + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveBiopsy(index)}
                      style={{
                        background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px',
                        padding: '4px 8px', cursor: 'pointer', color: '#dc2626', fontSize: '12px'
                      }}
                    >
                      <Trash2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Eliminar
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>Tejido</label>
                      <input
                        type="text"
                        value={biopsy.tissueType}
                        onChange={(e) => handleEditBiopsyField(index, 'tissueType', e.target.value)}
                        style={{
                          width: '100%', padding: '6px 10px', border: '1px solid #d1d5db',
                          borderRadius: '6px', fontSize: '13px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>Tipo (BX/PQ)</label>
                      <select
                        value={biopsy.type}
                        onChange={(e) => handleEditBiopsyField(index, 'type', e.target.value)}
                        style={{
                          width: '100%', padding: '6px 10px', border: '1px solid #d1d5db',
                          borderRadius: '6px', fontSize: '13px'
                        }}
                      >
                        <option value="BX">BX</option>
                        <option value="PQ">PQ</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>Cassettes</label>
                      <input
                        type="number"
                        value={biopsy.cassettes}
                        onChange={(e) => handleEditBiopsyField(index, 'cassettes', e.target.value)}
                        min="0"
                        style={{
                          width: '100%', padding: '6px 10px', border: '1px solid #d1d5db',
                          borderRadius: '6px', fontSize: '13px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>Trozos</label>
                      <input
                        type="number"
                        value={biopsy.pieces}
                        onChange={(e) => handleEditBiopsyField(index, 'pieces', e.target.value)}
                        min="0"
                        style={{
                          width: '100%', padding: '6px 10px', border: '1px solid #d1d5db',
                          borderRadius: '6px', fontSize: '13px'
                        }}
                      />
                    </div>
                    {biopsy.papQuantity > 0 && (
                      <div>
                        <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>PAP Cantidad</label>
                        <input
                          type="number"
                          value={biopsy.papQuantity}
                          onChange={(e) => handleEditBiopsyField(index, 'papQuantity', Number(e.target.value))}
                          min="0"
                          style={{
                            width: '100%', padding: '6px 10px', border: '1px solid #d1d5db',
                            borderRadius: '6px', fontSize: '13px'
                          }}
                        />
                      </div>
                    )}
                    {biopsy.citologiaQuantity > 0 && (
                      <div>
                        <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>Citología Cantidad</label>
                        <input
                          type="number"
                          value={biopsy.citologiaQuantity}
                          onChange={(e) => handleEditBiopsyField(index, 'citologiaQuantity', Number(e.target.value))}
                          min="0"
                          style={{
                            width: '100%', padding: '6px 10px', border: '1px solid #d1d5db',
                            borderRadius: '6px', fontSize: '13px'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px', borderTop: '1px solid #e5e7eb',
              display: 'flex', gap: '10px', justifyContent: 'flex-end',
              position: 'sticky', bottom: 0, background: 'white', borderRadius: '0 0 16px 16px'
            }}>
              <button
                onClick={() => setEditingEntry(null)}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db',
                  background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#374151'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Save size={16} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Vista del remito profesional */}
      {showRemito.isOpen && showRemito.entry && (() => {
        const re = showRemito.entry;
        const doc = re.doctorInfo || {} as any;
        const bios = re.biopsies || [];
        const labCfg = (() => { try { return JSON.parse(localStorage.getItem('labConfig') || '{}'); } catch { return {}; } })();
        const fechaRemito = (() => { try { return new Date(re.timestamp || re.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return String(re.date || ''); } })();
        const totalBX = bios.filter((b: any) => b.tissueType !== 'PAP' && b.tissueType !== 'Citología' && b.type !== 'PQ').length;
        const totalPQ = bios.filter((b: any) => b.type === 'PQ').length;
        const totalPAP = bios.reduce((s: number, b: any) => s + (b.papQuantity || 0), 0);
        const totalCito = bios.reduce((s: number, b: any) => s + (b.citologiaQuantity || 0), 0);
        const totalCassettes = bios.reduce((s: number, b: any) => s + (parseInt(b.cassettes) || 0), 0);

        const handlePrintInline = () => {
          window.print();
        };

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f1f5f9', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
            {/* Barra de acciones (no se imprime) */}
            <div style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>Remito #{((re as any).remitoNumber || ((re as any).remitoNumber || (re.id || '').slice(-6).toUpperCase()))}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintInline} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>🖨 Imprimir</button>
                <button onClick={() => setShowRemito({ isOpen: false, entry: null })} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>✕ Cerrar</button>
              </div>
            </div>

            {/* Área imprimible */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <div id="remito-print-area" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '32px', fontFamily: 'Georgia, serif', color: '#1a1a1a', fontSize: '11pt', lineHeight: 1.5 }}>

                {/* Encabezado institucional */}
                <div style={{ borderBottom: '3px solid #1e3a5f', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '20pt', fontWeight: 700, color: '#1e3a5f', letterSpacing: '-0.5px' }}>{labCfg.nombre || 'Laboratorio de Anatomía Patológica'}</div>
                      {(labCfg.direccion || labCfg.telefono || labCfg.email) && (
                        <div style={{ fontSize: '9pt', color: '#64748b', marginTop: '4px' }}>
                          {[labCfg.direccion, labCfg.telefono, labCfg.email].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10pt', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '2px' }}>Remito</div>
                      <div style={{ fontSize: '18pt', fontWeight: 700, color: '#1e3a5f' }}>#{((re as any).remitoNumber || (re.id || '').slice(-6).toUpperCase())}</div>
                      <div style={{ fontSize: '9pt', color: '#64748b' }}>{fechaRemito}</div>
                    </div>
                  </div>
                </div>

                {/* Datos del médico */}
                <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '8pt', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Médico Solicitante</div>
                    <div style={{ fontSize: '13pt', fontWeight: 700, color: '#1e293b' }}>Dr/a. {doc.name || 'N/A'}</div>
                    <div style={{ fontSize: '10pt', color: '#475569' }}>{doc.email || ''}</div>
                    {doc.hospital && <div style={{ fontSize: '10pt', color: '#475569' }}>{doc.hospital}</div>}
                    {(re as any).cargadoPor && <div style={{ fontSize: '9pt', color: '#d97706', fontWeight: 600, marginTop: '4px' }}>Cargado por: {(re as any).cargadoPor}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '8pt', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Resumen</div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      {totalBX > 0 && <div style={{ background: '#1e40af', color: 'white', borderRadius: '6px', padding: '4px 10px', fontSize: '10pt', fontWeight: 700 }}>BX: {totalBX}</div>}
                      {totalPQ > 0 && <div style={{ background: '#0369a1', color: 'white', borderRadius: '6px', padding: '4px 10px', fontSize: '10pt', fontWeight: 700 }}>PQ: {totalPQ}</div>}
                      {totalPAP > 0 && <div style={{ background: '#4338ca', color: 'white', borderRadius: '6px', padding: '4px 10px', fontSize: '10pt', fontWeight: 700 }}>PAP: {totalPAP}</div>}
                      {totalCito > 0 && <div style={{ background: '#475569', color: 'white', borderRadius: '6px', padding: '4px 10px', fontSize: '10pt', fontWeight: 700 }}>Cito: {totalCito}</div>}
                    </div>
                    <div style={{ fontSize: '9pt', color: '#64748b', marginTop: '4px' }}>{totalCassettes} cassette{totalCassettes !== 1 ? 's' : ''} total</div>
                  </div>
                </div>

                {/* Tabla de estudios */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #1e3a5f', fontSize: '8pt', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #1e3a5f', fontSize: '8pt', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>N° Paciente</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #1e3a5f', fontSize: '8pt', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Material</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid #1e3a5f', fontSize: '8pt', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid #1e3a5f', fontSize: '8pt', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cant.</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid #1e3a5f', fontSize: '8pt', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trozos</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #1e3a5f', fontSize: '8pt', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Servicios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bios.map((b: any, i: number) => {
                      const isPAP = b.tissueType === 'PAP';
                      const isCito = b.tissueType === 'Citología';
                      const tipo = isPAP ? 'PAP' : isCito ? (b.citologiaSubType || 'Cito') : b.type === 'PQ' ? 'PQ' : 'BX';
                      const sv = b.servicios || {};
                      const services: string[] = [];
                      if (sv.cassetteUrgente) services.push('⚡ Urgente 24hs');
                      if (sv.pap) services.push('PAP');
                      if (sv.papUrgente) services.push('PAP Urgente');
                      if (sv.citologia) services.push('Citología');
                      if (sv.citologiaUrgente) services.push('Cito Urgente');
                      if (sv.corteBlancoIHQ) services.push(`Corte IHQ (${sv.corteBlancoIHQQuantity || 1})`);
                      if (sv.corteBlancoComun) services.push(`Corte Blanco (${sv.corteBlancoComunQuantity || 1})`);
                      if (sv.giemsaPASMasson) {
                        const tecnicas: string[] = [];
                        if (sv.giemsaOptions?.giemsa) tecnicas.push('Giemsa');
                        if (sv.giemsaOptions?.pas) tecnicas.push('PAS');
                        if (sv.giemsaOptions?.masson) tecnicas.push('Masson');
                        services.push(tecnicas.length > 0 ? tecnicas.join(', ') : 'Giemsa/PAS/Masson');
                      }
                      const cassNums = b.cassettesNumbers?.map((c: any) => `${c.base}/${c.suffix}`).join(', ') || '';
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px', fontSize: '10pt', fontWeight: 600, color: '#64748b' }}>{i + 1}</td>
                          <td style={{ padding: '8px', fontSize: '10pt' }}>
                            <div style={{ fontWeight: 700 }}>{b.number || '-'}</div>
                            {cassNums && <div style={{ fontSize: '8pt', color: '#94a3b8' }}>SUBs: {cassNums}</div>}
                          </td>
                          <td style={{ padding: '8px', fontSize: '10pt' }}>{b.tissueType || '-'}</td>
                          <td style={{ padding: '8px', fontSize: '10pt', textAlign: 'center' }}>
                            <span style={{ background: tipo === 'BX' ? '#1e40af' : tipo === 'PQ' ? '#0369a1' : tipo === 'PAP' ? '#4338ca' : '#475569', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '9pt', fontWeight: 700 }}>{tipo}</span>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', fontSize: '10pt', fontWeight: 600 }}>{isPAP ? (b.papQuantity || 1) : isCito ? (b.citologiaQuantity || 1) : (b.cassettes || 0)}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontSize: '10pt' }}>
                            {isPAP || isCito ? '-' : (() => {
                              const tpc = b.trozoPorCassette || [];
                              const totalT = tpc.length > 0 ? tpc.reduce((s: number, v: number) => s + (v || 1), 0) : (parseInt(b.pieces) || 0);
                              const cns = b.cassettesNumbers || [];
                              if (tpc.length > 1) {
                                return <div>
                                  <div style={{ fontWeight: 700 }}>{totalT}</div>
                                  <div style={{ fontSize: '7pt', color: '#94a3b8' }}>{tpc.map((t: number, ci: number) => (ci === 0 ? (cns[0]?.base || 'C1') : ('S/' + (cns[ci]?.suffix || ci))) + ':' + (t || 1)).join(' · ')}</div>
                                </div>;
                              }
                              return totalT || '-';
                            })()}
                            {b.quedaMaterial && <div style={{ fontSize: '7pt', color: '#d97706', fontWeight: 700 }}>⚠ Q.Material</div>}
                          </td>
                          <td style={{ padding: '8px', fontSize: '9pt', color: '#475569' }}>{services.length > 0 ? services.join(', ') : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Observaciones */}
                {bios.some((b: any) => b.observations) && (
                  <div style={{ marginBottom: '24px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 700, fontSize: '9pt', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Observaciones</div>
                    {bios.filter((b: any) => b.observations).map((b: any, i: number) => (
                      <div key={i} style={{ fontSize: '10pt', marginBottom: '3px' }}>• <strong>#{b.number}:</strong> {b.observations}</div>
                    ))}
                  </div>
                )}

                {/* Firmas */}
                <div style={{ display: 'flex', gap: '60px', marginTop: '40px', paddingTop: '20px' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ borderBottom: '2px solid #1e3a5f', height: '50px', marginBottom: '8px' }} />
                    <div style={{ fontSize: '10pt', fontWeight: 700, color: '#1e3a5f' }}>Firma del Médico</div>
                    <div style={{ fontSize: '9pt', color: '#64748b' }}>Dr/a. {doc.name || ''}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ borderBottom: '2px solid #1e3a5f', height: '50px', marginBottom: '8px' }} />
                    <div style={{ fontSize: '10pt', fontWeight: 700, color: '#1e3a5f' }}>Recibido por Laboratorio</div>
                    <div style={{ fontSize: '9pt', color: '#64748b' }}>Fecha: ____________</div>
                  </div>
                </div>

                {/* Pie de página */}
                <div style={{ marginTop: '30px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8pt', color: '#94a3b8' }}>
                  Documento generado por BiopsyTracker · {fechaRemito} · Remito #{((re as any).remitoNumber || (re.id || '').slice(-6).toUpperCase())}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default HistoryScreen;
