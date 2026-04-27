'use client';
import OnboardingLayout from "@/components/layouts/OnboardingLayout";
import foxdummyImg from "@/assets/images/foxdummyImg.png";
import ConnectStore from "./components/ConnectStore";
import { useEffect, useState } from "react";
import { getStores } from "@/api/services/onboarding.api";
import FloatingQliqyWidget from "@/components/shared/Qliqy";
export const ConnectStoreComponent = () => {
    const [stores, setStores] = useState([]);
    useEffect(() => {
        let mounted = true;
        getStores()
            .then((res) => {
            if (!mounted)
                return;
            setStores(res || []);
        })
            .catch(() => {
            if (!mounted)
                return;
            setStores([]);
        });
        return () => {
            mounted = false;
        };
    }, []);
    return (<OnboardingLayout image={foxdummyImg}>
      <ConnectStore stores={stores}/>
      <FloatingQliqyWidget />
    </OnboardingLayout>);
};
