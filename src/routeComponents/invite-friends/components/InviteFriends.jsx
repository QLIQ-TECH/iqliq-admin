import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl, } from '@/components/ui/form';
import { Check } from 'lucide-react';
import facebookIcon from '@/assets/icons/facebook-icon.svg';
import instagramIcon from '@/assets/icons/instagram-icon.svg';
import tiktokIcon from '@/assets/icons/tiktok-icon.svg';
import luluIcon from '@/assets/icons/lulu-icon.svg';
import carrefourIcon from '@/assets/icons/carrefour-icon.svg';
const formSchema = z.object({
    store: z.array(z.string()).min(1, 'Please select at least one store'),
});
const InviteFriends = () => {
    const options = [
        { name: 'Facebook', icon: facebookIcon },
        { name: 'Instagram', icon: instagramIcon },
        { name: 'Tiktok', icon: tiktokIcon },
        { name: 'Lulu', icon: luluIcon },
        { name: 'Carrefour', icon: carrefourIcon },
        { name: 'Facebook', icon: facebookIcon },
        { name: 'Instagram', icon: instagramIcon },
    ];
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            store: [],
        },
    });
    const onSubmit = (data) => {
        console.log('Selected Option:', data.store);
    };
    return (<div className="w-full mx-auto ">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField control={form.control} name="store" render={({ field }) => (<FormItem>
                <FormLabel className="sr-only">Select a store</FormLabel>
                <div className="min-h-[1.2rem]">
                  <FormMessage className="text-red-500 mt-1"/>
                </div>
                <FormControl>
                  <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                    {options.map((option) => {
                const isSelected = field.value.includes(option.name);
                return (<label key={option.name} className="cursor-pointer w-full">
                          <div className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 transition ${isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white hover:bg-gray-50'}`} onClick={() => {
                        if (isSelected) {
                            field.onChange(field.value.filter((s) => s !== option.name));
                        }
                        else {
                            field.onChange([...field.value, option.name]);
                        }
                    }}>
                            <div className="flex items-center gap-3">
                              <img src={option.icon} alt={option.name} className="w-6 h-6"/>
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

          <div className="flex flex-col gap-4 sm:gap-6 mt-7">
            <Button type="submit" className="w-full rounded-3xl py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF66] transition" onClick={() => console.log('Allow button clicked')}>
              Invite Friends
            </Button>

            <div className="flex flex-row gap-4">
              <Button type="button" className="w-full bg-white rounded-3xl border py-5 border-blue-500 text-blue-500 hover:bg-blue-50 transition" onClick={() => console.log('Back button clicked')}>
                Back
              </Button>
              <Button type="button" className="w-full bg-white rounded-3xl border py-5 border-blue-500 text-blue-500 hover:bg-blue-50 transition" onClick={() => console.log('Skip button clicked')}>
                Skip
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>);
};
export default InviteFriends;
