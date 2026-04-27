import { Button } from "@/components/ui/button";
import type { useAppToast } from "@/hooks/useAppToast";
import { Pencil, Send } from "lucide-react";

interface VerificationButtonProps {
  value: string;
  type: 'email' | 'phone';
  verified: { email: boolean; phone: boolean };
  otpSent: { email: boolean; phone: boolean };
  onSendOtp: (value: string, type: 'email' | 'phone') => Promise<void>;
  onOpenModal: (type: 'email' | 'phone', value: string) => void;
  onChangeValue: (type: 'email' | 'phone') => void;
  toast: ReturnType<typeof useAppToast>;
}

export const VerificationButton = ({
  value,
  type,
  verified,
  otpSent,
  onSendOtp,
  onOpenModal,
  onChangeValue,
  toast,
}: VerificationButtonProps) => {
  const iconButtonClassName =
    "absolute right-0 inset-y-0 h-full w-12 rounded-r-xl bg-[#0082FF1A] text-[#0082FF] hover:bg-[#0082FF33] focus-visible:ring-0 px-0";

  if (verified[type]) {
    return (
      <Button
        type="button"
        size="sm"
        className={iconButtonClassName}
        onClick={() => onChangeValue(type)}
        aria-label={`Change ${type}`}
        title={`Change ${type}`}
      >
        <Pencil className="h-5 w-5" />
      </Button>
    );
  }

  if (otpSent[type]) {
    return (
      <Button
        type="button"
        size="sm"
        className={iconButtonClassName}
        onClick={() => {
          if (!value) return toast.error(`Enter ${type} to verify`);
          onOpenModal(type, value);
        }}
        aria-label={`Enter ${type} OTP`}
        title={`Enter ${type} OTP`}
      >
        <Pencil className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className={iconButtonClassName}
      onClick={() => onSendOtp(value, type)}
      aria-label={`Send ${type} OTP`}
      title={`Send ${type} OTP`}
    >
      <Send className="h-5 w-5" />
    </Button>
  );
};
