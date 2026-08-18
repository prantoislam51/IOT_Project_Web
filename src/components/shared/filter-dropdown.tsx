"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

const ALL = "__ALL__";

export function FilterDropdown({
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  className,
}: FilterDropdownProps) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(v) => onValueChange(v === ALL ? "" : v)}
      aria-label={ariaLabel}
    >
      <SelectTrigger className={className} aria-label={ariaLabel ?? placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder ?? "All"}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
