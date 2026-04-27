'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from '@/components/ui/form';
import { Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Language } from '@/types/onboarding';
import { useOnboarding } from '@/hooks/useOnboarding';

const LanguageformSchema = z.object({
  languages: z.array(z.string()).min(1, 'Please select at least one language'),
});

const LanguageSelector = ({ languages }: { languages: Language[] }) => {

  const { data: onboardingData, updateData } = useOnboarding();

  const form = useForm<z.infer<typeof LanguageformSchema>>({
    resolver: zodResolver(LanguageformSchema),
    defaultValues: { 
      languages: onboardingData.languages || [],
     }
  });

  const router = useRouter();
  const onSubmit = (data: z.infer<typeof LanguageformSchema>) => {
    updateData({ languages: data.languages });
    router.push('/onboarding/know-more');
  };

  const [searchTerm, setSearchTerm] = useState('');
  const filteredLanguages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return languages;
    return languages.filter((lang) => lang.name.toLowerCase().includes(term));
  }, [languages, searchTerm]);

  return (
    <div className="w-full text-black space-y-4">
      <h1 className="font-semibold text-3xl sm:text-4xl">
        Choose Your Languages
      </h1>

      <div className="relative w-full">
        <Input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl font-semibold placeholder:text-[#00000066] pr-12 bg-[#F5F5F5] border-none py-5 px-4"
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="languages"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Languages</FormLabel>
                <div className="min-h-[1.2rem]">
                  <FormMessage className="text-red-500 mt-1" />
                </div>
                <FormControl>
                  <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                    {filteredLanguages.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        No languages found
                      </div>
                    )}
                    {filteredLanguages.length > 0 &&
                      filteredLanguages.map((lang) => {
                        const isSelected = field.value.includes(lang._id);
                        const isEnglish = lang.name.toLowerCase() === 'english';
                        const isDisabled = !isEnglish;
                        return (
                          <label
                            key={lang._id}
                            className={`w-full ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div
                              className={`flex justify-between items-center border rounded-xl px-4 py-3 transition ${
                                isDisabled
                                  ? 'border-gray-200 bg-gray-100 opacity-50'
                                  : isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                if (isDisabled) return;
                                if (isSelected) {
                                  field.onChange(
                                    field.value.filter(
                                      (id: string) => id !== lang._id
                                    )
                                  );
                                } else {
                                  field.onChange([...field.value, lang._id]);
                                }
                              }}
                            >
                              <span
                                className={`font-medium ${isDisabled ? 'text-gray-400' : ''}`}
                              >
                                {lang.name}
                              </span>
                              {isDisabled ? (
                                <div className="w-5 h-5 border border-gray-300 rounded-full bg-gray-200" />
                              ) : isSelected ? (
                                <Check className="w-5 h-5 p-1 rounded-full bg-blue-500 stroke-white" />
                              ) : (
                                <div className="w-5 h-5 border border-gray-400 rounded-full bg-white" />
                              )}
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex flex-row gap-4 mt-7">
            <Button
              type="button"
              className="w-full rounded-3xl bg-white border py-5 border-[#0082FF] text-[#0082FF] hover:bg-blue-50 transition"
              onClick={() => router.push('/onboarding/virtual-assitance')}
            >
              Back
            </Button>

            <Button
              type="submit"
              className="w-full rounded-3xl py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF3D] transition"
            >
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LanguageSelector;
