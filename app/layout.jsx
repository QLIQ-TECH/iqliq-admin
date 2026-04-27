import '../styles/globals.css'
import 'react-international-phone/style.css'
import { AuthProvider } from '../contexts/AuthContext'
import { MetricsProvider } from '../contexts/MetricsContext'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'QLIQ Admin Dashboard',
  description: 'Admin dashboard for QLIQ platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <MetricsProvider>
            {children}
            <Toaster richColors position="top-right" expand={true} />
          </MetricsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
