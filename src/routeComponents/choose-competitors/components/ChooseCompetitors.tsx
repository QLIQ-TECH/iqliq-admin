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
import type { IVendor } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebounce';

const ChooseCompetitorsFormSchema = z.object({
  competitors: z
    .array(z.string())
    .min(1, 'Please select at least one competitor'),
});

const CompetitorSelector = ({ competitors }: { competitors: IVendor[] }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 500);
  const { updateData, data: onboardingData } = useOnboarding();
  const form = useForm<z.infer<typeof ChooseCompetitorsFormSchema>>({
    resolver: zodResolver(ChooseCompetitorsFormSchema),
    defaultValues: {
      competitors: onboardingData.topCompetitors || [],
    },
  });

  useEffect(() => {
    const current = searchParams.get('search') || '';
    setSearchTerm(current);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');
    const qs = params.toString();
    router.replace(qs ? `/onboarding/choose-competitors?${qs}` : '/onboarding/choose-competitors');
  }, [debouncedSearch, router, searchParams]);

  const onSubmit = (data: z.infer<typeof ChooseCompetitorsFormSchema>) => {
    updateData({ topCompetitors: data.competitors });
    router.push('/onboarding/choose-influencers');
  };

  return (
    <div className="w-full text-black ">
      <h1 className="font-semibold text-3xl sm:text-4xl">
        Choose Your Top Competitors
      </h1>

      <div className="relative w-full mt-7">
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
            name="competitors"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Competitors</FormLabel>
                <div className="min-h-[1.25rem]">
                  <FormMessage className="text-red-500 mt-1" />
                </div>
                <FormControl>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                    {competitors.map((comp) => {
                      const isSelected = field.value.includes(comp._id);
                      return (
                        <label key={comp._id} className="cursor-pointer w-full">
                          <div
                            className={`flex justify-between items-center border rounded-xl px-4 py-3 transition ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                field.onChange(
                                  field.value.filter(
                                    (c: string) => c !== comp._id
                                  )
                                );
                              } else {
                                field.onChange([...field.value, comp._id]);
                              }
                            }}
                          >
                            <span className="font-medium">
                              {comp.vendorName}
                            </span>
                            {isSelected ? (
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
              onClick={() => router.push('/onboarding/choose-category')}
              className="w-full bg-white sm:flex-1 rounded-3xl border py-5 border-blue-500 text-blue-500 hover:bg-blue-50 transition"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="w-full sm:flex-1 rounded-3xl border py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF3D] transition"
            >
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CompetitorSelector;
