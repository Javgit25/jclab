import React from 'react';

const BasicTest = () => {
  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'red',
      color: 'white',
      fontSize: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }
  }, 'SI VES ESTO, REACT FUNCIONA!');
};

export default BasicTest;
