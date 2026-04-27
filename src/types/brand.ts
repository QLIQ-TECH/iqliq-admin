export interface Influencer {
  _id: string;
  authUserId: string;
  email: string;
  name: string;
  country: string;
  profileClaimed: boolean;
  activeSocialMedia: string[]; 
  brandPartnerships: string[]; 
  niches: string[];
  top10Niches: string[];
  passportImageUrl: string[];
  emiratesIdImageUrl: string[];
  followers?: number;
  subscribers?: number;
  createdAt: string; 
  followerCount?: number;
  profilePicture?: string;
  updatedAt: string;
  __v: number;
}


export type LoginRequest = {
  email: string;
  password: string;
  roles:string[]
};
export type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      cognitoUserId: string;
      onboardingCompleted: boolean;
      email: string;
      name: string;
      role: string;
      phone?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      idToken: string;
      expiresIn: number;
    };
    platform: string;
  };
};

export interface SignUpRequest {
  email: string;
  password: string;
  phone: string;
  gender: string;
  role: string;
  name: string;
  nationality: string;
}


export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  gender: string;
  referralCode: string;
  role: string
}

// Response types
export interface SignUpResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      cognitoUserId: string;
      email: string;
      name: string;
      role: string
      phone: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      idToken: string;
      expiresIn: number;
    };
    platform: string;
  };
}