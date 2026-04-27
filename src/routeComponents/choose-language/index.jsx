'use client';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import foxdummyImg from '@/assets/images/foxdummyImg.png';
import ChooseLanguage from './components/ChooseLanguage';
import { useEffect, useState } from 'react';
import { getLanguages } from '@/api/services/onboarding.api';
import FloatingQliqyWidget from '@/components/shared/Qliqy';
export const ChooseLanguageComponent = () => {
    const [languages, setLanguages] = useState([]);
    useEffect(() => {
        let mounted = true;
        getLanguages()
            .then((res) => {
            if (!mounted)
                return;
            setLanguages(res?.data ?? []);
        })
            .catch(() => {
            if (!mounted)
                return;
            setLanguages([]);
        });
        return () => {
            mounted = false;
        };
    }, []);
    return (<OnboardingLayout image={foxdummyImg}>
      <ChooseLanguage languages={languages}/>
      <FloatingQliqyWidget />
    </OnboardingLayout>);
};
