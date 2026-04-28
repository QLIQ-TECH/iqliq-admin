import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import foxdummyImg from '@/assets/images/foxdummyImg.png';
import AssitantScreen from './components/AssitantScreen';
import AuthHeader from '@/components/shared/AuthHeader';
export const VirtualAssistantComponent = () => {
  return (
    <OnboardingLayout image={foxdummyImg}>
      <div className="space-y-6 sm:space-y-8">
        <AuthHeader
          title=" Set Your Own Virtual AI Voice Assistant"
          description="Allow microphone access so that I can help you shop by just voice."
        />
        <AssitantScreen />
      </div>
    </OnboardingLayout>
  );
};
