import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import foxdummyImg from '@/assets/images/foxdummyImg.png';
import InviteFriends from './components/InviteFriends';
import AuthHeader from '@/components/shared/AuthHeader';
import FloatingQliqyWidget from '@/components/shared/Qliqy';
export const InviteFriendsComponent = () => {
    return (<OnboardingLayout image={foxdummyImg}>
      <div className="space-y-6 sm:space-y-8">
        <AuthHeader title="Connect your social media for better insights"/>
        <InviteFriends />
      </div>
      <FloatingQliqyWidget />
    </OnboardingLayout>);
};
