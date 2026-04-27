export interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

export type Influencer = {
  id: string;
  name: string;
  avatarUrl?: string;
  followers: number;
  er: number;
  email: string;
  platforms: string[];
  skills: string[];
  location: string;
  growth: number;
};
export type InfluencerOutReachT = {
  id: string;
  name: string;
  offer: string;
  date: string;
  free: boolean;
  followers: number;
  avatar?: string;
};

export type GigT = {
  id: string;
  date: string;
  gigType: string;
  type: string;
  description: string;
  deadline: string;
  price: number;
  status: "active" | "pending" | "completed" | "cancelled";
};

export type ProductOffer = {
  id: string
  sku: string
  productName: string
  price: number
  brand: string
  offer: string
  offerStart: string
  offerEnd: string
  overlap: boolean
}


export interface UploadedKycData {
  companyName: string;
  companyWebsite: string;
  passportNumber: string;
  emiratesId: string;
  tradeLicense: string;
  vatCertificate: string;
  passportDocs?: string;
  emiratesIdDocs?: string;
  tradeLicenseDocs?: string;
  vatCertificateDocs?: string;
}


export interface IVendor {
  _id: string;
  authUserId: string;
  contactNumber?: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  vendorName?: string;
  influencerPreferances: string[];
  languages: string[];
  salesChannel: string[];
  socialAccounts: string[];
  topCompetitors: string[];
  vendorProductCategories: string[];
  __v: number;
}

export interface VendorApiResponse {
  success: boolean;
  message: string;
  data: IVendor[];
}

export type Store = {
  _id: string;
  name: string;
  type: string;
  logoUrl: string;
  websiteUrl: string;
};

export type GetStoresResponse = {
  success: boolean;
  message: string;
  data: Store[];
};


export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export type ResetPasswordFormValues = {
  newPassword: string;
};
export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}
