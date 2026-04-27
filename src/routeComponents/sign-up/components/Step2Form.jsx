'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PasswordToggle from '@/components/shared/PasswordToggle';
import { step2Schema, } from '@/validation/validation.schema';
const Step2Form = ({ initialEmail, onBack, onSubmit, }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showVerifyPassword, setShowVerifyPassword] = useState(false);
    const form = useForm({
        resolver: zodResolver(step2Schema),
        defaultValues: {
            password: '',
            verifyPassword: '',
            email: initialEmail,
        },
    });
    return (<Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField control={form.control} name="password" render={({ field }) => (<FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative pb-1.5">
                <FormControl>
                  <>
                    <Input {...field} type={showPassword ? 'text' : 'password'} className="rounded-xl border-gray-300 py-5 px-3 pr-12"/>
                    <PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)}/>
                  </>
                </FormControl>
                <FormMessage className="absolute left-1 -bottom-3 text-xs text-red-500"/>
              </div>
            </FormItem>)}/>

        <FormField control={form.control} name="verifyPassword" render={({ field }) => (<FormItem>
              <FormLabel>Verify Password</FormLabel>
              <div className="relative pb-1.5">
                <FormControl>
                  <>
                    <Input {...field} type={showVerifyPassword ? 'text' : 'password'} className="rounded-xl border-gray-300 py-5 px-3 pr-12"/>
                    <PasswordToggle show={showVerifyPassword} onToggle={() => setShowVerifyPassword(!showVerifyPassword)}/>
                  </>
                </FormControl>
                <FormMessage className="absolute left-1 -bottom-3 text-xs text-red-500"/>
              </div>
            </FormItem>)}/>

        <div className="flex flex-row gap-4">
          <Button type="button" className="w-full rounded-3xl border py-5 bg-white border-blue-500 text-blue-500 hover:bg-blue-50 transition" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" className="w-full rounded-3xl bg-blue-200 py-5 text-blue-600 hover:bg-blue-300 transition">
            Submit
          </Button>
        </div>
      </form>
    </Form>);
};
export default Step2Form;
