// AppWrapper.jsx
import React from 'react';
import Talk from './Talk'; // Adjust path as needed
import Main from './Main';   // Import your main app component

const AppWrapper = () => {
  return (
    <div className="relative min-h-screen w-full">
      {/* This is the container for your main application */}
      <div className="main-app-content">
        <Main />
      </div>

      {/* The floating voice chat component */}
      <Talk />
    </div>
  );
};

export default AppWrapper;