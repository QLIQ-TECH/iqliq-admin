'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAppToast } from '@/hooks/useAppToast';

type Props = {
  open: boolean;
  type: 'email' | 'phone';
  email?: string;
  resendCooldown: number;
  otpExpiry: number;
  isExpired: boolean;
  onClose: () => void;
  onVerify: (otp: number) => void;
  onResend: () => void;
};

export default function OtpModal({
  open,
  type,
  resendCooldown,
  otpExpiry,
  isExpired,
  onClose,
  onVerify,
  onResend,
}: Props) {
  const toast = useAppToast();
  const [otp, setOtp] = useState(['', '', '', '']);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (open) {
      setOtp(['', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [open]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Only process if it's 4 digits
    if (/^\d{4}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs[3].current?.focus(); // Focus last input
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join('');

    if (isExpired) {
      toast.error('OTP has expired. Please request a new one.');
      return;
    }

    if (otpValue.length !== 4) {
      toast.error('Please enter complete 4-digit OTP');
      return;
    }

    onVerify(Number(otpValue));
  };

  const handleResend = () => {
    setOtp(['', '', '', '']);
    inputRefs[0].current?.focus();
    onResend();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl shadow-xl bg-white dark:bg-neutral-900 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Enter {type === 'phone' ? 'Mobile' : 'Email'} OTP
          </h1>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            We've sent a verification code to your {type}.
          </p>

          {!isExpired && otpExpiry > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-8">
              Code expires in{' '}
              <span className="font-semibold">{formatTime(otpExpiry)}</span>
            </p>
          )}

          {isExpired && (
            <p className="text-xs text-red-500 mb-8 font-semibold">
              OTP has expired. Please request a new one.
            </p>
          )}

          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <div key={index} className="flex items-center">
                <input
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isExpired}
                  className="w-16 h-16 text-center text-2xl font-semibold border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white dark:bg-neutral-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {index < 3 && (
                  <span className="text-gray-400 dark:text-gray-600 mx-2 text-xl">
                    –
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={isExpired || otp.join('').length !== 4}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full transition-colors mb-6"
          >
            Verify OTP
          </button>

          <div className="text-center">
            {resendCooldown > 0 ? (
              <p className="text-gray-500 text-sm">
                Resend available in{' '}
                <span className="font-semibold">
                  {formatTime(resendCooldown)}
                </span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-blue-500 hover:text-blue-600 font-semibold text-sm transition-colors underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
