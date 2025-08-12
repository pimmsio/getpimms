import { useMemo } from 'react';
import useDomains from './useDomains';

interface UseWorkspaceDomainsReturn {
  domains: string[];
  isWorkspaceLink: (href: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

export default function useWorkspaceDomains(): UseWorkspaceDomainsReturn {
  const { domains: domainOptions, isLoading, error } = useDomains();

  // Extract domain slugs from the domain options
  const domains = useMemo(() => {
    return domainOptions
      .filter(domain => domain.verified && !domain.archived)
      .map(domain => domain.slug);
  }, [domainOptions]);

  // Function to check if a link belongs to any workspace domain
  const isWorkspaceLink = useMemo(() => {
    return (href: string): boolean => {
      if (!href || typeof href !== 'string' || domains.length === 0) {
        return false;
      }

      try {
        const url = new URL(href.startsWith('http') ? href : `https://${href}`);
        const hostname = url.hostname.toLowerCase();
        
        // Check if hostname matches any of the workspace domains
        return domains.some(domain => {
          const domainLower = domain.toLowerCase();
          // Match exact domain or subdomain
          return hostname === domainLower || hostname.endsWith(`.${domainLower}`);
        });
      } catch {
        // Invalid URL, try to match as bare domain
        const cleanHref = href.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
        return domains.some(domain => {
          const domainLower = domain.toLowerCase();
          return cleanHref === domainLower || cleanHref.endsWith(`.${domainLower}`);
        });
      }
    };
  }, [domains]);

  return {
    domains,
    isWorkspaceLink,
    isLoading,
    error,
  };
}
