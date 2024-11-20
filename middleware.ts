import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
})

export const config = {
  matcher: [
    '/write',
    '/settings',
    '/api/articles/:path*',
    '/api/user/:path*',
  ],
}
