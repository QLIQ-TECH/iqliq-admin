import OnboardingLayout from "@/components/layouts/OnboardingLayout";
import dummyImg from "@/assets/images/dummyImg.jpg";
import ResetPasswordForm from "./components/ResetPasswordForm";
export const ResetPasswordComponent = () => {
    return (<OnboardingLayout image={dummyImg}>
      <ResetPasswordForm />
    </OnboardingLayout>);
};
