import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center my-12">
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
      <div className="absolute inset-0 rounded-full border-4 border-t-teal-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
    </div>
    <p className="mt-4 text-gray-300 text-lg font-semibold">Analyzing market sentiment...</p>
    <p className="mt-1 text-gray-500 text-sm">Please wait while our AI gathers the latest data.</p>
  </div>
);

export default LoadingSpinner;
