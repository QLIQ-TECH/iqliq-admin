import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { forgotPasswordApi } from "@/api/services/auth.api";
import { forgotPasswordSchema, } from "@/validation/validation.schema";
import { useAppToast } from "@/hooks/useAppToast";
import { useRouter } from "next/navigation";
const ForgotPasswordForm = () => {
    const toast = useAppToast();
    const form = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });
    const router = useRouter();
    async function handleEmailSubmit(values) {
        try {
            await forgotPasswordApi({
                ...values,
                returnTo: window.location.origin + "/reset-password"
            });
            toast.success("Please check your email for a reset link. Click the link to change your password.");
            form.reset();
            setTimeout(() => {
                router.push("/login");
            }, 1500);
        }
        catch (err) {
            const error = err;
            console.error("Forgot password error:", error);
            toast.error(error.response?.data?.message ||
                "Failed to send reset link. Please try again.");
        }
    }
    return (<div className="mx-auto w-full space-y-5 text-black sm:space-y-7">
      <div className="space-y-3 text-center sm:space-y-5 sm:text-left">
        <h1 className="text-3xl font-semibold sm:text-4xl">Forget Password</h1>
        <p className="ml-1 text-sm font-semibold sm:text-base">
          Enter your email below to receive a reset link.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleEmailSubmit)} className="space-y-4 sm:space-y-7">
          <FormField control={form.control} name="email" render={({ field }) => (<FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} className="rounded-xl border-gray-300 px-3 py-5"/>
                </FormControl>
                <FormMessage className="text-red-500"/>
              </FormItem>)}/>

          <div className="flex w-full justify-center">
            <Button type="submit" className="w-full rounded-3xl bg-blue-200 py-5 text-blue-600 hover:bg-blue-300">
              Send Reset Link
            </Button>
          </div>
        </form>
      </Form>
    </div>);
};
export default ForgotPasswordForm;
