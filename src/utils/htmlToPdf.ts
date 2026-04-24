// Convierte HTML a PDF en el navegador usando html2pdf.js.
// Devuelve el PDF como string base64 (sin el prefijo data:...;base64,) listo para
// pasar como attachment a Resend.

import html2pdf from 'html2pdf.js';

export const htmlToPdfBase64 = async (html: string, filename = 'documento.pdf'): Promise<string> => {
  // Contenedor oculto. Ancho fijo A4 para que html2canvas renderice con layout consistente.
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:white;';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const opt: any = {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const blob: Blob = await html2pdf().set(opt).from(container).output('blob');

    // Convertir blob → base64
    const reader = new FileReader();
    const base64: string = await new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        // result format: "data:application/pdf;base64,XXXX"
        const commaIdx = result.indexOf(',');
        resolve(commaIdx >= 0 ? result.substring(commaIdx + 1) : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    return base64;
  } finally {
    document.body.removeChild(container);
  }
};
