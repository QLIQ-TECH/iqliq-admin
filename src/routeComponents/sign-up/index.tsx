'use client';

import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import dummyImg from '@/assets/images/dummyImg.jpg';
import SignUpForm from './components/SignUpForm';
import PageTitle from '@/components/shared/PageTitle';
import { useSearchParams } from 'next/navigation';

export const SignUpComponent = () => {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('referralCode') || null;
  return (
    <OnboardingLayout image={dummyImg}>
      <div className="text-black w-full mx-auto space-y-5">
        <PageTitle>Create Your Account</PageTitle>
        <SignUpForm referralCode={referralCode?.toString()} />
      </div>
    </OnboardingLayout>
  );
};
