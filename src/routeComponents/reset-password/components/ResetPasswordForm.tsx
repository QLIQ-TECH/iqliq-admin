import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppToast } from "@/hooks/useAppToast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/ui/PasswordInput";
import { confirmForgotPasswordApi } from "@/api/services/auth.api";
import { useRouter } from "next/navigation";

import type { ResetPasswordResponse } from "@/lib/types";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/validation/validation.schema";



const ResetPasswordForm = () => {
  const toast = useAppToast();
  const router = useRouter();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues): Promise<void> {
    const email: string | null = new URLSearchParams(
      window.location.search,
    ).get("email");
    const token: string | null = new URLSearchParams(
      window.location.search,
    ).get("token");

    if (!email || !token) {
      toast.error(
        "Invalid link ❌",
        "Reset link is missing or invalid. Please request a new one.",
      );
      return;
    }

    try {
      const response: ResetPasswordResponse = await confirmForgotPasswordApi({
        email,
        token,
        newPassword: values.newPassword,
      });

      if (response.success) {
        toast.success(
          "Password reset successful 🎉",
          response.message || "You can now log in with your new password.",
        );

        setTimeout(() => {
          router.replace("/onboarding/login");
        }, 1500);
      } else {
        toast.error(
          "Reset failed ❌",
          response.message || "Unable to reset password. Please try again.",
        );
      }
    } catch (error) {
      console.error("Reset password error:", error);

      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Something went wrong. Please try again.";

      toast.error("Reset failed ❌", message);
    }
  }

  return (
    <div className="mx-auto w-full space-y-5 text-black sm:space-y-7">
      <div className="space-y-3 text-center sm:space-y-5 sm:text-left">
        <h1 className="text-3xl font-semibold sm:text-4xl">Reset Password</h1>
        <p className="ml-1 text-sm font-semibold sm:text-base">
          Enter your new password below.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-7"
        >
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
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

          <div className="flex w-full justify-center">
            <Button
              type="submit"
              className="w-full rounded-3xl bg-blue-200 py-5 text-blue-600 hover:bg-blue-300"
            >
              Reset Password
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ResetPasswordForm;
