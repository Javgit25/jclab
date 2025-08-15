import React from 'react';

function TestApp() {
  return (
    <div style={{ 
      padding: '20px', 
      fontSize: '24px', 
      backgroundColor: '#f0f0f0',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>🔬 BiopsyTracker Test</h1>
        <p style={{ color: '#666' }}>Si ves este mensaje, React está funcionando correctamente</p>
        <button 
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
          onClick={() => alert('¡Botón funcionando!')}
        >
          Hacer Click para Probar
        </button>
        <div style={{ marginTop: '20px', color: '#888', fontSize: '14px' }}>
          <p>Fecha actual: {new Date().toLocaleString('es-ES')}</p>
          <p>Puerto: 5173</p>
        </div>
      </div>
    </div>
  );
}

export default TestApp;
