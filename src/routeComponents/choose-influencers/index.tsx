import OnboardingLayout from "@/components/layouts/OnboardingLayout";
import foxdummyImg from "@/assets/images/foxdummyImg.png";
import ChooseInfluencers from "./components/ChooseInfluencers";
import FloatingQliqyWidget from "@/components/shared/Qliqy";

export const ChooseInfluencersComponent = () => {
  return (
    <OnboardingLayout image={foxdummyImg}>
      <ChooseInfluencers influencers={[]} />
      <FloatingQliqyWidget />
    </OnboardingLayout>
  );
};
