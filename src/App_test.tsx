import React from 'react';

function App() {
  console.log('App component rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontSize: '24px', 
      color: 'blue',
      backgroundColor: 'yellow',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1>🚀 BiopsyTracker FUNCIONANDO!</h1>
      <p>Si ves esto, la aplicación está cargando correctamente.</p>
      <p>Fecha: {new Date().toLocaleString()}</p>
    </div>
  );
}

export default App;
