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
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/useOnboarding';

const formSchema = z.object({
  goals: z.array(z.string()).min(1, 'Please select at least one option'),
});

const KnowMore = () => {
  const { updateData, data: onboardingData } = useOnboarding();
  const router = useRouter();

  const options = [
    'Would you like to make money from social media & brands?',
    'Are you interested in earning money by doing small tasks on social media?',
    'Which platforms are you currently active on?',
    'Would you like to connect your social platforms so we can show your earning potential?',
    'Connect your other platforms to increase your earning potential',
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goals: onboardingData.goals || [],
    },
  });

  const onSubmit = (formData: z.infer<typeof formSchema>) => {
    updateData({ goals: formData.goals });
    router.push('/onboarding/connect-store');
  };

  return (
    <div className="w-full text-black mx-auto space-y-7">
      <h1 className="font-semibold text-3xl sm:text-4xl leading-relaxed text-center sm:text-left">
        Let’s Understand What You Would Like to Achieve With QLIQ
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="goals"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Select your goals</FormLabel>
                <div className="min-h-[1.2rem]">
                  <FormMessage className="text-red-500 mt-1" />
                </div>
                <FormControl>
                  <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                    {options.map((option) => {
                      const isSelected = field.value.includes(option);

                      return (
                        <label key={option} className="cursor-pointer w-full">
                          <div
                            className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 transition ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                field.onChange(
                                  field.value.filter((s) => s !== option)
                                );
                              } else {
                                field.onChange([...field.value, option]);
                              }
                            }}
                          >
                            <span className="text-sm sm:text-base font-medium">
                              {option}
                            </span>

                            {isSelected ? (
                              <Check className="w-5 h-5 sm:rounded-full rounded-xl p-1 bg-blue-500 stroke-white" />
                            ) : (
                              <div className="w-5 h-5 sm:rounded-full rounded-xl border border-gray-400 bg-white" />
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
              className="w-full bg-white rounded-3xl border py-5 border-blue-500 text-blue-500 hover:bg-blue-50 transition"
              onClick={() => router.push('/onboarding/choose-language')}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="w-full rounded-3xl py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF66] transition"
            >
              Connect
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default KnowMore;
