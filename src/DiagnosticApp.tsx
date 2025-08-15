import React from 'react';

// Componente de diagnóstico simple
const DiagnosticApp = () => {
  console.log('DiagnosticApp: Componente renderizado');
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#e3f2fd',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      zIndex: 9999
    }}>
      <h1 style={{
        color: '#1976d2',
        fontSize: '2rem',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        🔧 Diagnóstico BiopsyTracker
      </h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#333', marginBottom: '1rem' }}>
          ✅ React está funcionando correctamente
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Fecha: {new Date().toLocaleString('es-ES')}
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Puerto: {window.location.port || '80'}
        </p>
        
        <button
          onClick={() => {
            console.log('Botón presionado');
            alert('¡JavaScript funcionando!');
          }}
          style={{
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '1rem'
          }}
        >
          Probar JavaScript
        </button>
        
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '0.8rem',
          color: '#666'
        }}>
          <strong>Estado del navegador:</strong><br/>
          User Agent: {navigator.userAgent.substring(0, 50)}...<br/>
          URL: {window.location.href}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticApp;
