import { BiopsyForm, DoctorInfo, HistoryEntry } from '../types';

export const generateProfessionalRemito = (entry: HistoryEntry, doctorInfo: DoctorInfo): string => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Remito BiopsyTracker - ${entry.id}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page { margin: 20mm; size: A4; }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.5;
            color: #333;
            background: white;
            font-size: 12pt;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 25px;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
        }
        
        .app-brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            border: 3px solid rgba(255, 255, 255, 0.3);
        }
        
        .brand-text h1 {
            font-size: 26pt;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .brand-text p {
            font-size: 12pt;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .document-title {
            background: rgba(255, 255, 255, 0.15);
            padding: 12px 30px;
            border-radius: 30px;
            font-size: 18pt;
            font-weight: 700;
            display: inline-block;
            border: 2px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 35px;
        }
        
        .info-card {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            border-left: 6px solid #3b82f6;
        }
        
        .card-title {
            font-size: 14pt;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .label {
            font-weight: 600;
            color: #64748b;
        }
        
        .value {
            font-weight: 700;
            color: #1e293b;
            text-align: right;
        }
        
        .table-container {
            margin-bottom: 30px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border: 2px solid #e2e8f0;
        }
        
        .table-title {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            color: white;
            padding: 15px 20px;
            font-size: 16pt;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }
        
        th {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 15px 10px;
            text-align: center;
            font-weight: 700;
            font-size: 10pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 12px 10px;
            text-align: center;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
            font-size: 10pt;
        }
        
        tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .biopsy-num {
            background: #dbeafe;
            color: #1e40af;
            padding: 6px 10px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 11pt;
        }
        
        .tissue-cell {
            text-align: left;
            font-weight: 600;
            color: #1e293b;
        }
        
        .quantity {
            background: #dcfce7;
            color: #166534;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 700;
        }
        
        .service-tag {
            background: #ede9fe;
            color: #6b21a8;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
            margin: 2px;
            display: inline-block;
        }
        
        .priority-urgent {
            background: #fee2e2;
            color: #dc2626;
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 9pt;
        }
        
        .priority-normal {
            background: #dcfce7;
            color: #166534;
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 9pt;
        }
        
        .instructions {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 3px solid #f59e0b;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .instructions-title {
            font-size: 14pt;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 20px;
            text-align: center;
            text-transform: uppercase;
        }
        
        .instructions ul {
            list-style: none;
            padding: 0;
        }
        
        .instructions li {
            margin-bottom: 12px;
            padding: 8px 0;
            color: #78350f;
            font-weight: 500;
            border-bottom: 1px solid rgba(146, 64, 14, 0.1);
        }
        
        .instructions li:before {
            content: "🔸";
            margin-right: 10px;
        }
        
        .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-top: 40px;
        }
        
        .signature-box {
            text-align: center;
            padding: 20px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            background: #f8fafc;
        }
        
        .signature-line {
            border-bottom: 2px solid #64748b;
            height: 50px;
            margin-bottom: 15px;
        }
        
        .signature-label {
            font-size: 10pt;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .footer {
            margin-top: 40px;
            padding: 20px;
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border-radius: 12px;
            text-align: center;
            border: 2px solid #cbd5e1;
        }
        
        .footer-brand {
            font-size: 12pt;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
        }
        
        .footer-info {
            font-size: 9pt;
            color: #64748b;
            margin-bottom: 5px;
        }
        
        .print-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            border: 2px solid #e2e8f0;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin: 0 5px;
            font-size: 11pt;
        }
        
        .btn-print {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .btn-close {
            background: #6b7280;
            color: white;
        }
        
        @media print {
            .print-controls { display: none !important; }
            body { font-size: 11pt; }
            * { color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="app-brand">
            <div class="logo">
                <img src="/assets/biopsytracker_logo_final.svg" alt="BiopsyTracker" style="width: 120px; height: 30px; filter: brightness(0) invert(1);" />
            </div>
            <div class="brand-text">
                <h1>BiopsyTracker</h1>
                <p>Sistema Profesional de Registro de Biopsias v2.3.0</p>
            </div>
        </div>
        <div class="document-title">📋 REMITO DE BIOPSIAS</div>
    </div>

    <!-- Information Grid -->
    <div class="info-grid">
        <div class="info-card">
            <div class="card-title">�‍⚕️ Información Médica</div>
            <div class="info-item">
                <span class="label">Médico:</span>
                <span class="value">Dr/a. ${entry.doctorInfo?.name || doctorInfo?.name || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Email:</span>
                <span class="value">${entry.doctorInfo?.email || doctorInfo?.email || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Hospital:</span>
                <span class="value">${entry.doctorInfo?.hospital || doctorInfo?.hospital || 'No especificado'}</span>
            </div>
        </div>
        
        <div class="info-card">
            <div class="card-title">📅 Datos del Remito</div>
            <div class="info-item">
                <span class="label">Número:</span>
                <span class="value">#${entry.id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-item">
                <span class="label">Fecha:</span>
                <span class="value">${new Date(entry.date).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}</span>
            </div>
            <div class="info-item">
                <span class="label">Hora:</span>
                <span class="value">${new Date(entry.timestamp).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
            </div>
        </div>
    </div>

    <!-- Biopsies Table -->
    <div class="table-container">
        <div class="table-title">🔬 Detalle de Biopsias</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 8%">N°</th>
                    <th style="width: 25%">Tipo de Tejido</th>
                    <th style="width: 12%">Cassettes</th>
                    <th style="width: 10%">PAP</th>
                    <th style="width: 12%">Citología</th>
                    <th style="width: 20%">Servicios</th>
                    <th style="width: 13%">Prioridad</th>
                </tr>
            </thead>
            <tbody>
                ${entry.biopsies?.map((biopsy, index) => {
                  const servicios = [];
                  if (biopsy.serviciosEspeciales?.giemsa) servicios.push('Giemsa');
                  if (biopsy.serviciosEspeciales?.pas) servicios.push('PAS');
                  if (biopsy.serviciosEspeciales?.masson) servicios.push('Masson');
                  
                  const isUrgent = biopsy.isUrgent;
                  
                  return `
                    <tr>
                        <td><span class="biopsy-num">${index + 1}</span></td>
                        <td class="tissue-cell">${biopsy.tissueType || 'No especificado'}</td>
                        <td><span class="quantity">${biopsy.cassettes || 0}</span></td>
                        <td><span class="quantity">${biopsy.papQuantity || 0}</span></td>
                        <td><span class="quantity">${biopsy.citologiaQuantity || 0}</span></td>
                        <td>
                            ${servicios.length > 0 
                              ? servicios.map(s => `<span class="service-tag">${s}</span>`).join(' ')
                              : '<span style="color: #6b7280; font-style: italic;">Sin servicios</span>'
                            }
                        </td>
                        <td>
                            ${isUrgent 
                              ? '<span class="priority-urgent">🚨 URGENTE</span>'
                              : '<span class="priority-normal">✓ NORMAL</span>'
                            }
                        </td>
                    </tr>
                  `;
                }).join('') || '<tr><td colspan="7" style="text-align: center; color: #6b7280; font-style: italic; padding: 20px;">No hay biopsias registradas</td></tr>'}
            </tbody>
        </table>
    </div>

    <!-- Instructions -->
    <div class="instructions">
        <div class="instructions-title">⚠️ Instrucciones Importantes</div>
        <ul>
            <li><strong>Conservar este remito</strong> junto con las muestras hasta la entrega de resultados</li>
            <li><strong>Verificar identificación</strong> de todas las muestras según numeración del remito</li>
            <li><strong>Estudios urgentes</strong> serán procesados en 24-48 horas hábiles</li>
            <li><strong>Estudios normales</strong> serán procesados en 5-7 días hábiles</li>
            <li><strong>Contactar al laboratorio</strong> inmediatamente ante cualquier consulta</li>
        </ul>
    </div>

    <!-- Signatures -->
    <div class="signatures">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Firma del Médico</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Sello Profesional</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Recepción Lab.</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-brand">🩺 BiopsyTracker - Sistema de Registro Médico</div>
        <div class="footer-info">Generado: ${new Date().toLocaleString('es-AR')} | ID: ${entry.id.slice(-8).toUpperCase()}</div>
        <div class="footer-info">Documento válido únicamente acompañado de las muestras correspondientes</div>
    </div>

    <!-- Print Controls -->
    <div class="print-controls">
        <button class="btn btn-print" onclick="window.print()">🖨️ IMPRIMIR</button>
        <button class="btn btn-close" onclick="window.close()">✕ CERRAR</button>
    </div>
</body>
</html>
  `;
};
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
            margin: 20mm;
            size: A4;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.5;
            color: #2c3e50;
            background: white;
            font-size: 12pt;
        }
        
        .header-container {
            display: flex;
            align-items: center;
            background: linear-gradient(45deg, #2c3e50, #34495e);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
        }
        
        .header-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            transform: rotate(45deg);
        }
        
        .app-brand {
            display: flex;
            align-items: center;
            margin-right: 40px;
            z-index: 1;
        }
        
        .brand-icon {
            background: rgba(255,255,255,0.2);
            width: 70px;
            height: 70px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-right: 20px;
            border: 3px solid rgba(255,255,255,0.3);
        }
        
        .brand-text h1 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 5px;
            letter-spacing: 2px;
        }
        
        .brand-text p {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .document-header {
            flex: 1;
            text-align: right;
            z-index: 1;
        }
        
        .document-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .document-number {
            font-size: 18px;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 25px;
            display: inline-block;
            font-weight: 600;
        }
        
        .clinic-info {
            background: #ecf0f1;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            border-left: 6px solid #3498db;
        }
        
        .clinic-name {
            font-size: 22px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .clinic-details {
            color: #7f8c8d;
            font-size: 14px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: white;
            border: 2px solid #bdc3c7;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .card-title {
            font-size: 16px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 15px;
            text-transform: uppercase;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 8px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
        }
        
        .info-label {
            font-weight: 600;
            color: #7f8c8d;
        }
        
        .info-value {
            font-weight: 700;
            color: #2c3e50;
        }
        
        .biopsies-container {
            margin-bottom: 30px;
        }
        
        .table-title {
            font-size: 18px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 15px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .biopsies-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            border: 2px solid #bdc3c7;
        }
        
        .biopsies-table th {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            padding: 15px 10px;
            text-align: center;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .biopsies-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #ecf0f1;
            text-align: center;
            font-size: 10px;
            vertical-align: middle;
        }
        
        .biopsies-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .biopsies-table tr:hover {
            background: #e3f2fd;
        }
        
        .biopsy-num {
            background: #3498db;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 11px;
        }
        
        .tissue-name {
            font-weight: 600;
            color: #2c3e50;
            text-align: left;
            font-size: 11px;
        }
        
        .quantity {
            background: #27ae60;
            color: white;
            padding: 4px 8px;
            border-radius: 15px;
            font-weight: 700;
            font-size: 10px;
        }
        
        .service-tag {
            background: #e74c3c;
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: 600;
            margin: 1px;
            display: inline-block;
        }
        
        .priority-urgent {
            background: #e74c3c;
            color: white;
            padding: 4px 10px;
            border-radius: 15px;
            font-weight: 700;
            font-size: 9px;
        }
        
        .priority-normal {
            background: #27ae60;
            color: white;
            padding: 4px 10px;
            border-radius: 15px;
            font-weight: 700;
            font-size: 9px;
        }
        
        .notes-section {
            background: #fff3cd;
            border: 2px solid #ffeeba;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .notes-title {
            font-size: 16px;
            font-weight: 700;
            color: #856404;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .notes-list {
            list-style: none;
            padding: 0;
        }
        
        .notes-list li {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
            color: #856404;
            font-size: 11px;
            line-height: 1.4;
        }
        
        .notes-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #28a745;
            font-weight: bold;
        }
        
        .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-top: 40px;
        }
        
        .signature-block {
            text-align: center;
            border: 2px solid #bdc3c7;
            border-radius: 10px;
            padding: 25px 15px;
            background: #f8f9fa;
        }
        
        .signature-line {
            border-bottom: 2px solid #2c3e50;
            height: 50px;
            margin-bottom: 15px;
        }
        
        .signature-label {
            font-size: 11px;
            font-weight: 700;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            padding: 20px;
            background: #2c3e50;
            color: white;
            border-radius: 10px;
        }
        
        .footer-title {
            font-weight: 700;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .footer-details {
            font-size: 10px;
            opacity: 0.8;
            line-height: 1.4;
        }
        
        @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
            .header-container, .info-grid, .biopsies-table, .notes-section { 
                page-break-inside: avoid; 
            }
        }
        
        .print-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            border: 2px solid #bdc3c7;
        }
        
        .btn {
            padding: 12px 20px;
            margin: 5px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 12px;
        }
        
        .btn-primary {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
        }
        
        .btn-secondary {
            background: #95a5a6;
            color: white;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header-container">
        <div class="app-brand">
            <div class="brand-icon">🩺</div>
            <div class="brand-text">
                <h1>BiopsyTracker</h1>
                <p>Sistema Profesional v2.3.0</p>
            </div>
        </div>
        <div class="document-header">
            <div class="document-title">Remito de Biopsias</div>
            <div class="document-number">#${entry.id.slice(-8).toUpperCase()}</div>
        </div>
    </div>

    <!-- Clinic Information -->
    <div class="clinic-info">
        <div class="clinic-name">${entry.doctorInfo?.name || doctorInfo?.name || 'CENTRO MÉDICO'}</div>
        <div class="clinic-details">${entry.doctorInfo?.hospital || doctorInfo?.hospital || 'Centro Médico Especializado'}</div>
    </div>

    <!-- Information Grid -->
    <div class="info-grid">
        <div class="info-card">
            <div class="card-title">👨‍⚕️ Información del Médico</div>
            <div class="info-item">
                <span class="info-label">Nombre:</span>
                <span class="info-value">Dr/a. ${entry.doctorInfo?.name || doctorInfo?.name || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${entry.doctorInfo?.email || doctorInfo?.email || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Hospital:</span>
                <span class="info-value">${entry.doctorInfo?.hospital || doctorInfo?.hospital || 'No especificado'}</span>
            </div>
        </div>
        
        <div class="info-card">
            <div class="card-title">📅 Información del Remito</div>
            <div class="info-item">
                <span class="info-label">Número:</span>
                <span class="info-value">#${entry.id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${new Date(entry.date).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Hora:</span>
                <span class="info-value">${new Date(entry.timestamp).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
            </div>
        </div>
    </div>

    <!-- Biopsies Table -->
    <div class="biopsies-container">
        <div class="table-title">📋 Detalle de Biopsias</div>
        <table class="biopsies-table">
            <thead>
                <tr>
                    <th style="width: 8%">N°</th>
                    <th style="width: 25%">Tipo de Tejido</th>
                    <th style="width: 12%">Cassettes</th>
                    <th style="width: 10%">PAP</th>
                    <th style="width: 10%">Citología</th>
                    <th style="width: 20%">Servicios</th>
                    <th style="width: 15%">Prioridad</th>
                </tr>
            </thead>
            <tbody>
                ${entry.biopsies?.map((biopsy, index) => {
                  const isUrgent = biopsy.priority === 'urgent';
                  const servicios = [];
                  
                  // Servicios especiales
                  if (biopsy.serviciosEspeciales) {
                    Object.entries(biopsy.serviciosEspeciales).forEach(([key, value]) => {
                      if (value === true) {
                        const serviceName = serviciosAdicionales.find(s => s.id === key)?.name || key;
                        servicios.push(serviceName);
                      }
                    });
                  }
                  
                  // Giemsa
                  if (biopsy.giemsa && biopsy.giemsa !== 'no') {
                    const giemsaName = giemsaOptions.find(g => g.id === biopsy.giemsa)?.name || biopsy.giemsa;
                    servicios.push(giemsaName);
                  }
                  
                  return `
                    <tr>
                        <td><span class="biopsy-num">${index + 1}</span></td>
                        <td class="tissue-name">${biopsy.tissueType || 'No especificado'}</td>
                        <td><span class="quantity">${biopsy.cassettes || 0}</span></td>
                        <td><span class="quantity">${biopsy.papQuantity || 0}</span></td>
                        <td><span class="quantity">${biopsy.citologiaQuantity || 0}</span></td>
                        <td>
                            ${servicios.length > 0 
                              ? servicios.map(s => `<span class="service-tag">${s}</span>`).join(' ')
                              : '<span style="color: #95a5a6; font-style: italic;">Sin servicios</span>'
                            }
                        </td>
                        <td>
                            ${isUrgent 
                              ? '<span class="priority-urgent">🚨 URGENTE</span>'
                              : '<span class="priority-normal">✓ NORMAL</span>'
                            }
                        </td>
                    </tr>
                  `;
                }).join('') || '<tr><td colspan="7" style="text-align: center; color: #95a5a6; font-style: italic; padding: 30px;">No hay biopsias registradas</td></tr>'}
            </tbody>
        </table>
    </div>

    <!-- Important Notes -->
    <div class="notes-section">
        <div class="notes-title">⚠️ INSTRUCCIONES IMPORTANTES</div>
        <ul class="notes-list">
            <li><strong>CONSERVAR ESTE REMITO</strong> junto con las muestras hasta la entrega de resultados</li>
            <li><strong>VERIFICAR</strong> que todas las muestras estén debidamente identificadas y rotuladas</li>
            <li><strong>CONTACTAR INMEDIATAMENTE</strong> al laboratorio en caso de urgencias o consultas</li>
            <li><strong>ESTUDIOS URGENTES</strong> serán procesados en 24-48 horas hábiles</li>
            <li><strong>ESTUDIOS NORMALES</strong> serán procesados en 5-7 días hábiles</li>
            <li><strong>CUALQUIER DISCREPANCIA</strong> debe ser reportada inmediatamente</li>
        </ul>
    </div>

    <!-- Signatures -->
    <div class="signatures">
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Firma del Médico</div>
        </div>
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Sello Profesional</div>
        </div>
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Recepción Lab.</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-title">Documento generado por BiopsyTracker v2.3.0</div>
        <div class="footer-details">
            Fecha de generación: ${new Date().toLocaleString('es-AR')}<br>
            Código de verificación: ${entry.id.slice(-8).toUpperCase()}<br>
            Este documento es válido únicamente acompañado de las muestras correspondientes
        </div>
    </div>

    <!-- Print Controls -->
    <div class="print-controls no-print">
        <button class="btn btn-primary" onclick="window.print()">🖨️ IMPRIMIR</button>
        <button class="btn btn-secondary" onclick="window.close()">✕ CERRAR</button>
    </div>
</body>
</html>`;

    // Abrir nueva ventana para imprimir
    try {
      const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
      if (printWindow) {
        printWindow.document.write(remitoHTML);
        printWindow.document.close();
        
        // Configurar para imprimir automáticamente cuando cargue
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
          }, 500);
        };
        
        console.log('✅ Remito profesional generado exitosamente');
      } else {
        console.error('No se pudo abrir la ventana de impresión');
        alert('Error: No se pudo abrir la ventana de impresión. Verifique que los pop-ups estén habilitados.');
      }
    } catch (error) {
      console.error('❌ Error al generar remito:', error);
      alert('Error al generar el remito. Intenta nuevamente o contacta soporte técnico.');
    }
  };
