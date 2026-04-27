'use client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl, } from "@/components/ui/form";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/hooks/useOnboarding";
const formSchema = z.object({
    store: z.array(z.string()).min(1, "Please select at least one store"),
});
const ConnectStore = ({ stores }) => {
    const { updateData, data: onboardingData } = useOnboarding();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            store: onboardingData.salesChannel || [],
        },
    });
    const router = useRouter();
    const onSubmit = (data) => {
        // Update onboarding data with store IDs instead of names
        updateData({ salesChannel: data.store });
        router.push("/onboarding/kyc");
    };
    return (<div className="w-full mx-auto">
      <h1 className="font-semibold text-3xl sm:text-4xl leading-relaxed text-center sm:text-left">
        Where do you sell currently?
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField control={form.control} name="store" render={({ field }) => (<FormItem>
                <FormLabel className="sr-only">Select a store</FormLabel>
                <div className="min-h-[1.2rem]">
                  <FormMessage className="text-red-500 mt-1"/>
                </div>
                <FormControl>
                  <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                    {stores.map((option) => {
                const isSelected = field.value.includes(option._id);
                return (<label key={option._id} className="cursor-pointer w-full">
                          <div className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 transition ${isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-white hover:bg-gray-50"}`} onClick={() => {
                        if (isSelected) {
                            field.onChange(field.value.filter((id) => id !== option._id));
                        }
                        else {
                            field.onChange([...field.value, option._id]);
                        }
                    }}>
                            <div className="flex items-center gap-3">
                              <img src={option.logoUrl} alt={option.name} className="w-6 h-6"/>
                              <span className="text-sm sm:text-base font-medium">
                                {option.name}
                              </span>
                            </div>

                            {isSelected ? (<Check className="w-5 h-5 sm:rounded-full rounded-xl p-1 bg-blue-500 stroke-white"/>) : (<div className="w-5 h-5 sm:rounded-full rounded-xl border border-gray-400 bg-white"/>)}
                          </div>
                        </label>);
            })}
                  </div>
                </FormControl>
              </FormItem>)}/>

          <div className="flex flex-row gap-4 mt-7">
            <Button type="button" className="w-full bg-white rounded-3xl border py-5 border-blue-500 text-blue-500 hover:bg-blue-50 transition" onClick={() => router.push("/onboarding/know-more")}>
              Back
            </Button>
            <Button type="submit" className="w-full rounded-3xl py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF66] transition">
              Connect
            </Button>
          </div>
        </form>
      </Form>
    </div>);
};
export default ConnectStore;
