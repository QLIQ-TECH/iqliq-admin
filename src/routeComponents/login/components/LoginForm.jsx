'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loginSchema, } from '@/validation/validation.schema';
import { getOAuthRedirectUrl } from '@/api/services/auth.api';
import { useAppToast } from '@/hooks/useAppToast';
import PasswordInput from '@/components/ui/PasswordInput';
import { redirectToHostApp } from '@/lib/utils';
import { useAuth } from '../../../../contexts/AuthContext';
const LoginForm = () => {
    const toast = useAppToast();
    const { login } = useAuth();
    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });
    async function onSubmit(values) {
        try {
            const result = await login(values.email, values.password);
            const loggedInUser = result?.user;
            toast.success('Login successful');
            if (loggedInUser?.role === 'superadmin') {
                redirectToHostApp('/admin');
                return;
            }
            if (loggedInUser?.role === 'vendor' && loggedInUser.onboardingCompleted === false) {
                redirectToHostApp('/onboarding/virtual-assitance');
                return;
            }
            redirectToHostApp('/vendor');
        }
        catch (err) {
            const axiosError = err;
            if (axiosError.response?.data?.message) {
                toast.error(`Login failed: ${axiosError.response.data.message}`);
                console.error('Login failed:', axiosError.response.data);
            }
            else if (axiosError.message) {
                toast.error(`Login failed: ${axiosError.message}`);
                console.error('Login failed:', axiosError);
            }
            else {
                toast.error('Login failed: Unknown error');
                console.error('Login failed:', axiosError);
            }
        }
    }
    const handleSocialLogin = async (provider) => {
        try {
            const url = await getOAuthRedirectUrl({
                returnTo: window.location.origin + "/callback",
                type: "web",
                roles: ["vendor"],
                provider,
            });
            window.location.href = url;
        }
        catch (error) {
            toast.error("OAuth Login Failed", "Please try again.");
            console.error("OAuth Login Error:", error);
        }
    };
    return (<div className="text-black w-full  mx-auto  space-y-5 sm:space-y-7">

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-7">
          <FormField control={form.control} name="email" render={({ field }) => (<FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" className="rounded-xl border-gray-300 py-5 px-3" {...field}/>
                </FormControl>
                <FormMessage className="text-red-500"/>
              </FormItem>)}/>
          <div>
            <div className="flex items-center justify-between mb-2">
              <FormLabel>Password</FormLabel>
            <Link href="/onboarding/forgot-password" className="text-sm text-gray-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <FormField control={form.control} name="password" render={({ field }) => (<FormItem>
                  <FormControl>
                    <PasswordInput {...field} className="rounded-xl border-gray-300 px-3 py-5"/>
                  </FormControl>
                  <FormMessage className="text-red-500"/>
                </FormItem>)}/>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/onboarding/sign-up" className="w-full">
              <Button type="button" className="w-full rounded-3xl border py-5  bg-white  border-blue-500 text-blue-500 hover:bg-blue-50 transition">
                Create Account
              </Button>
            </Link>
            <Button type="submit" className="w-full rounded-3xl bg-blue-200 py-5  text-blue-600 hover:bg-blue-300 transition">
              Login
            </Button>
          </div>
        </form>
      </Form>

      {/* Divider */}
      <div className="flex items-center space-x-2 my-6 max-w-md mx-auto">
        <hr className="flex-1 border-gray-300"/>
        <span className="text-sm text-gray-500 whitespace-nowrap">or</span>
        <hr className="flex-1 border-gray-300"/>
      </div>

     <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
        <button onClick={() => handleSocialLogin("Google")} className="flex w-full items-center justify-center rounded-3xl border border-gray-300 bg-white px-6 py-3 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md sm:w-auto">
          <img src="/assets/icons/google-icon.svg" alt="Google login" className="h-5 w-5 sm:h-6 sm:w-6"/>
          <span className="ml-3 text-sm font-medium text-gray-700 sm:text-base">
            Continue with Google
          </span>
        </button>

        <button onClick={() => handleSocialLogin("Facebook")} className="flex w-full items-center justify-center rounded-3xl border border-gray-300 bg-white px-6 py-3 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md sm:w-auto">
          <img src="/assets/icons/facebook-icon.svg" alt="Facebook login" className="h-5 w-5 sm:h-6 sm:w-6"/>
          <span className="ml-3 text-sm font-medium text-gray-700 sm:text-base">
            Continue with Facebook
          </span>
        </button>
      </div>
    </div>);
};
export default LoginForm;
