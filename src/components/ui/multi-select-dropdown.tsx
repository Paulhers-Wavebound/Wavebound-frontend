import React, { useMemo } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder,
  className,
}: MultiSelectDropdownProps) {
  const hasSelections = selected.length > 0;

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClear = () => {
    onChange([]);
  };

  // Merge selected values that might not be in options (e.g. from URL)
  const allOptions = useMemo(() => {
    const extra = selected.filter(s => !options.includes(s));
    return [...extra, ...options];
  }, [options, selected]);

  const triggerLabel = hasSelections
    ? `${label} (${selected.length})`
    : placeholder || `All ${label}s`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-between gap-1.5 rounded-xl border border-transparent bg-background px-4 py-2 text-sm ring-offset-background",
            "shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06),0_1px_2px_-1px_hsl(var(--foreground)/0.04)]",
            "hover:shadow-[0_4px_14px_-4px_hsl(var(--foreground)/0.1),0_2px_4px_-2px_hsl(var(--foreground)/0.06)]",
            "hover:translate-y-[-0.5px] active:translate-y-[0px]",
            "transition-all duration-200",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "h-10 min-w-[140px]",
            hasSelections && "border-primary/30 bg-primary/5 shadow-[0_2px_10px_-2px_hsl(var(--primary)/0.15)]",
            className,
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[220px] p-0 bg-popover border border-border/15 shadow-[0_8px_30px_-8px_hsl(var(--foreground)/0.15)] rounded-xl z-50"
      >
        {/* Actions row */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/10">
          <button
            onClick={handleSelectAll}
            className="text-xs text-primary hover:underline"
          >
            Select All
          </button>
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Clear
          </button>
        </div>

        {/* Options list */}
        <div className="max-h-[240px] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="p-1">
            {allOptions.map((option) => {
              const isChecked = selected.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    "flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm",
                    "hover:bg-accent hover:text-accent-foreground transition-colors",
                    "text-left cursor-pointer",
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleOption(option)}
                    className="pointer-events-none"
                  />
                  <span className="truncate">{option}</span>
                </button>
              );
            })}
            {allOptions.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                No options available
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
