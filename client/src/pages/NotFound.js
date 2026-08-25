import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col justify-center items-center p-6 text-center relative font-sans">
      <h1 className="text-[10rem] sm:text-[12rem] font-extrabold text-gray-200 tracking-widest select-none leading-none">404</h1>
      <div className="bg-emerald-600 px-4 py-1.5 text-xs rounded-full rotate-6 absolute mb-20 text-white font-extrabold shadow-sm">
        Page Not Found
      </div>
      <p className="text-gray-600 mt-6 max-w-md text-xs font-medium">
        The page you are looking for does not exist, has been relocated, or is currently under construction.
      </p>
      <Link
        to="/"
        className="mt-8 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all"
      >
        Go Home
      </Link>
    </div>
  );
}
