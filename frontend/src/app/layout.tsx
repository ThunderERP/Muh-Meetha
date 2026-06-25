import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/lib/query-provider'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: { default: 'ThunderERP', template: '%s | ThunderERP' },
  description: 'Modular ERP platform for modern businesses',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors expand toastOptions={{ duration: 4000 }} />
        </QueryProvider>
      </body>
    </html>
  )
}
