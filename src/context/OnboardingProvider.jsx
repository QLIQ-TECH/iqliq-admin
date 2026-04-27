'use client';
import React, { useState } from "react";
import { OnboardingContext } from "./OnboardingContext";
export const OnboardingProvider = ({ children }) => {
    const [data, setData] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("onboardingData");
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });
    const updateData = (newData) => {
        setData((prev) => {
            const updated = { ...prev, ...newData };
            localStorage.setItem("onboardingData", JSON.stringify(updated));
            return updated;
        });
    };
    const reset = () => {
        setData({});
        localStorage.removeItem("onboardingData");
    };
    return (<OnboardingContext.Provider value={{ data, updateData, reset }}>
      {children}
    </OnboardingContext.Provider>);
};
