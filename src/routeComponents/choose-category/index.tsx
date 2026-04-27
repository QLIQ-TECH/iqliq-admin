'use client';

import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import foxdummyImg from '@/assets/images/foxdummyImg.png';
import ChooseCategory from './components/ChooseCategory';
import type { Category } from '@/types/onboarding';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCategories } from '@/api/services/onboarding.api';
import FloatingQliqyWidget from '@/components/shared/Qliqy';

export const ChooseCategoryComponent = () => {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;
    const search = searchParams.get('search') || undefined;
    getCategories(search)
      .then((res) => {
        if (!mounted) return;
        setCategories(res?.data || []);
      })
      .catch(() => {
        if (!mounted) return;
        setCategories([]);
      });
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  return (
    <OnboardingLayout image={foxdummyImg}>
      <ChooseCategory categories={categories} />
      <FloatingQliqyWidget />
    </OnboardingLayout>
  );
};
