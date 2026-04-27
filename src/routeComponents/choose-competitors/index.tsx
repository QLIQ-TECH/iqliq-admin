'use client';

import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import foxdummyImg from '@/assets/images/foxdummyImg.png';
import ChooseCompetitors from './components/ChooseCompetitors';
import type { IVendor } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCompetitors } from '@/api/services/onboarding.api';
import FloatingQliqyWidget from '@/components/shared/Qliqy';

export const ChooseCompetitorsComponent = () => {
  const searchParams = useSearchParams();
  const [competitors, setCompetitors] = useState<IVendor[]>([]);

  useEffect(() => {
    let mounted = true;
    const search = searchParams.get('search') || undefined;
    getCompetitors(search)
      .then((res) => {
        if (!mounted) return;
        setCompetitors(res?.data || []);
      })
      .catch(() => {
        if (!mounted) return;
        setCompetitors([]);
      });
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  return (
    <OnboardingLayout image={foxdummyImg}>
      <ChooseCompetitors competitors={competitors} />
      <FloatingQliqyWidget />
    </OnboardingLayout>
  );
};
