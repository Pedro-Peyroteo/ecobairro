import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from 'next-themes'
import { GoogleOAuthProvider } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export const Route = createRootRoute({
  component: () => {
    const content = (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Outlet />
      </ThemeProvider>
    )

    if (GOOGLE_CLIENT_ID) {
      return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>
    }

    return content
  },
})
