import OnboardingLayout from "@/components/layouts/OnboardingLayout";
import foxdummyImg from "@/assets/images/foxdummyImg.png";
import KnowMore from "./components/KnowMore";
import FloatingQliqyWidget from "@/components/shared/Qliqy";

export const KnowMoreComponent = () => {
  return (
    <OnboardingLayout image={foxdummyImg}>
      <KnowMore />
      <FloatingQliqyWidget />
    </OnboardingLayout>
  );
};
