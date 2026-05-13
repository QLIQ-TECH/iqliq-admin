'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { OnboardingProvider } from '@/context/OnboardingProvider'

export default function OnboardingLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const publicPaths = ['/onboarding/sign-up', '/onboarding/login','/login']
    if (publicPaths.includes(pathname)) return

    const token = localStorage.getItem('access_token')
    const onboardingCompleted = localStorage.getItem('onboarding_completed')
    if (token && onboardingCompleted === 'true') {
      try {
        const savedUser = localStorage.getItem('qliq-admin-user')
        const user = savedUser ? JSON.parse(savedUser) : null
        if (user && user.onboardingCompleted === false) return
      } catch {}
      router.replace('/')
    }
  }, [router, pathname])

  return (
    <OnboardingProvider>
      <div className="h-screen">{children}</div>
    </OnboardingProvider>
  )
}

