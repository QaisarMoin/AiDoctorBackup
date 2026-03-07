import React from 'react';
import './loader1111.css';

const Loader = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6 transform transition-all">
        <div className="loading">
          <svg width="120px" height="48px">
            <polyline points="0 24, 25 24, 40 48, 70 0, 85 24, 120 24" id="back"></polyline>
            <polyline points="0 24, 25 24, 40 48, 70 0, 85 24, 120 24" id="front"></polyline>
          </svg>
        </div>
        {message && <p className="text-gray-700 font-medium text-lg animate-pulse">{message}</p>}
      </div>
    </div>
  );
};

export default Loader;
