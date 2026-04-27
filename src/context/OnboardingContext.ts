'use client';

import { createContext } from "react";
import type { OnboardingPayload } from "@/types/onboarding";

export type OnboardingContextType = {
  data: Partial<OnboardingPayload>;
  updateData: (newData: Partial<OnboardingPayload>) => void;
  reset: () => void;
};

export const OnboardingContext = createContext<OnboardingContextType | null>(null);
