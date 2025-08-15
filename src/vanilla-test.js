// Prueba sin React - JavaScript puro
console.log('=== INICIANDO JAVASCRIPT PURO ===');

// Intentar modificar directamente el DOM
const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (rootElement) {
  rootElement.innerHTML = `
    <div style="
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      color: white;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      font-size: 24px;
      text-align: center;
    ">
      <h1 style="font-size: 48px; margin-bottom: 20px;">🚀 JavaScript Puro Funciona!</h1>
      <p>Hora: ${new Date().toLocaleTimeString()}</p>
      <p>URL: ${window.location.href}</p>
      <button onclick="alert('Click detectado!')" style="
        padding: 20px 40px;
        font-size: 20px;
        background: white;
        color: #333;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        margin-top: 20px;
      ">Probar Click</button>
    </div>
  `;
  console.log('DOM modificado exitosamente');
} else {
  console.error('NO SE ENCONTRÓ EL ELEMENTO ROOT!');
  document.body.innerHTML = '<h1 style="color: red; font-size: 50px;">ERROR: No root element</h1>';
}
