// client/src/App.js
import React, { useState, useEffect } from 'react';
import HomePage from './pages/Homepage.jsx';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5050/api/test')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setMessage(data.message);
        setError('');
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError('Failed to fetch message from backend. Is the backend server running?');
        setMessage('');
      });
  }, []);

  return (
    <div>
      <HomePage />
    </div>
    // <div className="App">
    //   <header className="App-header">
    //     <h1>MERN Stack Test</h1>
    //     {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    //     {message ? (
    //       <p>Message from backend: <strong>{message}</strong></p>
    //     ) : (
    //       !error && <p>Loading message from backend...</p>
    //     )}
    //   </header>
    // </div>
  );
}

export default App;