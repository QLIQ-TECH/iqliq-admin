'use client';

import { OnboardingContext, type OnboardingContextType } from "@/context/OnboardingContext";
import { useContext } from "react";


export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return context;
};
