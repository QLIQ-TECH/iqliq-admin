'use client';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckBoxformSchema, } from '@/validation/validation.schema';
import { postOnboarding } from '@/api/services/onboarding.api';
import { useAppToast } from '@/hooks/useAppToast';
import { redirectToHostApp } from '@/lib/utils';
const WelcomeOnboardingGrowBusiness = () => {
    const toast = useAppToast();
    const router = useRouter();
    const { data: onboardingData, reset } = useOnboarding();
    const form = useForm({
        resolver: zodResolver(CheckBoxformSchema),
        defaultValues: {
            agree: false,
        },
    });
    const onSubmit = async (data) => {
        if (data.agree) {
            await postOnboarding(onboardingData);
            reset();
            localStorage.setItem("onboarding_completed", "true");
            try {
                const vendorAccessToken = localStorage.getItem('access_token');
                const vendorRefreshToken = localStorage.getItem('refresh_token');
                if (vendorAccessToken) {
                    localStorage.setItem('qliq-admin-access-token', vendorAccessToken);
                    localStorage.setItem('qliq-admin-tokens', JSON.stringify({
                        accessToken: vendorAccessToken,
                        refreshToken: vendorRefreshToken || null,
                    }));
                }
                if (vendorRefreshToken) {
                    localStorage.setItem('qliq-admin-refresh-token', vendorRefreshToken);
                }
                const existingUser = localStorage.getItem('qliq-admin-user');
                if (existingUser) {
                    const parsed = JSON.parse(existingUser);
                    parsed.onboardingCompleted = true;
                    localStorage.setItem('qliq-admin-user', JSON.stringify(parsed));
                }
                else {
                    const id = localStorage.getItem('id') || '';
                    const email = localStorage.getItem('email') || '';
                    const name = typeof onboardingData?.companyName === 'string'
                        ? onboardingData.companyName
                        : '';
                    const adminUser = {
                        id,
                        email,
                        name,
                        role: 'vendor',
                        avatar: (name || email || 'U').charAt(0).toUpperCase(),
                        phone: '',
                        cognitoUserId: '',
                        vendorId: id,
                        onboardingCompleted: true,
                    };
                    localStorage.setItem('qliq-admin-user', JSON.stringify(adminUser));
                }
            }
            catch {
            }
            toast.success('Onboarding successful');
            redirectToHostApp('/vendor');
        }
    };
    return (<div className="w-full text-black mx-auto space-y-7">
      <h1 className="font-semibold text-3xl sm:text-4xl leading-relaxed text-center sm:text-left">
        Welcome Onboard
      </h1>
      <p className="font-semibold text-sm">
        This QLIQR Code will help you generate 10 X sales in your stores. All
        you have to do is get your customers to scan it and join under your
        network and you will earn 10$ per signup per year and get your customers
        data for LIFE.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="agree" render={({ field }) => (<FormItem className="flex flex-col space-y-2">
                <div className="flex items-start space-x-3">
                  <FormControl>
                    <Checkbox checked={!!field.value} onCheckedChange={(checked) => field.onChange(checked === true)} className="ml-1"/>
                  </FormControl>
                  <FormLabel className="font-medium text-sm leading-relaxed cursor-pointer">
                    I agree to the terms and conditions
                  </FormLabel>
                </div>
                <FormMessage className="text-red-500 text-sm"/>
              </FormItem>)}/>

          <div className="flex gap-4">
            <Button type="button" className="w-1/2 bg-white text-black rounded-3xl py-5 border border-[#0082FF] hover:bg-white transition" onClick={() => router.push('/onboarding/choose-influencers')}>
              Back
            </Button>
            <Button type="submit" disabled={!form.watch('agree')} className="w-1/2 rounded-3xl py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF66] transition disabled:opacity-50 disabled:cursor-not-allowed">
              I Agree
            </Button>
          </div>
        </form>
      </Form>
    </div>);
};
export default WelcomeOnboardingGrowBusiness;
