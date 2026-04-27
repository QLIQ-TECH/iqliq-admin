import OnboardingLayout from "@/components/layouts/OnboardingLayout"
import dummyImg from '@/assets/images/dummyImg.jpg'
import ForgetPasswordForm from "./components/ForgetPassword"

export const ForgetPasswordComponent = () => {
  return (
    <OnboardingLayout image={dummyImg}>
      <ForgetPasswordForm />
    </OnboardingLayout>
  )
}