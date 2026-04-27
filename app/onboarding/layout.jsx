'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProvider } from '@/context/OnboardingProvider'

export default function OnboardingLayout({ children }) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const onboardingCompleted = localStorage.getItem('onboarding_completed')
    if (token && onboardingCompleted === 'true') {
      router.replace('/')
    }
  }, [router])

  return (
    <OnboardingProvider>
      <div className="h-screen">{children}</div>
    </OnboardingProvider>
  )
}

