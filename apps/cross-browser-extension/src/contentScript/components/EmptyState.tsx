import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <svg 
          className="h-8 w-8 text-slate-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" 
          />
        </svg>
      </div>
      <div className="mb-2 text-[15px] font-medium text-slate-700">No links detected</div>
      <div className="text-[13px] text-slate-500 max-w-[250px] leading-relaxed">
        We're scanning for links in this email. Links will appear here when detected.
      </div>
    </div>
  );
};

export default EmptyState;
