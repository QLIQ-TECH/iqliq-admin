import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl, } from "@/components/ui/form";
import { Search } from "lucide-react";
import dummyBrand from "@/assets/icons/dummyBrand.svg";
import { useState } from "react";
import { claimProfileSchema, } from "@/validation/validation.schema";
import { useRouter } from "next/navigation";
const brands = Array.from({ length: 8 }).map((_, idx) => ({
    id: idx,
    name: "Apple",
    handle: "@apple",
    logo: dummyBrand,
}));
const ClaimProfileForm = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(claimProfileSchema),
        defaultValues: { selectedBrand: -1 },
    });
    const onSubmit = (data) => {
        const selectedBrand = brands.find((b) => b.id === data.selectedBrand);
        console.log("Selected brand:", selectedBrand);
        router.push("/onboarding/virtual-assitance");
    };
    const filteredBrands = brands.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return (<div className="text-black space-y-4 sm:space-y-6">
      <h1 className="font-semibold text-3xl sm:text-4xl">Claim Your Profile</h1>

      <div className="relative w-full">
        <Input type="text" placeholder="Search..." className="w-full rounded-2xl font-semibold placeholder:text-[#00000066] pr-12 bg-[#F5F5F5] border-none py-5 px-4" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black"/>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField control={form.control} name="selectedBrand" render={({ field }) => (<FormItem>
                <FormLabel className="sr-only">Select Brand</FormLabel>
                <FormMessage className="text-red-500 mb-2"/>
                <FormControl>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                    {filteredBrands.map((brand) => {
                const isSelected = field.value === brand.id;
                return (<div key={brand.id} className={`flex flex-col justify-center items-center py-4 px-6 rounded-2xl border transition-300 cursor-pointer
                            ${isSelected ? "border-[#0082FF] bg-blue-50" : "border-transparent bg-white"}
                          `} onClick={() => field.onChange(brand.id)}>
                          <img src={brand.logo} alt={brand.name} className="h-12 w-12"/>
                          <p className="font-semibold text-base mt-2">
                            {brand.name}
                          </p>
                          <p className="font-semibold text-sm text-gray-500">
                            {brand.handle}
                          </p>
                        </div>);
            })}
                  </div>
                </FormControl>
              </FormItem>)}/>

          <p className="text-sm font-semibold text-[#0082FF] mt-2">
            If you don't find your profile listed, you can create your own
            profile
          </p>

          <div className="flex flex-col gap-4 sm:gap-6 mt-7">
            <Button type="submit" className="w-full rounded-3xl bg-blue-200 py-5 text-blue-600 hover:bg-blue-300 transition">
              Create Profile
            </Button>
          </div>
        </form>
      </Form>
    </div>);
};
export default ClaimProfileForm;
