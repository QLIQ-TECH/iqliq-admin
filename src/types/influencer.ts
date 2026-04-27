export interface Influencer {
    data:{
      _id: number;
    name: string;
    subscribers: number;
    followers: number;
    }
  }
  

export type LoginRequest = {
    email: string;
    password: string;
  };
  
  export type LoginResponse = {
    user: {
      id: string;
      cognitoUserId: string;
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
  