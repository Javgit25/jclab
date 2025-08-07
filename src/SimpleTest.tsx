import React from 'react';

function SimpleTest() {
  return (
    <div style={{ 
      width: '100vw',
      height: '100vh',
      backgroundColor: 'red',
      color: 'white',
      fontSize: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      ¡APLICACIÓN FUNCIONANDO!
    </div>
  );
}

export default SimpleTest;
