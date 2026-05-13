export type Language = {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string; 
  updatedAt: string; 
};


export type Category = {

    _id: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string; 
    updatedAt: string; 
    __v: number;
};


// src/types/onboarding.ts
export type SocialAccount = {
  platform: string;
  username?: string;
  followers?: number;
  url?: string;
};

export type OnboardingPayload = {
  authUserId?: string;
  languages?: string[];
  goals?: string[]
  salesChannel?: string[];
  vendorProductCategories?: string[];
  topCompetitors?: string[];
  influencerPreferances?: string[];
  companyName?: string;
  companyWebsite?: string;
  passportNumber?: string;
  passportDocs?: string[];
  emiratesId?: string;
  emiratesIdDocs?: string[];
  tradeLicense?: string;
  tradeLicenseDocs?: string[];
  vatCertificate?: string;
  vatCertificateDocs?: string[];
};

