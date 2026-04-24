// Convierte HTML a PDF en el navegador.
// Estrategia: renderizar el HTML dentro de un <iframe> aislado (asi los `<style>`
// y el DOCTYPE funcionan igual que en una página normal), y después capturar el
// body del iframe con html2pdf.js.

import html2pdf from 'html2pdf.js';

const A4_WIDTH_PX = 794; // ancho aprox A4 a 96dpi

export const htmlToPdfBase64 = async (html: string, filename = 'documento.pdf'): Promise<string> => {
  // 1) Crear iframe oculto con el HTML completo
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${A4_WIDTH_PX}px;height:1123px;border:0;visibility:hidden;`;
  document.body.appendChild(iframe);

  try {
    // Usar srcdoc — permite pasar el HTML completo y el iframe lo renderiza como documento aislado
    iframe.srcdoc = html;

    // Esperar a que termine de cargar
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout cargando HTML en iframe')), 15000);
      iframe.onload = () => { clearTimeout(timeout); resolve(); };
      iframe.onerror = () => { clearTimeout(timeout); reject(new Error('Error cargando iframe')); };
    });

    // Esperar un tick extra para que se completen imágenes/fonts
    await new Promise(r => setTimeout(r, 300));

    const doc = iframe.contentDocument;
    if (!doc || !doc.body) {
      throw new Error('No se pudo acceder al documento del iframe');
    }

    // Ajustar alto del iframe al contenido real para que html2canvas lo capture completo
    const bodyHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
    iframe.style.height = bodyHeight + 'px';

    const opt: any = {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: A4_WIDTH_PX,
        windowHeight: bodyHeight,
        // Capturar desde el documento del iframe
        ignoreElements: () => false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const blob: Blob = await html2pdf().set(opt).from(doc.body).output('blob');

    // blob → base64
    const reader = new FileReader();
    const base64: string = await new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        const commaIdx = result.indexOf(',');
        resolve(commaIdx >= 0 ? result.substring(commaIdx + 1) : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    return base64;
  } finally {
    document.body.removeChild(iframe);
  }
};
