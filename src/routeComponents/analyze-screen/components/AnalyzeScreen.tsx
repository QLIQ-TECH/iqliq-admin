'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const AnalyzeScreen = () => {
  const router = useRouter();

  return (
    <div className="w-full text-black mx-auto space-y-7">
      <h1 className="font-semibold text-3xl sm:text-4xl leading-relaxed text-center sm:text-left">
        These QR Code Will Help You 10x Your Business
      </h1>
      <p className="font-semibold text-sm">
        This QLIQR Code will help you generate 10 X sales in your stores. All
        you have to do is get your customers to scan it and join under your
        network and you will earn 10$ per signup per year and get your customers
        data for LIFE
      </p>

      <div className="flex gap-4">
        <Button
          type="button"
          className="w-1/2 bg-white text-black rounded-3xl py-5 border border-[#0082FF] hover:bg-white transition"
          onClick={() => router.push('/onboarding/connect-store')}
        >
          Back
        </Button>
        <Button
          type="button"
          className="w-1/2 rounded-3xl py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF66] transition"
          onClick={() => router.push('/onboarding/kyc')}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AnalyzeScreen;
