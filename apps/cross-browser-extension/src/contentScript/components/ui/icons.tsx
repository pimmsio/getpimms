import React from 'react';
import { ArrowLeft, Loader2, X, ChevronDown } from 'lucide-react';

// Temporary wrappers to smooth over React 19 type changes with lucide-react types
export const IconArrowLeft = ArrowLeft as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
export const IconLoader2 = Loader2 as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
export const IconX = X as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
export const IconChevronDown = ChevronDown as unknown as React.FC<React.SVGProps<SVGSVGElement>>;


