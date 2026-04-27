import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import foxdummyImg from '@/assets/images/foxdummyImg.png';
import KycForm from './components/KycForm';
import FloatingQliqyWidget from '@/components/shared/Qliqy';

export const KycFormComponent = () => {
  return (
    <OnboardingLayout image={foxdummyImg}>
      <KycForm />
      <FloatingQliqyWidget />
    </OnboardingLayout>
  );
};
