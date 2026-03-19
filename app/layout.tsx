import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AppShell } from "@/components/layout/app-shell"
import { Toaster } from "@/components/ui/sonner"

const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: "Gestão Financeira",
  description: "App de gestão financeira pessoal",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={fontSans.variable}>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
