import OnboardingLayout from '@/components/layouts/OnboardingLayout';
const welcomeOnboardingImg = '/assets/images/onboarding-welcome.png';
import WelcomeOnboarding from './components/WelcomeOnboarding';
import FloatingQliqyWidget from '@/components/shared/Qliqy';

export const WelcomeOnboardingComponent = () => {
  return (
    <OnboardingLayout image={welcomeOnboardingImg}>
      <WelcomeOnboarding />
      <FloatingQliqyWidget />
    </OnboardingLayout>
  );
};
