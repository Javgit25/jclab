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
  // Debug: Agregar logs para diagnosticar
  React.useEffect(() => {
    console.log('HistoryScreen - doctorInfo:', doctorInfo);
    console.log('HistoryScreen - historyEntries:', historyEntries);
    console.log('HistoryScreen - historyEntries.length:', historyEntries?.length);
  }, [doctorInfo, historyEntries]);

  const [emailPopup, setEmailPopup] = useState<{isOpen: boolean, entry: HistoryEntry | null}>({
    isOpen: false,
    entry: null
  });
  const [emailAddress, setEmailAddress] = useState('');

  // Verificación de seguridad
  if (!doctorInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onGoBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Error</h2>
          </div>
        </div>
        <div className="max-w-md mx-auto p-4 text-center py-12">
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Error: Información del doctor no disponible
          </h3>
          <button
            onClick={onGoBack}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // historyEntries siempre debe ser un array, incluso si está vacío
  const entries = historyEntries || [];
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Función para generar CSV
  const generateCSV = (biopsies: BiopsyForm[], doctorInfo: DoctorInfo, date: string) => {
    const headers = [
      'Número de Biopsia',
      'Tipo de Tejido', 
      'Sub-tipos Endoscopia',
      'Tipo (BX/PQ)',
      'Cantidad Cassettes',
      'Números de Cassettes',
      'Cantidad Trozos',
      'Desclasificar',
      'Servicios Adicionales',
      'Observaciones',
      'Hora de Carga',
      'Fecha'
    ];

    const csvContent = [
      `Remito del día - Dr. ${doctorInfo.firstName} ${doctorInfo.lastName}`,
      doctorInfo.hospitalName ? `Hospital: ${doctorInfo.hospitalName}` : '',
      `Fecha: ${new Date(date).toLocaleDateString('es-AR')}`,
      `Total de biopsias: ${biopsies.length}`,
      '',
      headers.join(','),
      ...biopsies.map(biopsy => {
        const serviciosActivos: string[] = [];
        if (biopsy.servicios) {
          Object.entries(biopsy.servicios).forEach(([key, value]) => {
            if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
              const servicio = serviciosAdicionales.find(s => s.key === key);
              if (servicio) {
                let servicioLabel = servicio.label;
                
                // Agregar cantidad para cortes en blanco
                if (key === 'corteBlancoIHQ') {
                  const quantity = biopsy.servicios.corteBlancoIHQQuantity || 1;
                  servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
                } else if (key === 'corteBlancoComun') {
                  const quantity = biopsy.servicios.corteBlancoComunQuantity || 1;
                  servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
                }
                
                // Agregar sub-opciones de Giemsa si están seleccionadas
                if (key === 'giemsaPASMasson' && biopsy.servicios.giemsaOptions) {
                  const giemsaSelected = Object.entries(biopsy.servicios.giemsaOptions)
                    .filter(([_, selected]) => selected)
                    .map(([optionKey, _]) => {
                      const option = giemsaOptions.find(opt => opt.key === optionKey);
                      return option ? option.label : optionKey;
                    });
                  
                  if (giemsaSelected.length > 0) {
                    servicioLabel = `${giemsaSelected.join(', ')}`;
                  }
                }
                
                serviciosActivos.push(servicioLabel);
              }
            }
          });
        }
        
        // Determinar el tipo de tejido completo con sub-tipos de Endoscopia
        let tipoTejidoCompleto = biopsy.tissueType;
        let endoscopiaSubTypesText = '';
        
        if (biopsy.tissueType === 'Endoscopia' && biopsy.endoscopiaSubTypes && biopsy.endoscopiaSubTypes.length > 0) {
          tipoTejidoCompleto = `Endoscopia`;
          endoscopiaSubTypesText = biopsy.endoscopiaSubTypes.join(', ');
        }
        
        return [
          biopsy.number,
          `"${tipoTejidoCompleto}"`,
          `"${endoscopiaSubTypesText}"`,
          biopsy.type,
          biopsy.cassettes,
          `"${Array.isArray(biopsy.cassettesNumbers) ? biopsy.cassettesNumbers.join(', ') : biopsy.cassettesNumbers || biopsy.number}"`,
          biopsy.pieces,
          biopsy.declassify,
          `"${serviciosActivos.join(', ')}"`,
          `"${biopsy.observations || ''}"`,
          biopsy.timestamp ? new Date(biopsy.timestamp).toLocaleTimeString('es-AR') : '',
          biopsy.timestamp ? new Date(biopsy.timestamp).toLocaleDateString('es-AR') : ''
        ].join(',');
      })
    ].join('\n');

    return csvContent;
  };

  // Función para imprimir remito
  const printEntry = (entry: HistoryEntry) => {
    const printContent = generatePrintableReport(entry.biopsies, doctorInfo, entry.date);
    
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  // Función para generar reporte imprimible
  const generatePrintableReport = (biopsies: BiopsyForm[], doctorInfo: DoctorInfo, date: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Remito de Biopsias - ${new Date(date).toLocaleDateString('es-AR')}</title>
        <style>
          @page { 
            margin: 20mm; 
            size: A4;
          }
          
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.3;
            margin: 0;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          
          .header h1 {
            margin: 0;
            font-size: 18px;
            color: #333;
          }
          
          .header p {
            margin: 5px 0;
            color: #666;
          }
          
          .info-section {
            margin-bottom: 15px;
          }
          
          .info-section h3 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 10px;
          }
          
          th, td {
            border: 1px solid #333;
            padding: 6px 4px;
            text-align: left;
            vertical-align: top;
          }
          
          th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 9px;
            text-align: center;
          }
          
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .numero { width: 8%; text-align: center; }
          .tejido { width: 20%; }
          .tipo { width: 6%; text-align: center; }
          .cassettes { width: 8%; text-align: center; }
          .nums-cassettes { width: 15%; font-family: monospace; font-size: 9px; }
          .declasificar { width: 10%; text-align: center; }
          .servicios { width: 25%; font-size: 9px; }
          .observaciones { width: 18%; font-size: 9px; }
          
          .servicios ul {
            margin: 0;
            padding-left: 12px;
            list-style-type: disc;
          }
          
          .servicios li {
            margin: 1px 0;
          }
          
          .summary {
            margin-top: 20px;
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 5px;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
          
          @media print {
            body { font-size: 10px; }
            th, td { padding: 4px 2px; font-size: 9px; }
            .header h1 { font-size: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>REMITO DE BIOPSIAS</h1>
          <p><strong>Dr. ${doctorInfo.firstName} ${doctorInfo.lastName}</strong></p>
          ${doctorInfo.hospitalName ? `<p>${doctorInfo.hospitalName}</p>` : ''}
          <p>Fecha: <strong>${new Date(date).toLocaleDateString('es-AR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</strong></p>
        </div>

        <div class="info-section">
          <h3>📊 Resumen</h3>
          <p><strong>Total de biopsias:</strong> ${biopsies.length}</p>
          <p><strong>Con servicios adicionales:</strong> ${biopsies.filter(b => 
            Object.values(b.servicios || {}).some(val => typeof val === 'boolean' ? val : false)
          ).length}</p>
          <p><strong>Generado:</strong> ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th class="numero">N° Biopsia</th>
              <th class="tejido">Tipo de Tejido</th>
              <th class="tipo">Tipo</th>
              <th class="cassettes">Cant. Cassettes</th>
              <th class="nums-cassettes">N° Cassettes</th>
              <th class="declasificar">Desclasificar</th>
              <th class="servicios">Servicios Adicionales</th>
              <th class="observaciones">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${biopsies.map(biopsy => {
              // Obtener servicios activos
              const serviciosActivos: string[] = [];
              if (biopsy.servicios) {
                Object.entries(biopsy.servicios).forEach(([key, value]) => {
                  if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
                    const servicio = serviciosAdicionales.find(s => s.key === key);
                    if (servicio) {
                      let servicioLabel = servicio.label;
                      
                      // Agregar cantidad para cortes en blanco
                      if (key === 'corteBlancoIHQ') {
                        const quantity = biopsy.servicios.corteBlancoIHQQuantity || 1;
                        servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
                      } else if (key === 'corteBlancoComun') {
                        const quantity = biopsy.servicios.corteBlancoComunQuantity || 1;
                        servicioLabel += ` (${quantity} corte${quantity !== 1 ? 's' : ''})`;
                      }
                      
                      // Agregar sub-opciones de Giemsa si están seleccionadas
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
              }

              // Determinar el tipo de tejido completo con sub-tipos de Endoscopia
              let tipoTejidoCompleto = biopsy.tissueType;
              if (biopsy.tissueType === 'Endoscopia' && biopsy.endoscopiaSubTypes && biopsy.endoscopiaSubTypes.length > 0) {
                tipoTejidoCompleto = `${biopsy.tissueType} (${biopsy.endoscopiaSubTypes.join(', ')})`;
              }

              // Obtener números de cassettes
              const cassettesNumbers = Array.isArray(biopsy.cassettesNumbers) 
                ? biopsy.cassettesNumbers.join(', ') 
                : biopsy.cassettesNumbers || biopsy.number;

              return `
                <tr>
                  <td class="numero"><strong>#${biopsy.number}</strong></td>
                  <td class="tejido">${tipoTejidoCompleto}</td>
                  <td class="tipo">${biopsy.type}</td>
                  <td class="cassettes">${biopsy.cassettes}</td>
                  <td class="nums-cassettes">${cassettesNumbers}</td>
                  <td class="declasificar">${biopsy.declassify || 'No'}</td>
                  <td class="servicios">
                    ${serviciosActivos.length > 0 ? `
                      <ul>
                        ${serviciosActivos.map(servicio => `<li>${servicio}</li>`).join('')}
                      </ul>
                    ` : '<em>Ninguno</em>'}
                  </td>
                  <td class="observaciones">${biopsy.observations || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Documento generado automáticamente - ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}</p>
          <p>Sistema de Gestión de Biopsias</p>
        </div>
      </body>
      </html>
    `;
  };

  // Función para enviar por email
  const sendByEmail = (entry: HistoryEntry) => {
    setEmailPopup({ isOpen: true, entry });
  };

  const confirmSendEmail = () => {
    if (!emailAddress || !emailPopup.entry) return;

    const csvContent = generateCSV(emailPopup.entry.biopsies, doctorInfo, emailPopup.entry.date);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Crear subject y body del email
    const subject = `Remito de Biopsias - Dr. ${doctorInfo.firstName} ${doctorInfo.lastName} - ${emailPopup.entry.date}`;
    const body = `Adjunto remito del día ${emailPopup.entry.date} con ${emailPopup.entry.biopsies.length} biopsias.\n\nDr. ${doctorInfo.firstName} ${doctorInfo.lastName}${doctorInfo.hospitalName ? `\n${doctorInfo.hospitalName}` : ''}`;

    // Abrir cliente de email
    const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);

    // También permitir descargar el archivo CSV
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Remito_${doctorInfo.firstName}_${doctorInfo.lastName}_${emailPopup.entry.date.replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setEmailPopup({ isOpen: false, entry: null });
    setEmailAddress('');

    alert(`📧 Email preparado para enviar a: ${emailAddress}\n\n💾 El archivo CSV también se descargó para adjuntar manualmente si es necesario.`);
  };

  const closeEmailPopup = () => {
    setEmailPopup({ isOpen: false, entry: null });
    setEmailAddress('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={onGoBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Historial de Remitos</h2>
              <p className="text-sm text-gray-600">
                {entries.length} remito{entries.length !== 1 ? 's' : ''} guardado{entries.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ConnectionStatus 
            isOnline={isOnline}
            backupStatus={backupStatus}
            syncQueueLength={syncQueueLength}
          />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No hay remitos en el historial
            </h3>
            <p className="text-gray-500 mb-4">
              Los remitos finalizados aparecerán aquí
            </p>
            <button
              onClick={onGoBack}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
            >
              Volver al Inicio
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
              >
                {/* Header del remito */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Remito del {new Date(entry.date).toLocaleDateString('es-AR')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {entry.biopsies.length} biopsia{entry.biopsies.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString('es-AR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Biopsias</p>
                      <p className="text-lg font-bold text-gray-800">{entry.biopsies.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Con Servicios</p>
                      <p className="text-lg font-bold text-gray-800">
                        {entry.biopsies.filter(b => 
                          Object.values(b.servicios || {}).some(val => 
                            typeof val === 'boolean' ? val : false
                          )
                        ).length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview de biopsias - ACTUALIZADO */}
                {entry.biopsies.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <p className="text-xs text-blue-800 font-medium mb-2">📋 Biopsias incluidas:</p>
                    <div className="space-y-1">
                      {entry.biopsies.slice(0, 3).map((biopsy, index) => {
                        // Obtener servicios adicionales
                        const serviciosActivos: string[] = [];
                        if (biopsy.servicios) {
                          Object.entries(biopsy.servicios).forEach(([key, value]) => {
                            if (value && key !== 'giemsaOptions' && key !== 'corteBlancoIHQQuantity' && key !== 'corteBlancoComunQuantity') {
                              const servicio = serviciosAdicionales.find(s => s.key === key);
                              if (servicio) {
                                let servicioLabel = servicio.label;
                                
                                // Agregar cantidad para cortes en blanco
                                if (key === 'corteBlancoIHQ') {
                                  const quantity = biopsy.servicios.corteBlancoIHQQuantity || 1;
                                  servicioLabel += ` (${quantity})`;
                                } else if (key === 'corteBlancoComun') {
                                  const quantity = biopsy.servicios.corteBlancoComunQuantity || 1;
                                  servicioLabel += ` (${quantity})`;
                                }
                                
                                // Agregar sub-opciones de Giemsa si están seleccionadas
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
                        }

                        return (
                          <div key={index} className="bg-white p-2 rounded border">
                            <div className="flex justify-between items-start text-xs mb-1">
                              <span className="text-blue-700 font-medium">#{biopsy.number}</span>
                              <span className="text-blue-500">{biopsy.type}</span>
                            </div>
                            <div className="text-xs text-blue-600 mb-1">
                              <span className="font-medium">{biopsy.tissueType}</span>
                              {biopsy.tissueType === 'Endoscopia' && biopsy.endoscopiaSubTypes && biopsy.endoscopiaSubTypes.length > 0 && (
                                <span className="text-blue-500"> ({biopsy.endoscopiaSubTypes.join(', ')})</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-blue-600">Cassettes: <strong>{biopsy.cassettes}</strong></span>
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

                {/* Acciones */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => printEntry(entry)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir</span>
                  </button>
                  
                  <button
                    onClick={() => sendByEmail(entry)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </button>
                  
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                onClick={closeEmailPopup}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
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