import React, { useMemo, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import countries from 'world-countries';

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);

  const countryOptions = useMemo(() => {
    return countries.map((country) => ({
      value: country.cca2,
      label: country.name.common,
      flag: country.flag,
    }));
  }, []);

  const selectedCountry = countryOptions.find((c) => c.label === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-xl border-gray-300 py-5 px-3 text-base font-normal"
        >
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.label}</span>
            </div>
          ) : (
            <span className="text-gray-500">Select country</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[9999] bg-white"
        align="start"
        side="bottom"
      >
        <Command>
          <CommandInput placeholder="Search country..." className="h-11" />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {countryOptions.map((country) => (
              <CommandItem
                key={country.value}
                onSelect={() => {
                  onChange(country.label);
                  setOpen(false);
                }}
                className="flex items-center gap-2 text-base"
              >
                <span>{country.flag}</span>
                <span className="flex-1">{country.label}</span>
                {country.label === value && (
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
