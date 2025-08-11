import React, { useState } from 'react';
import { DoctorInfo } from '../types';

interface LoginScreenProps {
  onLogin: (doctorInfo: DoctorInfo) => void;
  onGoToAdmin: () => void;
}

const SimpleLoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGoToAdmin }) => {
  const [firstName, setFirstName] = useState('');

  const handleLogin = () => {
    const doctorInfo: DoctorInfo = {
      name: firstName || 'Doctor Test',
      email: 'test@test.com',
      hospital: 'Hospital Test',
      selectedDate: new Date().toISOString().split('T')[0],
      loginDate: new Date().toISOString()
    };
    onLogin(doctorInfo);
  };

  return (
    <div style={{ 
      padding: '60px', 
      minHeight: '100vh', 
      backgroundColor: '#f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <div style={{ marginBottom: '15px', textAlign: 'center' }}>
        <img 
          src="/assets/biopsytracker_logo_final.svg" 
          alt="BiopsyTracker Logo" 
          style={{
            width: '100%',
            maxWidth: '1400px',
            height: '280px',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
          }}
        />
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="Nombre"
          value={firstName}
          onChange={(e) => {
            // Capitalizar solo la primera letra
            const value = e.target.value;
            const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            setFirstName(capitalizedValue);
          }}
          style={{
            width: '250px',
            padding: '10px',
            margin: '10px 0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
            textTransform: 'none'
          }}
        />
        
        <br />
        
        <button
          onClick={handleLogin}
          style={{
            width: '270px',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Iniciar Sesión
        </button>
        
        <br />
        
        <button
          onClick={onGoToAdmin}
          style={{
            width: '270px',
            padding: '12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Panel Admin
        </button>
      </div>
    </div>
  );
};

export default SimpleLoginScreen;
