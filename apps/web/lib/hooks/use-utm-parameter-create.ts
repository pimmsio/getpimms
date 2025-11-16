import { useState } from "react";
import { toast } from "sonner";
import { normalizeUtmValue } from "@dub/utils";
import { KeyedMutator } from "swr";
import { UtmParameterType } from "../utils/utm-parameter-utils";

interface UseUtmParameterCreateProps {
  parameterType: UtmParameterType;
  mutate: KeyedMutator<any>;
  workspaceId: string;
  onSuccess?: () => void;
  onError?: () => void;
}

interface CreateUtmParameterOptions {
  name: string;
  previousValue?: string;
  onChange?: (value: string) => void;
}

const PARAMETER_NAMES: Record<UtmParameterType, string> = {
  source: "source",
  medium: "medium",
  campaign: "campaign",
  term: "term",
  content: "content",
};

const PARAMETER_LABELS: Record<UtmParameterType, string> = {
  source: "UTM source",
  medium: "UTM medium",
  campaign: "UTM campaign",
  term: "UTM term",
  content: "UTM content",
};

export function useUtmParameterCreate({
  parameterType,
  mutate,
  workspaceId,
  onSuccess,
  onError,
}: UseUtmParameterCreateProps) {
  const [isCreating, setIsCreating] = useState(false);

  const getEndpoint = () => {
    const pluralMap: Record<UtmParameterType, string> = {
      source: "sources",
      medium: "mediums",
      campaign: "campaigns",
      term: "terms",
      content: "contents",
    };
    return `/api/utm-${pluralMap[parameterType]}?workspaceId=${workspaceId}`;
  };

  const createParameter = async ({
    name,
    previousValue = "",
    onChange,
  }: CreateUtmParameterOptions): Promise<boolean> => {
    const normalizedName = normalizeUtmValue(name);
    const paramLabel = PARAMETER_LABELS[parameterType];
    
    if (!normalizedName) {
      toast.message(`Please enter a valid ${PARAMETER_NAMES[parameterType]}.`);
      return false;
    }

    // Optimistic update
    if (onChange) {
      onChange(normalizedName);
    }

    setIsCreating(true);

    try {
      const res = await fetch(getEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: normalizedName }),
      });

      if (res.ok) {
        const newParameter = await res.json();
        toast.success(`Successfully created ${paramLabel}!`);
        
        // Call bound mutate function to refresh cache
        await mutate();
        
        if (onSuccess) {
          onSuccess();
        }
        
        setIsCreating(false);
        return true;
      } else if (res.status === 409) {
        // Already exists – treat as success and keep selection
        toast.message(`${paramLabel.charAt(0).toUpperCase() + paramLabel.slice(1)} already exists — selected.`);
        
        // Still refresh cache to ensure it's in the list
        await mutate();
        
        if (onSuccess) {
          onSuccess();
        }
        
        setIsCreating(false);
        return true;
      } else {
        // Revert optimistic update
        if (onChange) {
          onChange(previousValue);
        }
        
        let message = `Failed to create ${paramLabel}.`;
        try {
          const { error } = await res.json();
          if (error?.message) message = error.message;
        } catch {}
        
        toast.error(message);
        
        if (onError) {
          onError();
        }
        
        setIsCreating(false);
        return false;
      }
    } catch (error) {
      // Revert optimistic update
      if (onChange) {
        onChange(previousValue);
      }
      
      toast.error(`Failed to create ${paramLabel}.`);
      
      if (onError) {
        onError();
      }
      
      setIsCreating(false);
      return false;
    }
  };

  return {
    createParameter,
    isCreating,
  };
}

