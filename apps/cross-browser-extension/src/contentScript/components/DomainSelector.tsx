import React, { useState, useRef, useEffect } from 'react';
import { cn } from "../../lib/utils";
import { DomainOption } from '../../types';
import { IconChevronDown } from './ui/icons';

interface DomainSelectorProps {
  domains: DomainOption[];
  selectedDomain: string | null;
  onDomainChange: (domain: string) => void;
  disabled?: boolean;
  className?: string;
}

const DomainSelector: React.FC<DomainSelectorProps> = ({
  domains,
  selectedDomain,
  onDomainChange,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get the display text for selected domain
  const selectedDomainText = selectedDomain || (domains.length > 0 ? domains[0].slug : 'Select domain');

  const handleDomainSelect = (domain: string) => {
    onDomainChange(domain);
    setIsOpen(false);
  };

  if (domains.length === 0) {
    return (
      <div className="text-xs text-neutral-500 p-2">
        No domains available
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm",
          "hover:border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
          disabled && "cursor-not-allowed opacity-50",
          "transition-colors"
        )}
      >
        <span className="truncate font-medium text-neutral-900">
          {selectedDomainText}
        </span>
        <IconChevronDown 
          className={cn(
            "h-4 w-4 text-neutral-500 transition-transform",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto py-1">
            {domains.map((domain) => (
              <button
                key={domain.id}
                type="button"
                onClick={() => handleDomainSelect(domain.slug)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-sm text-left",
                  "hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none",
                  selectedDomain === domain.slug && "bg-blue-50 text-blue-700"
                )}
              >
                <span className="truncate font-medium">
                  {domain.slug}
                </span>
                <div className="flex items-center gap-1">
                  {domain.primary && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                      Primary
                    </span>
                  )}
                  {!domain.verified && (
                    <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                      Unverified
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DomainSelector;
