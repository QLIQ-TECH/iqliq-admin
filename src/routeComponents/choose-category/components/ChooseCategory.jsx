'use client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl, } from "@/components/ui/form";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebounce";
const formSchema = z.object({
    categories: z.array(z.string()).min(1, "Please select at least one category"),
});
const CategorySelector = ({ categories }) => {
    const { updateData, data: onboardingData } = useOnboarding();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 500);
    useEffect(() => {
        const current = searchParams.get("search") || "";
        setSearchTerm(current);
    }, [searchParams]);
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearch)
            params.set("search", debouncedSearch);
        else
            params.delete("search");
        const qs = params.toString();
        router.replace(qs ? `/onboarding/choose-category?${qs}` : "/onboarding/choose-category");
    }, [debouncedSearch, router, searchParams]);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            categories: onboardingData.vendorProductCategories || [],
        },
    });
    const onSubmit = (data) => {
        updateData({ vendorProductCategories: data.categories });
        router.push("/onboarding/choose-competitors");
    };
    return (<div className="w-full text-black">
      <h1 className="font-semibold text-3xl sm:text-4xl">
        Choose Your Product Categories
      </h1>
      <div className="relative w-full mt-7">
        <Input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-2xl font-semibold placeholder:text-[#00000066] pr-12 bg-[#F5F5F5] border-none py-5 px-4"/>
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black"/>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField control={form.control} name="categories" render={({ field }) => (<FormItem>
                <FormLabel className="sr-only">Categories</FormLabel>
                <div className="min-h-[1.25rem]">
                  <FormMessage className="text-red-500 mt-1"/>
                </div>
                <FormControl>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                    {categories?.map((category) => {
                const isSelected = field.value.includes(category._id);
                return (<div key={category._id} onClick={() => {
                        if (isSelected) {
                            field.onChange(field.value.filter((c) => c !== category._id));
                        }
                        else {
                            field.onChange([...field.value, category._id]);
                        }
                    }} className={`flex flex-col justify-between items-start border rounded-xl px-4 py-3 cursor-pointer transition ${isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-white hover:bg-gray-50"}`}>
                          <div className="flex justify-between w-full items-center">
                            <span className="font-medium">{category.name}</span>
                            {isSelected ? (<Check className="w-5 h-5 p-1 rounded-full bg-blue-500 stroke-white"/>) : (<div className="w-5 h-5 border border-gray-400 rounded-full bg-white"/>)}
                          </div>
                          {category.description && (<p className="text-sm text-gray-500 mt-1">
                              {category.description}
                            </p>)}
                        </div>);
            })}
                  </div>
                </FormControl>
              </FormItem>)}/>




           <div className="flex flex-row gap-4 mt-7">
            <Button type="button" className="w-full rounded-3xl bg-white border py-5 border-[#0082FF] text-[#0082FF] hover:bg-blue-50 transition" onClick={() => router.push("/onboarding/kyc")}>
              Back
            </Button>

            <Button type="submit" className="w-full rounded-3xl py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF3D] transition">
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>);
};
export default CategorySelector;
