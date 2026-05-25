import React from 'react';
import { Link } from 'react-router-dom';
import { useFadeIn } from '../hooks/useFadeIn';

const NotFound = () => {
  const isVisible = useFadeIn();

  return (
    <div className={`bg-white rounded-xl shadow-md border border-rose-100 overflow-hidden flex flex-col items-center justify-center py-24 px-4 text-center my-8 max-w-4xl mx-auto transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="text-amber-500 mb-6 animate-pulse">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-20 h-20 mx-auto">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h1 className="text-7xl md:text-9xl font-serif font-bold text-rose-950 mb-4 tracking-widest drop-shadow-sm">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold text-rose-900 mb-4">Page Not Found</h2>
      <p className="text-gray-600 max-w-lg mb-10 text-base md:text-lg leading-relaxed">
        Alas, the royal chambers you seek are nowhere to be found. 
        They may have been moved, or perhaps they never existed at all.
      </p>
      <Link 
        to="/" 
        className="inline-flex items-center justify-center bg-gradient-to-r from-rose-950 to-rose-900 hover:from-rose-900 hover:to-rose-800 text-amber-400 font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      >
        Return to Royal Collection
      </Link>
    </div>
  );
};

export default NotFound;