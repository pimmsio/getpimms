import React, { useState, useRef, useEffect } from "react";
import { DomainOption } from "../../types";

interface DomainSelectorProps {
  domains: DomainOption[];
  selectedDomain: string | null;
  onDomainChange: (domain: string) => void;
  defaultDomain: string | null;
  onSetDefaultDomain: (domain: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const DomainSelector: React.FC<DomainSelectorProps> = ({
  domains,
  selectedDomain,
  onDomainChange,
  defaultDomain,
  onSetDefaultDomain,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDomainObj = domains.find(d => d.slug === selectedDomain);

  const handleSelect = (domain: DomainOption) => {
    onDomainChange(domain.slug);
    setIsOpen(false);
  };

  const handleSetAsDefault = async (domain: DomainOption, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await onSetDefaultDomain(domain.slug);
    } catch (error) {
      console.error("Error setting default domain:", error);
    }
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  if (domains.length === 0) {
    return (
      <div className="p-2 text-xs text-neutral-500">No domains available</div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-neutral-300 rounded-md shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
      >
        <span className="truncate">
          {selectedDomainObj ? selectedDomainObj.slug : 'Select domain'}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 cursor-pointer ${selectedDomain === domain.slug ? 'bg-blue-50 text-blue-700' : 'text-neutral-900'}`}
              onMouseDown={() => handleSelect(domain)}
            >
              <div className="flex w-full items-center justify-between">
                <span 
                  className="truncate font-medium flex-1"
                >
                  {domain.slug}
                </span>
                <div className="ml-2 flex items-center gap-1">
                  {/* Star icon - clickable to set as default, filled if this domain is the default */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSetAsDefault(domain, e)
                    }}
                    className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                      defaultDomain === domain.slug ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'
                    }`}
                    title={defaultDomain === domain.slug ? 'Default domain' : 'Click to set as default'}
                  >
                    <svg 
                      className="w-4 h-4"
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={2}
                      fill={defaultDomain === domain.slug ? 'currentColor' : 'none'}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  {!domain.verified && (
                    <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DomainSelector;
