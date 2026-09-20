import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found or you do not have permission to view this resource.</p>
      <Link 
        to="/" 
        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
