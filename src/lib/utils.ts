import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

export const buildHostAppUrl = (path: string = "/") => {
  const rawBase = (process.env.NEXT_PUBLIC_HOST_APP_URL as string | undefined) ?? ""
  const base = trimTrailingSlash(rawBase.trim())
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  if (!base) return normalizedPath
  if (base.startsWith("http://") || base.startsWith("https://")) {
    return `${base}${normalizedPath}`
  }
  if (base.startsWith("/")) {
    return `${trimTrailingSlash(base)}${normalizedPath}`
  }
  return `${trimTrailingSlash(`/${base}`)}${normalizedPath}`
}

export const redirectToHostApp = (path: string = "/") => {
  window.location.replace(buildHostAppUrl(path))
}
