import type {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
} from '@/types/brand';
import axios from 'axios';
import { http } from '../client';
import type { ResetPasswordRequest, ResetPasswordResponse } from '@/lib/types';

export const forgotPasswordApi = async (data: { email: string ,returnTo: string}) => {
  return http.post("auth", "/api/auth/request-reset", data);
};

export const confirmForgotPasswordApi = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  return http.post<ResetPasswordResponse>("auth", "/api/auth/reset-password", data);
};


export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  return http.post<LoginResponse>('auth', '/api/auth/login', data);
};

const getEmailOtpBaseUrl = () => {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_EMAIL_OTP_BASE_URL ||
    'https://auth.qliq.ae';

  return rawBaseUrl
    .replace(/\/api\/auth\/?$/, '')
    .replace(/\/$/, '');
};

export const sendEmailOtp = async (data: { email: string }) => {
  const res = await axios.post(
    `${getEmailOtpBaseUrl()}/api/otp/send-otp`,
    data,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
};

export const verifyEmailOtp = async (data: { email: string; otp: number }) => {
  const res = await axios.post(
    `${getEmailOtpBaseUrl()}/api/otp/verify-otp`,
    data,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
};

export const sendWhatsappOtp = async (data: { phone: string }) => {
  return http.post('message', '/api/otp/send', {
    ...data,
    channel: 'whatsapp',
  });
};

export const verifyWhatsappOtp = async (data: { phone: string; otp: number }) => {
  return http.post('message', '/api/otp/verify', data);
};

export const signUpApi = async ( data: SignUpRequest) => {
  return http.post<SignUpResponse>('auth', '/api/auth/signup', data);
};


export const getOAuthRedirectUrl = async (params: {
  returnTo: string;
  type: "web" | "mobile";
  provider: "Google" | "Facebook";
  roles?: string[];
}) => {
  const res = await http.get<{ data: { url: string } }>(
    "auth",
    "/api/oauth/url",
    { params }
  );
  return res.data.url;
};

export const verifyRefferalCode = async (code: string) => {
  return http.get<{ data: string[] }>('amp', `/api/users/verify-referral-code/${code}`);
};
