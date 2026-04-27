import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import QrCodeImg from '/assets/images/QR_code.png';
import QrCode from './components/QrCode';
import FloatingQliqyWidget from '@/components/shared/Qliqy';

export const QrCodeComponent = () => {
  return (
    <OnboardingLayout image={QrCodeImg}>
      <QrCode />
      <FloatingQliqyWidget />
    </OnboardingLayout>
  );
};
