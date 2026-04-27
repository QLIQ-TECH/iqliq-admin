'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from 'react-international-phone';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useRouter } from 'next/navigation';
import { step1Schema, } from '@/validation/validation.schema';
import OtpModal from './OtpModal';
import { useAppToast } from '@/hooks/useAppToast';
import { sendEmailOtp, sendWhatsappOtp, signUpApi, verifyEmailOtp, verifyWhatsappOtp, verifyRefferalCode, } from '@/api/services/auth.api';
import Step2Form from './Step2Form';
import { CountrySelect } from '@/components/shared/CountrySelect';
import { VerificationButton } from './VerificationButton';
const SignUpForm = ({ referralCode }) => {
    const [step, setStep] = useState(1);
    const [step1Data, setStep1Data] = useState({});
    const [otpModal, setOtpModal] = useState({ type: 'email', open: false, value: '' });
    const [otpSent, setOtpSent] = useState({ email: false, phone: false });
    const [verified, setVerified] = useState({ email: false, phone: false });
    const [emailTimers, setEmailTimers] = useState({
        resendCooldown: 0,
        otpExpiry: 0,
        isExpired: false,
    });
    const [phoneTimers, setPhoneTimers] = useState({
        resendCooldown: 0,
        otpExpiry: 0,
        isExpired: false,
    });
    const toast = useAppToast();
    const router = useRouter();
    const step1Form = useForm({
        resolver: zodResolver(step1Schema),
        defaultValues: {
            name: step1Data.name ?? '',
            email: step1Data.email ?? '',
            phone: step1Data.phone ?? '',
            nationality: step1Data.nationality ?? '',
            gender: step1Data.gender ?? undefined,
            referralCode: referralCode || step1Data.referralCode || '',
        },
    });
    useEffect(() => {
        if (emailTimers.resendCooldown > 0) {
            const timer = setInterval(() => {
                setEmailTimers((prev) => ({
                    ...prev,
                    resendCooldown: Math.max(0, prev.resendCooldown - 1),
                }));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [emailTimers.resendCooldown]);
    useEffect(() => {
        if (emailTimers.otpExpiry > 0 && !emailTimers.isExpired) {
            const timer = setInterval(() => {
                setEmailTimers((prev) => {
                    const newExpiry = prev.otpExpiry - 1;
                    if (newExpiry <= 0) {
                        return { ...prev, otpExpiry: 0, isExpired: true };
                    }
                    return { ...prev, otpExpiry: newExpiry };
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [emailTimers.otpExpiry, emailTimers.isExpired]);
    useEffect(() => {
        if (phoneTimers.resendCooldown > 0) {
            const timer = setInterval(() => {
                setPhoneTimers((prev) => ({
                    ...prev,
                    resendCooldown: Math.max(0, prev.resendCooldown - 1),
                }));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [phoneTimers.resendCooldown]);
    // Phone expiry timer
    useEffect(() => {
        if (phoneTimers.otpExpiry > 0 && !phoneTimers.isExpired) {
            const timer = setInterval(() => {
                setPhoneTimers((prev) => {
                    const newExpiry = prev.otpExpiry - 1;
                    if (newExpiry <= 0) {
                        return { ...prev, otpExpiry: 0, isExpired: true };
                    }
                    return { ...prev, otpExpiry: newExpiry };
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [phoneTimers.otpExpiry, phoneTimers.isExpired]);
    const handleStep1Next = async (values) => {
        if (!verified.email || !verified.phone) {
            toast.error('Please verify Email and Phone before proceeding.');
            return;
        }
        try {
            const res = await verifyRefferalCode(referralCode || values?.referralCode || '');
            if (!res.data.includes('vendor')) {
                toast.error('Referral code is not valid for vendor');
                return;
            }
        }
        catch (err) {
            const axiosError = err;
            if (axiosError.response?.data?.message) {
                toast.error(`Referral code verification failed: ${axiosError.response.data.message}`);
            }
            else if (axiosError.message) {
                toast.error(`Referral code verification failed: ${axiosError.message}`);
            }
            else {
                toast.error('Referral code verification failed: Unknown error');
            }
            return;
        }
        setStep1Data(values);
        setStep(2);
    };
    const handleFinalSubmit = async (step2Values) => {
        const data = {
            name: step1Data.name ?? '',
            email: step1Data.email?.toLowerCase() ?? '',
            phone: step1Data.phone ?? '',
            gender: step1Data.gender ?? '',
            password: step2Values.password,
            referralCode: referralCode || step1Data.referralCode || '',
            role: 'vendor',
            nationality: step1Data.nationality ?? '',
        };
        try {
            const response = await signUpApi(data);
            toast.success('Account created successfully');
            localStorage.setItem('access_token', response.data.tokens.accessToken);
            localStorage.setItem('refresh_token', response.data.tokens.refreshToken);
            localStorage.setItem('role', response.data.user.role);
            localStorage.setItem('email', response.data.user.email);
            localStorage.setItem('id', response.data.user.id);
            try {
                const mappedRole = response.data.user.role === 'admin' ||
                    response.data.user.role === 'manager' ||
                    response.data.user.role === 'super_admin'
                    ? 'superadmin'
                    : 'vendor';
                const u = response.data.user;
                const adminUser = {
                    id: response.data.user.id,
                    email: response.data.user.email,
                    name: response.data.user.name || '',
                    role: mappedRole,
                    avatar: (response.data.user.name || 'U').charAt(0).toUpperCase(),
                    phone: response.data.user.phone || '',
                    cognitoUserId: u.cognitoUserId || '',
                    vendorId: u.vendorId || response.data.user.id,
                    onboardingCompleted: u.onboardingCompleted ?? false,
                };
                const adminTokens = {
                    accessToken: response.data.tokens.accessToken,
                    refreshToken: response.data.tokens.refreshToken,
                };
                localStorage.setItem('qliq-admin-user', JSON.stringify(adminUser));
                localStorage.setItem('qliq-admin-tokens', JSON.stringify(adminTokens));
            }
            catch {
                // best-effort mapping; ignore if shape differs
            }
            router.push('/onboarding/virtual-assitance');
        }
        catch (error) {
            if (typeof error === 'object' && error !== null) {
                const axiosErr = error;
                const backendMsg = axiosErr.response?.data?.message;
                if (backendMsg) {
                    toast.error(backendMsg);
                    return;
                }
            }
            toast.error('Failed to create account');
        }
    };
    const handleOtpRequest = async (value, type) => {
        try {
            if (type === 'email') {
                const res = (await sendEmailOtp({ email: value }));
                if (!res?.success) {
                    toast.error(res?.message || 'Failed to send OTP');
                    return false;
                }
                setOtpSent((prev) => ({ ...prev, email: true }));
                setEmailTimers({
                    resendCooldown: 60,
                    otpExpiry: 180,
                    isExpired: false,
                });
            }
            else {
                const res = (await sendWhatsappOtp({ phone: value }));
                if (!res?.success) {
                    toast.error(res?.message || 'Failed to send OTP');
                    return false;
                }
                setOtpSent((prev) => ({ ...prev, phone: true }));
                setPhoneTimers({
                    resendCooldown: 60,
                    otpExpiry: 180,
                    isExpired: false,
                });
            }
            toast.success('OTP sent successfully');
            return true;
        }
        catch (err) {
            const axiosError = err;
            if (axiosError.response?.data?.message) {
                toast.error(`Send OTP failed: ${axiosError.response.data.message}`);
            }
            else if (axiosError.message) {
                toast.error(`Send OTP failed: ${axiosError.message}`);
            }
            else {
                toast.error('Send OTP failed: Unknown error');
            }
            return false;
        }
    };
    const handleOtpVerification = async (type, value, otp) => {
        try {
            if (type === 'email') {
                await verifyEmailOtp({ email: value.toLowerCase(), otp });
            }
            else {
                await verifyWhatsappOtp({ phone: value, otp });
            }
            toast.success('OTP verified successfully');
            setVerified((prev) => ({ ...prev, [type]: true }));
            setOtpSent((prev) => ({ ...prev, [type]: false }));
            if (type === 'email') {
                setEmailTimers({ resendCooldown: 0, otpExpiry: 0, isExpired: false });
            }
            else {
                setPhoneTimers({ resendCooldown: 0, otpExpiry: 0, isExpired: false });
            }
            return true;
        }
        catch (err) {
            const axiosError = err;
            if (axiosError.response?.data?.message) {
                toast.error(`Verify OTP failed: ${axiosError.response.data.message}`);
            }
            else if (axiosError.message) {
                toast.error(`Verify OTP failed: ${axiosError.message}`);
            }
            else {
                toast.error('Verify OTP failed: Unknown error');
            }
            return false;
        }
    };
    const handleResendOtp = async (type, value) => {
        try {
            if (type === 'email') {
                await sendEmailOtp({ email: value });
                setEmailTimers({
                    resendCooldown: 60,
                    otpExpiry: 180,
                    isExpired: false,
                });
            }
            else {
                await sendWhatsappOtp({ phone: value });
                setPhoneTimers({
                    resendCooldown: 60,
                    otpExpiry: 180,
                    isExpired: false,
                });
            }
            toast.success('OTP sent successfully!');
        }
        catch (err) {
            const axiosError = err;
            if (axiosError.response?.data?.message) {
                toast.error(`Resend OTP failed: ${axiosError.response.data.message}`);
            }
            else if (axiosError.message) {
                toast.error(`Resend OTP failed: ${axiosError.message}`);
            }
            else {
                toast.error('Resend OTP failed: Unknown error');
            }
        }
    };
    const handleChangeVerifiedValue = (type) => {
        setVerified((prev) => ({ ...prev, [type]: false }));
        setOtpSent((prev) => ({ ...prev, [type]: false }));
        if (type === 'email') {
            setEmailTimers({ resendCooldown: 0, otpExpiry: 0, isExpired: false });
        }
        else {
            setPhoneTimers({ resendCooldown: 0, otpExpiry: 0, isExpired: false });
        }
        setOtpModal((prev) => prev.type === type ? { ...prev, open: false, value: '' } : prev);
    };
    const handleSendOtpAndOpenModal = async (_value, type) => {
        const rawValue = (step1Form.getValues(type) || '').trim();
        if (!rawValue) {
            toast.error(`Enter ${type} to verify`);
            return;
        }
        if (type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(rawValue)) {
                toast.error('Please enter a valid email address');
                return;
            }
        }
        else {
            const normalized = '+' + rawValue.replace(/[^\d]/g, '');
            const phoneRegex = /^\+\d{8,15}$/;
            if (!phoneRegex.test(normalized)) {
                toast.error('Please enter a valid phone number');
                return;
            }
        }
        const payload = type === 'phone'
            ? '+' + rawValue.replace(/[^\d]/g, '')
            : rawValue.toLowerCase();
        const ok = await handleOtpRequest(payload, type);
        if (ok)
            setOtpModal({ type, open: true, value: payload });
    };
    const handleOpenModal = (type, value) => {
        setOtpModal({ type, open: true, value });
    };
    const currentTimers = otpModal.type === 'email' ? emailTimers : phoneTimers;
    return (<div>
      {step === 1 && (<Form {...step1Form}>
          <form onSubmit={step1Form.handleSubmit(handleStep1Next)} className="md:space-y-3 space-y-2">
            <FormField control={step1Form.control} name="name" render={({ field }) => (<FormItem>
                  <FormLabel>Name</FormLabel>
                  <div className="relative pb-1.5">
                    <FormControl>
                      <Input {...field} className="rounded-xl border-gray-300 py-5 px-3"/>
                    </FormControl>
                    <FormMessage className="absolute left-1 -bottom-3 text-xs text-red-500"/>
                  </div>
                </FormItem>)}/>

            <FormField control={step1Form.control} name="email" render={({ field }) => (<FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative pb-1.5">
                    <div className="relative">
                      <FormControl>
                        <Input {...field} disabled={verified.email} onChange={(e) => {
                    if (verified.email)
                        handleChangeVerifiedValue('email');
                    field.onChange(e);
                }} className="rounded-xl border-gray-300 py-5 pr-28 pl-3 disabled:opacity-60 disabled:cursor-not-allowed"/>
                      </FormControl>
                      <VerificationButton value={field.value} type="email" verified={verified} otpSent={otpSent} onSendOtp={handleSendOtpAndOpenModal} onOpenModal={handleOpenModal} onChangeValue={handleChangeVerifiedValue} toast={toast}/>
                    </div>
                    <FormMessage className="absolute left-1 -bottom-3 text-xs text-red-500"/>
                  </div>
                </FormItem>)}/>

            <FormField control={step1Form.control} name="phone" render={({ field }) => (<FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <div className="relative pb-1.5">
                    <div className="relative">
                      <FormControl className="!w-full !rounded-xl py-0.5 !border !border-gray-300 custom-phone-input">
                        <PhoneInput disabled={verified.phone} defaultCountry="ae" value={field.value} onChange={(value) => {
                    if (verified.phone)
                        handleChangeVerifiedValue('phone');
                    field.onChange(value);
                }} inputClassName="!w-full !rounded-xl !border-none !px-3 placeholder-gray-400 !outline-none !ring-0"/>
                      </FormControl>

                      <VerificationButton value={field.value} type="phone" verified={verified} otpSent={otpSent} onSendOtp={handleSendOtpAndOpenModal} onOpenModal={handleOpenModal} onChangeValue={handleChangeVerifiedValue} toast={toast}/>
                    </div>
                    <FormMessage className="absolute left-1 -bottom-3 text-xs text-red-500"/>
                  </div>
                </FormItem>)}/>

            <FormField control={step1Form.control} name="nationality" render={({ field }) => (<FormItem>
                  <FormLabel>Nationality</FormLabel>
                  <div className="relative pb-1.5">
                    <FormControl>
                      <CountrySelect value={field.value} onChange={(value) => field.onChange(value)}/>
                    </FormControl>
                    <FormMessage className="absolute left-1 -bottom-3 text-xs text-red-500"/>
                  </div>
                </FormItem>)}/>

            <FormField control={step1Form.control} name="referralCode" render={({ field }) => (<FormItem>
                  <FormLabel>Referral Code</FormLabel>
                  <div className="relative pb-1.5">
                    <FormControl>
                      <Input {...field} value={referralCode ?? field.value ?? ''} disabled={!!referralCode} onChange={(e) => {
                    if (!referralCode)
                        field.onChange(e.target.value);
                }} className="rounded-xl border-gray-300 py-5 px-3"/>
                    </FormControl>
                    <FormMessage className="absolute left-1 -bottom-3 text-xs text-red-500"/>
                  </div>
                </FormItem>)}/>

            <FormField control={step1Form.control} name="gender" render={({ field }) => (<FormItem>
                  <FormLabel>Select Gender</FormLabel>
                  <div className="relative pb-1.5">
                    <FormControl>
                      <ToggleGroup type="single" value={field.value} onValueChange={field.onChange} className="flex gap-3">
                        <ToggleGroupItem value="male" className="px-6 py-3 w-full rounded-xl border border-[#0082FF] data-[state=on]:bg-[#0082FF] data-[state=on]:text-white">
                          Male
                        </ToggleGroupItem>
                        <ToggleGroupItem value="female" className="px-6 py-3 w-full rounded-xl border border-[#0082FF] data-[state=on]:bg-[#0082FF] data-[state=on]:text-white">
                          Female
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage className="absolute left-1 -bottom-3 text-xs text-red-500"/>
                  </div>
                </FormItem>)}/>

            <div className="flex flex-col gap-4 sm:gap-7 pt-4 sm:pt-7">
              <div className="flex flex-row gap-4">
                <Button type="button" className="w-full bg-white rounded-3xl border py-5 border-blue-500 text-blue-500 hover:bg-blue-50 transition" onClick={() => router.back()}>
                  Back
                </Button>
                <Button type="submit" className="w-full rounded-3xl bg-blue-200 py-5 text-blue-600 hover:bg-blue-300 transition">
                  Next
                </Button>
              </div>
            </div>
          </form>
        </Form>)}

      {step === 2 && step1Data.email && (<Step2Form initialEmail={step1Data.email} onBack={() => setStep(1)} onSubmit={handleFinalSubmit}/>)}

      <OtpModal open={otpModal.open} type={otpModal.type} email={otpModal.value} resendCooldown={currentTimers.resendCooldown} otpExpiry={currentTimers.otpExpiry} isExpired={currentTimers.isExpired} onClose={() => setOtpModal((prev) => ({ ...prev, open: false }))} onVerify={async (otp) => {
            if (!otpModal.value)
                return;
            const success = await handleOtpVerification(otpModal.type, otpModal.value, otp);
            if (success) {
                setOtpModal((prev) => ({ ...prev, open: false }));
            }
        }} onResend={() => {
            if (otpModal.value) {
                handleResendOtp(otpModal.type, otpModal.value);
            }
        }}/>
    </div>);
};
export default SignUpForm;
