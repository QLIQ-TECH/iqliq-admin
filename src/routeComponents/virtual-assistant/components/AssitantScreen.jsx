'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAppToast } from '@/hooks/useAppToast';
const AssistantScreen = () => {
    const [, setPermissionGranted] = useState(false);
    const router = useRouter();
    const toast = useAppToast();
    const handleAllow = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setPermissionGranted(true);
            toast.success('Microphone access granted! 🎉');
            setTimeout(() => {
                router.push('/onboarding/choose-language');
            }, 1500);
        }
        catch {
            setPermissionGranted(false);
            toast.error('Microphone access denied. Please allow to continue.');
        }
    };
    return (<div>
      <div className="flex flex-row gap-4 mt-7">
        {/* <Button
          type="button"
          className="w-full rounded-3xl border bg-white py-5 border-blue-500 text-blue-500 hover:bg-blue-50 transition"
          onClick={() => navigate({ to: '/claim-profile' })}
        >
          Back
        </Button> */}
        <Button type="button" className="w-full rounded-3xl py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF66] transition" onClick={handleAllow}>
          Allow
        </Button>
      </div>
    </div>);
};
export default AssistantScreen;
