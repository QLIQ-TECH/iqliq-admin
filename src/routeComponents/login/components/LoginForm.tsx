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
import {
  loginSchema,
  type LoginFormValues,
} from '@/validation/validation.schema';
import { getOAuthRedirectUrl, loginApi } from '@/api/services/auth.api';
import type { AxiosError } from 'axios';
import { useAppToast } from '@/hooks/useAppToast';
import PasswordInput from '@/components/ui/PasswordInput';
import { redirectToHostApp } from '@/lib/utils';

const LoginForm = () => {
  const toast = useAppToast();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues): Promise<void> {
    try {

      const res = await loginApi({roles:["vendor","brand"],...values});

      if (res?.data?.tokens) {
        console.log(res.data);
        toast.success('Login successful');
        localStorage.setItem(
          "onboarding_completed",
          res.data.user.onboardingCompleted.toString()
        );
        localStorage.setItem('access_token', res.data.tokens.accessToken);
        localStorage.setItem('refresh_token', res.data.tokens.refreshToken);
        try {
          const mappedRole =
            res.data.user.role === 'admin' ||
            res.data.user.role === 'manager' ||
            res.data.user.role === 'super_admin'
              ? 'superadmin'
              : 'vendor';
          const u = res.data.user as unknown as {
            vendorId?: string;
            cognitoUserId?: string;
            onboardingCompleted?: boolean;
          };
          const adminUser = {
            id: res.data.user.id,
            email: res.data.user.email,
            name: res.data.user.name || '',
            role: mappedRole,
            avatar: (res.data.user.name || 'U').charAt(0).toUpperCase(),
            phone: res.data.user.phone || '',
            cognitoUserId: u.cognitoUserId || '',
            vendorId: u.vendorId || res.data.user.id,
            onboardingCompleted: u.onboardingCompleted ?? false,
          };
          const adminTokens = {
            accessToken: res.data.tokens.accessToken,
            refreshToken: res.data.tokens.refreshToken,
          };
          localStorage.setItem('qliq-admin-user', JSON.stringify(adminUser));
          localStorage.setItem('qliq-admin-tokens', JSON.stringify(adminTokens));
        } catch {
          // best-effort mapping; ignore if shape differs
        }

        redirectToHostApp('/vendor');
      } else {
        toast.error('Login failed: Tokens missing from response');
        console.error('Login failed: Tokens missing', res);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;

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

    const handleSocialLogin = async (provider: "Google" | "Facebook") => {
    try {
      const url = await getOAuthRedirectUrl({
        returnTo: window.location.origin + "/callback",
        type: "web",
        roles:["vendor"],
        provider,
      });
      window.location.href = url;
    } catch (error) {
      toast.error("OAuth Login Failed", "Please try again.");
      console.error("OAuth Login Error:", error);
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

      {/* Divider */}
      <div className="flex items-center space-x-2 my-6 max-w-md mx-auto">
        <hr className="flex-1 border-gray-300" />
        <span className="text-sm text-gray-500 whitespace-nowrap">or</span>
        <hr className="flex-1 border-gray-300" />
      </div>

     <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
        <button
          onClick={() => handleSocialLogin("Google")}
          className="flex w-full items-center justify-center rounded-3xl border border-gray-300 bg-white px-6 py-3 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md sm:w-auto"
        >
          <img
            src="/assets/icons/google-icon.svg"
            alt="Google login"
            className="h-5 w-5 sm:h-6 sm:w-6"
          />
          <span className="ml-3 text-sm font-medium text-gray-700 sm:text-base">
            Continue with Google
          </span>
        </button>

        <button
          onClick={() => handleSocialLogin("Facebook")}
          className="flex w-full items-center justify-center rounded-3xl border border-gray-300 bg-white px-6 py-3 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md sm:w-auto"
        >
          <img
            src="/assets/icons/facebook-icon.svg"
            alt="Facebook login"
            className="h-5 w-5 sm:h-6 sm:w-6"
          />
          <span className="ml-3 text-sm font-medium text-gray-700 sm:text-base">
            Continue with Facebook
          </span>
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
