// Logo BiopsyTracker como base64 SVG para usar en impresión
export const LOGO_BASE64 = `data:image/svg+xml;base64,${btoa(`
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo con gradiente -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F76F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3B5BDB;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="60" fill="url(#bgGrad)" rx="8"/>
  
  <!-- Logo médico mejorado -->
  <g transform="translate(12, 12)">
    <!-- Círculo de fondo -->
    <circle cx="18" cy="18" r="16" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
    <!-- Cruz médica -->
    <rect x="15" y="8" width="6" height="20" fill="url(#crossGrad)" rx="2"/>
    <rect x="8" y="15" width="20" height="6" fill="url(#crossGrad)" rx="2"/>
    <!-- Sombra interior -->
    <rect x="15" y="8" width="6" height="20" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="0.3" rx="2"/>
    <rect x="8" y="15" width="20" height="6" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="0.3" rx="2"/>
  </g>
  
  <!-- Texto BiopsyTracker -->
  <text x="50" y="25" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">
    BiopsyTracker
  </text>
  <text x="50" y="40" font-family="Arial, sans-serif" font-size="9" fill="rgba(255,255,255,0.9)">
    Sistema de Gestión de Biopsias
  </text>
</svg>
`)}`;
