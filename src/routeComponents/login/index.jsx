'use client';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import dummyImg from '@/assets/images/dummyImg.jpg';
import LoginForm from './components/LoginForm';
import AuthHeader from '@/components/shared/AuthHeader';

export const LoginComponent = () => {
  return (
    <OnboardingLayout image={dummyImg}>
      <div className="space-y-6 sm:space-y-8">
        <AuthHeader
          title="Welcome to IQLIQ"
          description="Let’s get to business 
Log in to IQLIQ Live and turn your products into top-selling influencer favorites."
        />
        <LoginForm />
      </div>
    </OnboardingLayout>
  );
};
