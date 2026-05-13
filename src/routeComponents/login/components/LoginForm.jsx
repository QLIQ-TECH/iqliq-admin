'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loginSchema } from '@/validation/validation.schema';
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
      
      // Debug logging to see the actual user data
      console.log('🔍 Login Debug - User data:', {
        role: loggedInUser?.role,
        onboardingCompleted: loggedInUser?.onboardingCompleted,
        vendorId: loggedInUser?.vendorId,
        id: loggedInUser?.id,
        fullUser: loggedInUser
      });
      
      toast.success('Login successful');
      
      if (loggedInUser?.role === 'superadmin') {
        console.log('🚀 Redirecting to superadmin dashboard');
        redirectToHostApp('/superadmin/user');
        return;
      }
      
      if (
        loggedInUser?.role === 'vendor' &&
        loggedInUser.onboardingCompleted === false &&
        !loggedInUser.vendorId // Only redirect to onboarding if no vendorId exists
      ) {
        console.log('🔄 Redirecting to onboarding - no vendorId found');
        redirectToHostApp('/onboarding/virtual-assitance');
        return;
      }
      
      console.log('🏪 Redirecting to vendor dashboard');
      redirectToHostApp('/vendor');
    } catch (err) {
      const axiosError = err;
      if (axiosError.response?.data?.message) {
        toast.error(`Login failed: ${axiosError.response.data.message}`);
        console.error('Login failed:', axiosError.response.data);
      } else if (axiosError.message) {
        toast.error(`Login failed: ${axiosError.message}`);
        console.error('Login failed:', axiosError);
      } else {
        toast.error('Login failed: Unknown error');
        console.error('Login failed:', axiosError);
      }
    }
  }
  const handleSocialLogin = async (provider) => {
    try {
      const url = await getOAuthRedirectUrl({
        returnTo: window.location.origin + '/callback',
        type: 'web',
        roles: ['vendor'],
        provider,
      });
      window.location.href = url;
    } catch (error) {
      toast.error('OAuth Login Failed', 'Please try again.');
      console.error('OAuth Login Error:', error);
    }
  };
  return (
    <div className="text-black w-full  mx-auto  space-y-5 sm:space-y-7">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-7"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    className="rounded-xl border-gray-300 py-5 px-3"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <FormLabel>Password</FormLabel>
              <Link
                href="/onboarding/forgot-password"
                className="text-sm text-gray-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      className="rounded-xl border-gray-300 px-3 py-5"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/onboarding/sign-up" className="w-full">
              <Button
                type="button"
                className="w-full rounded-3xl border py-5  bg-white  border-blue-500 text-blue-500 hover:bg-blue-50 transition"
              >
                Create Account
              </Button>
            </Link>
            <Button
              type="submit"
              className="w-full rounded-3xl bg-blue-200 py-5  text-blue-600 hover:bg-blue-300 transition"
            >
              Login
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
export default LoginForm;
