import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import dummyImg from '@/assets/images/dummyImg.jpg';
import ClaimProfileForm from './components/ClaimProfileForm';
import FloatingQliqyWidget from '@/components/shared/Qliqy';

export const ClaimProfileComponent = () => {
  return (
    <OnboardingLayout image={dummyImg}>
      <ClaimProfileForm />
      <FloatingQliqyWidget />
    </OnboardingLayout>
  );
};
