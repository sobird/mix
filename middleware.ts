import type { NextFetchEvent } from 'next/server';
import { withAuth, NextRequestWithAuth, NextAuthMiddlewareOptions } from 'next-auth/middleware';

// export const config = {
//   // matcher: ["/profile"],
//   matcher: ['/((?!register|api|login).*)'],
// };

// This function can be marked `async` if using `await` inside
// export function middleware(request: NextRequest, fetchEvent: NextFetchEvent) {
//   console.log(request);

//   // return NextResponse.next({
//   //   request: {
//   //     test: 123,
//   //   },
//   // })

//   if (request.nextUrl.pathname.startsWith('/api')) {
//     // return NextResponse.rewrite(new URL('/about-2', request.url))

//     // return response;
//   }
// }

export default withAuth(
  (request: NextRequestWithAuth, fetchEvent: NextFetchEvent) => {
    //
    console.log(request.nextauth);
  },
  {
    callbacks: {
      authorized({ token }) {
        console.log('token', token);
        return true;
      },
    },
  },
);

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  matcher: ['/dashboard'],
};
