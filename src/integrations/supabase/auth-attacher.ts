import { createMiddleware } from '@tanstack/react-start'

// Must be registered as a global `functionMiddleware` in `src/start.ts`
export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    let token = null
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brh_session')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          token = parsed?.access_token
        } catch (e) {
          console.error(e)
        }
      }
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },
)
