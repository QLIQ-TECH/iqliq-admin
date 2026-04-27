import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

export const forgetPasswordSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    verifyEmail: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    verifyPassword: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.email === data.verifyEmail, {
    path: ['verifyEmail'],
    message: 'Emails do not match',
  })
  .refine((data) => data.password === data.verifyPassword, {
    path: ['verifyPassword'],
    message: 'Passwords do not match',
  });

export type ForgetPasswordFormValues = z.infer<typeof forgetPasswordSchema>;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const allowedFileTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf"
];

const MAX_FILE_SIZE = 3 * 1024 * 1024;

const fileValidation = z
  .custom<File | string>((val) => {
    return val instanceof File || (typeof val === 'string' && val.length > 0);
  }, "File is required")
  .refine((file) => {
    if (typeof file === 'string') return true;
    if (!file) return false;
    return allowedFileTypes.includes(file.type);
  }, "Only JPG, PNG or PDF files are allowed")
  .refine((file) => {
    if (typeof file === 'string') return true;
    if (!file) return false;
    return file.size <= MAX_FILE_SIZE;
  }, "File size must be less than 3MB");

export const kycSchema = z.object({
  passportNumber: z
    .string()
    .trim()
    .min(1, "Passport number is required")
    .max(20, "Passport number must be less than 20 characters"),

  passportImage: fileValidation,

  emiratesId: z
    .string()
    .trim()
    .min(1, "Emirates ID is required")
    .max(20, "Emirates ID must be less than 20 characters"),

  emirateImage: fileValidation,

  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(100, "Company name must be less than 100 characters"),

  companyWebsite: z
    .string()
    .trim()
    .min(1, "Company website is required")
    .max(100, "Company website must be less than 100 characters")
    .url("Enter a valid URL")
    .refine((val) => val.startsWith("https://"), {
      message: "URL must start with https://",
    })
    .refine(
      (val) => {
        try {
          const url = new URL(val);
          return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url.hostname);
        } catch {
          return false;
        }
      },
      { message: "Enter a valid domain (e.g., https://example.com)" }
    ),

  tradeLicense: z
    .string()
    .trim()
    .min(1, "Trade license is required")
    .max(50, "Trade license must be less than 50 characters"),

  tradeImage: fileValidation,

  vatCertificate: z
    .string()
    .trim()
    .min(1, "VAT certificate is required")
    .max(50, "VAT certificate must be less than 50 characters"),

  vatImage: fileValidation,
});

export type KycFormValues = z.infer<typeof kycSchema>;

export const claimProfileSchema = z.object({
  selectedBrand: z.number().min(0, 'Please select a brand'),
});

export type claimProfileValues = z.infer<typeof claimProfileSchema>;

export const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(40, 'Name must be at most 40 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email')
    .max(40, 'Email must be at most 40 characters')
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Enter a valid email address'
    ),
  nationality: z.string().min(2, 'Nationality must be at least 2 characters'),
  phone: z
    .string()
    .refine(
      (val) => isValidPhoneNumber(val),
      'Enter a valid phone number for the selected country'
    ),
  referralCode: z.string().min(1, 'Referral code is required').max(15, 'Referral code must be at most 15 characters'),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Select a gender' }),
  } as any),
});

export type Step1Values = z.infer<typeof step1Schema>;

export const step2Schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number') // ✅ added
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    verifyPassword: z.string().min(8, 'Verify your password'),
    email: z.string().email('Enter a valid email'),
  })
  .refine((data) => data.password === data.verifyPassword, {
    message: 'Passwords must match',
    path: ['verifyPassword'],
  });
export type Step2FormValues = z.infer<typeof step2Schema>;

export const CheckBoxformSchema = z.object({
  agree: z.boolean().refine((val) => val === true, {
    message: 'You must agree before continuing',
  }),
});

export type CheckBoxFormData = z.infer<typeof CheckBoxformSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const TSignUpParams = z.object({
  referralCode: z.string().optional(),
});

export type TSignupParams = z.infer<typeof TSignUpParams>;
