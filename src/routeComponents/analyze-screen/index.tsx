import OnboardingLayout from "@/components/layouts/OnboardingLayout";
import analyzeScreenImg from "/assets/images/analyze-screen.png";
import AnalyzeScreen from "./components/AnalyzeScreen";
import FloatingQliqyWidget from "@/components/shared/Qliqy";


export const AnalyzeScreenComponent = () => {
  return (
    <OnboardingLayout image={analyzeScreenImg}>
      <AnalyzeScreen/>
      <FloatingQliqyWidget />
    </OnboardingLayout>
  );
};
