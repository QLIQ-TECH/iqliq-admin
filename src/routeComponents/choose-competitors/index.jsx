'use client';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import foxdummyImg from '@/assets/images/foxdummyImg.png';
import ChooseCompetitors from './components/ChooseCompetitors';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCompetitors } from '@/api/services/onboarding.api';
import FloatingQliqyWidget from '@/components/shared/Qliqy';
export const ChooseCompetitorsComponent = () => {
    const searchParams = useSearchParams();
    const [competitors, setCompetitors] = useState([]);
    useEffect(() => {
        let mounted = true;
        const search = searchParams.get('search') || undefined;
        const id = searchParams.get('id') || undefined;
        const email = searchParams.get('email') || undefined;
        getCompetitors(search, id, email)
            .then((res) => {
            if (!mounted)
                return;
            setCompetitors(res?.data || []);
        })
            .catch(() => {
            if (!mounted)
                return;
            setCompetitors([]);
        });
        return () => {
            mounted = false;
        };
    }, [searchParams]);
    return (<OnboardingLayout image={foxdummyImg}>
      <ChooseCompetitors competitors={competitors}/>
      <FloatingQliqyWidget />
    </OnboardingLayout>);
};
